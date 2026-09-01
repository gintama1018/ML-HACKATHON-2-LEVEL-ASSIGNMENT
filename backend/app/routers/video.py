import uuid
import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import LessonSession, SessionSegment, Lesson, VideoJob
from app.schemas import VideoGenerateRequest, VideoJobStatusResponse
from app.services.video_generator import video_generator

router = APIRouter(tags=["Video & Avatar"])

# In-memory cache for fast lookup
VIDEO_JOBS: Dict[str, Dict[str, Any]] = {}

@router.post("/video/generate", response_model=VideoJobStatusResponse)
def generate_video(payload: VideoGenerateRequest, db: Session = Depends(get_db)):
    job_id = str(uuid.uuid4())
    
    # 1. Fetch Session or Segment to build storyboard
    segments_data = []
    lesson_topic = payload.lesson_topic or "Core Conceptual Lesson"
    language = payload.language or "English"
    session_id = payload.session_id or str(uuid.uuid4())

    if payload.session_id:
        session = db.query(LessonSession).filter(LessonSession.id == payload.session_id).first()
        if session:
            lesson = db.query(Lesson).filter(Lesson.id == session.lesson_id).first()
            if lesson and lesson.topic:
                lesson_topic = lesson.topic
            language = session.language or language
            
            db_segments = db.query(SessionSegment).filter(SessionSegment.session_id == session.id).order_by(SessionSegment.segment_order.asc()).all()
            if not payload.segment_id and lesson and lesson.plan and lesson.plan.segments and len(lesson.plan.segments) > len(db_segments):
                # Build complete lesson storyboard across all plan segments
                segments_data = []
                db_seg_map = {s.segment_order: s for s in db_segments}
                for idx, ps in enumerate(lesson.plan.segments, 1):
                    if ps.get("skipped", False):
                        continue
                    db_s = db_seg_map.get(idx)
                    c_name = ps.get("concept", f"Concept {idx}")
                    v_type = ps.get("visual_type", "diagram")
                    v_spec = ps.get("visual_spec", {"title": c_name, "type": v_type})
                    expl = (db_s.explanation_text if db_s else None) or ps.get("learning_objective") or f"In this section, we examine {c_name}, establishing its foundational intuition and practical applications."
                    segments_data.append({
                        "concept": c_name,
                        "explanation_text": expl,
                        "visual_type": v_type,
                        "visual_spec": v_spec
                    })
            else:
                for s in db_segments:
                    segments_data.append({
                        "concept": s.concept,
                        "explanation_text": s.explanation_text,
                        "visual_type": s.visual_type,
                        "visual_spec": s.visual_spec or {}
                    })

    if not segments_data:
        # Fallback structured pedagogical segments (domain-aware)
        is_stem = any(k in lesson_topic.lower() for k in ["physics", "circuit", "ohm", "current", "voltage", "mechanics", "newton", "force", "math", "calculus", "thermo", "chemistry", "quantum"])
        is_history = any(k in lesson_topic.lower() for k in ["history", "revolution", "war", "century", "timeline", "empire", "civilization", "literature"])
        
        if is_history:
            segments_data = [
                {
                    "concept": f"{lesson_topic} Context & Causes",
                    "explanation_text": f"Let us understand the historical background, key social dynamics, and primary factors that led to {lesson_topic}.",
                    "visual_type": "timeline",
                    "visual_spec": {"title": f"Context of {lesson_topic}"}
                },
                {
                    "concept": f"Chronological Development of {lesson_topic}",
                    "explanation_text": f"Exploring the sequence of major milestones, pivotal decisions, and transformative events during {lesson_topic}.",
                    "visual_type": "timeline",
                    "visual_spec": {"title": "Key Historical Milestones"}
                },
                {
                    "concept": f"Impact, Legacy & Historical Significance",
                    "explanation_text": f"Analyzing the long-term historical impact, institutional transformations, and enduring legacy of {lesson_topic}.",
                    "visual_type": "diagram",
                    "visual_spec": {"title": "Impact & Legacy Overview"}
                }
            ]
        elif is_stem:
            segments_data = [
                {
                    "concept": f"{lesson_topic} Intuition & Definitions",
                    "explanation_text": f"Let us understand the core intuition and fundamental principles behind {lesson_topic}.",
                    "visual_type": "diagram",
                    "visual_spec": {"description": f"Physical model of {lesson_topic}"}
                },
                {
                    "concept": f"Analytical Formulation of {lesson_topic}",
                    "explanation_text": f"Examining the analytical framework and quantitative relationships governing {lesson_topic}.",
                    "visual_type": "chart",
                    "visual_spec": {"title": "Parameter Relationship Curve"}
                },
                {
                    "concept": f"Practical Applications of {lesson_topic}",
                    "explanation_text": f"Applying the principles of {lesson_topic} to practical engineering and analytical problem-solving.",
                    "visual_type": "math",
                    "visual_spec": {"formula": f"Governing Formulation for {lesson_topic}"}
                }
            ]
        else:
            segments_data = [
                {
                    "concept": f"Core Foundations of {lesson_topic}",
                    "explanation_text": f"Welcome to our structured study of {lesson_topic}. We begin by establishing key definitions, context, and foundational principles.",
                    "visual_type": "diagram",
                    "visual_spec": {"title": f"Foundations of {lesson_topic}"}
                },
                {
                    "concept": f"Structure and Core Dynamics of {lesson_topic}",
                    "explanation_text": f"Examining how key components and concepts within {lesson_topic} interact and develop logically.",
                    "visual_type": "chart",
                    "visual_spec": {"title": "Structural Overview"}
                },
                {
                    "concept": f"Practical Application & Synthesis of {lesson_topic}",
                    "explanation_text": f"Synthesizing our understanding of {lesson_topic} through practical analysis and real-world examples.",
                    "visual_type": "diagram",
                    "visual_spec": {"title": "Summary & Application"}
                }
            ]

    # 2. Trigger programmatic video & audio rendering
    try:
        res = video_generator.generate_lesson_video(
            session_id=session_id,
            lesson_topic=lesson_topic,
            segments=segments_data,
            language=language
        )

        # Update Session with video URL if session exists
        if payload.session_id:
            session = db.query(LessonSession).filter(LessonSession.id == payload.session_id).first()
            if session:
                session.video_url = res["video_url"]
                session.video_scenes = res["scenes"]
                db.commit()

        # Persist VideoJob into SQLite Database (REQ-50/51)
        db_job = VideoJob(
            id=job_id,
            session_id=session_id,
            segment_id=payload.segment_id,
            status="ready",
            video_url=res["video_url"],
            audio_url=res["video_url"],
            file_size_bytes=res["file_size_bytes"],
            total_duration_seconds=res["total_duration_seconds"],
            scenes=res["scenes"],
            captions=[],
            mode="ai_video_engine"
        )
        db.add(db_job)
        db.commit()
        db.refresh(db_job)

        job_data = {
            "job_id": job_id,
            "session_id": session_id,
            "segment_id": payload.segment_id,
            "status": "ready",
            "video_url": res["video_url"],
            "audio_url": res["video_url"],
            "file_size_bytes": res["file_size_bytes"],
            "total_duration_seconds": res["total_duration_seconds"],
            "scenes": res["scenes"],
            "captions": [],
            "mode": "ai_video_engine"
        }
        VIDEO_JOBS[job_id] = job_data
        return VideoJobStatusResponse(**job_data)

    except Exception as e:
        print(f"Video generation error: {e}")
        db_job = VideoJob(
            id=job_id,
            session_id=session_id,
            segment_id=payload.segment_id,
            status="ready",
            video_url=None,
            audio_url=None,
            file_size_bytes=0,
            total_duration_seconds=0.0,
            scenes=[],
            captions=[],
            mode="fallback_interactive",
            error_message=str(e)
        )
        db.add(db_job)
        db.commit()
        db.refresh(db_job)

        job_data = {
            "job_id": job_id,
            "session_id": session_id,
            "segment_id": payload.segment_id,
            "status": "ready",
            "video_url": None,
            "audio_url": None,
            "file_size_bytes": 0,
            "total_duration_seconds": 0.0,
            "scenes": [],
            "captions": [],
            "mode": "fallback_interactive"
        }
        VIDEO_JOBS[job_id] = job_data
        return VideoJobStatusResponse(**job_data)

@router.get("/video/{job_id}/status", response_model=VideoJobStatusResponse)
def get_video_status(job_id: str, db: Session = Depends(get_db)):
    # 1. First query persistent SQLite VideoJob table
    db_job = db.query(VideoJob).filter(VideoJob.id == job_id).first()
    if db_job:
        return VideoJobStatusResponse(
            job_id=db_job.id,
            session_id=db_job.session_id,
            segment_id=db_job.segment_id,
            status=db_job.status,
            video_url=db_job.video_url,
            audio_url=db_job.audio_url,
            file_size_bytes=db_job.file_size_bytes or 0,
            total_duration_seconds=db_job.total_duration_seconds or 0.0,
            scenes=db_job.scenes or [],
            captions=db_job.captions or [],
            mode=db_job.mode or "ai_video_engine"
        )
        
    # 2. In-memory cache fallback
    if job_id in VIDEO_JOBS:
        return VideoJobStatusResponse(**VIDEO_JOBS[job_id])
        
    raise HTTPException(status_code=404, detail="Video job not found")

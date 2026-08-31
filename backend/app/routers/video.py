import uuid
import os
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import LessonSession, SessionSegment, Lesson
from app.schemas import VideoGenerateRequest, VideoJobStatusResponse
from app.services.video_generator import video_generator

router = APIRouter(tags=["Video & Avatar"])

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
            for s in db_segments:
                segments_data.append({
                    "concept": s.concept,
                    "explanation_text": s.explanation_text,
                    "visual_type": s.visual_type,
                    "visual_spec": s.visual_spec or {}
                })

    if not segments_data:
        # Fallback structured pedagogical segments
        segments_data = [
            {
                "concept": f"{lesson_topic} Intuition & Definitions",
                "explanation_text": f"Let us understand the core intuition behind {lesson_topic}. Every fundamental relationship in nature balances driving forces against resistance.",
                "visual_type": "diagram",
                "visual_spec": {"description": f"Physical model of {lesson_topic}"}
            },
            {
                "concept": f"Quantitative Mechanics of {lesson_topic}",
                "explanation_text": f"Now we explore the mathematical and analytical formulation. As potential increases, the observable output scales proportionally.",
                "visual_type": "chart",
                "visual_spec": {"title": "Parameter Relationship Curve"}
            },
            {
                "concept": f"Practical Application & Edge Cases",
                "explanation_text": f"Finally, let us apply this principle to real-world engineering and computational scenarios.",
                "visual_type": "math",
                "visual_spec": {"formula": "Output = Input / Resistance"}
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
        # Fallback graceful response
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
def get_video_status(job_id: str):
    if job_id not in VIDEO_JOBS:
        raise HTTPException(status_code=404, detail="Video job not found")
    return VideoJobStatusResponse(**VIDEO_JOBS[job_id])

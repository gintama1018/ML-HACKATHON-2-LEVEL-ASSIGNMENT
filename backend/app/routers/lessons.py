from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StudentProfile, LearnerProfile, Lesson, LessonPlan, Material
from app.schemas import (
    LessonGenerateRequest, LessonPlanUpdate,
    LessonResponse, LessonPlanResponse
)
from app.agents.lesson_planner import plan_lesson
from app.services.claude_service import claude_service

router = APIRouter(tags=["Lessons"])

@router.get("/lessons", response_model=List[LessonResponse])
def list_student_lessons(student_id: str = None, db: Session = Depends(get_db)):
    if not student_id:
        student = db.query(StudentProfile).first()
        if not student:
            return []
        student_id = student.id
    
    lessons = db.query(Lesson).filter(Lesson.student_id == student_id).order_by(Lesson.created_at.desc()).all()
    return lessons

@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: str, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.put("/lessons/{lesson_id}/plan", response_model=LessonResponse)
def update_lesson_plan(lesson_id: str, payload: LessonPlanUpdate, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    if lesson.plan and payload.segments is not None:
        lesson.plan.segments = [seg.model_dump() if hasattr(seg, "model_dump") else dict(seg) for seg in payload.segments]
            
    db.commit()
    db.refresh(lesson)
    return lesson

@router.post("/lessons/generate", response_model=LessonResponse)
def generate_lesson_plan(payload: LessonGenerateRequest, db: Session = Depends(get_db)):
    student_id = payload.student_id
    if not student_id:
        student = db.query(StudentProfile).first()
        if not student:
            student = StudentProfile(name="Student")
            db.add(student)
            db.commit()
            db.refresh(student)
        student_id = student.id
        
    # Create or update LearnerProfile from full 7 parameters
    profile = LearnerProfile(
        student_id=student_id,
        level=payload.level or "Beginner",
        existing_knowledge=payload.existing_knowledge,
        objective=payload.objective or "Concept Mastery",
        language=payload.language or "English",
        style=payload.style or "Simple & example-heavy",
        available_time=payload.available_time or "20 min",
        depth=payload.depth or "Standard"
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    extracted_concepts = None
    if payload.material_id:
        material = db.query(Material).filter(Material.id == payload.material_id).first()
        if material and material.extracted_summary:
            extracted_concepts = material.extracted_summary.get("key_concepts", [])

    # Call Agent 2: Lesson Planner (Claude Sonnet)
    try:
        plan_data = plan_lesson(
            topic=payload.topic,
            concepts=extracted_concepts,
            profile=profile
        )
        segments = plan_data.get("segments", [])
        total_time = plan_data.get("total_estimated_minutes", 20)
    except Exception as e:
        topic_title = payload.topic or (material.filename if payload.material_id and material else "Foundations of Subject")
        total_time = 5 if "5" in profile.available_time else (60 if "60" in profile.available_time else 20)
        segments = [
            {
                "order": 1,
                "concept": f"Introduction & Core Intuition of {topic_title}",
                "target_time": f"{max(2, total_time // 3)} min",
                "visual_type": "diagram",
                "skipped": False
            },
            {
                "order": 2,
                "concept": f"Quantitative Mechanics & Mathematical Framework",
                "target_time": f"{max(2, total_time // 3)} min",
                "visual_type": "chart",
                "skipped": False
            },
            {
                "order": 3,
                "concept": f"Real-World Engineering & Applied Scenarios",
                "target_time": f"{max(2, total_time // 3)} min",
                "visual_type": "math",
                "skipped": False
            }
        ]

    # Create Lesson entity
    lesson = Lesson(
        student_id=student_id,
        source_type=payload.source_type,
        material_id=payload.material_id,
        topic=payload.topic,
        profile_id=profile.id,
        status="active"
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    # Create LessonPlan entity
    lesson_plan = LessonPlan(
        lesson_id=lesson.id,
        segments=segments,
        total_estimated_minutes=total_time,
        status="active"
    )
    db.add(lesson_plan)
    db.commit()
    db.refresh(lesson)

    return lesson

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

@router.patch("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson_plan(lesson_id: str, payload: LessonPlanUpdate, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    if payload.status:
        lesson.status = payload.status
        
    if lesson.plan and payload.segments is not None:
        lesson.plan.segments = [seg.model_dump() if hasattr(seg, "model_dump") else dict(seg) for seg in payload.segments]
        if payload.status:
            lesson.plan.status = payload.status
            
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
        
    profile = db.query(LearnerProfile).filter(LearnerProfile.id == payload.profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Learner profile not found")

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
        # Fallback if API key not present or error during test
        topic_title = payload.topic or (material.filename if payload.material_id and material else "Foundations of Subject")
        total_time = 5 if "5" in profile.available_time else (60 if "60" in profile.available_time else 20)
        segments = [
            {
                "order": 1,
                "concept": f"Introduction & Core Intuition of {topic_title}",
                "target_time": f"{max(2, total_time // 3)} min",
                "visual_type": "diagram",
                "learning_objective": "Establish fundamental definitions and intuitive motivation",
                "skipped": False
            },
            {
                "order": 2,
                "concept": f"Governing Laws & Analytical Relationships",
                "target_time": f"{max(3, total_time // 2)} min",
                "visual_type": "chart",
                "learning_objective": "Analyze mathematical formulas and parameter dependencies",
                "skipped": False
            },
            {
                "order": 3,
                "concept": f"Real-World Scenarios & Common Edge Cases",
                "target_time": f"{max(2, total_time // 4)} min",
                "visual_type": "code",
                "learning_objective": "Apply theoretical principles to practical problem scenarios",
                "skipped": False
            }
        ]

    lesson = Lesson(
        student_id=student_id,
        source_type=payload.source_type,
        material_id=payload.material_id,
        topic=payload.topic,
        profile_id=payload.profile_id,
        status="draft"
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    
    plan = LessonPlan(
        lesson_id=lesson.id,
        segments=segments,
        total_estimated_minutes=total_time,
        status="draft"
    )
    db.add(plan)
    db.commit()
    db.refresh(lesson)
    
    return lesson

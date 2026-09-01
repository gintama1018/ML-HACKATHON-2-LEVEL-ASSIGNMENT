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
def list_student_lessons(student_id: str = None, distinct: bool = True, db: Session = Depends(get_db)):
    if not student_id:
        student = db.query(StudentProfile).first()
        if not student:
            return []
        student_id = student.id
    
    all_lessons = db.query(Lesson).filter(Lesson.student_id == student_id).order_by(Lesson.created_at.desc()).all()
    if not distinct:
        return all_lessons
        
    seen = set()
    unique_lessons = []
    for l in all_lessons:
        key = (l.topic or "Study Document").strip().lower()
        if key not in seen:
            seen.add(key)
            unique_lessons.append(l)
    return unique_lessons

@router.post("/lessons/cleanup-duplicates")
def cleanup_duplicate_lessons(db: Session = Depends(get_db)):
    """Removes duplicate test runs from SQLite keeping the latest for each topic"""
    all_lessons = db.query(Lesson).order_by(Lesson.created_at.desc()).all()
    seen = set()
    deleted_count = 0
    for l in all_lessons:
        key = (l.topic or "Study Document").strip().lower()
        if key in seen:
            db.delete(l)
            deleted_count += 1
        else:
            seen.add(key)
    db.commit()
    return {"status": "success", "deleted_duplicates": deleted_count, "unique_retained": len(seen)}

@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: str, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.patch("/lessons/{lesson_id}", response_model=LessonResponse)
@router.put("/lessons/{lesson_id}/plan", response_model=LessonResponse)
def update_lesson_plan(lesson_id: str, payload: LessonPlanUpdate, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    if payload.status:
        lesson.status = payload.status
        if lesson.plan:
            lesson.plan.status = payload.status

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

    # Fetch student historical weak concepts for cross-session adaptation (REQ-43)
    student_obj = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    historical_weak = student_obj.weak_concepts if student_obj and student_obj.weak_concepts else None

    # Call Agent 2: Lesson Planner (Claude Sonnet / Gemini 1.5 Pro)
    try:
        plan_data = plan_lesson(
            topic=payload.topic,
            concepts=extracted_concepts,
            profile=profile,
            weak_concepts=historical_weak
        )
        segments = plan_data.get("segments", [])
        total_time = plan_data.get("total_estimated_minutes", 20)
    except Exception as e:
        topic_title = payload.topic or (material.filename if payload.material_id and material else "Foundations of Subject")
        avail = profile.available_time.lower() if profile.available_time else ""
        is_7_day = "7" in avail or "day" in avail or "week" in avail or ("7" in (payload.topic or "").lower() and "day" in (payload.topic or "").lower())
        
        if is_7_day:
            total_time = 7 * 45
            segments = [
                {
                    "order": 1,
                    "day_number": 1,
                    "is_revision_day": False,
                    "concept": f"Day 1: Core Fundamentals & Intuition of {topic_title}",
                    "target_time": "45 min",
                    "visual_type": "diagram",
                    "visual_rationale": "Diagram provides initial structural scaffolding of core principles",
                    "learning_objective": "Establish fundamental definitions and conceptual mental models",
                    "skipped": False
                },
                {
                    "order": 2,
                    "day_number": 2,
                    "is_revision_day": False,
                    "concept": f"Day 2: Mathematical Formulations & Governing Laws",
                    "target_time": "45 min",
                    "visual_type": "math",
                    "visual_rationale": "Formal equations clarify quantitative relationships",
                    "learning_objective": "Derive primary governing equations and verify units",
                    "skipped": False
                },
                {
                    "order": 3,
                    "day_number": 3,
                    "is_revision_day": False,
                    "concept": f"Day 3: Computational Simulation & Problem Solving",
                    "target_time": "45 min",
                    "visual_type": "code",
                    "visual_rationale": "Code implementation reinforces algorithmic mechanics",
                    "learning_objective": "Execute analytical problem calculations",
                    "skipped": False
                },
                {
                    "order": 4,
                    "day_number": 4,
                    "is_revision_day": True,
                    "concept": f"Day 4: Mid-Week Spaced Revision & Boundary Conditions",
                    "target_time": "45 min",
                    "visual_type": "chart",
                    "visual_rationale": "Comparative charts solidify retention through spaced retrieval",
                    "learning_objective": "Remediate early misconceptions and test boundary limits",
                    "skipped": False
                },
                {
                    "order": 5,
                    "day_number": 5,
                    "is_revision_day": False,
                    "concept": f"Day 5: Real-World Engineering & Applied Systems",
                    "target_time": "45 min",
                    "visual_type": "diagram",
                    "visual_rationale": "System blueprints map theoretical knowledge to real physical hardware",
                    "learning_objective": "Analyze industrial applications and edge cases",
                    "skipped": False
                },
                {
                    "order": 6,
                    "day_number": 6,
                    "is_revision_day": False,
                    "concept": f"Day 6: Advanced Synthesis & Cross-Domain Integration",
                    "target_time": "45 min",
                    "visual_type": "math",
                    "visual_rationale": "Mathematical proof synthesis builds exam-level confidence",
                    "learning_objective": "Synthesize multiple interacting concepts into unified framework",
                    "skipped": False
                },
                {
                    "order": 7,
                    "day_number": 7,
                    "is_revision_day": True,
                    "concept": f"Day 7: Capstone Mastery Assessment & Diagnostic Feedback",
                    "target_time": "45 min",
                    "visual_type": "chart",
                    "visual_rationale": "Mastery metrics visualizer maps learner profile progression",
                    "learning_objective": "Demonstrate complete subject mastery across all dimensions",
                    "skipped": False
                }
            ]
        else:
            total_time = 5 if "5" in avail else (60 if "60" in avail else 20)
            segments = [
                {
                    "order": 1,
                    "day_number": 1,
                    "is_revision_day": False,
                    "concept": f"Introduction & Core Intuition of {topic_title}",
                    "target_time": f"{max(2, total_time // 3)} min",
                    "visual_type": "diagram",
                    "visual_rationale": "Visual diagram provides immediate intuitive spatial grounding",
                    "learning_objective": "Understand high-level definitions and core mechanics",
                    "skipped": False
                },
                {
                    "order": 2,
                    "day_number": 1,
                    "is_revision_day": False,
                    "concept": f"Quantitative Mechanics & Mathematical Framework",
                    "target_time": f"{max(2, total_time // 3)} min",
                    "visual_type": "chart",
                    "visual_rationale": "Coordinate curves display empirical and theoretical relationships",
                    "learning_objective": "Solve governing mathematical equations with precision",
                    "skipped": False
                },
                {
                    "order": 3,
                    "day_number": 1,
                    "is_revision_day": False,
                    "concept": f"Real-World Engineering & Applied Scenarios",
                    "target_time": f"{max(2, total_time // 3)} min",
                    "visual_type": "math",
                    "visual_rationale": "Applied equations connect textbook theory to practical engineering",
                    "learning_objective": "Synthesize knowledge to solve practical real-world problems",
                    "skipped": False
                }
            ]

    # Create Lesson entity with draft status for review
    lesson = Lesson(
        student_id=student_id,
        source_type=payload.source_type,
        material_id=payload.material_id,
        topic=payload.topic,
        profile_id=profile.id,
        status="draft"
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    # Create LessonPlan entity
    lesson_plan = LessonPlan(
        lesson_id=lesson.id,
        segments=segments,
        total_estimated_minutes=total_time,
        status="draft"
    )
    db.add(lesson_plan)
    db.commit()
    db.refresh(lesson)

    return lesson

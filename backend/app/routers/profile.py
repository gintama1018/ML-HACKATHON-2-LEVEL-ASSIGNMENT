from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StudentProfile, LearnerProfile
from app.schemas import (
    StudentProfileResponse, StudentProfileUpdate,
    LearnerProfileCreate, LearnerProfileResponse
)

router = APIRouter(tags=["Profiles"])

@router.get("/students/default", response_model=StudentProfileResponse)
def get_or_create_default_student(db: Session = Depends(get_db)):
    student = db.query(StudentProfile).first()
    if not student:
        student = StudentProfile(name="Student")
        db.add(student)
        db.commit()
        db.refresh(student)
    return student

@router.post("/students", response_model=StudentProfileResponse)
def create_student(payload: Optional[StudentProfileUpdate] = None, db: Session = Depends(get_db)):
    name = payload.name if payload and payload.name else "Student"
    student = StudentProfile(name=name)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.get("/students/{student_id}/profile", response_model=StudentProfileResponse)
def get_student_profile(student_id: str, db: Session = Depends(get_db)):
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student

@router.patch("/students/{student_id}/profile", response_model=StudentProfileResponse)
def update_student_profile(student_id: str, payload: StudentProfileUpdate, db: Session = Depends(get_db)):
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    if payload.name is not None:
        student.name = payload.name
    if payload.strong_concepts is not None:
        student.strong_concepts = payload.strong_concepts
    if payload.weak_concepts is not None:
        student.weak_concepts = payload.weak_concepts
    if payload.current_path_id is not None:
        student.current_path_id = payload.current_path_id
    if payload.learning_history is not None:
        student.learning_history = payload.learning_history
        
    db.commit()
    db.refresh(student)
    return student

@router.post("/learner-profile", response_model=LearnerProfileResponse)
def create_or_update_learner_profile(payload: LearnerProfileCreate, db: Session = Depends(get_db)):
    student_id = payload.student_id
    if not student_id:
        # Default or first student
        student = db.query(StudentProfile).first()
        if not student:
            student = StudentProfile(name="Student")
            db.add(student)
            db.commit()
            db.refresh(student)
        student_id = student.id
    
    profile = LearnerProfile(
        student_id=student_id,
        level=payload.level,
        existing_knowledge=payload.existing_knowledge,
        objective=payload.objective,
        language=payload.language,
        style=payload.style,
        available_time=payload.available_time,
        depth=payload.depth
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

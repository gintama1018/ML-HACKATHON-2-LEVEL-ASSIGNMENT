from typing import List, Optional
from datetime import datetime, timezone
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StudentProfile, LearningPath, LearningPathModule
from app.schemas import (
    LearningPathResponse, LearningPathGenerateRequest,
    LearningPathModuleUpdateRequest, LearningPathModuleResponse
)
from app.services.claude_service import claude_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/learning-paths", tags=["Learning Path & Curriculum Progression"])

CURRICULUM_PROMPT = """You are the Curriculum Architect Agent of Bharat Academix.
Generate a structured, sequential multi-module learning curriculum for a broad educational topic.

Schema:
{
  "curriculum_title": string,
  "modules": [
    {
      "module_order": int,
      "title": string,
      "description": string,
      "key_concepts": [string]
    }
  ]
}"""

@router.post("/generate", response_model=LearningPathResponse)
def generate_learning_path(payload: LearningPathGenerateRequest, db: Session = Depends(get_db)):
    student_id = payload.student_id
    if not student_id:
        student = db.query(StudentProfile).first()
        if not student:
            student = StudentProfile(name="Student")
            db.add(student)
            db.commit()
            db.refresh(student)
        student_id = student.id

    topic = payload.topic
    level = payload.target_level
    num_modules = min(8, max(3, payload.total_modules))

    # Generate curriculum using AI reasoning or structured fallback
    try:
        curriculum_data = claude_service.call_json(
            system_prompt=CURRICULUM_PROMPT,
            user_prompt=f"Generate a {num_modules}-module progressive curriculum for '{topic}' at level '{level}'. Ensure pedagogical sequence from foundational intuition to advanced synthesis.",
            use_reasoning=True,
            temperature=0.2
        )
        raw_modules = curriculum_data.get("modules", [])
    except Exception as e:
        logger.warning(f"Curriculum generation fallback for {topic}: {e}")
        raw_modules = [
            {
                "module_order": 1,
                "title": f"{topic} Foundations & Core Principles",
                "description": f"Understanding foundational axioms, key definitions, and mental models of {topic}.",
                "key_concepts": [f"{topic} Overview", "Core Terminology", "Foundational Principles"]
            },
            {
                "module_order": 2,
                "title": f"Structural Mechanics & Conceptual Frameworks in {topic}",
                "description": f"Detailed exploration of internal structures, processes, and relationships governing {topic}.",
                "key_concepts": ["Structural Framework", "Core Relationships", "Analytical Dynamics"]
            },
            {
                "module_order": 3,
                "title": f"Real-World Scenarios & Applied Case Studies in {topic}",
                "description": f"Practical application scenarios, historical/experimental examples, and case studies of {topic}.",
                "key_concepts": ["Practical Scenarios", "Case Analysis", "Applied Methodologies"]
            },
            {
                "module_order": 4,
                "title": f"Advanced Synthesis & Complex Systems in {topic}",
                "description": f"Advanced interactions, edge cases, and comparative frameworks in {topic}.",
                "key_concepts": ["Advanced Interactions", "Edge Case Analysis", "Synthesis Frameworks"]
            },
            {
                "module_order": 5,
                "title": f"Comprehensive Mastery & Capstone Diagnostic for {topic}",
                "description": f"End-to-end concept synthesis, critical problem solving, and diagnostic mastery evaluation.",
                "key_concepts": ["Cross-Concept Synthesis", "Problem Solving", "Diagnostic Review"]
            }
        ][:num_modules]

    # Create LearningPath entity
    learning_path = LearningPath(
        student_id=student_id,
        topic=topic,
        target_level=level,
        total_modules=len(raw_modules),
        current_module_index=0,
        status="in_progress"
    )
    db.add(learning_path)
    db.commit()
    db.refresh(learning_path)

    # Create module entities (First module unlocked, subsequent locked)
    for idx, mod in enumerate(raw_modules):
        is_first = (idx == 0)
        module_entity = LearningPathModule(
            path_id=learning_path.id,
            module_order=mod.get("module_order", idx + 1),
            title=mod.get("title", f"Module {idx + 1}"),
            description=mod.get("description", ""),
            key_concepts=mod.get("key_concepts", []),
            is_unlocked=is_first,
            is_completed=False,
            score=None
        )
        db.add(module_entity)

    db.commit()
    db.refresh(learning_path)

    # Update student profile current path
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if student:
        student.current_path_id = learning_path.id
        db.commit()

    return learning_path

@router.get("", response_model=List[LearningPathResponse])
@router.get("/", response_model=List[LearningPathResponse])
def list_learning_paths(student_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(LearningPath)
    if student_id:
        query = query.filter(LearningPath.student_id == student_id)
    return query.order_by(LearningPath.created_at.desc()).all()

@router.get("/{path_id}", response_model=LearningPathResponse)
def get_learning_path(path_id: str, db: Session = Depends(get_db)):
    path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return path

@router.patch("/{path_id}/modules/{module_id}", response_model=LearningPathModuleResponse)
def update_module_progress(
    path_id: str,
    module_id: str,
    payload: LearningPathModuleUpdateRequest,
    db: Session = Depends(get_db)
):
    path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")

    module = db.query(LearningPathModule).filter(
        LearningPathModule.id == module_id,
        LearningPathModule.path_id == path_id
    ).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found in this path")

    # Enforce unlock guard: Cannot complete or score a locked module directly
    if not module.is_unlocked and payload.is_completed:
        raise HTTPException(
            status_code=403,
            detail=f"Module '{module.title}' is locked. Please complete preceding modules first."
        )

    if payload.score is not None:
        module.score = payload.score

    if payload.is_completed is not None:
        module.is_completed = payload.is_completed
        if payload.is_completed:
            module.completed_at = datetime.now(timezone.utc)

            # Check if mastery criteria met (score >= 70% or marked completed)
            if module.score is None or module.score >= 70.0:
                # Unlock the next sequential module
                next_module = db.query(LearningPathModule).filter(
                    LearningPathModule.path_id == path_id,
                    LearningPathModule.module_order == module.module_order + 1
                ).first()
                if next_module:
                    next_module.is_unlocked = True
                    path.current_module_index = next_module.module_order - 1
                else:
                    # All modules completed
                    path.status = "completed"

    db.commit()
    db.refresh(module)
    return module

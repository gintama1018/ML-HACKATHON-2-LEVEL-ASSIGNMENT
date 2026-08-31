import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    LessonSession, SessionSegment, Assessment, LearningReport, StudentProfile
)
from app.schemas import (
    AssessmentGenerateRequest, AssessmentSubmitRequest,
    AssessmentResponse
)
from app.agents.assessment_engine import generate_final_assessment
from app.agents.learning_profile_engine import update_profile_and_recommend

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Assessment"])

def utcnow():
    return datetime.now(timezone.utc)

@router.post("/session/{session_id}/assessment/generate", response_model=AssessmentResponse)
def generate_assessment(session_id: str, db: Session = Depends(get_db)):
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    existing = db.query(Assessment).filter(Assessment.session_id == session.id).first()
    if existing:
        return existing
        
    segments = db.query(SessionSegment).filter(SessionSegment.session_id == session.id).all()
    concepts_summary = [
        {
            "concept": seg.concept,
            "is_mastered": seg.is_mastered,
            "retry_count": seg.retry_count
        }
        for seg in segments
    ]
    
    lesson_title = session.lesson.topic if session.lesson and session.lesson.topic else "Lesson Concepts"

    # Call Agent 9: Assessment Engine (Claude Sonnet)
    try:
        level = session.lesson.profile.level if session.lesson and session.lesson.profile else "Beginner"
        exam_data = generate_final_assessment(
            lesson_title=lesson_title,
            concepts_summary=concepts_summary,
            level=level
        )
        questions = exam_data.get("questions", [])
    except Exception as e:
        logger.warning(f"AssessmentEngine agent call failed: {e}. Generating structured fallback.")
        questions = []
        for idx, seg in enumerate(segments, 1):
            questions.append({
                "id": f"q_{idx}",
                "concept": seg.concept,
                "type": "mcq",
                "prompt": f"Regarding {seg.concept}, what is the primary governing relationship or principle?",
                "options": [
                    f"Core characteristic relationship in {seg.concept}",
                    f"Alternative secondary perturbation",
                    f"Constant invariant zero-state",
                    f"Non-deterministic stochastic variation"
                ],
                "answer_key": f"Core characteristic relationship in {seg.concept}"
            })
        questions.append({
            "id": f"q_{len(segments) + 1}",
            "concept": "Synthesis & Application",
            "type": "mcq",
            "prompt": "How do all of these covered concepts synthesize in real-world application?",
            "options": [
                "They combine systematically to govern system behavior",
                "They operate completely independently without interaction",
                "They cancel each other out in equilibrium",
                "They apply only to idealized vacuum states"
            ],
            "answer_key": "They combine systematically to govern system behavior"
        })
    
    assessment = Assessment(
        session_id=session.id,
        questions=questions,
        student_answers={},
        status="in_progress"
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment

@router.post("/session/{session_id}/assessment/submit", response_model=AssessmentResponse)
def submit_assessment(session_id: str, payload: AssessmentSubmitRequest, db: Session = Depends(get_db)):
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    assessment = db.query(Assessment).filter(Assessment.session_id == session.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    answers = payload.answers
    assessment.student_answers = answers
    
    correct_count = 0
    total_count = len(assessment.questions)
    breakdown = []
    strong_areas = []
    weak_areas = []
    
    for q in assessment.questions:
        q_id = q.get("id")
        concept = q.get("concept", "General")
        student_ans = answers.get(q_id, "").strip().lower()
        key_ans = q.get("answer_key", "").strip().lower()
        is_correct = False
        if student_ans:
            if student_ans == key_ans or key_ans in student_ans or student_ans in key_ans:
                is_correct = True
            else:
                k_tokens = set(key_ans.split())
                s_tokens = set(student_ans.split())
                overlap = len(k_tokens.intersection(s_tokens))
                if overlap >= max(1, int(len(k_tokens) * 0.5)):
                    is_correct = True
        if is_correct:
            correct_count += 1
            if concept not in strong_areas:
                strong_areas.append(concept)
        else:
            if concept not in weak_areas:
                weak_areas.append(concept)
                
        breakdown.append({
            "question_id": q_id,
            "prompt": q.get("prompt"),
            "concept": concept,
            "student_answer": answers.get(q_id, "No answer"),
            "correct_answer": q.get("answer_key"),
            "is_correct": is_correct
        })
        
    score_pct = round((correct_count / total_count * 100.0), 1) if total_count > 0 else 0.0
    assessment.score = score_pct
    assessment.status = "completed"
    assessment.completed_at = utcnow()
    
    session.status = "completed"
    session.completed_at = utcnow()
    
    # Call Agent 10: Learning Profile Engine (Claude Haiku)
    student = session.lesson.student if session.lesson else None
    completed_topic = session.lesson.topic if session.lesson and session.lesson.topic else "Completed Module"
    
    rec_next_topic = f"Advanced Applications of {completed_topic}"
    rec_reason = "Natural progression along foundational curriculum."
    
    if student:
        try:
            profile_update_data = update_profile_and_recommend(
                current_strong=student.strong_concepts or [],
                current_weak=student.weak_concepts or [],
                completed_topic=completed_topic,
                score=score_pct,
                session_strong=strong_areas,
                session_weak=weak_areas
            )
            rec_next_topic = profile_update_data.get("recommended_next_topic", rec_next_topic)
            rec_reason = profile_update_data.get("recommendation_reason", rec_reason)
            updated_strong = profile_update_data.get("updated_strong_concepts", strong_areas)
            updated_weak = profile_update_data.get("updated_weak_concepts", weak_areas)
        except Exception as e:
            updated_strong = list(set((student.strong_concepts or []) + strong_areas))
            updated_weak = [c for c in (student.weak_concepts or []) if c not in strong_areas] + [w for w in weak_areas if w not in (student.weak_concepts or [])]

        history = list(student.learning_history or [])
        history.append({
            "lesson_id": session.lesson_id,
            "topic": completed_topic,
            "score": score_pct,
            "completed_at": utcnow().isoformat(),
            "strong_concepts": strong_areas,
            "weak_concepts": weak_areas
        })
        student.learning_history = history
        student.strong_concepts = updated_strong
        student.weak_concepts = updated_weak

    # Create or update learning report
    report = db.query(LearningReport).filter(LearningReport.session_id == session.id).first()
    if not report:
        report = LearningReport(
            session_id=session.id,
            score=score_pct,
            total_questions=total_count,
            correct_answers=correct_count,
            strong_areas=strong_areas or ["Core Principles"],
            weak_areas=weak_areas,
            recommended_revision="Review weak concepts and re-verify parameter dependencies." if weak_areas else "Excellent mastery demonstrated across all sections.",
            recommended_next_topic=rec_next_topic,
            detailed_breakdown=breakdown
        )
        db.add(report)
    else:
        report.score = score_pct
        report.total_questions = total_count
        report.correct_answers = correct_count
        report.strong_areas = strong_areas or ["Core Principles"]
        report.weak_areas = weak_areas
        report.recommended_next_topic = rec_next_topic
        report.detailed_breakdown = breakdown
        
    db.commit()
    db.refresh(assessment)
    return assessment

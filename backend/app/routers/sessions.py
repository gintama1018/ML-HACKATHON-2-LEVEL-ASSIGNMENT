import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Lesson,
    LessonSession,
    SessionSegment,
    Question,
    StudentResponse,
    Evaluation,
    LearnerProfile
)
from app.schemas import (
    SessionCreateRequest,
    SessionUpdateRequest,
    StudentAnswerRequest,
    ExplainAgainRequest,
    AskTeacherRequest,
    AskTeacherResponse,
    LessonSessionResponse,
    EvaluationResponse,
    QuestionResponse,
    FlashcardsResponse,
    FlashcardItem,
    StudyNotesResponse,
    ConceptMapResponse,
    ConceptMapNode,
    ConceptMapEdge
)
from app.services.rag_service import rag_service
from app.services.claude_service import claude_service
from app.agents.teaching_agent import teach_concept
from app.agents.visual_planner import plan_visual
from app.agents.question_generator import generate_question
from app.agents.response_evaluator import evaluate_response
from app.agents.misconception_detector import detect_misconception
from app.agents.adaptive_teacher import adapt_and_reteach

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Sessions & Teaching Loop"])

def utcnow():
    return datetime.now(timezone.utc)

def format_session_response(session: LessonSession, db: Session) -> LessonSessionResponse:
    # Fetch current segment
    current_segment = db.query(SessionSegment).filter(
        SessionSegment.session_id == session.id,
        SessionSegment.segment_order == session.current_step + 1
    ).first()

    current_question = None
    if current_segment:
        # Get latest active question (including adaptive follow-ups)
        current_question = db.query(Question).filter(
            Question.session_id == session.id,
            Question.segment_id == current_segment.id
        ).order_by(Question.created_at.desc()).first()

    total_segments = len(session.lesson.plan.segments) if session.lesson and session.lesson.plan and session.lesson.plan.segments else 3

    return LessonSessionResponse(
        id=session.id,
        lesson_id=session.lesson_id,
        status=session.status,
        current_step=session.current_step,
        current_difficulty=session.current_difficulty or "Intermediate",
        consecutive_correct=session.consecutive_correct or 0,
        consecutive_incorrect=session.consecutive_incorrect or 0,
        language=session.language,
        video_url=session.video_url,
        video_scenes=session.video_scenes or [],
        started_at=session.started_at,
        completed_at=session.completed_at,
        updated_at=session.updated_at,
        current_segment=current_segment,
        current_question=current_question,
        total_segments=total_segments
    )

@router.post("/session/create", response_model=LessonSessionResponse)
def create_session(payload: SessionCreateRequest, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == payload.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    target_language = lesson.profile.language if lesson.profile else "English"
    initial_difficulty = lesson.profile.level if lesson.profile else "Intermediate"

    # Transition lesson and lesson plan from draft to active
    lesson.status = "active"
    if lesson.plan:
        lesson.plan.status = "active"
    db.commit()

    # Create new session entity
    session = LessonSession(
        lesson_id=lesson.id,
        status="in_progress",
        current_step=0,
        current_difficulty=initial_difficulty,
        consecutive_correct=0,
        consecutive_incorrect=0,
        language=target_language
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Initialize first segment
    segments_data = lesson.plan.segments if lesson.plan else []
    active_segments = [s for s in segments_data if not s.get("skipped", False)]
    
    if active_segments:
        first_seg_def = active_segments[0]
        concept = first_seg_def.get("concept", "Foundational Concept")
        visual_type_hint = first_seg_def.get("visual_type", "diagram")
        
        # RAG retrieval if material exists
        rag_chunks = []
        if lesson.material_id:
            rag_chunks = rag_service.retrieve_relevant_chunks(lesson.material_id, query=concept, top_k=3)

        # Call Agent 3: Teaching Agent
        try:
            teach_data = teach_concept(
                concept=concept,
                learning_objective=first_seg_def.get("learning_objective", "Core intuitive understanding"),
                profile=lesson.profile,
                rag_chunks=rag_chunks,
                language_override=target_language
            )
            explanation_text = teach_data.get("explanation_text")
            citations = teach_data.get("source_citations", [])
        except Exception as e:
            logger.warning(f"TeachingAgent fallback on create_session: {e}")
            if target_language.lower() == "hindi":
                explanation_text = f"नमस्ते! आज हम {concept} के मूलभूत सिद्धांतों को विस्तार से समझेंगे।"
            elif target_language.lower() == "hinglish":
                explanation_text = f"Namaste! Aaj hum {concept} ke core concept ko step-by-step explore karenge."
            else:
                explanation_text = f"Welcome to today's lesson on {concept}. Let's examine the foundational principles step by step."
            citations = []

        # Groundedness verification (REQ-20)
        groundedness_info = None
        if rag_chunks:
            groundedness_info = rag_service.verify_groundedness(explanation_text, rag_chunks)
            if not groundedness_info.get("is_grounded", True):
                logger.warning(
                    f"GROUNDING_WARNING: Concept '{concept}' explanation groundedness score is low "
                    f"({groundedness_info.get('groundedness_score', 0):.2f} < 0.70)."
                )

        # Call Agent 4: Visual Planner
        try:
            visual_data = plan_visual(concept=concept, visual_type_hint=visual_type_hint, explanation_text=explanation_text)
            chosen_visual_type = visual_data.get("visual_type", visual_type_hint)
            visual_spec = visual_data.get("visual_spec", {})
        except Exception as e:
            chosen_visual_type = visual_type_hint
            visual_spec = {"title": concept, "type": visual_type_hint}

        if groundedness_info:
            visual_spec["groundedness"] = groundedness_info

        first_segment = SessionSegment(
            session_id=session.id,
            segment_order=1,
            concept=concept,
            explanation_text=explanation_text,
            visual_type=chosen_visual_type,
            visual_spec=visual_spec,
            source_citations=citations,
            status="ready"
        )
        db.add(first_segment)
        db.commit()
        db.refresh(first_segment)

        # Call Agent 5: Question Generator
        try:
            q_data = generate_question(
                concept=concept,
                explanation_text=explanation_text,
                level=initial_difficulty,
                question_type="mcq",
                language=target_language
            )
            prompt = q_data.get("prompt")
            options = q_data.get("options")
            answer_key = q_data.get("answer_key")
            hint = q_data.get("explanation_hint")
        except Exception as e:
            logger.warning(f"QuestionGenerator fallback on create_session: {e}")
            if target_language.lower() == "hindi":
                prompt = f"{concept} के संदर्भ में कौन सा कथन सही है?"
                options = ["यह मुख्य संबंध को निर्धारित करता है।", "यह पूरी तरह अपरिवर्तनीय है।", "यह केवल शून्य तापमान पर लागू होता है।", "इसका कोई व्यावहारिक उपयोग नहीं है।"]
                answer_key = "यह मुख्य संबंध को निर्धारित करता है।"
                hint = "मुख्य सूत्र पर विचार करें।"
            elif target_language.lower() == "hinglish":
                prompt = f"{concept} ke context me kaun sa statement correct hai?"
                options = ["Ye primary physical relationship ko define karta hai.", "Ye completely constant rehta hai.", "Ye zero temperature par hi apply hota hai.", "Iska koi use nahi hai."]
                answer_key = "Ye primary physical relationship ko define karta hai."
                hint = "Core formula ko recall karein."
            else:
                prompt = f"Which statement best describes the fundamental behavior of {concept}?"
                options = ["It defines the primary direct and inverse physical relationship.", "It remains strictly constant under all conditions.", "It has no practical engineering relevance.", "It applies only in extreme non-physical environments."]
                answer_key = "It defines the primary direct and inverse physical relationship."
                hint = "Focus on the governing relationship."

        first_question = Question(
            session_id=session.id,
            segment_id=first_segment.id,
            type="mcq",
            difficulty=initial_difficulty,
            prompt=prompt,
            options=options,
            answer_key=answer_key,
            explanation_hint=hint
        )
        db.add(first_question)
        db.commit()

    return format_session_response(session, db)

@router.get("/session/{session_id}", response_model=LessonSessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return format_session_response(session, db)

@router.patch("/session/{session_id}", response_model=LessonSessionResponse)
def update_session(
    session_id: str,
    payload: SessionUpdateRequest,
    db: Session = Depends(get_db)
):
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if payload.language is not None:
        target_lang = payload.language
        session.language = target_lang

        # Translate current segment explanation & questions
        current_segment = db.query(SessionSegment).filter(
            SessionSegment.session_id == session.id,
            SessionSegment.segment_order == session.current_step + 1
        ).first()

        if current_segment:
            try:
                trans_prompt = f"""Translate this educational concept explanation into natural {target_lang}:
Text: {current_segment.explanation_text}
Concept: {current_segment.concept}

Return valid JSON:
{{"explanation_text": string}}"""
                res = claude_service.call_json(
                    system_prompt="You are a multilingual educational translation agent.",
                    user_prompt=trans_prompt,
                    use_reasoning=False
                )
                if res.get("explanation_text"):
                    current_segment.explanation_text = res["explanation_text"]
                    db.commit()
            except Exception as e:
                c_name = current_segment.concept
                if target_lang.lower() == "hindi":
                    current_segment.explanation_text = f"नमस्ते! आज हम {c_name} के बारे में विस्तार से सीखेंगे। आइए इसके मुख्य सिद्धांतों, सूत्रों और व्यावहारिक प्रयोगों को सरल हिंदी में समझते हैं।"
                elif target_lang.lower() == "hinglish":
                    current_segment.explanation_text = f"Namaste! Aaj hum {c_name} ko deeply aur intuitively samjhenge. Chaliye iske fundamental mechanics aur real-world applications ko step by step explore karte hain."
                else:
                    current_segment.explanation_text = f"Welcome to today's lesson on {c_name}. Let's examine the foundational principles, core mechanics, and practical applications step by step."
                db.commit()

        current_q = db.query(Question).filter(
            Question.session_id == session.id,
            Question.segment_id == (current_segment.id if current_segment else None)
        ).order_by(Question.created_at.desc()).first()

        if current_q:
            try:
                q_trans_prompt = f"""Translate and adapt this question into {target_lang}:
Prompt: {current_q.prompt}
Options: {current_q.options}

Return JSON:
{{"prompt": string, "options": [string]}}"""
                q_res = claude_service.call_json(
                    system_prompt="You are an educational assessment translator.",
                    user_prompt=q_trans_prompt,
                    use_reasoning=False
                )
                if q_res.get("prompt"):
                    current_q.prompt = q_res["prompt"]
                if q_res.get("options"):
                    current_q.options = q_res["options"]
                db.commit()
            except Exception as e:
                c_name = current_segment.concept if current_segment else "Concept"
                if target_lang.lower() == "hindi":
                    current_q.prompt = f"{c_name} के संबंध में कौन सा कथन सही है?"
                    current_q.options = [
                        f"यह {c_name} के मूलभूत भौतिक और गणितीय संबंध को निर्धारित करता है।",
                        "यह बाहरी कारकों से पूरी तरह स्वतंत्र और अप्रभावित रहता है।",
                        "यह केवल शून्य तापमान की विशेष स्थिति में लागू होता है।",
                        "इसका कोई व्यावहारिक या इंजीनियरिंग महत्व नहीं है।"
                    ]
                    current_q.answer_key = f"यह {c_name} के मूलभूत भौतिक और गणितीय संबंध को निर्धारित करता है।"
                elif target_lang.lower() == "hinglish":
                    current_q.prompt = f"{c_name} ke bare me kaun sa option correct hai?"
                    current_q.options = [
                        f"Ye {c_name} ke fundamental relationship aur behavior ko govern karta hai.",
                        "Ye external factors se completely independent hota hai.",
                        "Ye sirf absolute zero temperature par hi apply hota hai.",
                        "Iska koi practical engineering relevance nahi hai."
                    ]
                    current_q.answer_key = f"Ye {c_name} ke fundamental relationship aur behavior ko govern karta hai."
                else:
                    current_q.prompt = f"Which statement best characterizes {c_name}?"
                    current_q.options = [
                        f"It governs the fundamental relationship in {c_name}.",
                        "It is completely independent of external parameters.",
                        "It applies only under extreme non-physical conditions.",
                        "It is a purely empirical observation with no theoretical basis."
                    ]
                    current_q.answer_key = f"It governs the fundamental relationship in {c_name}."
                db.commit()

    if payload.status is not None:
        session.status = payload.status
        if payload.status == "completed" and not session.completed_at:
            session.completed_at = utcnow()
    if payload.current_step is not None:
        session.current_step = payload.current_step
    if payload.current_difficulty is not None:
        session.current_difficulty = payload.current_difficulty
        
    session.updated_at = utcnow()
    db.commit()
    db.refresh(session)
    return format_session_response(session, db)

@router.post("/session/{session_id}/next-segment", response_model=LessonSessionResponse)
def advance_next_segment(session_id: str, db: Session = Depends(get_db)):
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    lesson = session.lesson
    active_segments = [s for s in (lesson.plan.segments if lesson and lesson.plan else []) if not s.get("skipped", False)]
    
    current_step = session.current_step + 1
    session.current_step = current_step
    target_language = session.language or (lesson.profile.language if lesson.profile else "English")
    current_difficulty = session.current_difficulty or "Intermediate"
    
    if current_step < len(active_segments):
        seg_def = active_segments[current_step]
        concept = seg_def.get("concept", f"Concept {current_step + 1}")
        visual_type_hint = seg_def.get("visual_type", "chart")
        
        # RAG retrieval
        rag_chunks = []
        if lesson.material_id:
            rag_chunks = rag_service.retrieve_relevant_chunks(lesson.material_id, query=concept, top_k=3)

        # Call Agent 3: Teaching Agent (Grounded with difficulty)
        try:
            teach_data = teach_concept(
                concept=concept,
                learning_objective=f"Master {concept} at {current_difficulty} level",
                profile=lesson.profile,
                rag_chunks=rag_chunks,
                language_override=target_language
            )
            explanation_text = teach_data.get("explanation_text")
            citations = teach_data.get("source_citations", [])
        except Exception as e:
            if target_language.lower() == "hindi":
                explanation_text = f"अब हम अगले मुख्य विषय {concept} पर आगे बढ़ते हैं।"
            elif target_language.lower() == "hinglish":
                explanation_text = f"Ab hum next concept {concept} par chalte hain."
            else:
                explanation_text = f"Now moving on to {concept}. Let's examine how this connects to what we just learned."
            citations = []

        # Groundedness verification (REQ-20)
        groundedness_info = None
        if rag_chunks:
            groundedness_info = rag_service.verify_groundedness(explanation_text, rag_chunks)
            if not groundedness_info.get("is_grounded", True):
                logger.warning(
                    f"GROUNDING_WARNING: Concept '{concept}' explanation groundedness score is low "
                    f"({groundedness_info.get('groundedness_score', 0):.2f} < 0.70)."
                )

        # Call Agent 4: Visual Planner
        try:
            visual_data = plan_visual(concept=concept, visual_type_hint=visual_type_hint, explanation_text=explanation_text)
            chosen_visual_type = visual_data.get("visual_type", visual_type_hint)
            visual_spec = visual_data.get("visual_spec", {})
        except Exception as e:
            chosen_visual_type = visual_type_hint
            visual_spec = {"title": concept, "type": visual_type_hint}

        if groundedness_info:
            visual_spec["groundedness"] = groundedness_info

        new_segment = SessionSegment(
            session_id=session.id,
            segment_order=current_step + 1,
            concept=concept,
            explanation_text=explanation_text,
            visual_type=chosen_visual_type,
            visual_spec=visual_spec,
            source_citations=citations,
            status="ready"
        )
        db.add(new_segment)
        db.commit()
        db.refresh(new_segment)

        # Call Agent 5: Question Generator (Difficulty-conscious)
        try:
            q_data = generate_question(
                concept=concept,
                explanation_text=explanation_text,
                level=current_difficulty,
                question_type="mcq",
                language=target_language
            )
            prompt = q_data.get("prompt")
            options = q_data.get("options")
            answer_key = q_data.get("answer_key")
            hint = q_data.get("explanation_hint")
        except Exception as e:
            if target_language.lower() == "hindi":
                prompt = f"{concept} के मुख्य प्रभाव को स्पष्ट करने वाला विकल्प चुनें:"
                options = ["यह मुख्य चर के समानुपाती है।", "यह पूरी तरह अपरिवर्तनीय है।", "यह केवल शून्य तापमान पर लागू होता है।", "इसका कोई व्यावहारिक उपयोग नहीं है।"]
                answer_key = "यह मुख्य चर के समानुपाती है।"
                hint = "समानुपातिकता पर ध्यान दें।"
            elif target_language.lower() == "hinglish":
                prompt = f"{concept} ka core effect kya hai?"
                options = ["Ye main variable ke directly proportional hai.", "Ye completely constant rehta hai.", "Ye zero temperature par hi apply hota hai.", "Iska koi use nahi hai."]
                answer_key = "Ye main variable ke directly proportional hai."
                hint = "Proportionality ko check karein."
            else:
                prompt = f"What is the key takeaway of {concept}?"
                options = ["It is directly proportional to the driving parameter.", "It remains strictly constant at all times.", "It has no physical significance.", "It only applies in a vacuum."]
                answer_key = "It is directly proportional to the driving parameter."
                hint = "Consider the mathematical relationship."

        new_question = Question(
            session_id=session.id,
            segment_id=new_segment.id,
            type="mcq",
            difficulty=current_difficulty,
            prompt=prompt,
            options=options,
            answer_key=answer_key,
            explanation_hint=hint
        )
        db.add(new_question)
        db.commit()
    else:
        # All segments finished -> Transition session to assessment
        session.status = "assessment"
        db.commit()
        
    session.updated_at = utcnow()
    db.commit()
    db.refresh(session)
    return format_session_response(session, db)

@router.post("/session/{session_id}/answer", response_model=EvaluationResponse)
def submit_student_answer(
    session_id: str,
    payload: StudentAnswerRequest,
    db: Session = Depends(get_db)
):
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    question = db.query(Question).filter(Question.id == payload.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    current_segment = db.query(SessionSegment).filter(
        SessionSegment.session_id == session.id,
        SessionSegment.segment_order == session.current_step + 1
    ).first()

    # 1. Record student response entity
    response_entity = StudentResponse(
        question_id=question.id,
        response_text=payload.response_text,
        is_unsure=payload.is_unsure
    )
    db.add(response_entity)
    db.commit()
    db.refresh(response_entity)

    # 2. Call Agent 6: Response Evaluator (Semantic Evaluation)
    ai_mode = "live"
    try:
        eval_data = evaluate_response(
            concept=current_segment.concept if current_segment else "Current Concept",
            prompt=question.prompt,
            student_response=payload.response_text,
            answer_key=question.answer_key or "Accurate conceptual explanation",
            is_unsure=payload.is_unsure
        )
        is_correct = eval_data.get("correct", False)
        confidence = eval_data.get("confidence", 0.9)
        notes = eval_data.get("evaluator_notes", eval_data.get("evaluation_notes", ""))
        ai_mode = eval_data.get("ai_mode", "live")
    except Exception as e:
        logger.warning("LLM_FALLBACK_FIRED", extra={"agent": "ResponseEvaluator", "reason": str(e)})
        ai_mode = "fallback"
        if payload.is_unsure:
            is_correct = False
            confidence = 1.0
            notes = "Student indicated uncertainty."
        else:
            resp_clean = payload.response_text.strip().lower()
            key_clean = (question.answer_key or "").strip().lower()
            if resp_clean == key_clean or resp_clean in key_clean or key_clean in resp_clean:
                is_correct = True
                confidence = 0.95
                notes = f"Direct match with key concept for '{payload.response_text[:30]}'."
            else:
                key_tokens = set(key_clean.split())
                resp_tokens = set(resp_clean.split())
                overlap = key_tokens.intersection(resp_tokens)
                overlap_ratio = len(overlap) / max(1, len(key_tokens))
                is_correct = overlap_ratio >= 0.5
                confidence = 0.85
                notes = f"Offline token overlap ({overlap_ratio:.2f}) evaluated for '{payload.response_text[:30]}'."

    # Save evaluation entity
    eval_entity = Evaluation(
        response_id=response_entity.id,
        correct=is_correct,
        confidence=confidence,
        notes=notes
    )
    db.add(eval_entity)
    db.commit()
    db.refresh(eval_entity)

    misconception_info = None
    adaptation_info = None
    new_explanation = None
    new_question_data = None

    # 3. Stateful Difficulty & Multi-Tier Evidence-Based Mastery State Machine
    mastery_state = "not_started"
    mastery_evidence = ""

    if is_correct:
        session.consecutive_correct = (session.consecutive_correct or 0) + 1
        session.consecutive_incorrect = 0
        
        # Difficulty Step-Up (e.g. Beginner -> Intermediate -> Advanced)
        if session.consecutive_correct >= 2:
            if session.current_difficulty == "Beginner":
                session.current_difficulty = "Intermediate"
            elif session.current_difficulty == "Intermediate":
                session.current_difficulty = "Advanced"

        # Evidence-Based Mastery Confirmation
        if question.is_adaptive_followup:
            mastery_state = "confirmed"
            mastery_evidence = "Remediation follow-up successfully resolved with alternative mental model."
            feedback = "Correct! You successfully applied the alternative mental model and mastered this concept."
        elif confidence >= 0.85:
            mastery_state = "confirmed"
            mastery_evidence = f"High-confidence conceptual demonstration ({confidence:.2f}) verified on initial assessment."
            feedback = "Correct! Excellent intuition and confirmed mastery of this concept."
        else:
            mastery_state = "provisional"
            mastery_evidence = f"Provisional conceptual understanding ({confidence:.2f}) demonstrated."
            feedback = "Good answer! Concept understanding verified."

        if current_segment:
            current_segment.is_mastered = True
        db.commit()

    else:
        mastery_state = "in_remediation"
        mastery_evidence = "Conceptual misconception detected. Scaffolded alternative explanation and targeted follow-up deployed."
        session.consecutive_incorrect = (session.consecutive_incorrect or 0) + 1
        session.consecutive_correct = 0

        # Difficulty Step-Down (e.g. Advanced -> Intermediate -> Beginner)
        if session.consecutive_incorrect >= 2:
            if session.current_difficulty == "Advanced":
                session.current_difficulty = "Intermediate"
            elif session.current_difficulty == "Intermediate":
                session.current_difficulty = "Beginner"

        if current_segment:
            current_segment.is_mastered = False
            current_segment.retry_count += 1
            db.commit()

        feedback = "Let us examine this concept from an alternative perspective to address the underlying misconception."

        # Call Agent 7: Misconception Detector (Claude Sonnet / Gemini)
        try:
            misc_data = detect_misconception(
                prompt=question.prompt,
                answer_key=question.answer_key or "",
                student_response=payload.response_text,
                evaluator_notes=notes
            )
            misc_desc = misc_data.get("description", "Conceptual gap regarding parameter relationships.")
            misc_root = misc_data.get("root_cause", "Misinterpreted governing mechanism.")
            misc_cat = misc_data.get("misconception_category", "Relationship Inversion")
            
            misconception_info = {
                "description": misc_desc,
                "root_cause": misc_root,
                "misconception_category": misc_cat
            }
            eval_entity.misconception = misconception_info
            db.commit()
        except Exception as e:
            c_name = current_segment.concept if current_segment else (session.lesson.topic if session.lesson else "the core concept")
            resp_snippet = payload.response_text[:60].strip()
            key_snippet = (question.answer_key or "")[:50].strip()
            misc_desc = f"Your answer '{resp_snippet}' suggests confusing the core governing mechanism in {c_name} with '{key_snippet}'."
            misc_root = f"Inferred '{resp_snippet}' as the valid relationship instead of '{key_snippet}' in {c_name}."
            misconception_info = {
                "description": misc_desc,
                "root_cause": misc_root,
                "misconception_category": "Conceptual Misattribution"
            }
            eval_entity.misconception = misconception_info
            db.commit()
            logger.warning("LLM_FALLBACK_FIRED", extra={"agent": "MisconceptionDetector", "concept": c_name, "reason": str(e)})

        # Call Agent 8: Adaptive Teacher (Claude Sonnet / Gemini)
        try:
            adapt_data = adapt_and_reteach(
                concept=current_segment.concept if current_segment else (session.lesson.topic if session.lesson else "Current Concept"),
                misconception=misconception_info,
                retry_count=current_segment.retry_count if current_segment else 1,
                profile=session.lesson.profile if session.lesson else None
            )
            new_explanation = adapt_data.get("new_explanation")
            new_q_payload = adapt_data.get("followup_question")
            adaptation_info = {
                "action": adapt_data.get("action", "analogy_switch"),
                "pedagogical_rationale": adapt_data.get("pedagogical_rationale", f"Provide concrete first-principles model for {current_segment.concept if current_segment else 'concept'}"),
                "new_analogy": adapt_data.get("new_analogy", f"Intuitive Concrete Model of {current_segment.concept if current_segment else 'concept'}")
            }
        except Exception as e:
            c_name = current_segment.concept if current_segment else (session.lesson.topic if session.lesson else "the core principle")
            resp_snippet = payload.response_text[:50].strip()
            target_lang = (session.language or "English").lower()
            if "hindi" in target_lang:
                new_explanation = f"आइए {c_name} को आपके उत्तर ('{resp_snippet}') के संदर्भ में सरल और स्पष्ट रूप से पुनः समझते हैं। मुख्य अंतर्दृष्टि यह है कि इसके सभी प्रमुख घटक एक संरचित और तार्किक प्रक्रिया के तहत परस्पर जुड़े होते हैं।"
                prompt_text = f"{c_name} के इस स्पष्टीकरण के आधार पर, कौन सा कथन सबसे सटीक है?"
                opt_correct = f"{c_name} के मूलभूत सिद्धांत और प्रमुख घटक एक सुसंगत, तार्किक संरचना के अनुसार कार्य करते हैं।"
            elif "hinglish" in target_lang:
                new_explanation = f"Chaliye {c_name} ko aapke response ('{resp_snippet}') ke context me step-by-step dobara samajhte hain. Core insight ye hai ki iske sare key components ek structured logical framework me interact karte hain."
                prompt_text = f"{c_name} ke is model ke hisab se, kaun sa statement sabse accurate hai?"
                opt_correct = f"{c_name} ke core principles aur key components ek coherent, logical framework ke mutabiq operate karte hain."
            else:
                new_explanation = f"Let's break down {c_name} step by step. Considering your answer ('{resp_snippet}'), the key insight is that each component interacts within a cohesive, logically structured framework rather than in isolation."
                prompt_text = f"Based on this structured understanding of {c_name}, which statement is most accurate?"
                opt_correct = f"The foundational principles and key elements of {c_name} operate within a cohesive, logically structured framework."

            adaptation_info = {"action": "analogy_switch", "new_analogy": f"Scaffolded Mental Model for {c_name}"}
            new_q_payload = {
                "type": "mcq",
                "prompt": prompt_text,
                "options": [
                    opt_correct,
                    f"The components of {c_name} function in complete isolation without systemic correlation.",
                    f"The foundational framework of {c_name} is arbitrary and lacks structured logic.",
                    f"The primary dynamics of {c_name} remain completely invariant regardless of fundamental context."
                ],
                "answer_key": opt_correct,
                "explanation_hint": f"Focus on how core principles and key elements connect within {c_name}."
            }
            logger.warning("LLM_FALLBACK_FIRED", extra={"agent": "AdaptiveTeacher", "concept": c_name, "reason": str(e)})

        # Persist and create the genuine adaptive follow-up Question in DB
        if new_q_payload and isinstance(new_q_payload, dict):
            adaptive_q = Question(
                session_id=session.id,
                segment_id=current_segment.id if current_segment else None,
                type=new_q_payload.get("type", "mcq"),
                difficulty=session.current_difficulty,
                is_adaptive_followup=True,
                target_misconception=misc_desc,
                prompt=new_q_payload.get("prompt", "Follow-up Check:"),
                options=new_q_payload.get("options", []),
                answer_key=new_q_payload.get("answer_key", ""),
                explanation_hint=new_q_payload.get("explanation_hint", "Use the new mental model")
            )
            db.add(adaptive_q)
            db.commit()
            db.refresh(adaptive_q)
            new_question_data = {
                "id": adaptive_q.id,
                "session_id": session.id,
                "segment_id": adaptive_q.segment_id,
                "type": adaptive_q.type,
                "difficulty": adaptive_q.difficulty,
                "is_adaptive_followup": True,
                "target_misconception": misc_desc,
                "prompt": adaptive_q.prompt,
                "options": adaptive_q.options,
                "answer_key": adaptive_q.answer_key,
                "explanation_hint": adaptive_q.explanation_hint,
                "created_at": adaptive_q.created_at.isoformat()
            }

    return EvaluationResponse(
        id=eval_entity.id,
        response_id=response_entity.id,
        correct=is_correct,
        confidence=confidence,
        notes=notes,
        feedback=feedback,
        misconception=misconception_info,
        adaptation_decision=adaptation_info,
        new_explanation=new_explanation,
        new_question=new_question_data,
        current_difficulty=session.current_difficulty,
        is_mastered=is_correct,
        is_session_advanced=is_correct,
        mastery_state=mastery_state,
        mastery_evidence=mastery_evidence,
        ai_mode=ai_mode,
        evaluated_at=eval_entity.evaluated_at
    )

@router.post("/session/{session_id}/ask", response_model=AskTeacherResponse)
@router.post("/session/{session_id}/ask-doubt", response_model=AskTeacherResponse)
def ask_teacher_doubt(
    session_id: str,
    payload: AskTeacherRequest,
    db: Session = Depends(get_db)
):
    """
    Context-aware Free-form Student Doubt Resolution.
    Answers student questions using active lesson context + RAG source material.
    """
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    current_segment = db.query(SessionSegment).filter(
        SessionSegment.session_id == session.id,
        SessionSegment.segment_order == session.current_step + 1
    ).first()

    lesson = session.lesson
    topic = lesson.topic if lesson else "Core Subject"
    concept = current_segment.concept if current_segment else topic
    language = session.language or "English"

    # 1. RAG Retrieval from uploaded material if present
    citations = []
    rag_context = ""
    is_grounded = False
    confidence = 0.88

    if lesson and lesson.material_id:
        chunks = rag_service.retrieve_relevant_chunks(lesson.material_id, query=payload.question, top_k=3)
        if chunks:
            is_grounded = True
            confidence = 0.95
            for c in chunks:
                citations.append({
                    "section": c.get("section", "Source Document"),
                    "page": c.get("page", 1),
                    "excerpt": c.get("text", "")[:120] + "..."
                })
            rag_context = "\n".join([f"[{c.get('section', 'Doc')} p.{c.get('page', 1)}]: {c.get('text', '')}" for c in chunks])

    # 2. Call Claude to answer conversationally in context
    try:
        user_prompt = f"""You are the Bharat Academix AI Teacher conducting a live classroom lesson.
Topic: {topic}
Current Concept: {concept}
Learner Level: {session.current_difficulty}
Language: {language}

Material Context (if any):
{rag_context if rag_context else 'No specific material upload. Ground in standard verified scientific and mathematical principles.'}

Student's Live Doubt / Question:
"{payload.question}"

Explain clearly, concisely, and warmly. Address the student's doubt directly using an intuitive example, and maintain continuity with {concept}.

Return valid JSON:
{{
  "answer": "Clear, formatted explanation with formatting/bullet points if helpful",
  "voice_script": "Natural conversational spoken response for TTS (max 3 sentences)",
  "related_concept": "Suggested related concept to explore"
}}"""

        res = claude_service.call_json(
            system_prompt="You are an expert, human-like AI teacher explaining student doubts.",
            user_prompt=user_prompt,
            use_reasoning=True
        )
        answer = res.get("answer", f"Great question! In the context of {concept}, this occurs because the governing relationship balances the driving potential against resistance.")
        voice_script = res.get("voice_script", answer[:180])
        related_concept = res.get("related_concept", concept)

    except Exception as e:
        logger.warning(f"AskTeacher Claude error: {e}")
        if language.lower() == "hindi":
            answer = f"बहुत अच्छा प्रश्न! {concept} में जब हम मुख्य कारक को बदलते हैं, तो परिणामी प्रभाव व्युत्क्रमानुपाती या सीधे तौर पर बदलता है।"
            voice_script = f"बहुत अच्छा सवाल! {concept} में यह सीधा संबंध स्थापित करता है।"
        elif language.lower() == "hinglish":
            answer = f"Great question! {concept} me driving potential aur opposing resistance ke beech direct balance hota hai."
            voice_script = f"Acha question hai! {concept} me ye directly balance karta hai."
        else:
            answer = f"Excellent question! In {concept}, any change in the driving potential directly alters the observable flow in accordance with the governing equation."
            voice_script = f"Great question! In {concept}, the output scales directly with the driving force."
        related_concept = concept

    return AskTeacherResponse(
        answer=answer,
        voice_script=voice_script,
        citations=citations,
        is_grounded=is_grounded,
        confidence=confidence,
        related_concept=related_concept
    )

@router.post("/session/{session_id}/explain-again")
def explain_again(
    session_id: str,
    payload: Optional[ExplainAgainRequest] = None,
    db: Session = Depends(get_db)
):
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    current_segment = db.query(SessionSegment).filter(
        SessionSegment.session_id == session.id,
        SessionSegment.segment_order == session.current_step + 1
    ).first()

    if not current_segment:
        raise HTTPException(status_code=400, detail="No active segment found")

    current_segment.retry_count += 1
    target_language = session.language or "English"

    # Trigger proactive fresh analogy via Adaptive Teacher (Agent 8)
    try:
        adapt_data = adapt_and_reteach(
            concept=current_segment.concept,
            misconception={
                "description": f"Student requested an alternative explanation focusing on: {payload.focus if payload and payload.focus else 'Core intuition'}",
                "root_cause": "User requested re-explanation."
            },
            retry_count=current_segment.retry_count,
            profile=session.lesson.profile if session.lesson else None
        )
        new_explanation = adapt_data.get("new_explanation")
    except Exception as e:
        if target_language.lower() == "hindi":
            new_explanation = f"आइए {current_segment.concept} को एक बहुत ही सरल और स्पष्ट उदाहरण के साथ फिर से समझते हैं।"
        elif target_language.lower() == "hinglish":
            new_explanation = f"Chaliye {current_segment.concept} ko ek simple real-life example ke saath dubara samajhte hain."
        else:
            new_explanation = f"Let's break down {current_segment.concept} using an intuitive real-world perspective."

    current_segment.explanation_text = new_explanation
    db.commit()

    return {
        "status": "success",
        "new_explanation": new_explanation,
        "retry_count": current_segment.retry_count
    }


# --- Advanced Section 18 Features (Flashcards, Study Notes, Concept Map) ---

@router.get("/session/{session_id}/flashcards", response_model=FlashcardsResponse)
def get_session_flashcards(session_id: str, db: Session = Depends(get_db)):
    """Generate high-yield active recall flashcards for the session (Section 18)."""
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    topic = session.lesson.topic if session.lesson and session.lesson.topic else "Curriculum Concept"
    segments = db.query(SessionSegment).filter(SessionSegment.session_id == session.id).order_by(SessionSegment.segment_order.asc()).all()
    questions = db.query(Question).filter(Question.session_id == session.id).all()
    
    flashcards: List[FlashcardItem] = []
    
    try:
        if claude_service.is_configured() and segments:
            summary_points = "\n".join([f"- {s.concept}: {s.explanation_text[:200]}" for s in segments])
            sys_prompt = "You are an expert educator creating active-recall study flashcards. Return ONLY a JSON object with a key 'flashcards' containing a list of {id, concept, front, back, mnemonic}."
            user_prompt = f"Create 4-6 high-yield study flashcards for topic '{topic}' in language '{session.language or 'English'}' based on these concepts:\n{summary_points}"
            data = claude_service.call_json(sys_prompt, user_prompt, use_reasoning=False)
            cards = data.get("flashcards", [])
            for idx, c in enumerate(cards):
                flashcards.append(FlashcardItem(
                    id=f"fc_{idx+1}",
                    concept=c.get("concept", topic),
                    front=c.get("front", "Question"),
                    back=c.get("back", "Answer"),
                    mnemonic=c.get("mnemonic")
                ))
    except Exception as e:
        logger.warning(f"LLM flashcard generation failed: {e}")
    
    if not flashcards:
        for idx, seg in enumerate(segments):
            related_q = next((q for q in questions if q.segment_id == seg.id), None)
            front_text = related_q.prompt if related_q else f"What is the core principle of {seg.concept}?"
            back_text = seg.explanation_text[:250] if seg.explanation_text else f"The foundational law and intuition of {seg.concept}."
            flashcards.append(FlashcardItem(
                id=f"fc_{idx+1}",
                concept=seg.concept,
                front=front_text,
                back=back_text,
                mnemonic=f"Visualize {seg.concept} through its {seg.visual_type} representation."
            ))
            
    return FlashcardsResponse(session_id=session_id, topic=topic, flashcards=flashcards)


@router.get("/session/{session_id}/study-notes", response_model=StudyNotesResponse)
def get_session_study_notes(session_id: str, db: Session = Depends(get_db)):
    """Generate structured revision study notes and cheat sheet (Section 18)."""
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    topic = session.lesson.topic if session.lesson and session.lesson.topic else "Educational Subject"
    segments = db.query(SessionSegment).filter(SessionSegment.session_id == session.id).order_by(SessionSegment.segment_order.asc()).all()
    lang = session.language or "English"
    
    takeaways = []
    defs_or_formulas = []
    
    for seg in segments:
        takeaways.append(f"Mastery of **{seg.concept}**: Key analytical takeaways, governing rules, and boundary conditions.")
        defs_or_formulas.append({
            "term": seg.concept,
            "definition": (seg.explanation_text[:180] + "...") if seg.explanation_text else "Core foundational concept."
        })
        
    summary_md = f"# Comprehensive Study Notes: {topic}\n\n"
    summary_md += f"**Language**: {lang} | **Target Time**: {session.lesson.profile.available_time if session.lesson and session.lesson.profile else '20 min'}\n\n"
    summary_md += "## Executive Conceptual Summary\n"
    for seg in segments:
        summary_md += f"### {seg.segment_order}. {seg.concept}\n"
        summary_md += f"{seg.explanation_text}\n\n"
        
    recommended = [
        f"Review {topic} flashcards daily using active spaced recall.",
        "Solve 3 practice application problems on boundary conditions.",
        "Proceed to the recommended next topic to build on these fundamentals."
    ]
    
    return StudyNotesResponse(
        session_id=session_id,
        topic=topic,
        language=lang,
        summary_markdown=summary_md,
        key_takeaways=takeaways,
        formulas_or_definitions=defs_or_formulas,
        recommended_actions=recommended
    )


@router.get("/session/{session_id}/concept-map", response_model=ConceptMapResponse)
def get_session_concept_map(session_id: str, db: Session = Depends(get_db)):
    """Generate hierarchical concept graph of prerequisites, core concepts, and applications (Section 18)."""
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    topic = session.lesson.topic if session.lesson and session.lesson.topic else "Curriculum Domain"
    segments = db.query(SessionSegment).filter(SessionSegment.session_id == session.id).order_by(SessionSegment.segment_order.asc()).all()
    
    nodes: List[ConceptMapNode] = []
    edges: List[ConceptMapEdge] = []
    
    # Root domain node
    nodes.append(ConceptMapNode(id="root", label=topic, type="core", status="mastered"))
    
    prev_id = "root"
    for idx, seg in enumerate(segments):
        node_id = f"node_{idx+1}"
        node_type = "prerequisite" if idx == 0 else ("application" if idx == len(segments)-1 else "core")
        status = "mastered" if getattr(seg, "is_mastered", False) else "reviewing"
        nodes.append(ConceptMapNode(id=node_id, label=seg.concept, type=node_type, status=status))
        edges.append(ConceptMapEdge(source=prev_id, target=node_id, label="governs" if idx == 0 else "leads to"))
        prev_id = node_id
        
    return ConceptMapResponse(session_id=session_id, topic=topic, nodes=nodes, edges=edges)


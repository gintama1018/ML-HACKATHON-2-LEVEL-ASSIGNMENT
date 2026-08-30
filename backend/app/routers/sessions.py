import logging
from datetime import datetime, timezone
from typing import List, Optional
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
    Misconception
)
from app.schemas import (
    SessionCreateRequest,
    SessionUpdateRequest,
    StudentAnswerRequest,
    ExplainAgainRequest,
    LessonSessionResponse,
    EvaluationResponse
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
        current_question = db.query(Question).filter(
            Question.session_id == session.id,
            Question.segment_id == current_segment.id
        ).first()

    total_segments = len(session.lesson.plan.segments) if session.lesson and session.lesson.plan and session.lesson.plan.segments else 3

    return LessonSessionResponse(
        id=session.id,
        lesson_id=session.lesson_id,
        status=session.status,
        current_step=session.current_step,
        language=session.language,
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

    # Create new session entity
    session = LessonSession(
        lesson_id=lesson.id,
        status="in_progress",
        current_step=0,
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

        # Call Agent 3: Teaching Agent (Claude Sonnet)
        try:
            teach_data = teach_concept(
                concept=concept,
                learning_objective=first_seg_def.get("learning_objective", "Understand core principles"),
                profile=lesson.profile,
                rag_chunks=rag_chunks,
                language_override=target_language
            )
            explanation_text = teach_data.get("explanation_text", f"Welcome to our lesson on {concept}.")
            citations = teach_data.get("source_citations", [])
        except Exception as e:
            logger.warning(f"TeachingAgent call failed: {e}. Using structured default.")
            if target_language.lower() == "hindi":
                explanation_text = f"नमस्ते! आज के पाठ में हम {concept} के मूलभूत सिद्धांतों को विस्तार से समझेंगे।"
            elif target_language.lower() == "hinglish":
                explanation_text = f"Hello! Aaj ke session me hum {concept} ke fundamental principles ko step by step samjhenge."
            else:
                explanation_text = f"Welcome to today's lesson on {concept}. Let's examine the foundational principles step by step."
            citations = [
                {"section_ref": "Section 1: Foundations", "page_number": 1, "excerpt": "Primary defining relationships and rules."}
            ] if lesson.material_id else []

        # Call Agent 4: Visual Planner (Claude Haiku)
        try:
            visual_data = plan_visual(concept=concept, visual_type_hint=visual_type_hint, explanation_text=explanation_text)
            chosen_visual_type = visual_data.get("visual_type", visual_type_hint)
            visual_spec = visual_data.get("visual_spec", {})
        except Exception as e:
            chosen_visual_type = visual_type_hint
            visual_spec = {"title": concept, "type": visual_type_hint}

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
        
        # Call Agent 5: Question Generator (Claude Haiku)
        try:
            q_data = generate_question(
                concept=concept,
                explanation_text=explanation_text,
                level=lesson.profile.level if lesson.profile else "Beginner",
                question_type="mcq",
                language=target_language
            )
            prompt = q_data.get("prompt")
            options = q_data.get("options")
            answer_key = q_data.get("answer_key")
            hint = q_data.get("explanation_hint")
        except Exception as e:
            if target_language.lower() == "hindi":
                prompt = f"{concept} के संबंध में कौन सा कथन सही है?"
                options = [
                    f"यह {lesson.topic or 'विषय'} के मूल संबंध को निर्धारित करता है।",
                    "यह बाहरी कारकों से पूरी तरह स्वतंत्र है।",
                    "यह केवल चरम स्थितियों में लागू होता है।",
                    "यह केवल एक सैद्धांतिक अनुमान है।"
                ]
                answer_key = f"यह {lesson.topic or 'विषय'} के मूल संबंध को निर्धारित करता है।"
                hint = "परिभाषा पर ध्यान दें।"
            elif target_language.lower() == "hinglish":
                prompt = f"{concept} ke bare me kaun sa statement correct hai?"
                options = [
                    f"Ye {lesson.topic or 'topic'} ke fundamental relationship ko govern karta hai.",
                    "Ye external factors se independent hota hai.",
                    "Ye sirf extreme cases me apply hota hai.",
                    "Ye sirf ek theoretical assumption hai."
                ]
                answer_key = f"Ye {lesson.topic or 'topic'} ke fundamental relationship ko govern karta hai."
                hint = "Core definition ko recall karein."
            else:
                prompt = f"Which statement best characterizes {concept}?"
                options = [
                    f"It governs the fundamental relationship in {lesson.topic or 'the subject'}.",
                    "It is completely independent of external parameters.",
                    "It applies only under extreme non-physical conditions.",
                    "It is a purely empirical observation with no theoretical basis."
                ]
                answer_key = f"It governs the fundamental relationship in {lesson.topic or 'the subject'}."
                hint = "Think about the governing definitions."

        first_question = Question(
            session_id=session.id,
            segment_id=first_segment.id,
            type="mcq",
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
def update_session(session_id: str, payload: SessionUpdateRequest, db: Session = Depends(get_db)):
    session = db.query(LessonSession).filter(LessonSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if payload.language is not None and payload.language != session.language:
        target_lang = payload.language
        session.language = target_lang
        
        # Real-time multilingual adaptation of current segment explanation & question
        current_segment = db.query(SessionSegment).filter(
            SessionSegment.session_id == session.id,
            SessionSegment.segment_order == session.current_step + 1
        ).first()
        
        if current_segment:
            try:
                trans_prompt = f"""You are the Teaching Agent. Translate and adapt the following explanation into natural, human-like {target_lang} for classroom teaching:
Original Explanation: {current_segment.explanation_text}

Rules:
- If Hindi: Write in clear, natural conversational Hindi in Devanagari script (e.g. "नमस्ते! आइए ओम के नियम को समझते हैं...").
- If Hinglish: Write in colloquial Hindi-English in Latin script (e.g. "Namaste! Chaliye Ohm's Law ko intuitively samajhte hain...").
- If English: Fluent clear English.

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
                logger.warning(f"Claude translation fallback: {e}")
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
        ).first()
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
                logger.warning(f"Claude question translation fallback: {e}")
                c_name = current_segment.concept if current_segment else "इस विषय"
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
    
    if current_step < len(active_segments):
        seg_def = active_segments[current_step]
        concept = seg_def.get("concept", f"Concept {current_step + 1}")
        visual_type_hint = seg_def.get("visual_type", "chart")
        
        # RAG retrieval
        rag_chunks = []
        if lesson.material_id:
            rag_chunks = rag_service.retrieve_relevant_chunks(lesson.material_id, query=concept, top_k=3)

        # Call Agent 3: Teaching Agent
        try:
            teach_data = teach_concept(
                concept=concept,
                learning_objective=seg_def.get("learning_objective", "Deepen understanding"),
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

        # Call Agent 4: Visual Planner
        try:
            visual_data = plan_visual(concept=concept, visual_type_hint=visual_type_hint, explanation_text=explanation_text)
            chosen_visual_type = visual_data.get("visual_type", visual_type_hint)
            visual_spec = visual_data.get("visual_spec", {})
        except Exception as e:
            chosen_visual_type = visual_type_hint
            visual_spec = {"title": concept, "type": visual_type_hint}

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

        # Call Agent 5: Question Generator
        try:
            q_data = generate_question(
                concept=concept,
                explanation_text=explanation_text,
                level=lesson.profile.level if lesson.profile else "Beginner",
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
        session_id=session.id,
        response_text=payload.response_text,
        is_unsure=payload.is_unsure
    )
    db.add(response_entity)
    db.commit()
    db.refresh(response_entity)

    # 2. Call Agent 6: Response Evaluator (Claude Haiku)
    try:
        eval_data = evaluate_response(
            concept=current_segment.concept if current_segment else "Current Concept",
            question_prompt=question.prompt,
            student_response=payload.response_text,
            answer_key=question.answer_key or "Accurate conceptual explanation",
            is_unsure=payload.is_unsure
        )
        is_correct = eval_data.get("correct", False)
        confidence = eval_data.get("confidence", 0.9)
        notes = eval_data.get("evaluation_notes", "")
    except Exception as e:
        logger.warning(f"ResponseEvaluator fallback: {e}")
        is_correct = False if payload.is_unsure else (payload.response_text.strip().lower() in (question.answer_key or "").lower())
        confidence = 0.85
        notes = "Answer evaluated against standard conceptual benchmarks."

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

    # 3. IF INCORRECT: Run Misconception Detector & Adaptive Teacher Loop
    if not is_correct:
        # Increment retry count on current segment
        if current_segment:
            current_segment.retry_count += 1
            db.commit()

        # Call Agent 7: Misconception Detector (Claude Sonnet)
        try:
            misc_data = detect_misconception(
                prompt=question.prompt,
                answer_key=question.answer_key or "",
                student_response=payload.response_text,
                evaluator_notes=notes
            )
            misc_desc = misc_data.get("description", "Conceptual confusion identified.")
            misc_root = misc_data.get("root_cause", "Inverted relationship between variables.")
            misc_cat = misc_data.get("misconception_category", "Overgeneralization")
            
            # Save Misconception entity
            misc_entity = Misconception(
                evaluation_id=eval_entity.id,
                description=misc_desc,
                root_cause=misc_root
            )
            db.add(misc_entity)
            db.commit()

            misconception_info = {
                "description": misc_desc,
                "root_cause": misc_root,
                "misconception_category": misc_cat
            }
        except Exception as e:
            logger.warning(f"Misconception detector error: {e}")
            misconception_info = {
                "description": "Student is conflating the direct and inverse effects of the core variables.",
                "root_cause": "Intuitive heuristic misapplied to circuit mechanics.",
                "misconception_category": "Overgeneralization"
            }

        # Call Agent 8: Adaptive Teacher (Claude Sonnet)
        try:
            adapt_data = adapt_and_reteach(
                concept=current_segment.concept if current_segment else "Current Concept",
                misconception=misconception_info,
                retry_count=current_segment.retry_count if current_segment else 1,
                profile=session.lesson.profile if session.lesson else None
            )
            new_explanation = adapt_data.get("new_explanation")
            new_q = adapt_data.get("followup_question")

            # Add analogy to segment alternative_explanations history
            if current_segment and new_explanation:
                current_alts = list(current_segment.alternative_explanations or [])
                current_alts.append({
                    "analogy": adapt_data.get("new_analogy", "Physical flow model"),
                    "timestamp": utcnow().isoformat()
                })
                current_segment.alternative_explanations = current_alts
                db.commit()

            adaptation_info = {
                "action": adapt_data.get("action", "analogy_switch"),
                "pedagogical_rationale": adapt_data.get("pedagogical_rationale", "Use intuitive water pipe analogy"),
                "new_analogy": adapt_data.get("new_analogy")
            }
            new_question_data = new_q
        except Exception as e:
            logger.warning(f"AdaptiveTeacher fallback: {e}")
            new_explanation = "Think of voltage like water pressure in a pipe, and resistance like a narrow restriction. More restriction means less flow (current)."
            adaptation_info = {"action": "analogy_switch", "new_analogy": "Water pipe pressure analogy"}

    else:
        # Mark concept as mastered in current segment
        if current_segment:
            current_segment.is_mastered = True
            db.commit()

    return EvaluationResponse(
        id=eval_entity.id,
        response_id=response_entity.id,
        correct=is_correct,
        confidence=confidence,
        notes=notes,
        misconception=misconception_info,
        adaptation_decision=adaptation_info,
        new_explanation=new_explanation,
        new_question=new_question_data,
        is_session_advanced=is_correct,
        evaluated_at=eval_entity.created_at
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

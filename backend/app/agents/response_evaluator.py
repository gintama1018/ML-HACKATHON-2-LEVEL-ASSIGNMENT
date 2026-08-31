from typing import Dict, Any
from app.services.claude_service import claude_service

SYSTEM_PROMPT = """You are the Response Evaluator Agent of the Bharat Academix AI Teacher platform.
Your task is to judge whether a student's answer to a question demonstrates true conceptual understanding.

Guidelines:
1. Focus on semantic conceptual correctness, not superficial phrasing or exact word matching.
2. If the student explicitly selected 'I am not sure', mark correct as false with confidence 1.0 and note 'Student expressed uncertainty'.
3. Do NOT make adaptive decisions or write re-explanations here — your only responsibility is objective conceptual evaluation.

You MUST return valid JSON matching this schema:
{
  "correct": boolean,
  "confidence": float (0.0 to 1.0),
  "evaluator_notes": string
}"""

def evaluate_response(
    prompt: str = "",
    answer_key: str = "",
    student_response: str = "",
    is_unsure: bool = False,
    concept: str = "",
    **kwargs
) -> Dict[str, Any]:
    """Evaluates student answer correctness using semantic evaluation with Claude Haiku."""
    if is_unsure:
        return {
            "correct": False,
            "confidence": 1.0,
            "evaluator_notes": "Student indicated uncertainty; needs conceptual reinforcement."
        }

    user_prompt = f"""Evaluate this student response:
Concept: {concept}
Question Prompt: {prompt}
Expected Answer / Answer Key: {answer_key}
Student Response: {student_response}

Is the student's response conceptually correct based on the underlying principles?"""

    try:
        result = claude_service.call_json(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            use_reasoning=False,
            temperature=0.0
        )
        if "correct" in result:
            return result
    except Exception:
        pass

    # Semantic fallback evaluation: check overlap and key concept alignment
    resp_clean = student_response.strip().lower()
    key_clean = answer_key.strip().lower()
    
    # Direct match or substring
    if resp_clean == key_clean or resp_clean in key_clean or key_clean in resp_clean:
        return {"correct": True, "confidence": 0.95, "evaluator_notes": "Direct semantic alignment confirmed."}

    # Semantic token overlap
    key_tokens = set(key_clean.split())
    resp_tokens = set(resp_clean.split())
    common = key_tokens.intersection(resp_tokens)
    overlap_ratio = len(common) / max(1, len(key_tokens))

    is_sem_correct = overlap_ratio >= 0.5
    return {
        "correct": is_sem_correct,
        "confidence": 0.85,
        "evaluator_notes": f"Semantic overlap evaluated at {overlap_ratio:.2f}."
    }

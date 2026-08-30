from typing import Dict, Any
from app.services.claude_service import claude_service

SYSTEM_PROMPT = """You are the Misconception Detector Agent of the Bharat Academix AI Teacher platform.
Your task is to identify and articulate the exact cognitive gap or misconception behind a student's incorrect response.

Guidelines:
1. Explain WHY the student made this error in plain, empathetic, teacher-like language.
2. Identify the root cause (e.g., confusing inverse with direct proportionality, mixing velocity with acceleration, off-by-one boundary reasoning).
3. Do NOT lecture or scold the student; produce a constructive diagnostic diagnosis.

You MUST return valid JSON matching this schema:
{
  "description": string (plain language explanation of the misunderstanding),
  "root_cause": string (underlying conceptual confusion / schema error),
  "misconception_category": string
}"""

def detect_misconception(
    prompt: str,
    answer_key: str,
    student_response: str,
    evaluator_notes: str = ""
) -> Dict[str, Any]:
    """Diagnoses cognitive gaps and root causes using Claude Sonnet"""
    user_prompt = f"""Diagnose the misconception in this incorrect student response:
Question: {prompt}
Correct Concept / Answer: {answer_key}
Student Answer: {student_response}
Evaluator Notes: {evaluator_notes}

Identify the precise misconception and root cause."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=True,
        temperature=0.2
    )
    return result

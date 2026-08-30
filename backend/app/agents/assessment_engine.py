from typing import List, Dict, Any
from app.services.claude_service import claude_service

SYSTEM_PROMPT = """You are the Assessment Engine Agent of the Bharat Academix AI Teacher platform.
Your task is to generate a comprehensive, balanced final exam across all concepts covered in the lesson session.

Guidelines:
1. Weight questions towards concepts that had higher retry counts or were flagged as struggling.
2. Include both conceptual MCQs and scenario application questions.
3. Every question must have an unambiguous answer_key and clear options if MCQ.

You MUST return valid JSON matching this schema:
{
  "questions": [
    {
      "id": string (e.g. "q_1"),
      "concept": string,
      "type": "mcq" | "short_answer" | "problem_solving",
      "prompt": string,
      "options": [string] or null,
      "answer_key": string,
      "explanation": string
    }
  ]
}"""

def generate_final_assessment(
    lesson_title: str,
    concepts_summary: List[Dict[str, Any]],
    level: str = "Beginner"
) -> Dict[str, Any]:
    """Generates weighted final quiz using Claude Sonnet"""
    concepts_desc = "\n".join([
        f"- Concept: {c.get('concept')}, Mastered First Try: {c.get('is_mastered', False)}, Retries: {c.get('retry_count', 0)}"
        for c in concepts_summary
    ])

    user_prompt = f"""Generate a 4-6 question comprehensive final exam for:
Lesson Topic: {lesson_title}
Learner Level: {level}

Concept Mastery Summary from Session:
{concepts_desc}

Generate questions with higher focus on concepts that needed retries."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=True,
        temperature=0.2
    )
    return result

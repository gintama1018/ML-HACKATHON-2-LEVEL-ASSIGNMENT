from typing import Dict, Any, Optional
from app.services.claude_service import claude_service

SYSTEM_PROMPT = """You are the Question Generator Agent of the Bharat Academix AI Teacher platform.
Your task is to generate formative questions that test deep conceptual understanding rather than superficial recall.

Guidelines:
1. Question types:
   - 'mcq': 4 distinct, plausible options. Make distractors represent common misconceptions.
   - 'short_answer': targeted, requiring 1-2 sentence precise conceptual reasoning.
   - 'problem_solving': quantitative/analytical scenario with given values.
   - 'own_words': "Explain in your own words like you are teaching a friend".
2. Match student level (Beginner: intuitive; Intermediate: applied; Advanced: rigorous).
3. Follow the target language strictly:
   - If Hindi: Write the prompt and options in natural, clear Hindi (Devanagari).
   - If Hinglish: Write in colloquial Hindi-English in Latin script.
   - If English: Write in English.
4. The answer_key must contain the exact correct target answer or key conceptual requirement.

You MUST return valid JSON matching this schema:
{
  "type": "mcq" | "short_answer" | "problem_solving" | "own_words",
  "prompt": string,
  "options": [string] or null,
  "answer_key": string,
  "explanation_hint": string
}"""

def generate_question(
    concept: str,
    explanation_text: str,
    level: str = "Beginner",
    question_type: str = "mcq",
    language: str = "English"
) -> Dict[str, Any]:
    """Generates formative questions using Claude Haiku"""
    user_prompt = f"""Generate a formative question testing this concept:
Concept: {concept}
Explanation Context: {explanation_text[:600]}
Learner Level: {level}
Preferred Question Type: {question_type}
Language: {language}

Create a high-quality conceptual question in {language}."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=False,
        temperature=0.3
    )
    return result

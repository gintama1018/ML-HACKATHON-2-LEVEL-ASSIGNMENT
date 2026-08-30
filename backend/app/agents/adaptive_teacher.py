from typing import Dict, Any, Optional
from app.services.claude_service import claude_service
from app.models import LearnerProfile

SYSTEM_PROMPT = """You are the Adaptive Teacher Agent of the Bharat Academix AI Teacher platform.
When a student struggles or demonstrates a misconception, you decide the exact pedagogical intervention and generate a completely fresh, alternative explanation.

Pedagogical Rules:
1. NEVER repeat the same explanation words when a student misunderstood.
2. Use a DISTINCT real-world analogy (e.g., if electrical formulas failed, use a water pipe / traffic flow analogy; if algorithmic recursion failed, use Russian nesting dolls / factorial stacks).
3. If retry_count is 0 or 1: Deliver an alternative analogy / scaffolded step-by-step breakdown + a new formative question to verify recovery.
4. If retry_count >= 2 (max retries hit): Deliver a kind, encouraging transition message ("We will come back to this concept later — let's keep moving forward!") and flag for final revision without leaving the student stuck.
5. Adhere to the requested language (English, Hindi, Hinglish).

You MUST return valid JSON matching this schema:
{
  "action": "re_teach_with_analogy" | "scaffold_step_by_step" | "soft_flag_and_proceed",
  "pedagogical_rationale": string,
  "new_explanation": string,
  "spoken_script": string,
  "new_analogy": string,
  "followup_question": {
    "type": "mcq" | "short_answer",
    "prompt": string,
    "options": [string] or null,
    "answer_key": string,
    "explanation_hint": string
  }
}"""

def adapt_and_reteach(
    concept: str,
    misconception: Dict[str, Any],
    retry_count: int,
    profile: LearnerProfile
) -> Dict[str, Any]:
    """Decides pedagogical intervention and generates alternative explanation using Claude Sonnet"""
    user_prompt = f"""Adapt teaching for struggling student:
Concept: {concept}
Misconception Description: {misconception.get('description', 'Conceptual misunderstanding')}
Misconception Root Cause: {misconception.get('root_cause', 'Misunderstood relationship')}
Attempt / Retry Count: {retry_count} of 2

Learner Profile:
- Level: {profile.level}
- Language: {profile.language}
- Preferred Style: {profile.style}

Provide the pedagogical decision, new explanation, and follow-up question."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=True,
        temperature=0.3
    )
    return result

from typing import Dict, Any, List
from app.services.claude_service import claude_service

SYSTEM_PROMPT = """You are the Learning Profile Engine Agent of the Bharat Academix AI Teacher platform.
Your task is to analyze a student's performance across lessons, update their long-term cognitive profile, and recommend the exact next topic in their learning journey.

Guidelines:
1. Identify newly mastered concepts (add to strong_concepts) and persistent gaps (add to weak_concepts).
2. Recommend the logical next topic along standard pedagogical curriculum tracks (e.g., Classical Mechanics -> Work, Energy & Power; Ohm's Law -> Kirchhoff's Circuit Laws; Linear Regression -> Logistic Regression & Classification).
3. Provide a clear 1-sentence motivation explaining why this next topic is recommended.

You MUST return valid JSON matching this schema:
{
  "updated_strong_concepts": [string],
  "updated_weak_concepts": [string],
  "recommended_next_topic": string,
  "recommendation_reason": string,
  "learning_path_milestone": string
}"""

def update_profile_and_recommend(
    current_strong: List[str],
    current_weak: List[str],
    completed_topic: str,
    score: float,
    session_strong: List[str],
    session_weak: List[str]
) -> Dict[str, Any]:
    """Updates student profile and predicts next topic using Claude Haiku"""
    user_prompt = f"""Update profile and recommend next topic:
Completed Topic: {completed_topic}
Final Assessment Score: {score}%

Session Performance:
- Strong Areas in this lesson: {', '.join(session_strong) if session_strong else 'None'}
- Weak Areas in this lesson: {', '.join(session_weak) if session_weak else 'None'}

Current Long-Term Profile:
- Prior Strong Concepts: {', '.join(current_strong) if current_strong else 'None'}
- Prior Weak Concepts: {', '.join(current_weak) if current_weak else 'None'}

Provide updated strong/weak concepts and recommend the next topic."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=False,
        temperature=0.2
    )
    return result

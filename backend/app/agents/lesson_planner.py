from typing import List, Dict, Any, Optional
from app.services.claude_service import claude_service
from app.models import LearnerProfile

SYSTEM_PROMPT = """You are the Lesson Planner Agent of the Bharat Academix AI Teacher platform.
Your responsibility is to design a pedagogically optimal, structured curriculum timeline tailored precisely to the learner's profile, requested time budget, depth, and learning style.

You must choose the appropriate visual_type for each segment from:
- 'chart': for Physics/Economics/Data relationships (coordinate plots, circuit loads, curves)
- 'math': for Mathematical equations, step-by-step proofs, formulas
- 'code': for Computer Science / Programming concepts (code blocks with syntax & output)
- 'diagram': for Biology / Physics physical layouts / Anatomy / Mechanical systems
- 'timeline': for History / Evolution / Sequential processes

Budget the time strictly:
- '5 min': 2 focused, high-yield segments
- '20 min': 3-4 balanced conceptual and application segments
- '60 min': 5-7 deep-dive segments covering nuances, edge cases, and proofs
- '7-day plan': 7 daily progression modules

You MUST return valid JSON matching this schema:
{
  "lesson_title": string,
  "total_estimated_minutes": integer,
  "pacing_strategy": string,
  "segments": [
    {
      "order": integer,
      "concept": string,
      "target_time": string,
      "visual_type": "chart" | "math" | "code" | "diagram" | "timeline",
      "learning_objective": string,
      "skipped": false
    }
  ]
}"""

def plan_lesson(
    topic: Optional[str],
    concepts: Optional[List[str]],
    profile: LearnerProfile
) -> Dict[str, Any]:
    """Generates an ordered lesson plan using Claude Sonnet"""
    user_prompt = f"""Design an optimal lesson plan for:
Topic / Subject: {topic or 'Extracted Document Concepts'}
Extracted Concepts (if any): {', '.join(concepts) if concepts else 'None provided'}

Learner Profile:
- Education Level: {profile.level}
- Available Time: {profile.available_time}
- Teaching Style: {profile.style}
- Language: {profile.language}
- Depth: {profile.depth}
- Existing Knowledge: {profile.existing_knowledge or 'None stated'}
- Learning Objective: {profile.objective or 'Comprehensive mastery'}

Create the structured lesson segments."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=True,
        temperature=0.2
    )
    return result

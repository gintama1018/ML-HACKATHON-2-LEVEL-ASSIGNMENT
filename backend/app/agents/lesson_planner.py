from typing import List, Dict, Any, Optional
from app.services.claude_service import claude_service
from app.models import LearnerProfile

SYSTEM_PROMPT = """You are the Lesson Planner Agent of the Bharat Academix AI Teacher platform.
Your responsibility is to design a pedagogically optimal, structured curriculum timeline tailored precisely to the learner's profile, requested time budget, depth, and learning style.

Visual Type Selection & Explainability:
- 'chart': for Physics/Economics/Data relationships (coordinate plots, circuit loads, curves)
- 'math': for Mathematical equations, step-by-step derivations, formal proofs
- 'code': for Computer Science / Programming concepts (code blocks with syntax & output)
- 'biology': for Cell structures, biological systems, anatomical diagrams
- 'chemistry': for Reaction pathways, molecular structures, energy profiles
- 'diagram': for Physical layouts, force systems, mechanical machines
- 'timeline': for History, evolution, sequential chronological events

Time Budgeting & Pacing Rules:
- '5 min': 2 high-yield, focused segments
- '20 min': 3-4 balanced conceptual, mechanical, and application segments
- '60 min': 5-7 deep-dive segments covering edge cases, formal proofs, and nuances
- '7-day plan': 7 daily progression and spaced-revision modules (Day 1: Foundations, Day 2: Mechanics + Day 1 review, Day 3: Application, Day 4: Mid-Week Spaced Revision, Day 5: Advanced Nuance, Day 6: Synthesis, Day 7: Comprehensive Capstone Exam)

You MUST return valid JSON matching this schema:
{
  "lesson_title": string,
  "total_estimated_minutes": integer,
  "pacing_strategy": string,
  "segments": [
    {
      "order": integer,
      "day_number": integer (1-7 if 7-day plan, else 1),
      "is_revision_day": boolean,
      "concept": string,
      "target_time": string,
      "visual_type": "chart" | "math" | "code" | "biology" | "chemistry" | "diagram" | "timeline",
      "visual_rationale": string (1-sentence explainability for why this visual was chosen),
      "learning_objective": string,
      "skipped": false
    }
  ]
}"""

def plan_lesson(
    topic: Optional[str],
    concepts: Optional[List[str]],
    profile: LearnerProfile,
    weak_concepts: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Generates an ordered lesson plan with visual explainability, spaced-pacing, and cross-session weak concept reinforcement (REQ-43)"""
    weak_concepts_str = f"\n- Prior Identified Weak Concepts to Proactively Reinforce: {', '.join(weak_concepts)}" if weak_concepts else ""
    
    avail = str(profile.available_time or "20 min").lower()
    if "5" in avail:
        time_rule = "MANDATORY TIME RULE (5 min): Generate EXACTLY 1 to 2 high-yield, focused segments only."
    elif "60" in avail:
        time_rule = "MANDATORY TIME RULE (60 min): Generate EXACTLY 6 to 10 deep-dive segments covering edge cases, derivations, with formative checks."
    elif "7" in avail or "day" in avail:
        time_rule = "MANDATORY TIME RULE (7-day plan): Generate a 7-day structured learning path (Day 1 to Day 7) with Day 4 as spaced revision and Day 7 as capstone."
    else:
        time_rule = "MANDATORY TIME RULE (20 min): Generate EXACTLY 3 to 5 balanced conceptual, analytical, and practical application segments."

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
- Learning Objective: {profile.objective or 'Comprehensive mastery'}{weak_concepts_str}

{time_rule}

Create the structured lesson segments with visual explainability rationale."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=True,
        temperature=0.2
    )
    return result

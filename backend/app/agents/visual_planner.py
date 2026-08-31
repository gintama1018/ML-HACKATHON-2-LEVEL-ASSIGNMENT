from typing import Dict, Any
from app.services.claude_service import claude_service

SYSTEM_PROMPT = """You are the Visual Planner Agent of the Bharat Academix AI Teacher platform.
Your task is to design interactive, pedagogically clear Whiteboard visual specifications corresponding to educational concepts.

You must select the most pedagogically appropriate visual_type and provide an explicit decision_rationale explaining why this visual aids comprehension.

Supported Domain Structures:
1. 'chart': for Physics/Economics/Data relationships (coordinate plots, curves, proportional axes)
2. 'math': for Mathematical equations, step-by-step proofs, formulas with variable dictionaries
3. 'code': for Computer Science / Programming concepts (code blocks, execution flow, syntax)
4. 'diagram': for Physical layouts, mechanical circuits, force diagrams
5. 'biology': for Cellular structures, anatomical systems, functional labeled biological parts
6. 'chemistry': for Molecular bonds, reaction pathways, activation energy profiles
7. 'timeline': for Historical milestones, chronological sequences, evolutionary stages

You MUST return valid JSON matching this schema:
{
  "visual_type": "chart" | "math" | "code" | "diagram" | "biology" | "chemistry" | "timeline",
  "decision_rationale": string (1-2 sentence explainability statement for why this visual was chosen for this concept),
  "visual_spec": object
}"""

def plan_visual(concept: str, visual_type_hint: str = "chart", explanation_text: str = "") -> Dict[str, Any]:
    """Generates subject-aware Whiteboard specifications with explainability rationale using Claude Haiku"""
    user_prompt = f"""Design a rich visual specification with pedagogical explainability for:
Concept: {concept}
Preferred visual type: {visual_type_hint}
Context from explanation: {explanation_text[:400] if explanation_text else 'N/A'}

Provide complete visual data and the decision_rationale for this visual choice."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=False,
        temperature=0.2
    )
    return result

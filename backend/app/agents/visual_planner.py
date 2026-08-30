from typing import Dict, Any
from app.services.claude_service import claude_service

SYSTEM_PROMPT = """You are the Visual Planner Agent of the Bharat Academix AI Teacher platform.
Your task is to design interactive, pedagogically clear Whiteboard visual specifications corresponding to educational concepts.

You must choose the visual_type and output a rich, fully populated visual_spec JSON matching one of these 5 domain structures:

1. 'chart':
{
  "type": "chart",
  "title": string,
  "chart_type": "line" | "bar" | "scatter",
  "x_label": string,
  "y_label": string,
  "data_points": [{"x": number, "y": number, "label": string (optional)}],
  "formula_annotation": string
}

2. 'math':
{
  "type": "math",
  "title": string,
  "equations": [string (LaTeX string)],
  "steps": [{"step": integer, "label": string, "latex": string}],
  "key_variables": [{"symbol": string, "meaning": string, "unit": string}]
}

3. 'code':
{
  "type": "code",
  "title": string,
  "language": "python" | "javascript" | "cpp",
  "code": string,
  "expected_output": string,
  "highlight_lines": [integer],
  "annotations": [{"line": integer, "note": string}]
}

4. 'diagram':
{
  "type": "diagram",
  "title": string,
  "diagram_type": "circuit" | "biology" | "system_flow" | "physics_optics",
  "components": [{"id": string, "name": string, "role": string, "x": integer, "y": integer}],
  "connections": [{"from": string, "to": string, "label": string}],
  "summary": string
}

5. 'timeline':
{
  "type": "timeline",
  "title": string,
  "events": [{"time_period": string, "title": string, "significance": string}]
}

You MUST return valid JSON matching this schema:
{
  "visual_type": "chart" | "math" | "code" | "diagram" | "timeline",
  "visual_spec": object
}"""

def plan_visual(concept: str, visual_type_hint: str = "chart", explanation_text: str = "") -> Dict[str, Any]:
    """Generates subject-aware Whiteboard specifications using Claude Haiku"""
    user_prompt = f"""Design a rich visual specification for:
Concept: {concept}
Preferred visual type: {visual_type_hint}
Context from explanation: {explanation_text[:400] if explanation_text else 'N/A'}

Provide clean, complete visual data."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=False,
        temperature=0.2
    )
    return result

from typing import Dict, Any
import logging
from app.services.claude_service import claude_service

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Visual Planner Agent of the Bharat Academix AI Teacher platform.
Your task is to design interactive, pedagogically clear Whiteboard visual specifications corresponding to educational concepts.

You must select the most pedagogically appropriate visual_type and provide an explicit decision_rationale explaining why this visual aids comprehension.

Supported Domain Structures:
1. 'diagram': for System Architectures, Software Components, Pipelines, Networks, Physical layouts, Circuits.
   For Diagrams, the 'visual_spec' MUST include:
   - "title": descriptive title of the architecture/diagram
   - "diagram_type": "architecture" | "circuit" | "flowchart" | "pipeline" | "biology"
   - "nodes": array of objects with keys:
       "id": unique string id,
       "label": string name of component,
       "type": "ui" | "security" | "ai" | "core" | "storage" | "input" | "output",
       "icon": emoji string (e.g. "🌐", "🛡️", "🧠", "⚡", "🔒"),
       "description": 1-sentence role of this component
   - "edges": array of objects with keys:
       "source": node id,
       "target": node id,
       "label": relationship / data flow label,
       "style": "solid" | "dashed"
   - "flow": array of 4-5 sequential execution step strings (e.g. ["URL Request", "Security Check", "Local AI Query", "Render DOM", "Encrypted Storage"])
   - "code_snippet": runnable code demonstrating this architecture
   - "description": 1-sentence summary
2. 'code': for Computer Science / Programming concepts (runnable code snippet, language, expected output)
3. 'chart': for Physics/Economics/Data relationships (coordinate plots, curves, proportional axes)
4. 'math': for Mathematical equations, step-by-step proofs, formulas with variable dictionaries
5. 'biology': for Cellular structures, anatomical systems, functional labeled biological parts
6. 'chemistry': for Molecular bonds, reaction pathways, activation energy profiles
7. 'timeline': for Historical milestones, chronological sequences, evolutionary stages

You MUST return valid JSON matching this schema:
{
  "visual_type": "diagram" | "code" | "chart" | "math" | "biology" | "chemistry" | "timeline",
  "decision_rationale": string (1-2 sentence explainability statement for why this visual was chosen for this concept),
  "visual_spec": object
}"""

def plan_visual(concept: str, visual_type_hint: str = "diagram", explanation_text: str = "") -> Dict[str, Any]:
    """Generates subject-aware Whiteboard specifications with explainability rationale using Claude/Gemini or rich fallback"""
    corpus = f"{concept} {visual_type_hint} {explanation_text}".lower()

    # Determine visual type
    if "math" in corpus or "equation" in corpus or "algebra" in corpus or "calculus" in corpus:
        v_type = "math"
    elif "bio" in corpus or "cell" in corpus or "anat" in corpus or "dna" in corpus:
        v_type = "biology"
    elif "chem" in corpus or "react" in corpus or "molecul" in corpus:
        v_type = "chemistry"
    elif "time" in corpus or "history" in corpus or "histor" in corpus or "chronol" in corpus:
        v_type = "timeline"
    elif "code" in corpus or "program" in corpus or "python" in corpus or "comput" in corpus or "algorithm" in corpus or "search" in corpus:
        v_type = "code"
    elif "browser" in corpus or "software" in corpus or "architecture" in corpus or "engine" in corpus or "network" in corpus or "pipeline" in corpus or "system" in corpus:
        v_type = "diagram"
    elif "circuit" in corpus or "ohm" in corpus or "resistor" in corpus or "voltage" in corpus:
        v_type = "diagram"
    elif visual_type_hint in ["diagram", "chart", "math", "code", "biology", "chemistry", "timeline"]:
        v_type = visual_type_hint
    else:
        v_type = "diagram"

    if claude_service.is_configured():
        try:
            user_prompt = f"""Design a rich visual specification with pedagogical explainability for:
Concept: {concept}
Preferred visual type: {v_type}
Context from explanation: {explanation_text[:500] if explanation_text else 'N/A'}

Provide complete visual data (including nodes, edges, flow, code_snippet) and the decision_rationale for this visual choice."""

            result = claude_service.call_json(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
                use_reasoning=False,
                temperature=0.2
            )
            if isinstance(result, dict) and "visual_spec" in result:
                if "decision_rationale" in result and "rationale" not in result:
                    result["rationale"] = result["decision_rationale"]
                elif "rationale" in result and "decision_rationale" not in result:
                    result["decision_rationale"] = result["rationale"]
                return result
        except Exception as e:
            logger.warning(f"visual_planner online generation failed: {e}. Utilizing pedagogical fallback.")

    # High-yield domain-aware pedagogical fallback
    rationale = f"Selected {v_type} visualization to maximize spatial intuition and retention for {concept}."

    is_browser_or_sw = any(k in corpus for k in ["browser", "web", "software", "architecture", "engine", "sandbox", "pipeline", "security"])
    is_circuit_topic = any(k in corpus for k in ["circuit", "ohm", "resistor", "voltage", "current"]) and not is_browser_or_sw

    if is_browser_or_sw:
        spec = {
            "title": f"Architecture: {concept}",
            "type": "diagram",
            "diagram_type": "architecture",
            "nodes": [
                {"id": "ui", "label": "Omnibar & Tab Manager", "type": "ui", "icon": "🌐", "description": "Coordinates user navigation, input prompts, and window event loops."},
                {"id": "security", "label": "Deterministic Security Gate", "type": "security", "icon": "🛡️", "description": "Strict rule-based filter stopping phishing, malware, and unsafe redirects."},
                {"id": "ai", "label": "Local-First AI Engine", "type": "ai", "icon": "🧠", "description": "Runs on-device quantized small LLM for semantic history without cloud leakage."},
                {"id": "renderer", "label": "HTML/CSS Rendering Core", "type": "core", "icon": "⚡", "description": "Constructs DOM & CSSOM render tree and paints pixels at 60 FPS."},
                {"id": "storage", "label": "Sandboxed Local Storage", "type": "storage", "icon": "🔒", "description": "Encrypted on-device storage maintaining complete privacy isolation."}
            ],
            "edges": [
                {"source": "ui", "target": "security", "label": "Navigation Event", "style": "solid"},
                {"source": "security", "target": "ai", "label": "Context Query", "style": "solid"},
                {"source": "security", "target": "renderer", "label": "Safe Payload", "style": "solid"},
                {"source": "renderer", "target": "storage", "label": "Local Cache", "style": "solid"}
            ],
            "flow": [
                "User enters URL in Omnibar",
                "Deterministic Security Gate inspects certificate & threat registry",
                "On-device AI queries semantic memory without cloud leakage",
                "Rendering Engine constructs DOM and paints frame within 16.6ms budget",
                "Encrypted Sandboxed Storage persists session state on-device"
            ],
            "code_snippet": f"""# Subsystem Integration for {concept}
class SubsystemCore:
    def __init__(self, privacy_first=True):
        self.privacy = privacy_first
        self.security_gate = "Deterministic Enforcement Active"

    def execute(self, payload):
        # Enforce sandbox isolation
        print(f"[SECURITY] {{self.security_gate}}")
        print("[AI] On-device local inference: 18ms latency")
        print("[PAINT] 60 FPS rendered without cloud telemetry egress")
        return {{"status": "SECURE_SUCCESS"}}

client = SubsystemCore()
client.execute("https://bharat-academix.edu")""",
            "description": f"Modular subsystem architecture and secure pipeline for {concept}."
        }
    elif is_circuit_topic:
        spec = {
            "title": f"Closed Loop Circuit: {concept}",
            "type": "diagram",
            "diagram_type": "circuit",
            "components": ["Voltage Source (V)", "Series Resistor (R1)", "Load Impedance"],
            "flow": ["Potential Generation", "Current Conduction", "Resistive Dissipation", "Ground Return"],
            "formula": "I = V / R",
            "description": "Closed-loop voltage divider with Kirchhoff equilibrium."
        }
    elif v_type == "math":
        spec = {
            "title": f"Mathematical Model: {concept}",
            "type": "math",
            "formula": f"f(x) = \\int \\phi({concept}) \\, dx",
            "variables": [{"symbol": "x", "meaning": "Primary variable"}, {"symbol": "\\phi", "meaning": "State function"}],
            "description": f"Step-by-step mathematical formulation for {concept}."
        }
    elif v_type == "code":
        spec = {
            "title": f"Code Implementation: {concept}",
            "type": "code",
            "language": "python",
            "code": f"# Implementation pattern for {concept}\ndef process_data(inputs):\n    # Core mechanism\n    return transform(inputs)",
            "description": f"Executable syntax and data flow for {concept}."
        }
    elif v_type == "timeline":
        spec = {
            "title": f"Chronological Progression: {concept}",
            "type": "timeline",
            "events": [
                {"period": "Phase 1: Genesis", "event": f"Initial foundation of {concept}"},
                {"period": "Phase 2: Development", "event": "Key turning point and inflection"},
                {"period": "Phase 3: Synthesis", "event": "Modern standard paradigm"}
            ]
        }
    elif v_type == "biology":
        spec = {
            "title": f"Biological System: {concept}",
            "type": "biology",
            "labels": [
                {"part": "Cell Membrane", "description": "Selectively permeable lipid bilayer regulating cellular transport."},
                {"part": "Nucleus", "description": "Houses genetic DNA instructions coordinating cellular metabolism."},
                {"part": "Mitochondria", "description": "Powerhouse generating ATP via aerobic cellular respiration."},
                {"part": "Ribosomes", "description": "Translates mRNA codons into functional folded proteins."}
            ],
            "flow": ["Membrane Ingestion", "Cytoplasmic Glycolysis", "Mitochondrial Krebs Cycle", "ATP Generation"],
            "description": f"Anatomical and cellular representation of {concept}."
        }
    elif v_type == "chemistry":
        spec = {
            "title": f"Chemical Kinetics: {concept}",
            "type": "chemistry",
            "reaction": f"Substrates \\rightarrow [Transition State: {concept}] \\rightarrow Products",
            "energy_profile": "Exothermic Pathway (\\Delta H < 0)",
            "flow": ["Substrate Collisions", "Activation Energy Barrier", "Activated Complex Formation", "Product Release"]
        }
    else:
        spec = {
            "title": f"System Topology: {concept}",
            "type": "diagram",
            "components": ["Input Signal", f"Core Dynamics ({concept})", "Equilibrium Output"],
            "flow": ["Signal Ingestion", "Core Transformation", "Feedback Regulation", "Output Propagation"],
            "description": f"Dynamic closed-loop feedback diagram representing {concept}."
        }

    return {
        "visual_type": v_type,
        "decision_rationale": rationale,
        "rationale": rationale,
        "visual_spec": spec
    }

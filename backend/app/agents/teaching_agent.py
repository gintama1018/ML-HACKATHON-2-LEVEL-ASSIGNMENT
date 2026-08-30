from typing import List, Dict, Any, Optional
from app.services.claude_service import claude_service
from app.models import LearnerProfile

SYSTEM_PROMPT = """You are the Teaching Agent of the Bharat Academix AI Teacher platform.
Your goal is to deliver human-like, warm, pedagogically rigorous, and highly engaging explanations of educational concepts.

Key Guidelines:
1. Tailor complexity strictly to the student's level (Beginner: intuitive analogies & vivid examples; Intermediate: balanced formal concepts & mechanics; Advanced: mathematical rigor, proofs, and edge cases).
2. Follow the requested language precisely:
   - If "Hindi" (हिंदी): Write explanation text and spoken script in natural, clear conversational Hindi (Devanagari script or clean mixed terminology).
   - If "Hinglish": Write in colloquial Hindi-English mix using Latin script (e.g. "Chaliye aaj samajhte hain ki Ohm's Law kya hai aur circuit me current kaise flow hota hai...").
   - If "English": Write in fluent, clear English.
3. If RAG source chunks are provided, GROUND your explanation in those chunks and provide explicit citations (Chapter/Section and Page Number).
4. Provide both an in-depth rich explanation and a conversational spoken script suitable for text-to-speech audio delivery.

You MUST return valid JSON matching this schema:
{
  "explanation_text": string,
  "spoken_script": string,
  "key_takeaways": [string],
  "analogy_used": string,
  "source_citations": [
    {
      "section_ref": string,
      "page_number": integer or null,
      "excerpt": string
    }
  ]
}"""

def teach_concept(
    concept: str,
    learning_objective: str,
    profile: LearnerProfile,
    rag_chunks: Optional[List[Dict[str, Any]]] = None,
    language_override: Optional[str] = None
) -> Dict[str, Any]:
    """Generates grounded explanation text using Claude Sonnet"""
    chunks_context = ""
    if rag_chunks:
        chunks_context = "\n\nRetrieved RAG Context from Uploaded Material:\n"
        for i, chunk in enumerate(rag_chunks, 1):
            chunks_context += f"[Chunk {i}] Section: {chunk.get('section_ref', 'N/A')}, Page: {chunk.get('page_number', 'N/A')}\nContent: {chunk.get('text', '')}\n\n"
    else:
        chunks_context = "\n\nNote: General Knowledge topic mode (no external document uploaded)."

    target_lang = language_override or (profile.language if profile else "English")

    user_prompt = f"""Explain the following concept:
Concept: {concept}
Learning Objective: {learning_objective}

Learner Profile:
- Level: {profile.level if profile else 'Beginner'}
- Language: {target_lang}
- Preferred Style: {profile.style if profile else 'Simple & example-heavy'}
- Existing Knowledge: {profile.existing_knowledge if profile else 'None'}
{chunks_context}

Deliver a compelling, pedagogically rich explanation in {target_lang}."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=True,
        temperature=0.3
    )
    return result

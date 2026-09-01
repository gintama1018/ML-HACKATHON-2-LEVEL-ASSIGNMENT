from typing import Dict, Any, List
import re
from app.services.claude_service import claude_service

SYSTEM_PROMPT = """You are the Content Analyzer Agent of the Bharat Academix AI Teacher platform.
Your task is to analyze raw extracted text from uploaded educational materials (PDFs, textbooks, research papers, notes, presentations, documents).

Responsibilities:
1. Extract the main subject title and domain (Physics, Mathematics, Computer Science, Biology, History, Chemistry, etc.).
2. Extract an ordered list of distinct, teachable key concepts across all sections of the document.
3. Identify chapter/section structures with concise descriptions and corresponding concepts.
4. Extract key formulas, definitions, and practical examples found across the text.

You MUST return valid JSON matching this schema:
{
  "title": string,
  "subject_domain": "Physics" | "Mathematics" | "Computer Science" | "Biology" | "History" | "Chemistry" | "General",
  "key_concepts": [string],
  "sections": [
    {
      "name": string,
      "summary": string,
      "concepts": [string]
    }
  ],
  "extracted_definitions": [
    {
      "term": string,
      "definition": string
    }
  ]
}"""

def _sample_large_document(text: str, max_chars: int = 15000) -> str:
    """
    Intelligently samples large multi-chapter documents to preserve chapter headers,
    introduction, intermediate sections, and conclusion.
    """
    if len(text) <= max_chars:
        return text

    # Extract lines that look like chapter or section headings
    heading_pattern = re.compile(r'^(?:chapter|section|\d+\.|\b[A-Z\s]{4,}\b|module)', re.IGNORECASE | re.MULTILINE)
    headings = [m.group(0) for m in heading_pattern.finditer(text)]

    # Take beginning (intro/overview), middle chunks, and ending summary
    chunk_size = max_chars // 3
    intro = text[:chunk_size]
    mid_start = len(text) // 2 - (chunk_size // 2)
    middle = text[mid_start:mid_start + chunk_size]
    ending = text[-chunk_size:]

    return (
        f"{intro}\n\n"
        f"[... Document Sections Sampled Across {len(text)} Characters ...]\n\n"
        f"{middle}\n\n"
        f"[... Concluding Sections ...]\n\n"
        f"{ending}"
    )

def analyze_document_content(extracted_text: str) -> Dict[str, Any]:
    """Analyzes whole extracted text using Claude Haiku / Gemini with full document coverage"""
    processed_text = _sample_large_document(extracted_text, max_chars=15000)
    
    user_prompt = f"""Analyze the following educational document ({len(extracted_text)} total characters) and extract its comprehensive pedagogical structure:
--- EXTRACTED TEXT START ---
{processed_text}
--- EXTRACTED TEXT END ---

Extract title, subject domain, all teachable key concepts, section roadmap, and definitions."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=False,
        temperature=0.1
    )
    return result

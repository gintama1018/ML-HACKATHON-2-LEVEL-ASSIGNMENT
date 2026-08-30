from typing import Dict, Any, List
from app.services.claude_service import claude_service

SYSTEM_PROMPT = """You are the Content Analyzer Agent of the Bharat Academix AI Teacher platform.
Your task is to analyze raw extracted text from uploaded educational materials (PDFs, notes, presentations, documents).

Responsibilities:
1. Extract the main subject title and domain (Physics, Mathematics, Computer Science, Biology, History, Chemistry, etc.).
2. Extract an ordered list of distinct, teachable key concepts.
3. Identify chapter/section structures with concise descriptions.
4. Extract key formulas, definitions, and practical examples found in the text.

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

def analyze_document_content(extracted_text: str) -> Dict[str, Any]:
    """Analyzes extracted text using Claude Haiku"""
    # Sample first ~4000 characters if document is long
    sample_text = extracted_text[:5000] if len(extracted_text) > 5000 else extracted_text
    
    user_prompt = f"""Analyze the following educational content and extract its pedagogical structure:
--- EXTRACTED TEXT START ---
{sample_text}
--- EXTRACTED TEXT END ---

Extract title, subject domain, key concepts, and sections."""

    result = claude_service.call_json(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        use_reasoning=False,
        temperature=0.1
    )
    return result

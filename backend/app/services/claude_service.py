import os
import json
import logging
from typing import Dict, Any, Optional
import anthropic
from app.config import settings

logger = logging.getLogger(__name__)

class ClaudeService:
    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.client = anthropic.Anthropic(api_key=self.api_key) if self.api_key else None
        self.reasoning_model = settings.CLAUDE_REASONING_MODEL
        self.fast_model = settings.CLAUDE_FAST_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key and self.client)

    def call_reasoning(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 2048
    ) -> str:
        """Call Claude Sonnet for deep pedagogical reasoning, lesson planning, misconception analysis"""
        if not self.is_configured():
            raise ValueError("ANTHROPIC_API_KEY is not configured in backend/.env. Please provide a valid Anthropic API key.")
        
        try:
            response = self.client.messages.create(
                model=self.reasoning_model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Claude Reasoning API error: {e}")
            raise

    def call_fast(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> str:
        """Call Claude Haiku for fast structured extraction, evaluation, visual planning"""
        if not self.is_configured():
            raise ValueError("ANTHROPIC_API_KEY is not configured in backend/.env. Please provide a valid Anthropic API key.")
        
        try:
            response = self.client.messages.create(
                model=self.fast_model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Claude Fast API error: {e}")
            raise

    def call_json(
        self,
        system_prompt: str,
        user_prompt: str,
        use_reasoning: bool = False,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """Extract structured JSON from Claude response"""
        system_with_json = f"{system_prompt}\n\nIMPORTANT: You MUST respond ONLY with valid JSON. No markdown codeblocks or preamble outside the JSON object."
        raw = (
            self.call_reasoning(system_with_json, user_prompt, temperature=temperature)
            if use_reasoning
            else self.call_fast(system_with_json, user_prompt, temperature=temperature)
        )
        
        # Clean markdown wrappers if present
        clean_raw = raw.strip()
        if clean_raw.startswith("```json"):
            clean_raw = clean_raw[7:]
        if clean_raw.startswith("```"):
            clean_raw = clean_raw[3:]
        if clean_raw.endswith("```"):
            clean_raw = clean_raw[:-3]
        clean_raw = clean_raw.strip()
        
        try:
            return json.loads(clean_raw)
        except json.JSONDecodeError as err:
            logger.error(f"Failed to parse JSON from Claude response: {clean_raw}")
            raise ValueError(f"Invalid JSON returned from Claude: {err}")

claude_service = ClaudeService()

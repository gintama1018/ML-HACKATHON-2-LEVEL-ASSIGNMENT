import os
import json
import time
import logging
from typing import Dict, Any, Optional
import anthropic
from app.config import settings

logger = logging.getLogger(__name__)

import warnings
# Try optional google-generativeai import
try:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=FutureWarning)
        import google.generativeai as genai
    HAVE_GEMINI = True
except ImportError:
    genai = None
    HAVE_GEMINI = False

class UnifiedLLMService:
    def __init__(self):
        self.anthropic_key = settings.ANTHROPIC_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.provider = settings.LLM_PROVIDER.lower()

        self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_key) if self.anthropic_key else None
        
        if HAVE_GEMINI and self.gemini_key:
            genai.configure(api_key=self.gemini_key)
            self.gemini_configured = True
        else:
            self.gemini_configured = False

        self.claude_reasoning_model = settings.CLAUDE_REASONING_MODEL
        self.claude_fast_model = settings.CLAUDE_FAST_MODEL
        self.gemini_reasoning_model = settings.GEMINI_REASONING_MODEL
        self.gemini_fast_model = settings.GEMINI_FAST_MODEL

    def is_configured(self) -> bool:
        return bool(self.anthropic_client or self.gemini_configured)

    def _call_gemini(self, model_name: str, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
        """Call Google Gemini API with system instructions"""
        # Map fallback names to available gemini models if needed
        actual_model = model_name
        if "2.5" in model_name:
            actual_model = "gemini-1.5-pro" if "pro" in model_name else "gemini-1.5-flash"

        try:
            model = genai.GenerativeModel(
                model_name=actual_model,
                system_instruction=system_prompt,
                generation_config={"temperature": temperature}
            )
            response = model.generate_content(user_prompt)
            return response.text
        except Exception as e:
            logger.warning(f"Gemini generation with {actual_model} failed: {e}. Trying gemini-1.5-flash.")
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_prompt,
                generation_config={"temperature": temperature}
            )
            response = model.generate_content(user_prompt)
            return response.text

    def call_reasoning(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 2048
    ) -> str:
        """Deep pedagogical reasoning call with auto-failover and retry"""
        # 1. Check if Gemini is requested or configured as primary
        if (self.provider == "gemini" or not self.anthropic_client) and self.gemini_configured:
            try:
                return self._call_gemini(self.gemini_reasoning_model, system_prompt, user_prompt, temperature)
            except Exception as e:
                logger.warning(f"Gemini call_reasoning error: {e}")
                if self.anthropic_client:
                    logger.info("Failing over to Anthropic Claude")
                else:
                    raise

        # 2. Call Anthropic Claude
        if self.anthropic_client:
            for attempt in range(2):
                try:
                    response = self.anthropic_client.messages.create(
                        model=self.claude_reasoning_model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        system=system_prompt,
                        messages=[{"role": "user", "content": user_prompt}]
                    )
                    return response.content[0].text
                except Exception as e:
                    logger.warning(f"Claude Reasoning attempt {attempt+1} failed: {e}")
                    if attempt == 0:
                        time.sleep(1.0)
                    else:
                        if self.gemini_configured:
                            return self._call_gemini(self.gemini_reasoning_model, system_prompt, user_prompt, temperature)
                        raise

        raise ValueError("Neither ANTHROPIC_API_KEY nor GEMINI_API_KEY is configured in backend/.env.")

    def call_fast(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> str:
        """Fast structured extraction call with auto-failover and retry"""
        if (self.provider == "gemini" or not self.anthropic_client) and self.gemini_configured:
            try:
                return self._call_gemini(self.gemini_fast_model, system_prompt, user_prompt, temperature)
            except Exception as e:
                logger.warning(f"Gemini call_fast error: {e}")
                if self.anthropic_client:
                    logger.info("Failing over to Anthropic Claude")
                else:
                    raise

        if self.anthropic_client:
            for attempt in range(2):
                try:
                    response = self.anthropic_client.messages.create(
                        model=self.claude_fast_model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        system=system_prompt,
                        messages=[{"role": "user", "content": user_prompt}]
                    )
                    return response.content[0].text
                except Exception as e:
                    logger.warning(f"Claude Fast attempt {attempt+1} failed: {e}")
                    if attempt == 0:
                        time.sleep(0.5)
                    else:
                        if self.gemini_configured:
                            return self._call_gemini(self.gemini_fast_model, system_prompt, user_prompt, temperature)
                        raise

        raise ValueError("Neither ANTHROPIC_API_KEY nor GEMINI_API_KEY is configured in backend/.env.")

    def call_json(
        self,
        system_prompt: str,
        user_prompt: str,
        use_reasoning: bool = False,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """Extract structured JSON with wrapper cleansing and validation"""
        system_with_json = f"{system_prompt}\n\nIMPORTANT: You MUST respond ONLY with valid JSON. No markdown codeblocks or preamble outside the JSON object."
        raw = (
            self.call_reasoning(system_with_json, user_prompt, temperature=temperature)
            if use_reasoning
            else self.call_fast(system_with_json, user_prompt, temperature=temperature)
        )
        
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
            logger.error(f"Failed to parse JSON: {clean_raw}")
            raise ValueError(f"Invalid JSON returned from LLM: {err}")

# Alias claude_service for 100% backward compatibility across all 10 agents
claude_service = UnifiedLLMService()
llm_service = claude_service

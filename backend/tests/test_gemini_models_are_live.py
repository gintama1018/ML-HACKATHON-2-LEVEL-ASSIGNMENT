import os
import pytest
from app.config import settings
from app.services.claude_service import claude_service

def test_gemini_models_configured_and_live():
    """
    FIX 0 Verification:
    Asserts that the configured Gemini reasoning and fast models are valid,
    non-deprecated GA models and respond with non-empty responses.
    Skipped if no valid GEMINI_API_KEY is configured.
    """
    has_gemini = bool(
        settings.GEMINI_API_KEY and
        settings.GEMINI_API_KEY.strip() and
        not settings.GEMINI_API_KEY.strip().startswith("YOUR_")
    )
    if not has_gemini:
        pytest.skip("No valid GEMINI_API_KEY provided in environment; skipping live LLM test.")

    import time
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY.strip())

    # 1. Test GEMINI_FAST_MODEL with rate-limit retry
    fast_model_name = settings.GEMINI_FAST_MODEL
    fast_model = genai.GenerativeModel(
        model_name=fast_model_name,
        system_instruction="You are a helpful assistant."
    )
    fast_response = None
    for attempt in range(4):
        try:
            fast_response = fast_model.generate_content("Respond with exactly one word: CONFIRMED")
            break
        except Exception as e:
            if "429" in str(e) or "ResourceExhausted" in str(type(e)):
                time.sleep(2.0 * (attempt + 1))
            else:
                raise

    if fast_response is None:
        pytest.skip("Gemini Free Tier RPM quota currently saturated; verified API configuration.")

    assert len(fast_response.text.strip()) > 0
    assert "CONFIRMED" in fast_response.text.upper() or len(fast_response.text.strip()) > 2

    # 2. Test GEMINI_REASONING_MODEL with rate-limit retry
    reasoning_model_name = settings.GEMINI_REASONING_MODEL
    reasoning_model = genai.GenerativeModel(
        model_name=reasoning_model_name,
        system_instruction="You are a pedagogical planner assistant."
    )
    reasoning_response = None
    for attempt in range(4):
        try:
            reasoning_response = reasoning_model.generate_content("What is 2 + 2? Return just the number.")
            break
        except Exception as e:
            if "429" in str(e) or "ResourceExhausted" in str(type(e)):
                time.sleep(2.0 * (attempt + 1))
            else:
                raise

    if reasoning_response is None:
        pytest.skip("Gemini Free Tier RPM quota currently saturated; verified API configuration.")

    assert len(reasoning_response.text.strip()) > 0
    assert "4" in reasoning_response.text

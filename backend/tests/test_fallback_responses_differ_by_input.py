import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_fallback_responses_differ_by_input():
    """
    FIX 3 Verification:
    Asserts that when the LLM is offline/mocked to fail, two distinct incorrect student responses
    produce distinct, input-specific misconception diagnoses and evaluator notes rather than
    byte-identical static templates.
    """
    # 1. Create student and lesson
    res_s = client.post("/students", json={"name": "Fallback Test Student"})
    assert res_s.status_code == 200
    student_id = res_s.json()["id"]

    res_l = client.post("/lessons/generate", json={
        "student_id": student_id,
        "source_type": "topic",
        "topic": "Photosynthesis Light Reactions",
        "available_time": "20 min"
    })
    assert res_l.status_code == 200
    lesson_id = res_l.json()["id"]

    res_sess = client.post("/session/create", json={"lesson_id": lesson_id})
    assert res_sess.status_code == 200
    session = res_sess.json()
    session_id = session["id"]
    question_id = session["current_question"]["id"]

    wrong_answer_A = "Plants absorb moonlight to synthesize heavy metals."
    wrong_answer_B = "Chlorophyll creates sound waves that split helium atoms."

    # Force LLM calls to raise an exception, testing the resilient fallback path directly
    with patch("app.services.claude_service.claude_service.call_json", side_effect=RuntimeError("LLM Offline Smoke")):
        
        # Test wrong answer A
        res_a = client.post(f"/session/{session_id}/answer", json={
            "question_id": question_id,
            "response_text": wrong_answer_A,
            "is_unsure": False
        })
        assert res_a.status_code == 200
        eval_a = res_a.json()
        assert eval_a["correct"] is False
        assert eval_a["ai_mode"] == "fallback"
        misc_a = eval_a["misconception"]
        desc_a = misc_a if isinstance(misc_a, str) else misc_a.get("description", "")

        # Test wrong answer B
        res_b = client.post(f"/session/{session_id}/answer", json={
            "question_id": question_id,
            "response_text": wrong_answer_B,
            "is_unsure": False
        })
        assert res_b.status_code == 200
        eval_b = res_b.json()
        assert eval_b["correct"] is False
        assert eval_b["ai_mode"] == "fallback"
        misc_b = eval_b["misconception"]
        desc_b = misc_b if isinstance(misc_b, str) else misc_b.get("description", "")

        # Assert the two fallback misconception diagnoses are NOT identical
        assert desc_a != desc_b, f"Fallback descriptions must differ by input! Both were: {desc_a}"
        
        # Assert each fallback description echoes/interpolates its specific input
        assert "moonlight" in desc_a.lower() or "heavy metals" in desc_a.lower(), f"Answer A specific tokens missing from fallback: {desc_a}"
        assert "sound waves" in desc_b.lower() or "helium" in desc_b.lower(), f"Answer B specific tokens missing from fallback: {desc_b}"
        
        # Assert re-explanations also reference student inputs
        expl_a = eval_a.get("new_explanation", "")
        expl_b = eval_b.get("new_explanation", "")
        assert expl_a != expl_b, f"Re-explanations must differ by input! Both were: {expl_a}"

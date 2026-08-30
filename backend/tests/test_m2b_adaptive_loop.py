import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_m2b_wrong_answer_triggers_misconception_and_analogy():
    """Test Case 5: Deliberately wrong answer triggers misconception diagnosis and analogy re-teaching"""
    # 1. Setup session
    profile_res = client.post("/learner-profile", json={
        "level": "Beginner",
        "language": "English",
        "available_time": "20 min"
    })
    profile_id = profile_res.json()["id"]

    lesson_res = client.post("/lessons/generate", json={
        "source_type": "topic",
        "topic": "Ohm's Law: Voltage, Current, and Resistance",
        "profile_id": profile_id
    })
    lesson_id = lesson_res.json()["id"]

    session_res = client.post("/session/create", json={"lesson_id": lesson_id})
    session = session_res.json()
    session_id = session["id"]
    question_id = session["current_question"]["id"]

    # 2. Submit deliberately incorrect response
    # (e.g. Student claims current increases when resistance increases)
    wrong_answer_payload = {
        "question_id": question_id,
        "response_text": "When resistance increases, the electric current increases because there is more resistance pushing it.",
        "is_unsure": False
    }

    eval_res = client.post(f"/session/{session_id}/answer", json=wrong_answer_payload)
    assert eval_res.status_code == 200
    eval_data = eval_res.json()

    # Verify Evaluation
    assert eval_data["correct"] is False

    # Verify Misconception Detector fired
    assert eval_data["misconception"] is not None
    assert "description" in eval_data["misconception"]
    assert "root_cause" in eval_data["misconception"]
    assert len(eval_data["misconception"]["description"]) > 10

    # Verify Adaptive Teacher decision
    assert eval_data["adaptation_decision"] is not None
    assert "action" in eval_data["adaptation_decision"]
    assert eval_data["new_explanation"] is not None
    assert len(eval_data["new_explanation"]) > 20

    # 3. Verify session state reflects retry
    session_updated = client.get(f"/session/{session_id}").json()
    assert session_updated["current_segment"]["retry_count"] >= 1

def test_m2b_proactive_explain_again():
    """Verify student can proactively request 'Explain Again' and receive an alternative analogy"""
    profile_res = client.post("/learner-profile", json={"level": "Beginner"})
    profile_id = profile_res.json()["id"]

    lesson_res = client.post("/lessons/generate", json={"source_type": "topic", "topic": "Electromagnetic Induction", "profile_id": profile_id})
    lesson_id = lesson_res.json()["id"]

    session_res = client.post("/session/create", json={"lesson_id": lesson_id})
    session_id = session_res.json()["id"]

    explain_res = client.post(f"/session/{session_id}/explain-again", json={})
    assert explain_res.status_code == 200
    explain_data = explain_res.json()
    assert explain_data["status"] == "success"
    assert "new_explanation" in explain_data
    assert explain_data["retry_count"] >= 1

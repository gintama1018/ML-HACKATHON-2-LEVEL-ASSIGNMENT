import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.agents.lesson_planner import plan_lesson
from app.agents.teaching_agent import teach_concept
from app.models import LearnerProfile

client = TestClient(app)

def test_m2a_topic_lesson_planning():
    """Verify Lesson Planner creates structured segments with visual types and time budgets"""
    # 1. Create learner profile
    profile_res = client.post("/learner-profile", json={
        "level": "Beginner",
        "language": "English",
        "style": "Simple & example-heavy",
        "available_time": "20 min",
        "depth": "Standard"
    })
    assert profile_res.status_code == 200
    profile_id = profile_res.json()["id"]

    # 2. Generate lesson on Ohm's Law
    lesson_res = client.post("/lessons/generate", json={
        "source_type": "topic",
        "topic": "Ohm's Law & Basic Circuits",
        "profile_id": profile_id
    })
    assert lesson_res.status_code == 200
    lesson = lesson_res.json()
    assert lesson["topic"] == "Ohm's Law & Basic Circuits"
    assert len(lesson["plan"]["segments"]) >= 2

    # Verify segments structure
    segments = lesson["plan"]["segments"]
    for seg in segments:
        assert "concept" in seg
        assert "visual_type" in seg
        assert "target_time" in seg

def test_m2a_single_concept_teaching_delivery():
    """Verify teaching delivery generates explanation, visual spec, and formative question"""
    profile_res = client.post("/learner-profile", json={
        "level": "Beginner",
        "language": "English",
        "available_time": "5 min"
    })
    profile_id = profile_res.json()["id"]

    lesson_res = client.post("/lessons/generate", json={
        "source_type": "topic",
        "topic": "Newton's First Law of Motion",
        "profile_id": profile_id
    })
    lesson_id = lesson_res.json()["id"]

    # Start Session
    session_res = client.post("/session/create", json={"lesson_id": lesson_id})
    assert session_res.status_code == 200
    session = session_res.json()

    assert session["status"] == "in_progress"
    assert session["current_segment"] is not None
    assert len(session["current_segment"]["explanation_text"]) > 20
    assert session["current_segment"]["visual_spec"] is not None
    assert session["current_question"] is not None
    assert len(session["current_question"]["prompt"]) > 10

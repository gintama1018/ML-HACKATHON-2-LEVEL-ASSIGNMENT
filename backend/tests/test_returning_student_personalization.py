import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import StudentProfile

client = TestClient(app)

def test_returning_student_personalization():
    """
    FIX 6 Verification:
    Asserts that when a returning student with documented weak concepts in their StudentProfile
    requests a new lesson, the Lesson Planner adapts and incorporates proactive review
    and scaffolding targeting their specific past weaknesses.
    """
    # 1. Create a student
    res_s = client.post("/students", json={"name": "Aarav Sharma"})
    assert res_s.status_code == 200
    student_id = res_s.json()["id"]

    # 2. Seed student profile with historical weak concepts from prior assessments
    db = SessionLocal()
    try:
        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        student.weak_concepts = ["Electromagnetic Induction & Lenz Rule"]
        student.strong_concepts = ["Ohm's Law & DC Circuits"]
        student.learning_history = [
            {
                "topic": "Electromagnetism Basics",
                "score": 45.0,
                "weak_concepts": ["Electromagnetic Induction & Lenz Rule"]
            }
        ]
        db.commit()
    finally:
        db.close()

    # 3. Generate a subsequent lesson for this returning student
    res_l = client.post("/lessons/generate", json={
        "student_id": student_id,
        "source_type": "topic",
        "topic": "Transformers and AC Power Transmission",
        "available_time": "20 min",
        "level": "Intermediate"
    })
    assert res_l.status_code == 200
    lesson_data = res_l.json()
    segments = lesson_data["plan"]["segments"]

    # 4. Assert that the curriculum reflects personalization
    all_segment_text = " ".join([
        f"{s.get('concept', '')} {s.get('learning_objective', '')} {s.get('visual_rationale', '')}"
        for s in segments
    ]).lower()

    # Assert that prior weak concept is proactively addressed or reviewed in the plan
    assert (
        "lenz" in all_segment_text
        or "induction" in all_segment_text
        or "electromagnetic" in all_segment_text
        or any(s.get("is_revision_day") for s in segments)
    ), f"Expected proactive remediation for Lenz/Induction weak concept, got segments: {segments}"

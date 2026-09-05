import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_section18_flashcards_study_notes_and_concept_map():
    """Verify Section 18 Advanced Features: Flashcards, Automatic Study Notes, and Concept Map APIs"""
    # 1. Setup Student, Profile, and Lesson
    student_res = client.get("/students/default")
    assert student_res.status_code == 200
    student_id = student_res.json()["id"]

    profile_res = client.post("/learner-profile", json={
        "student_id": student_id,
        "level": "Beginner",
        "available_time": "20 min",
        "language": "English"
    })
    assert profile_res.status_code == 200
    profile_id = profile_res.json()["id"]

    lesson_res = client.post("/lessons/generate", json={
        "student_id": student_id,
        "source_type": "topic",
        "topic": "Newton's Laws of Motion",
        "profile_id": profile_id
    })
    assert lesson_res.status_code == 200
    lesson_id = lesson_res.json()["id"]

    # 2. Create Session
    session_res = client.post("/session/create", json={"lesson_id": lesson_id})
    assert session_res.status_code == 200
    session_id = session_res.json()["id"]

    # 3. Test Flashcards API (Section 18)
    fc_res = client.get(f"/session/{session_id}/flashcards")
    assert fc_res.status_code == 200
    fc_data = fc_res.json()
    assert fc_data["session_id"] == session_id
    assert len(fc_data["flashcards"]) >= 1
    first_card = fc_data["flashcards"][0]
    assert "front" in first_card
    assert "back" in first_card
    assert len(first_card["front"]) > 0
    assert len(first_card["back"]) > 0

    # 4. Test Automatic Study Notes API (Section 18)
    notes_res = client.get(f"/session/{session_id}/study-notes")
    assert notes_res.status_code == 200
    notes_data = notes_res.json()
    assert notes_data["session_id"] == session_id
    assert "summary_markdown" in notes_data
    assert len(notes_data["key_takeaways"]) >= 1
    assert len(notes_data["formulas_or_definitions"]) >= 1
    assert len(notes_data["recommended_actions"]) >= 1

    # 5. Test Concept Map API (Section 18)
    map_res = client.get(f"/session/{session_id}/concept-map")
    assert map_res.status_code == 200
    map_data = map_res.json()
    assert map_data["session_id"] == session_id
    assert len(map_data["nodes"]) >= 2
    assert len(map_data["edges"]) >= 1
    assert map_data["nodes"][0]["id"] == "root"

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_m3_end_to_end_assessment_report_and_profile_evolution():
    """Verify final assessment, server-side grading, learning report, and next topic prediction"""
    # 1. Setup profile and lesson
    student_res = client.get("/students/default")
    student_id = student_res.json()["id"]

    profile_res = client.post("/learner-profile", json={
        "student_id": student_id,
        "level": "Beginner",
        "available_time": "5 min"
    })
    profile_id = profile_res.json()["id"]

    lesson_res = client.post("/lessons/generate", json={
        "student_id": student_id,
        "source_type": "topic",
        "topic": "Machine Learning: Linear Regression",
        "profile_id": profile_id
    })
    lesson_id = lesson_res.json()["id"]

    # 2. Start session and advance to completion
    session_res = client.post("/session/create", json={"lesson_id": lesson_id})
    session_id = session_res.json()["id"]

    # Advance segment
    client.post(f"/session/{session_id}/next-segment")
    # Advance to assessment
    client.post(f"/session/{session_id}/next-segment")

    # 3. Generate Assessment
    exam_res = client.post(f"/session/{session_id}/assessment/generate")
    assert exam_res.status_code == 200
    exam = exam_res.json()
    assert len(exam["questions"]) >= 2

    # 4. Submit answers (answering half correct)
    answers = {}
    for i, q in enumerate(exam["questions"]):
        if i % 2 == 0:
            answers[q["id"]] = q.get("answer_key", "Correct Answer")
        else:
            answers[q["id"]] = "Wrong Answer Choice"

    submit_res = client.post(f"/session/{session_id}/assessment/submit", json={"answers": answers})
    assert submit_res.status_code == 200
    completed_exam = submit_res.json()
    assert completed_exam["status"] == "completed"
    assert completed_exam["score"] is not None

    # 5. Verify Learning Report
    report_res = client.get(f"/session/{session_id}/report")
    assert report_res.status_code == 200
    report = report_res.json()
    assert "score" in report
    assert "strong_areas" in report
    assert "weak_areas" in report
    assert report["recommended_next_topic"] is not None
    assert len(report["detailed_breakdown"]) == len(exam["questions"])

    # 6. Verify Student Profile updated
    profile_updated = client.get(f"/students/{student_id}/profile").json()
    assert len(profile_updated["learning_history"]) >= 1
    assert any(h["lesson_id"] == lesson_id for h in profile_updated["learning_history"])

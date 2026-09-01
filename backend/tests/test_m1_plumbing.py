import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_01_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Bharat Academix" in data["app"]

def _create_student_and_learner_profile():
    # Get or create default student
    res = client.get("/students/default")
    assert res.status_code == 200
    student = res.json()
    assert "id" in student
    student_id = student["id"]
    
    # Update student profile
    student_id = res.json()["id"]

    res = client.post("/learner-profile", json={
        "student_id": student_id,
        "level": "Beginner",
        "existing_knowledge": "Basic circuits",
        "objective": "Exam Prep",
        "style": "Simple",
        "language": "English",
        "available_time": "20 min",
        "depth": "Standard"
    })
    assert res.status_code == 200
    learner_profile = res.json()
    assert learner_profile["level"] == "Beginner"
    assert learner_profile["student_id"] == student_id
    return student_id, learner_profile["id"]

def test_02_student_and_learner_profile():
    _create_student_and_learner_profile()

def test_03_material_upload_and_analysis():
    student_id, profile_id = _create_student_and_learner_profile()
    
    # Simulate text upload
    files = {"file": ("physics_notes.txt", b"Ohm's law states that current is directly proportional to voltage and inversely proportional to resistance.", "text/plain")}
    data = {"student_id": student_id}
    res = client.post("/materials/upload", files=files, data=data)
    assert res.status_code == 200
    material = res.json()
    assert material["filename"] == "physics_notes.txt"
    assert material["status"] == "uploaded"
    material_id = material["id"]
    
    # Start analysis
    res = client.post("/content/analyze", json={"material_id": material_id, "profile_id": profile_id})
    assert res.status_code == 200
    job_id = res.json()["job_id"]
    
    # Check status
    res = client.get(f"/content/analyze/{job_id}/status")
    assert res.status_code == 200
    assert res.json()["status"] in ["extracting", "chunking", "embedding", "indexing", "ready"]

def test_04_lesson_planning_and_session_lifecycle():
    student_id, profile_id = _create_student_and_learner_profile()
    
    # Generate Lesson
    res = client.post("/lessons/generate", json={
        "student_id": student_id,
        "source_type": "topic",
        "topic": "Ohm's Law & Circuit Analysis",
        "profile_id": profile_id
    })
    assert res.status_code == 200
    lesson = res.json()
    lesson_id = lesson["id"]
    assert lesson["status"] == "draft"
    assert len(lesson["plan"]["segments"]) >= 1
    
    # Update lesson plan (toggle skip)
    segments = lesson["plan"]["segments"]
    segments[0]["skipped"] = False
    res = client.patch(f"/lessons/{lesson_id}", json={
        "segments": segments,
        "status": "active"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "active"
    
    # Create Session
    res = client.post("/session/create", json={"lesson_id": lesson_id})
    assert res.status_code == 200
    session = res.json()
    session_id = session["id"]
    assert session["status"] == "in_progress"
    assert session["current_segment"] is not None
    assert session["current_question"] is not None
    
    # Test Explain Again
    res = client.post(f"/session/{session_id}/explain-again", json={})
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    assert "new_explanation" in res.json()
    
    # Test Answer Submission (Wrong answer to verify misconception trigger)
    question_id = session["current_question"]["id"]
    res = client.post(f"/session/{session_id}/answer", json={
        "question_id": question_id,
        "response_text": "Alternative non-physical statement",
        "is_unsure": False
    })
    assert res.status_code == 200
    eval_data = res.json()
    assert eval_data["correct"] is False
    assert eval_data["misconception"] is not None
    assert eval_data["adaptation_decision"] is not None
    
    # Advance to next segment
    res = client.post(f"/session/{session_id}/next-segment")
    assert res.status_code == 200
    
    # Generate and Submit Assessment
    res = client.post(f"/session/{session_id}/assessment/generate")
    assert res.status_code == 200
    assessment = res.json()
    assert len(assessment["questions"]) > 0
    
    # Submit answers
    answers = {q["id"]: q["answer_key"] for q in assessment["questions"]}
    res = client.post(f"/session/{session_id}/assessment/submit", json={"answers": answers})
    assert res.status_code == 200
    assessment_res = res.json()
    assert assessment_res["score"] == 100.0
    assert assessment_res["status"] == "completed"
    
    # Get Learning Report
    res = client.get(f"/session/{session_id}/report")
    assert res.status_code == 200
    report = res.json()
    assert report["score"] == 100.0
    assert len(report["strong_areas"]) > 0
    assert "recommended_next_topic" in report
    
    # Verify student profile history updated
    res = client.get(f"/students/{student_id}/profile")
    assert res.status_code == 200
    profile_data = res.json()
    assert len(profile_data["learning_history"]) >= 1

def test_05_video_status_job():
    res = client.post("/video/generate", json={"segment_id": "seg_123", "provider": "fallback_svg"})
    assert res.status_code == 200
    job_id = res.json()["job_id"]
    
    res = client.get(f"/video/{job_id}/status")
    assert res.status_code == 200
    assert res.json()["status"] == "ready"

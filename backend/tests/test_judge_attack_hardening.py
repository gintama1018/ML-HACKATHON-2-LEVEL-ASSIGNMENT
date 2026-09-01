import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.video_generator import video_generator
import imageio_ffmpeg
import subprocess

client = TestClient(app)

def test_attack_01_tts_failure_audio_muxing_resilience():
    """
    Judge Attack Test 1:
    Tests real speech audio generation (Tier 1/2/3) without NameError, verifying
    speech synthesis audio file size, duration, and full video container muxing.
    """
    # 1. Directly test speech audio synthesis
    sample_text = "Welcome students. Today we explore the fundamental principles of quantum wave mechanics."
    audio_test_path = "./static/videos/test_direct_speech.mp3"
    duration = video_generator.generate_audio(sample_text, "English", audio_test_path)
    
    assert duration > 2.0, f"Speech duration too short: {duration}s"
    assert os.path.exists(audio_test_path), f"Audio file not generated at {audio_test_path}"
    audio_size = os.path.getsize(audio_test_path)
    assert audio_size > 10000, f"Audio file too small ({audio_size} bytes), speech generation failed"

    # 2. Test full video generation with fallback & multi-scene audio muxing
    result = video_generator.generate_lesson_video(
        session_id="judge_attack_video_test",
        lesson_topic="Quantum Tunneling & Wavefunctions",
        segments=[
            {
                "concept": "Wavefunction Probability Density",
                "visual_type": "chemistry",
                "explanation_text": "The particle wave nature allows non-zero transmission probabilities across finite energy barriers."
            }
        ],
        language="English"
    )

    assert result["status"] == "ready"
    assert result["video_url"] == "/static/videos/judge_attack_video_test.mp4"
    assert os.path.exists(result["file_path"])
    assert result["file_size_bytes"] > 50000  # Non-trivial MP4 size

    # Verify container has both video and audio streams using ffprobe
    probe = imageio_ffmpeg.get_ffmpeg_exe()
    res = subprocess.run([probe, "-i", result["file_path"]], stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    stderr_output = res.stderr
    assert "Video: h264" in stderr_output or "Stream" in stderr_output
    assert "Audio:" in stderr_output
    assert result["total_duration_seconds"] > 3.0

def test_attack_02_universal_remediation_on_non_physics_topic():
    """
    Judge Attack Test 2:
    Wrong answer on a non-physics topic (e.g. Photosynthesis) must NEVER
    generate hardcoded Ohm's Law, electricity, or mechanical physics jargon during fallback.
    """
    # 1. Create student and learner profile for Biology
    res = client.post("/students", json={"name": "Biology Student"})
    assert res.status_code == 200
    student_id = res.json()["id"]

    res = client.post("/learner-profile", json={
        "student_id": student_id,
        "level": "Beginner",
        "existing_knowledge": "Basic plant cells",
        "objective": "Understand chloroplast light reactions",
        "language": "English",
        "style": "Visual & structured",
        "available_time": "20 min",
        "depth": "Standard"
    })
    assert res.status_code == 200
    profile_id = res.json()["id"]

    # 2. Generate Biology Lesson
    res = client.post("/lessons/generate", json={
        "student_id": student_id,
        "source_type": "topic",
        "topic": "Photosynthesis & Light Reactions",
        "profile_id": profile_id
    })
    assert res.status_code == 200
    lesson = res.json()
    assert lesson["status"] == "draft"
    lesson_id = lesson["id"]

    # 3. Create Session
    res = client.post("/session/create", json={"lesson_id": lesson_id})
    assert res.status_code == 200
    session = res.json()
    session_id = session["id"]

    # 4. Submit deliberate wrong answer
    q_id = session["current_question"]["id"]
    res = client.post(f"/session/{session_id}/answer", json={
        "question_id": q_id,
        "response_text": "Plants absorb moonlight to convert nitrogen into plastic.",
        "is_unsure": False
    })
    assert res.status_code == 200
    eval_res = res.json()
    assert eval_res["correct"] is False
    assert eval_res["adaptation_decision"] is not None

    # Crucial Verification: NO Ohm's Law / voltage / mechanical physics jargon in biology remediation
    expl = str(eval_res["adaptation_decision"].get("new_explanation", "")).lower()
    rationale = str(eval_res["adaptation_decision"].get("pedagogical_rationale", "")).lower()
    assert "ohm" not in expl
    assert "voltage" not in expl
    assert "water pipe" not in rationale
    assert "driving potential" not in expl
    assert "opposing constraints" not in expl

def test_attack_03_learning_path_curriculum_progression():
    """
    Judge Attack Test 3 (REQ-67/68):
    Create a persistent multi-module curriculum, verify initial lock gating,
    verify that attempting to complete a locked module returns 403 Forbidden,
    and verify that scoring >= 70% on the active module unlocks the next sequential module.
    """
    # 1. Generate 4-module Learning Path
    res = client.post("/learning-paths/generate", json={
        "topic": "Deep Learning & Neural Networks",
        "target_level": "Intermediate",
        "total_modules": 4
    })
    assert res.status_code == 200
    path = res.json()
    path_id = path["id"]
    modules = path["modules"]
    assert len(modules) == 4
    assert path["status"] == "in_progress"

    # Module 1 should be unlocked, Modules 2-4 locked
    assert modules[0]["is_unlocked"] is True
    assert modules[0]["is_completed"] is False
    assert modules[1]["is_unlocked"] is False
    assert modules[2]["is_unlocked"] is False

    # 2. Attack Attempt: Try to complete locked Module 3 directly -> Must return 403
    mod3_id = modules[2]["id"]
    res_attack = client.patch(f"/learning-paths/{path_id}/modules/{mod3_id}", json={
        "is_completed": True,
        "score": 95.0
    })
    assert res_attack.status_code == 403
    assert "locked" in res_attack.json()["detail"].lower()

    # 3. Legitimate Completion: Complete Module 1 with score 88.0%
    mod1_id = modules[0]["id"]
    res = client.patch(f"/learning-paths/{path_id}/modules/{mod1_id}", json={
        "is_completed": True,
        "score": 88.0
    })
    assert res.status_code == 200
    updated_mod1 = res.json()
    assert updated_mod1["is_completed"] is True
    assert updated_mod1["score"] == 88.0

    # 4. Retrieve Path: Module 2 must now be unlocked
    res = client.get(f"/learning-paths/{path_id}")
    assert res.status_code == 200
    updated_path = res.json()
    assert updated_path["current_module_index"] == 1
    assert updated_path["modules"][1]["is_unlocked"] is True

def test_attack_04_multilingual_patch_preserves_session_state():
    """
    Judge Attack Test 4 (REQ-38/39):
    Mid-session language patch switches teaching language while preserving
    session step, difficulty, and student response history.
    """
    res = client.post("/students", json={"name": "Multilingual Student"})
    student_id = res.json()["id"]

    res = client.post("/lessons/generate", json={
        "student_id": student_id,
        "source_type": "topic",
        "topic": "Gravitational Potential Energy",
        "language": "English"
    })
    lesson_id = res.json()["id"]

    res = client.post("/session/create", json={"lesson_id": lesson_id})
    session_id = res.json()["id"]
    assert res.json()["language"] == "English"

    # Switch session language to Hindi
    res = client.patch(f"/session/{session_id}", json={"language": "Hindi"})
    assert res.status_code == 200
    patched_session = res.json()
    assert patched_session["language"] == "Hindi"
    assert patched_session["status"] == "in_progress"
    assert patched_session["current_step"] == 0

    # Request Explain Again in Hindi
    res = client.post(f"/session/{session_id}/explain-again", json={})
    assert res.status_code == 200
    hindi_expl = res.json()["new_explanation"]
    assert len(hindi_expl) > 20

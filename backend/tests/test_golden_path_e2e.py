import os
import sys

# Force UTF-8 encoding for stdout on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base

client = TestClient(app)

def setup_module():
    # Fresh database tables
    Base.metadata.create_all(bind=engine)

def test_golden_path_e2e_journey():
    print("\n" + "="*80)
    print(">> RUNNING OFFICIAL BHARAT ACADEMIX GOLDEN PATH INTEGRATION TEST")
    print("="*80)

    # 1. Get Default Student Profile
    print("\n--- STEP 1: Student Profile & Personalization ---")
    resp = client.get("/students/default")
    assert resp.status_code == 200, f"Failed to get student: {resp.text}"
    student = resp.json()
    student_id = student["id"]
    print(f"[OK] Active Student: {student['name']} (ID: {student_id})")

    # 2. Generate Lesson with Full 7-Parameter Personalization
    print("\n--- STEP 2: Lesson Generation with Full 7 Parameters ---")
    lesson_payload = {
        "student_id": student_id,
        "source_type": "topic",
        "topic": "Ohm's Law & Circuit Analysis",
        "level": "Intermediate",
        "existing_knowledge": "Basic concepts of charge and electrical potential",
        "objective": "Exam Preparation",
        "language": "English",
        "style": "Simple & example-heavy",
        "available_time": "20 min",
        "depth": "Standard"
    }
    resp = client.post("/lessons/generate", json=lesson_payload)
    assert resp.status_code == 200, f"Lesson generation failed: {resp.text}"
    lesson = resp.json()
    lesson_id = lesson["id"]
    assert lesson["plan"] is not None
    assert len(lesson["plan"]["segments"]) >= 2
    print(f"[OK] Generated Lesson Plan for: '{lesson['topic']}' with {len(lesson['plan']['segments'])} segments")

    # 3. Create Live Teaching Session
    print("\n--- STEP 3: Launch Teaching Session ---")
    resp = client.post("/session/create", json={"lesson_id": lesson_id})
    assert resp.status_code == 200, f"Session create failed: {resp.text}"
    session = resp.json()
    session_id = session["id"]
    assert session["status"] == "in_progress"
    assert session["current_difficulty"] == "Intermediate"
    assert session["current_segment"] is not None
    assert session["current_question"] is not None
    print(f"[OK] Session Launched: {session_id} | Initial Level: {session['current_difficulty']}")
    print(f"[OK] First Concept: {session['current_segment']['concept']}")
    print(f"[OK] Visual Mode: {session['current_segment']['visual_type']}")

    # 4. TASK 1: Real AI-Generated Educational Video Pipeline
    print("\n--- STEP 4: [TASK 1] AI Educational Video Generation (.MP4) ---")
    video_payload = {
        "session_id": session_id,
        "lesson_topic": "Ohm's Law & Circuit Analysis",
        "language": "English"
    }
    v_resp = client.post("/video/generate", json=video_payload)
    assert v_resp.status_code == 200, f"Video generation failed: {v_resp.text}"
    v_data = v_resp.json()
    assert v_data["status"] == "ready"
    assert v_data["video_url"] is not None
    assert v_data["total_duration_seconds"] > 5.0
    assert len(v_data["scenes"]) >= 3

    # Verify physical MP4 exists on disk
    mp4_disk_path = os.path.join(".", v_data["video_url"].lstrip("/"))
    assert os.path.exists(mp4_disk_path), f"Rendered MP4 file not found at {mp4_disk_path}"
    file_bytes = os.path.getsize(mp4_disk_path)
    assert file_bytes > 5000, f"Rendered MP4 file too small ({file_bytes} bytes)"
    print(f"[OK] Real MP4 Video Rendered: {v_data['video_url']}")
    print(f"[OK] File Size: {file_bytes / 1024:.1f} KB | Duration: {v_data['total_duration_seconds']}s")
    print(f"[OK] Storyboard Scenes ({len(v_data['scenes'])}):")
    for sc in v_data["scenes"]:
        print(f"   * Scene {sc['scene_index']}: '{sc['title']}' ({sc['start_time']}s - {sc['end_time']}s) [{sc['visual_type']}]")

    # 5. TASK 2: Adaptive Remediation Loop (Wrong Answer -> Misconception -> Reteach -> Followup)
    print("\n--- STEP 5: [TASK 2] Adaptive Misconception Remediation Loop ---")
    q1 = session["current_question"]
    print(f"Initial Question: {q1['prompt']}")
    
    # Intentionally submit incorrect answer
    wrong_answer_payload = {
        "question_id": q1["id"],
        "response_text": "Current increases when resistance increases because electrons accelerate through the circuit.",
        "is_unsure": False
    }
    ans_resp = client.post(f"/session/{session_id}/answer", json=wrong_answer_payload)
    assert ans_resp.status_code == 200
    eval1 = ans_resp.json()
    assert eval1["correct"] is False, "Wrong answer should not be marked correct"
    assert eval1["misconception"] is not None, "Misconception must be diagnosed"
    assert eval1["new_explanation"] is not None, "Alternative analogy must be generated"
    assert eval1["new_question"] is not None, "Adaptive follow-up question must be generated and persisted"
    
    misc_text = eval1["misconception"] if isinstance(eval1["misconception"], str) else eval1["misconception"].get("description")
    print(f"[OK] Misconception Detected: {misc_text}")
    print(f"[OK] Alternative Mental Model: \"{eval1['new_explanation'][:100]}...\"")
    
    followup_q = eval1["new_question"]
    print(f"[OK] Adaptive Follow-up Generated: {followup_q['prompt']}")

    # Solve the Adaptive Follow-up Question Correctly
    correct_followup_payload = {
        "question_id": followup_q["id"],
        "response_text": followup_q.get("answer_key", "Current is directly proportional to voltage and inversely proportional to resistance."),
        "is_unsure": False
    }
    ans_resp2 = client.post(f"/session/{session_id}/answer", json=correct_followup_payload)
    assert ans_resp2.status_code == 200
    eval2 = ans_resp2.json()
    assert eval2["correct"] is True
    print(f"[OK] Follow-up Solved Correctly! Mastery Confirmed: {eval2['feedback']}")

    # 6. Stateful Difficulty Step-Up
    print("\n--- STEP 6: Stateful Difficulty Adaptation ---")
    # Another correct answer triggers difficulty step-up
    ans_resp3 = client.post(f"/session/{session_id}/answer", json=correct_followup_payload)
    eval3 = ans_resp3.json()
    assert eval3["current_difficulty"] == "Advanced"
    print(f"[OK] Performance-Driven Difficulty Adapted to: Level {eval3['current_difficulty']}")

    # 7. Contextual Free-Form Doubt Asking ("Ask the Teacher")
    print("\n--- STEP 7: [TASK 2] Context-Aware Student Doubt Asking ---")
    doubt_payload = {
        "question": "Why does current decrease when resistance increases in a closed circuit?"
    }
    doubt_resp = client.post(f"/session/{session_id}/ask", json=doubt_payload)
    assert doubt_resp.status_code == 200
    doubt_data = doubt_resp.json()
    assert len(doubt_data["answer"]) > 20
    assert len(doubt_data["voice_script"]) > 10
    print(f"[OK] Student Asked: '{doubt_payload['question']}'")
    print(f"[OK] Teacher Spoken Response: \"{doubt_data['voice_script']}\"")
    print(f"[OK] Grounded: {doubt_data['is_grounded']} (Confidence: {doubt_data['confidence']})")

    # 8. Advance to Final Assessment
    print("\n--- STEP 8: Transition to Final Assessment ---")
    adv_resp = client.post(f"/session/{session_id}/next-segment")
    adv_resp = client.post(f"/session/{session_id}/next-segment")
    adv_resp = client.post(f"/session/{session_id}/next-segment")
    
    sess_status = client.get(f"/session/{session_id}").json()
    assert sess_status["status"] == "assessment"
    print("[OK] All Lesson Segments Completed -> Transistioned to Assessment")

    # 9. Generate & Submit Final Assessment
    print("\n--- STEP 9: Final Multi-Concept Assessment & Semantic Grading ---")
    exam_resp = client.post(f"/session/{session_id}/assessment/generate")
    assert exam_resp.status_code == 200
    exam = exam_resp.json()
    assert len(exam["questions"]) >= 2
    print(f"[OK] Generated Final Exam with {len(exam['questions'])} Questions")

    # Submit Answers
    answers = {}
    for q in exam["questions"]:
        answers[q["id"]] = q["answer_key"]
    
    sub_resp = client.post(f"/session/{session_id}/assessment/submit", json={"answers": answers})
    assert sub_resp.status_code == 200
    graded_exam = sub_resp.json()
    assert graded_exam["score"] >= 80.0
    print(f"[OK] Assessment Graded! Score: {graded_exam['score']}%")

    # 10. Verify Diagnostic Learning Report & History Update
    print("\n--- STEP 10: Diagnostic Learning Report & Progress Tracking ---")
    rep_resp = client.get(f"/report/{session_id}")
    assert rep_resp.status_code == 200
    report = rep_resp.json()
    assert report["score"] >= 80.0
    assert len(report["strong_areas"]) > 0
    assert report["recommended_next_topic"] is not None
    print(f"[OK] Diagnostic Report Generated:")
    print(f"   * Score: {report['score']}% ({report['correct_answers']}/{report['total_questions']})")
    print(f"   * Mastered Concepts: {report['strong_areas']}")
    print(f"   * Next Recommended Curriculum: {report['recommended_next_topic']}")

    print("\n" + "="*80)
    print(">> GOLDEN PATH INTEGRATION TEST PASSED 100% SUCCESSFULLY!")
    print("="*80 + "\n")

if __name__ == "__main__":
    setup_module()
    test_golden_path_e2e_journey()

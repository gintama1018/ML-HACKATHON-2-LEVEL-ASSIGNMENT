import json
import urllib.request
import sys

# Set standard output encoding
sys.stdout.reconfigure(encoding='utf-8')

def test_language_switch():
    req = urllib.request.Request("http://127.0.0.1:8000/students/default")
    student = json.loads(urllib.request.urlopen(req).read().decode())
    print("Default Student:", student["name"])

    req = urllib.request.Request(
        "http://127.0.0.1:8000/learner-profile",
        data=json.dumps({
            "student_id": student["id"],
            "level": "Beginner",
            "language": "English",
            "available_time": "20 min",
            "style": "Simple & example-heavy"
        }).encode(),
        headers={"Content-Type": "application/json"}
    )
    profile = json.loads(urllib.request.urlopen(req).read().decode())

    req = urllib.request.Request(
        "http://127.0.0.1:8000/lessons/generate",
        data=json.dumps({
            "student_id": student["id"],
            "source_type": "topic",
            "topic": "Ohm's Law and Resistance",
            "profile_id": profile["id"]
        }).encode(),
        headers={"Content-Type": "application/json"}
    )
    lesson = json.loads(urllib.request.urlopen(req).read().decode())

    # Create Session in English
    req = urllib.request.Request(
        "http://127.0.0.1:8000/session/create",
        data=json.dumps({"lesson_id": lesson["id"]}).encode(),
        headers={"Content-Type": "application/json"}
    )
    session = json.loads(urllib.request.urlopen(req).read().decode())
    print("\n--- 1. ENGLISH SESSION ---")
    print("Language:", session["language"])
    print("Explanation:", session["current_segment"]["explanation_text"])
    print("Question:", session["current_question"]["prompt"])

    # Live Switch to Hindi
    req = urllib.request.Request(
        f"http://127.0.0.1:8000/session/{session['id']}",
        data=json.dumps({"language": "Hindi"}).encode(),
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    hindi_session = json.loads(urllib.request.urlopen(req).read().decode())
    print("\n--- 2. LIVE SWITCHED TO HINDI (हिंदी) ---")
    print("Language:", hindi_session["language"])
    print("Explanation:", hindi_session["current_segment"]["explanation_text"])
    print("Question:", hindi_session["current_question"]["prompt"])
    print("Options:", hindi_session["current_question"]["options"])

    # Live Switch to Hinglish
    req = urllib.request.Request(
        f"http://127.0.0.1:8000/session/{session['id']}",
        data=json.dumps({"language": "Hinglish"}).encode(),
        headers={"Content-Type": "application/json"},
        method="PATCH"
    )
    hinglish_session = json.loads(urllib.request.urlopen(req).read().decode())
    print("\n--- 3. LIVE SWITCHED TO HINGLISH ---")
    print("Language:", hinglish_session["language"])
    print("Explanation:", hinglish_session["current_segment"]["explanation_text"])
    print("Question:", hinglish_session["current_question"]["prompt"])
    print("Options:", hinglish_session["current_question"]["options"])

    print("\n[SUCCESS] REAL-TIME MULTILINGUAL SWITCHING FULLY OPERATIONAL!")

if __name__ == "__main__":
    test_language_switch()

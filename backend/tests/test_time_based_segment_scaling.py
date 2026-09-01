import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_time_based_segment_scaling():
    """
    FIX 2 Verification:
    Asserts that lesson planning dynamically scales curriculum depth and segment counts
    based on the student's available time allocation:
    - 5 min: 1-2 segments
    - 20 min: 3-5 segments
    - 60 min: 6-10 segments
    - 7-day plan: 7 daily progression modules with day numbers and spaced revision
    Asserts segment counts are strictly monotonically non-decreasing (5 min <= 20 min <= 60 min).
    """
    topic = "Quantum Mechanics & Wave-Particle Duality"

    # 1. Test 5-minute allocation
    res_5 = client.post("/lessons/generate", json={
        "source_type": "topic",
        "topic": topic,
        "available_time": "5 min",
        "level": "Intermediate",
        "objective": "Quick Overview"
    })
    assert res_5.status_code == 200
    lesson_5 = res_5.json()
    segments_5 = lesson_5["plan"]["segments"]
    count_5 = len(segments_5)
    assert 1 <= count_5 <= 2, f"Expected 1-2 segments for 5 min, got {count_5}"

    # 2. Test 20-minute allocation
    res_20 = client.post("/lessons/generate", json={
        "source_type": "topic",
        "topic": topic,
        "available_time": "20 min",
        "level": "Intermediate",
        "objective": "Concept Mastery"
    })
    assert res_20.status_code == 200
    lesson_20 = res_20.json()
    segments_20 = lesson_20["plan"]["segments"]
    count_20 = len(segments_20)
    assert 3 <= count_20 <= 5, f"Expected 3-5 segments for 20 min, got {count_20}"

    # 3. Test 60-minute allocation
    res_60 = client.post("/lessons/generate", json={
        "source_type": "topic",
        "topic": topic,
        "available_time": "60 min",
        "level": "Advanced",
        "objective": "Deep Dive Mastery"
    })
    assert res_60.status_code == 200
    lesson_60 = res_60.json()
    segments_60 = lesson_60["plan"]["segments"]
    count_60 = len(segments_60)
    assert 6 <= count_60 <= 10, f"Expected 6-10 segments for 60 min, got {count_60}"

    # 4. Verify Monotonic Scaling Property
    assert count_5 <= count_20 <= count_60, f"Segment scaling is not monotonic: {count_5} <= {count_20} <= {count_60}"

    # 5. Test 7-Day Multi-Day Plan
    res_7d = client.post("/lessons/generate", json={
        "source_type": "topic",
        "topic": topic,
        "available_time": "7-day plan",
        "level": "Intermediate",
        "objective": "Long-Term Retention"
    })
    assert res_7d.status_code == 200
    lesson_7d = res_7d.json()
    segments_7d = lesson_7d["plan"]["segments"]
    assert len(segments_7d) == 7, f"Expected 7 day-modules for 7-day plan, got {len(segments_7d)}"
    
    day_numbers = [s.get("day_number") for s in segments_7d]
    assert day_numbers == [1, 2, 3, 4, 5, 6, 7], f"Expected days 1..7, got {day_numbers}"
    
    # Check for spaced revision day
    has_revision = any(s.get("is_revision_day") for s in segments_7d)
    assert has_revision, "7-day curriculum must include designated spaced revision module(s)"

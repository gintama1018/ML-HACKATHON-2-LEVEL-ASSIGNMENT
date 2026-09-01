import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.routers.video import VIDEO_JOBS

client = TestClient(app)

def test_video_job_survives_restart():
    """
    FIX 5 Verification:
    Asserts that VideoJob records are persisted to SQLite database and can be queried
    by job_id even after clearing all in-memory cache dicts (simulating server crash/restart).
    """
    # 1. Create a video job
    with patch("app.services.video_generator.video_generator.generate_audio", return_value=3.0), \
         patch("imageio_ffmpeg.write_frames") as mock_write, \
         patch("subprocess.run"):
        
        mock_writer = mock_write.return_value
        mock_writer.send.return_value = None

        res = client.post("/video/generate", json={
            "lesson_topic": "Thermodynamics & Heat Cycles",
            "language": "English"
        })
        assert res.status_code == 200
        job_data = res.json()
        job_id = job_data["job_id"]
        assert job_id is not None
        assert job_data["status"] == "ready"

    # 2. Simulate complete backend worker crash / memory wipe
    VIDEO_JOBS.clear()
    assert len(VIDEO_JOBS) == 0, "In-memory cache must be empty"

    # 3. Retrieve video job status using a fresh GET request
    res_status = client.get(f"/video/{job_id}/status")
    assert res_status.status_code == 200, f"Failed to retrieve video job from DB after restart: {res_status.text}"
    db_retrieved = res_status.json()

    assert db_retrieved["job_id"] == job_id
    assert db_retrieved["status"] == "ready"
    assert db_retrieved["mode"] == "ai_video_engine"
    assert len(db_retrieved["scenes"]) >= 3
    assert db_retrieved["total_duration_seconds"] > 0

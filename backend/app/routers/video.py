import uuid
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from app.schemas import VideoGenerateRequest, VideoJobStatusResponse

router = APIRouter(tags=["Video & Avatar"])

VIDEO_JOBS: Dict[str, Dict[str, Any]] = {}

@router.post("/video/generate", response_model=VideoJobStatusResponse)
def generate_video(payload: VideoGenerateRequest):
    job_id = str(uuid.uuid4())
    VIDEO_JOBS[job_id] = {
        "job_id": job_id,
        "segment_id": payload.segment_id,
        "status": "ready",
        "video_url": None,
        "audio_url": None,
        "captions": [],
        "mode": payload.provider or "fallback_svg"
    }
    return VideoJobStatusResponse(**VIDEO_JOBS[job_id])

@router.get("/video/{job_id}/status", response_model=VideoJobStatusResponse)
def get_video_status(job_id: str):
    if job_id not in VIDEO_JOBS:
        raise HTTPException(status_code=404, detail="Video job not found")
    return VideoJobStatusResponse(**VIDEO_JOBS[job_id])

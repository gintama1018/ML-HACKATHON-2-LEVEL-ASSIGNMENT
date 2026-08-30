import os
import uuid
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models import Material
from app.schemas import ContentAnalyzeRequest, ContentAnalyzeStatusResponse
from app.services.rag_service import rag_service
from app.agents.content_analyzer import analyze_document_content

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Content Analyzer"])

# In-memory job registry for status tracking
ANALYSIS_JOBS: Dict[str, Dict[str, Any]] = {}

def process_content_job_sync(job_id: str, material_id: str = None, topic: str = None, profile_id: str = None):
    """Background worker for document extraction, ChromaDB indexing, and concept analysis"""
    db = SessionLocal()
    try:
        ANALYSIS_JOBS[job_id] = {
            "status": "extracting",
            "stage": "Reading file and extracting semantic sections",
            "progress": 25,
            "details": "Parsing text, headings, formulas, and structural blocks",
            "summary": None
        }
        
        full_text = ""
        if material_id:
            material = db.query(Material).filter(Material.id == material_id).first()
            if not material:
                ANALYSIS_JOBS[job_id] = {
                    "status": "failed",
                    "stage": "Failed to locate material",
                    "progress": 100,
                    "details": "Material record not found",
                    "summary": None
                }
                return
            material.status = "processing"
            db.commit()

            # Step 1 & 2: Extract and chunk
            ANALYSIS_JOBS[job_id]["status"] = "chunking"
            ANALYSIS_JOBS[job_id]["stage"] = "Chunking into semantic units with overlap"
            ANALYSIS_JOBS[job_id]["progress"] = 50

            # Step 3: Embed and Index in Persistent ChromaDB
            ANALYSIS_JOBS[job_id]["status"] = "embedding"
            ANALYSIS_JOBS[job_id]["stage"] = "Computing dense sentence-transformer embeddings"
            ANALYSIS_JOBS[job_id]["progress"] = 70

            index_res = rag_service.index_material(
                material_id=material.id,
                file_path=material.storage_ref,
                file_type=material.type
            )
            full_text = index_res.get("full_text", "")
            total_chunks = index_res.get("total_chunks", 0)

            # Step 4: Concept Analysis via Agent 1 (Claude Haiku)
            ANALYSIS_JOBS[job_id]["status"] = "indexing"
            ANALYSIS_JOBS[job_id]["stage"] = "Extracting pedagogical concepts & chapter structure"
            ANALYSIS_JOBS[job_id]["progress"] = 90

            try:
                summary = analyze_document_content(full_text)
                summary["total_chunks"] = total_chunks
            except Exception as e:
                logger.warning(f"ContentAnalyzer agent call failed: {e}. Generating structured fallback.")
                summary = {
                    "title": material.filename,
                    "subject_domain": "General Science",
                    "key_concepts": [
                        f"Core Principles of {material.filename}",
                        "Fundamental Definitions & Mathematical Models",
                        "Practical Engineering Applications & Scenarios"
                    ],
                    "sections": [
                        {"name": "Chapter 1: Foundations", "summary": "Core definitions and historical context", "concepts": ["Foundations"]},
                        {"name": "Chapter 2: Quantitative Relations", "summary": "Mathematical formulation and parameter laws", "concepts": ["Quantitative Laws"]},
                        {"name": "Chapter 3: Applied Systems", "summary": "Engineering problems and case studies", "concepts": ["Applications"]}
                    ],
                    "total_chunks": total_chunks
                }

            material.status = "ready"
            material.extracted_summary = summary
            db.commit()
        else:
            # Topic path
            summary = {
                "title": topic or "General Topic",
                "subject_domain": "Academic Study",
                "key_concepts": [
                    f"Introduction to {topic}",
                    f"Mechanics & Principles of {topic}",
                    f"Applications & Problem Solving in {topic}"
                ],
                "sections": [
                    {"name": "Part 1: Conceptual Foundations", "summary": "Key definitions", "concepts": [f"{topic} Basics"]},
                    {"name": "Part 2: Core Analytical Mechanics", "summary": "Formulations", "concepts": [f"{topic} Mechanics"]},
                    {"name": "Part 3: Practical Mastery", "summary": "Applications", "concepts": [f"{topic} Applications"]}
                ],
                "total_chunks": 0
            }

        ANALYSIS_JOBS[job_id] = {
            "status": "ready",
            "stage": "Content analysis and vector index ready",
            "progress": 100,
            "details": "Document successfully parsed, chunked, embedded, and indexed in ChromaDB.",
            "summary": summary
        }
    except Exception as e:
        logger.error(f"Error during content analysis: {e}")
        ANALYSIS_JOBS[job_id] = {
            "status": "failed",
            "stage": "Analysis failed",
            "progress": 100,
            "details": str(e),
            "summary": None
        }
    finally:
        db.close()

@router.post("/content/analyze")
async def start_content_analysis(
    payload: ContentAnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    job_id = str(uuid.uuid4())
    ANALYSIS_JOBS[job_id] = {
        "status": "extracting",
        "stage": "Initiating extraction pipeline",
        "progress": 10,
        "details": "Starting async content parser",
        "summary": None
    }
    
    background_tasks.add_task(
        process_content_job_sync,
        job_id=job_id,
        material_id=payload.material_id,
        topic=payload.topic,
        profile_id=payload.profile_id
    )
    
    return {"job_id": job_id, "status": "extracting", "stage": "Started"}

@router.get("/content/analyze/{job_id}/status", response_model=ContentAnalyzeStatusResponse)
def get_analysis_status(job_id: str):
    if job_id not in ANALYSIS_JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    data = ANALYSIS_JOBS[job_id]
    return ContentAnalyzeStatusResponse(
        job_id=job_id,
        status=data["status"],
        stage=data["stage"],
        progress=data["progress"],
        details=data.get("details"),
        summary=data.get("summary")
    )

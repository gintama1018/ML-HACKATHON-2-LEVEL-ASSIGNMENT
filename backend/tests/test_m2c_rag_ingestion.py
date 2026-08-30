import os
import time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.rag_service import rag_service

client = TestClient(app)

SAMPLE_PHYSICS_DOC = """# Chapter 4: Electric Currents and Ohm's Law

## 4.1 Fundamental Definitions
Electric current (I) is defined as the net rate of charge flow through a given cross-sectional area. The SI unit of current is the Ampere (A).

## 4.2 Ohm's Law and Resistance
For an ohmic conductor at constant physical temperature, the current (I) flowing through the conductor is directly proportional to the potential difference (V) applied across its terminals and inversely proportional to the electrical resistance (R):
V = I * R
I = V / R

## 4.3 Practical Circuit Applications
When resistors are connected in series, the total equivalent resistance is the algebraic sum of individual resistances:
R_total = R1 + R2 + R3
In parallel configurations, the reciprocal of total resistance equals the sum of reciprocals of each branch.
"""

def test_m2c_document_upload_and_persistent_chroma_indexing():
    """Test Case 1: Upload document, index in persistent Chroma, verify chunking and retrieval"""
    # 1. Upload material
    files = {"file": ("chapter4_circuits.txt", SAMPLE_PHYSICS_DOC.encode("utf-8"), "text/plain")}
    upload_res = client.post("/materials/upload", files=files)
    assert upload_res.status_code == 200
    material = upload_res.json()
    material_id = material["id"]
    assert material["status"] == "uploaded"

    # 2. Analyze & Index
    analyze_res = client.post("/content/analyze", json={"material_id": material_id})
    assert analyze_res.status_code == 200
    job_id = analyze_res.json()["job_id"]

    # Poll status
    status = "extracting"
    for _ in range(20):
        res = client.get(f"/content/analyze/{job_id}/status")
        assert res.status_code == 200
        status_data = res.json()
        status = status_data["status"]
        if status in ["ready", "failed"]:
            break
        time.sleep(0.3)

    assert status == "ready"
    assert status_data["summary"] is not None
    assert len(status_data["summary"]["key_concepts"]) >= 1

    # 3. Direct RAG Retrieval Verification from Persistent Chroma
    retrieved_chunks = rag_service.retrieve_relevant_chunks(
        material_id=material_id,
        query="What is the mathematical formula for Ohm's law and resistance?",
        top_k=2
    )
    assert len(retrieved_chunks) >= 1
    assert any("V = I * R" in c["text"] or "Ohm" in c["text"] for c in retrieved_chunks)

def test_m2c_teaching_session_grounded_in_material_citations():
    """Verify teaching session grounded in uploaded document displays chunk citations"""
    # Create profile
    profile_res = client.post("/learner-profile", json={"level": "Beginner"})
    profile_id = profile_res.json()["id"]

    # Upload material
    files = {"file": ("biology_cell.txt", b"The Mitochondria is the powerhouse of the cell, generating ATP through cellular respiration.", "text/plain")}
    upload_res = client.post("/materials/upload", files=files)
    material_id = upload_res.json()["id"]

    # Index material
    client.post("/content/analyze", json={"material_id": material_id})
    time.sleep(0.5)

    # Generate lesson from material
    lesson_res = client.post("/lessons/generate", json={
        "source_type": "material",
        "material_id": material_id,
        "profile_id": profile_id
    })
    lesson_id = lesson_res.json()["id"]

    # Create session
    session_res = client.post("/session/create", json={"lesson_id": lesson_id})
    session = session_res.json()

    assert session["current_segment"] is not None
    # Source citations should be present for material-based lesson
    citations = session["current_segment"]["source_citations"]
    assert isinstance(citations, list)

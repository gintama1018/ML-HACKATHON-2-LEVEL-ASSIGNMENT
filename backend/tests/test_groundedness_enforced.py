import pytest
from app.services.rag_service import rag_service

def test_groundedness_verification_and_enforcement():
    """
    FIX 4 Verification:
    Asserts that verify_groundedness evaluates factual alignment between generated explanations
    and source document chunks:
    1. Grounded response sharing vocabulary & definitions with source material scores >= 0.70 (is_grounded=True).
    2. Hallucinated / completely off-topic response sharing zero overlap scores < 0.70 (is_grounded=False).
    """
    source_chunks = [
        {
            "chunk_index": 1,
            "page_number": 3,
            "section_ref": "Ohm's Law Fundamentals",
            "text": "Ohm's law states that the current passing through a conductor between two points is directly proportional to the voltage across the two points and inversely proportional to the electrical resistance of the conductor. The governing equation is V = I * R."
        },
        {
            "chunk_index": 2,
            "page_number": 4,
            "section_ref": "Resistance & Units",
            "text": "Resistance is measured in ohms. It represents the opposition to the flow of electric current through an electrical circuit."
        }
    ]

    # 1. Test genuine grounded explanation
    grounded_explanation = (
        "In this lesson on Ohm's law, we learn that electric current is directly proportional "
        "to the voltage applied across a conductor and inversely proportional to electrical resistance. "
        "The fundamental governing equation is V = I * R, where resistance represents the opposition to current flow."
    )
    result_grounded = rag_service.verify_groundedness(grounded_explanation, source_chunks)
    assert result_grounded["is_grounded"] is True
    assert result_grounded["groundedness_score"] >= 0.70
    assert result_grounded["overlap_ratio"] > 0.4
    assert result_grounded["matched_concepts_count"] >= 5
    assert len(result_grounded["verified_claims"]) >= 1
    assert len(result_grounded["citation_sources"]) >= 1
    assert result_grounded["citation_sources"][0]["section_ref"] in ["Ohm's Law Fundamentals", "Resistance & Units"]

    # 2. Test hallucinated explanation (Zero overlap)
    hallucinated_explanation = (
        "Ancient Egyptian pyramids were constructed during the Old Kingdom using limestone blocks "
        "transported along the Nile river by royal barge crews and seasonal agricultural laborers."
    )
    result_hallucinated = rag_service.verify_groundedness(hallucinated_explanation, source_chunks)
    assert result_hallucinated["is_grounded"] is False
    assert result_hallucinated["groundedness_score"] < 0.70
    assert result_hallucinated["overlap_ratio"] == 0.0
    assert result_hallucinated["matched_concepts_count"] == 0
    assert len(result_hallucinated["verified_claims"]) == 0
    assert len(result_hallucinated["unsupported_claims"]) >= 1

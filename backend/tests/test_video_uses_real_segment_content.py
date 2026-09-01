import pytest
from unittest.mock import patch
from app.services.video_generator import video_generator

def test_video_uses_real_segment_content():
    """
    FIX 1 Verification Test 1:
    Asserts that generate_lesson_video consumes the actual explanation_text and concepts
    passed in `segments`, ensuring the deterministic fingerprint appears in the scene scripts.
    """
    fingerprint = "ZEBRA_MARKER_7f3a_PROVING_REAL_SEGMENT_CONSUMPTION"
    custom_segments = [
        {
            "concept": "Biological Chloroplast Function",
            "explanation_text": f"Chloroplasts absorb photons to initiate photolysis. {fingerprint}",
            "visual_type": "biology",
            "visual_spec": {"title": "Chloroplast Membrane"}
        },
        {
            "concept": "Calvin Cycle Carbon Fixation",
            "explanation_text": "RuBisCO enzymes catalyze the fixation of carbon dioxide into carbohydrates.",
            "visual_type": "chemistry",
            "visual_spec": {"title": "Calvin Cycle Reactions"}
        }
    ]

    captured_scripts = []

    def mock_generate_audio(text, language, output_path):
        captured_scripts.append(text)
        return 3.0

    # Mock audio generation and frame writing to test video generator pipeline logic cleanly
    with patch.object(video_generator, 'generate_audio', side_effect=mock_generate_audio), \
         patch('imageio_ffmpeg.write_frames') as mock_write, \
         patch('subprocess.run'):
        
        mock_writer = mock_write.return_value
        mock_writer.send.return_value = None

        result = video_generator.generate_lesson_video(
            session_id="test_segment_fingerprint",
            lesson_topic="Photosynthesis & Cellular Botany",
            segments=custom_segments,
            language="English"
        )

        assert result["status"] == "ready"
        assert len(result["scenes"]) == 2
        
        # Verify the deterministic fingerprint was passed to the speech engine
        all_spoken_text = " ".join(captured_scripts)
        assert fingerprint in all_spoken_text, f"Fingerprint '{fingerprint}' was NOT found in spoken narration!"
        
        # Verify scene titles reflect the real concepts
        assert "Biological Chloroplast Function" in result["scenes"][0]["title"]
        assert "Calvin Cycle Carbon Fixation" in result["scenes"][1]["title"]

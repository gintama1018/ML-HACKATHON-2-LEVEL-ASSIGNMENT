import pytest
from unittest.mock import patch
from app.services.video_generator import video_generator

def test_video_language_matches_session():
    """
    FIX 1 Verification Test 2:
    Asserts that Hindi/Devanagari segments are rendered directly into the video audio narration
    and scene subtitles without defaulting or silently reverting to hardcoded English sentences.
    """
    hindi_explanation_1 = "प्रकाश संश्लेषण में पौधे सूर्य के प्रकाश का उपयोग करके ग्लूकोज और ऑक्सीजन का निर्माण करते हैं।"
    hindi_explanation_2 = "यह प्रक्रिया मुख्य रूप से पत्तियों के क्लोरोप्लास्ट में होती है।"
    
    hindi_segments = [
        {
            "concept": "प्रकाश संश्लेषण की मूल अवधारणा",
            "explanation_text": hindi_explanation_1,
            "visual_type": "biology",
            "visual_spec": {"title": "पौधों में पोषण"}
        },
        {
            "concept": "क्लोरोप्लास्ट की संरचना",
            "explanation_text": hindi_explanation_2,
            "visual_type": "biology",
            "visual_spec": {"title": "क्लोरोप्लास्ट"}
        }
    ]

    captured_scripts = []
    captured_languages = []

    def mock_generate_audio(text, language, output_path):
        captured_scripts.append(text)
        captured_languages.append(language)
        return 3.5

    with patch.object(video_generator, 'generate_audio', side_effect=mock_generate_audio), \
         patch('imageio_ffmpeg.write_frames') as mock_write, \
         patch('subprocess.run'):
        
        mock_writer = mock_write.return_value
        mock_writer.send.return_value = None

        result = video_generator.generate_lesson_video(
            session_id="test_hindi_video",
            lesson_topic="प्रकाश संश्लेषण",
            segments=hindi_segments,
            language="Hindi"
        )

        assert len(captured_scripts) == 2
        assert hindi_explanation_1 in captured_scripts[0]
        assert hindi_explanation_2 in captured_scripts[1]
        assert all(lang == "Hindi" for lang in captured_languages)
        
        # Verify no English physics boilerplate was injected
        all_narrated = " ".join(captured_scripts)
        assert "Welcome to Bharat Academix" not in all_narrated
        assert "boundary conditions" not in all_narrated

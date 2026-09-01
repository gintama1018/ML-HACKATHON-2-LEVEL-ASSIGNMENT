import pytest
from unittest.mock import patch
from app.services.video_generator import video_generator

def test_video_nonstem_topic_no_physics_leak():
    """
    FIX 1 Verification Test 3:
    Asserts that generating video for a History/Humanities topic (both with real segments
    and via fallback) does NOT leak hardcoded STEM/physics jargon like 'boundary conditions',
    'equilibrium', 'governing formulation', or 'rate-of-change factors'.
    """
    history_topic = "French Revolution causes and timeline"
    history_segments = [
        {
            "concept": "Socio-Economic Inequality & The Three Estates",
            "explanation_text": "The taxation burden fell disproportionately on the Third Estate, leading to widespread famine and fiscal crisis in 18th century France.",
            "visual_type": "timeline",
            "visual_spec": {"title": "Three Estates Model"}
        },
        {
            "concept": "The Storming of the Bastille & Declaration of Rights",
            "explanation_text": "In July 1789, Parisian citizens captured the Bastille fortress, marking the collapse of absolute monarchy and birth of popular sovereignty.",
            "visual_type": "timeline",
            "visual_spec": {"title": "Bastille Timeline"}
        }
    ]

    captured_scripts = []

    def mock_generate_audio(text, language, output_path):
        captured_scripts.append(text)
        return 3.0

    with patch.object(video_generator, 'generate_audio', side_effect=mock_generate_audio), \
         patch('imageio_ffmpeg.write_frames') as mock_write, \
         patch('subprocess.run'):
        
        mock_writer = mock_write.return_value
        mock_writer.send.return_value = None

        # 1. Test with explicit segments
        result_with_segs = video_generator.generate_lesson_video(
            session_id="test_history_segs",
            lesson_topic=history_topic,
            segments=history_segments,
            language="English"
        )
        
        # 2. Test with empty segments (fallback path)
        result_fallback = video_generator.generate_lesson_video(
            session_id="test_history_fallback",
            lesson_topic=history_topic,
            segments=[],
            language="English"
        )

        banned_phrases = [
            "boundary conditions",
            "dynamic rates of change",
            "governing formulation",
            "rate-of-change factors",
            "static equilibrium",
            "units and boundary limits"
        ]

        all_text = " ".join(captured_scripts).lower()
        for phrase in banned_phrases:
            assert phrase not in all_text, f"Banned physics phrase '{phrase}' leaked into History lesson video!"

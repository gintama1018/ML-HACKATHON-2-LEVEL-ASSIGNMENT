import pytest
from unittest.mock import patch
from app.services.video_generator import video_generator

def test_video_scene_count_matches_segment_count():
    """
    FIX 1 Verification Test 4:
    Asserts that the number of rendered scenes in the returned video metadata
    strictly matches the number of input segments passed to the video generator.
    """
    for count in [1, 2, 3, 5]:
        test_segments = [
            {
                "concept": f"Sub-topic Module {i+1}",
                "explanation_text": f"Detailed educational explanation for module {i+1}.",
                "visual_type": "diagram" if i % 2 == 0 else "chart",
                "visual_spec": {"title": f"Module {i+1}"}
            }
            for i in range(count)
        ]

        with patch.object(video_generator, 'generate_audio', return_value=2.5), \
             patch('imageio_ffmpeg.write_frames') as mock_write, \
             patch('subprocess.run'):
            
            mock_writer = mock_write.return_value
            mock_writer.send.return_value = None

            result = video_generator.generate_lesson_video(
                session_id=f"test_count_{count}",
                lesson_topic="Dynamic Systems Analysis",
                segments=test_segments,
                language="English"
            )

            assert len(result["scenes"]) == count, f"Expected {count} scenes, got {len(result['scenes'])}"
            for i, scene in enumerate(result["scenes"]):
                assert scene["scene_index"] == i + 1
                assert f"Sub-topic Module {i+1}" in scene["title"]

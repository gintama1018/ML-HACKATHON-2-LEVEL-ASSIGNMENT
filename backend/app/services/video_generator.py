import os
import math
import tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg
from gtts import gTTS

class VideoGeneratorService:
    def __init__(self, output_dir: str = "./static/videos"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        self.fps = 12
        self.width = 1280
        self.height = 720

    def _get_font(self, size: int = 18, bold: bool = False):
        try:
            # Try standard Windows / Linux fonts
            font_names = ["arialbd.ttf" if bold else "arial.ttf", "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf", "calibri.ttf"]
            for fn in font_names:
                try:
                    return ImageFont.truetype(fn, size)
                except Exception:
                    continue
            return ImageFont.load_default()
        except Exception:
            return ImageFont.load_default()

    def generate_audio(self, text: str, language: str, output_path: str) -> float:
        """Generate real TTS audio file and return duration in seconds."""
        clean_text = text.replace("*", "").replace("#", "").replace("`", "").strip()
        if not clean_text:
            clean_text = "Let us explore this fundamental educational concept together."

        # Map language to gTTS parameters
        lang_code = "en"
        tld = "co.in"
        if "hindi" in language.lower() or language.lower() == "hi":
            lang_code = "hi"
            tld = "com"
        elif "hinglish" in language.lower():
            lang_code = "en"
            tld = "co.in"

        try:
            tts = gTTS(text=clean_text[:400], lang=lang_code, tld=tld, slow=False)
            tts.save(output_path)
        except Exception as e:
            print(f"gTTS error: {e}, using fallback audio generator")
            # Create a short silent/tone audio file via ffmpeg as fallback
            cmd = f'ffmpeg -y -f lavfi -i "sine=frequency=440:duration=4" -c:a aac "{output_path}"'
            os.system(cmd)

        # Determine audio duration via imageio_ffmpeg
        try:
            duration = 4.0
            meta = imageio_ffmpeg.read_frames(output_path)
            meta_gen = meta.__iter__()
            # Read first header info
            probe = imageio_ffmpeg.get_ffmpeg_exe()
            import subprocess
            res = subprocess.run([probe, "-i", output_path], stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
            for line in res.stderr.splitlines():
                if "Duration:" in line:
                    time_str = line.split("Duration:")[1].split(",")[0].strip()
                    parts = time_str.split(":")
                    duration = float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                    break
            return max(3.0, duration)
        except Exception:
            # Estimate roughly ~130 words per min
            words = len(clean_text.split())
            return max(3.5, (words / 130.0) * 60.0)

    def _draw_avatar(self, draw: ImageDraw.ImageDraw, is_speaking: bool, frame_idx: int):
        """Draw animated teacher avatar with suit, glasses, and mouth sync."""
        cx, cy = 230, 310
        # Background avatar card
        draw.rounded_rectangle([40, 100, 420, 580], radius=16, fill=(15, 23, 42), outline=(51, 65, 85), width=2)
        
        # Avatar status badge
        status_text = "• AI TEACHER (SPEAKING)" if is_speaking else "• AI TEACHER (LISTENING)"
        badge_color = (16, 185, 129) if is_speaking else (148, 163, 184)
        draw.text((60, 115), status_text, fill=badge_color, font=self._get_font(12, bold=True))

        # Suit / Shoulders
        draw.polygon([(cx - 110, cy + 220), (cx - 70, cy + 100), (cx + 70, cy + 100), (cx + 110, cy + 220)], fill=(30, 41, 59))
        # Shirt V-neck & Emerald Tie
        draw.polygon([(cx - 30, cy + 100), (cx + 30, cy + 100), (cx, cy + 160)], fill=(241, 245, 249))
        draw.polygon([(cx - 10, cy + 115), (cx + 10, cy + 115), (cx, cy + 190)], fill=(16, 185, 129))

        # Neck & Head
        draw.rectangle([cx - 20, cy + 70, cx + 20, cy + 105], fill=(253, 224, 71)) # neck
        draw.ellipse([cx - 65, cy - 70, cx + 65, cy + 70], fill=(254, 240, 138), outline=(234, 179, 8), width=2) # face

        # Hair
        draw.pieslice([cx - 70, cy - 80, cx + 70, cy + 20], 180, 360, fill=(30, 27, 75))

        # Glasses
        draw.rounded_rectangle([cx - 50, cy - 20, cx - 10, cy + 12], radius=4, outline=(79, 70, 229), width=3)
        draw.rounded_rectangle([cx + 10, cy - 20, cx + 50, cy + 12], radius=4, outline=(79, 70, 229), width=3)
        draw.line([(cx - 10, cy - 4), (cx + 10, cy - 4)], fill=(79, 70, 229), width=3)

        # Eyes & Pupils
        draw.ellipse([cx - 35, cy - 10, cx - 25, cy], fill=(15, 23, 42))
        draw.ellipse([cx + 25, cy - 10, cx + 35, cy], fill=(15, 23, 42))

        # Mouth (Animated opening and closing)
        mouth_open = is_speaking and (frame_idx % 4 in [1, 2])
        if mouth_open:
            draw.ellipse([cx - 16, cy + 28, cx + 16, cy + 46], fill=(159, 18, 57))
            draw.line([(cx - 10, cy + 33), (cx + 10, cy + 33)], fill=(255, 255, 255), width=2) # teeth
        else:
            draw.arc([cx - 18, cy + 25, cx + 18, cy + 40], 20, 160, fill=(159, 18, 57), width=3)

        # Subtitle badge on Avatar Card
        draw.rounded_rectangle([60, 520, 400, 560], radius=8, fill=(30, 41, 59))
        draw.text((80, 532), "Bharat Academix • Autonomous Gurukul", fill=(203, 213, 225), font=self._get_font(12))

    def _draw_whiteboard(self, draw: ImageDraw.ImageDraw, visual_type: str, visual_spec: dict, concept: str, frame_idx: int):
        """Draw subject-aware whiteboard with live animations and technical schematics."""
        bx1, by1, bx2, by2 = 450, 100, 1240, 580
        # Whiteboard outer card
        draw.rounded_rectangle([bx1, by1, bx2, by2], radius=16, fill=(15, 23, 42), outline=(51, 65, 85), width=2)

        # Header Toolbar
        draw.rounded_rectangle([bx1 + 1, by1 + 1, bx2 - 1, by1 + 45], radius=16, fill=(30, 41, 59))
        draw.text((bx1 + 20, by1 + 14), f"STAGE: {concept.upper()}", fill=(248, 250, 252), font=self._get_font(14, bold=True))
        
        type_badge = f"[{visual_type.upper()} MODE]"
        draw.text((bx2 - 140, by1 + 14), type_badge, fill=(56, 189, 248), font=self._get_font(12, bold=True))

        # Canvas inner area
        cx1, cy1, cx2, cy2 = bx1 + 20, by1 + 60, bx2 - 20, by2 - 20
        draw.rounded_rectangle([cx1, cy1, cx2, cy2], radius=10, fill=(2, 6, 23), outline=(30, 41, 59), width=1)

        # Content Rendering Based on Visual Type
        if visual_type == "chart":
            # Draw coordinate axes
            ox, oy = cx1 + 80, cy2 - 70
            draw.line([(ox, oy), (cx2 - 60, oy)], fill=(100, 116, 139), width=2) # X axis
            draw.line([(ox, oy), (ox, cy1 + 60)], fill=(100, 116, 139), width=2) # Y axis
            draw.text((cx2 - 140, oy + 10), "Voltage (V) →", fill=(148, 163, 184), font=self._get_font(12))
            draw.text((ox - 70, cy1 + 40), "Current (I)", fill=(148, 163, 184), font=self._get_font(12))

            # Draw Ohm's Law Line (I = V/R)
            px_max = cx2 - 100
            py_max = cy1 + 80
            draw.line([(ox, oy), (px_max, py_max)], fill=(16, 185, 129), width=4)

            # Animated Point
            t = (frame_idx % 24) / 24.0
            cur_x = ox + (px_max - ox) * t
            cur_y = oy + (py_max - oy) * t
            draw.ellipse([cur_x - 6, cur_y - 6, cur_x + 6, cur_y + 6], fill=(56, 189, 248), outline=(255, 255, 255), width=2)
            draw.text((cur_x + 10, cur_y - 15), f"Operating Pt: I={t*5:.1f}A", fill=(56, 189, 248), font=self._get_font(12, bold=True))

            # Formula overlay badge
            draw.rounded_rectangle([cx1 + 40, cy1 + 20, cx1 + 220, cy1 + 60], radius=6, fill=(30, 41, 59))
            draw.text((cx1 + 55, cy1 + 28), "Linear Slope = 1 / R", fill=(251, 191, 36), font=self._get_font(14, bold=True))

        elif visual_type == "diagram":
            # Draw Closed-Loop Electrical Circuit
            rx1, ry1, rx2, ry2 = cx1 + 100, cy1 + 70, cx2 - 100, cy2 - 70
            draw.rectangle([rx1, ry1, rx2, ry2], outline=(56, 189, 248), width=3)

            # Voltage Source (Left)
            draw.rectangle([rx1 - 6, (ry1 + ry2)//2 - 25, rx1 + 6, (ry1 + ry2)//2 + 25], fill=(2, 6, 23))
            draw.line([(rx1 - 15, (ry1 + ry2)//2 - 15), (rx1 + 15, (ry1 + ry2)//2 - 15)], fill=(16, 185, 129), width=5)
            draw.line([(rx1 - 8, (ry1 + ry2)//2 + 15), (rx1 + 8, (ry1 + ry2)//2 + 15)], fill=(16, 185, 129), width=3)
            draw.text((rx1 - 50, (ry1 + ry2)//2 - 10), "+ V -", fill=(16, 185, 129), font=self._get_font(14, bold=True))

            # Resistor (Top)
            mid_x = (rx1 + rx2) // 2
            draw.rectangle([mid_x - 50, ry1 - 8, mid_x + 50, ry1 + 8], fill=(2, 6, 23))
            # Zig-zag resistor lines
            draw.line([(mid_x - 45, ry1), (mid_x - 30, ry1 - 15), (mid_x - 15, ry1 + 15), (mid_x, ry1 - 15), (mid_x + 15, ry1 + 15), (mid_x + 30, ry1 - 15), (mid_x + 45, ry1)], fill=(245, 158, 11), width=3)
            draw.text((mid_x - 35, ry1 - 40), "Resistor (R)", fill=(245, 158, 11), font=self._get_font(13, bold=True))

            # Current Arrow with animated electron pulses
            pulse_offset = (frame_idx * 15) % (rx2 - rx1)
            pulse_x = rx1 + pulse_offset
            draw.ellipse([pulse_x - 4, ry1 - 4, pulse_x + 4, ry1 + 4], fill=(255, 255, 255))
            draw.text((mid_x - 60, ry2 + 20), "→ Directional Current Flow (I) →", fill=(56, 189, 248), font=self._get_font(13, bold=True))

        elif visual_type == "math":
            # Mathematical Derivation Box
            draw.rounded_rectangle([cx1 + 60, cy1 + 40, cx2 - 60, cy2 - 40], radius=8, fill=(15, 23, 42), outline=(79, 70, 229), width=2)
            draw.text((cx1 + 100, cy1 + 70), "MATHEMATICAL FORMULATION", fill=(165, 180, 252), font=self._get_font(14, bold=True))
            
            formula = visual_spec.get("formula", "V = I · R  ⟹  I = V / R")
            draw.text((cx1 + 100, cy1 + 130), formula, fill=(16, 185, 129), font=self._get_font(28, bold=True))
            
            desc = visual_spec.get("derivation_step", "Potential Difference (Volts) equals Current (Amps) × Resistance (Ohms)")
            draw.text((cx1 + 100, cy1 + 200), desc, fill=(203, 213, 225), font=self._get_font(14))

        elif visual_type == "code":
            # Interactive Python IDE Box
            draw.rounded_rectangle([cx1 + 40, cy1 + 30, cx2 - 40, cy2 - 30], radius=8, fill=(15, 23, 42))
            draw.text((cx1 + 60, cy1 + 45), "# Python 3.11 Computational Demonstration", fill=(100, 116, 139), font=self._get_font(13))
            
            code_text = visual_spec.get("code_snippet", "def calculate_current(voltage: float, resistance: float) -> float:\n    return voltage / resistance\n\n# Calculate for 12V supply across 4 Ohm load:\nprint(f'Current = {calculate_current(12, 4)} Amperes')")
            y_offset = cy1 + 80
            for line in code_text.splitlines():
                draw.text((cx1 + 60, y_offset), line, fill=(52, 211, 153), font=self._get_font(13, bold=False))
                y_offset += 25
            
            # Simulated terminal output box
            draw.rounded_rectangle([cx1 + 60, cy2 - 90, cx2 - 60, cy2 - 45], radius=6, fill=(2, 6, 23), outline=(51, 65, 85), width=1)
            draw.text((cx1 + 75, cy2 - 75), "> [Output]: Current = 3.0 Amperes", fill=(56, 189, 248), font=self._get_font(13, bold=True))
        else:
            # Default Conceptual Milestone Canvas
            draw.text((cx1 + 80, cy1 + 80), concept, fill=(255, 255, 255), font=self._get_font(22, bold=True))
            draw.text((cx1 + 80, cy1 + 140), visual_spec.get("description", "Fundamental learning milestone representation"), fill=(203, 213, 225), font=self._get_font(14))

    def _render_frame(self, lesson_topic: str, scene_title: str, scene_idx: int, total_scenes: int, 
                      visual_type: str, visual_spec: dict, subtitle_text: str, is_speaking: bool, 
                      frame_idx: int, elapsed_time_s: float) -> np.ndarray:
        """Render a single 1280x720 RGB frame."""
        img = Image.new("RGB", (self.width, self.height), (2, 6, 23)) # Deep background
        draw = ImageDraw.Draw(img)

        # 1. Top Navbar Header
        draw.rectangle([0, 0, self.width, 65], fill=(15, 23, 42))
        draw.line([(0, 65), (self.width, 65)], fill=(51, 65, 85), width=1)
        
        # Brand
        draw.rounded_rectangle([30, 16, 62, 48], radius=6, fill=(16, 185, 129))
        draw.text((75, 22), "Bharat Academix", fill=(255, 255, 255), font=self._get_font(16, bold=True))
        draw.text((235, 24), "• AI TEACHER VIDEO ENGINE", fill=(148, 163, 184), font=self._get_font(12))

        # Scene Counter Badge
        scene_badge = f"Scene {scene_idx}/{total_scenes}: {scene_title}"
        draw.rounded_rectangle([self.width - 450, 16, self.width - 150, 48], radius=8, fill=(30, 41, 59))
        draw.text((self.width - 435, 24), scene_badge, fill=(251, 191, 36), font=self._get_font(13, bold=True))

        # Time Counter
        mins = int(elapsed_time_s // 60)
        secs = int(elapsed_time_s % 60)
        draw.text((self.width - 120, 24), f"{mins:02d}:{secs:02d}", fill=(203, 213, 225), font=self._get_font(14, bold=True))

        # 2. Left Teacher Avatar Card
        self._draw_avatar(draw, is_speaking, frame_idx)

        # 3. Right Whiteboard Stage
        self._draw_whiteboard(draw, visual_type, visual_spec, scene_title, frame_idx)

        # 4. Bottom Live Subtitle Banner
        draw.rounded_rectangle([40, 600, self.width - 40, 690], radius=12, fill=(15, 23, 42), outline=(51, 65, 85), width=2)
        draw.text((60, 612), "LIVE CAPTIONS", fill=(16, 185, 129), font=self._get_font(11, bold=True))
        
        # Wrap subtitles if long
        wrapped_sub = subtitle_text[:130] + ("..." if len(subtitle_text) > 130 else "")
        draw.text((60, 638), f'"{wrapped_sub}"', fill=(255, 255, 255), font=self._get_font(15, bold=True))

        return np.array(img)

    def generate_lesson_video(self, session_id: str, lesson_topic: str, segments: list, language: str = "English") -> dict:
        """
        Generates a complete, multi-scene educational .mp4 video with synchronized TTS audio,
        animated avatar, technical whiteboard visuals, and subtitle banners.
        """
        output_mp4 = os.path.join(self.output_dir, f"{session_id}.mp4")
        temp_dir = tempfile.mkdtemp()
        
        scene_metadata = []
        scene_video_segments = []
        current_time = 0.0

        # Build 4-5 structured pedagogical scenes from lesson segments
        scenes = []
        # Scene 1: Introduction
        scenes.append({
            "title": f"Introduction to {lesson_topic}",
            "visual_type": "diagram",
            "visual_spec": {"description": f"Overview of {lesson_topic}"},
            "script": f"Welcome to Bharat Academix! Today, we will master {lesson_topic}. We will break down the fundamental intuition, explore real-world mechanics, and verify our understanding step-by-step."
        })

        # Scenes from segments
        for seg in segments[:3]:
            scenes.append({
                "title": seg.get("concept", "Core Intuition"),
                "visual_type": seg.get("visual_type", "chart"),
                "visual_spec": seg.get("visual_spec", {}),
                "script": seg.get("explanation_text", f"Let us understand {seg.get('concept', 'this core principle')}.")
            })

        # Final Scene: Check For Understanding
        scenes.append({
            "title": "Conceptual Mastery Check",
            "visual_type": "math",
            "visual_spec": {"formula": "Test Your Understanding", "derivation_step": "Synthesize the core principles learned in this lesson."},
            "script": f"Great job following along! Now, let us apply our intuition to solve practical questions on {lesson_topic}."
        })

        total_scenes = len(scenes)

        # Generate each scene
        for idx, scene in enumerate(scenes):
            scene_idx = idx + 1
            scene_audio_path = os.path.join(temp_dir, f"scene_{scene_idx}.mp3")
            scene_video_path = os.path.join(temp_dir, f"scene_{scene_idx}.mp4")

            # 1. Synthesize Scene Audio
            duration = self.generate_audio(scene["script"], language, scene_audio_path)
            num_frames = max(12, int(duration * self.fps))

            # 2. Record Scene Metadata
            scene_start = current_time
            scene_end = current_time + duration
            current_time = scene_end

            scene_metadata.append({
                "scene_index": scene_idx,
                "title": scene["title"],
                "start_time": round(scene_start, 2),
                "end_time": round(scene_end, 2),
                "duration_seconds": round(duration, 2),
                "visual_type": scene["visual_type"]
            })

            # 3. Render Visual Frames for Scene
            writer = imageio_ffmpeg.write_frames(
                scene_video_path,
                (self.width, self.height),
                fps=self.fps,
                codec="libx264",
                audio_path=scene_audio_path,
                audio_codec="aac",
                pix_fmt_in="rgb24",
                pix_fmt_out="yuv420p"
            )
            writer.send(None) # Initialize

            for f_idx in range(num_frames):
                elapsed_s = scene_start + (f_idx / self.fps)
                is_speaking = True if f_idx < (num_frames - int(self.fps * 0.5)) else False
                frame_arr = self._render_frame(
                    lesson_topic=lesson_topic,
                    scene_title=scene["title"],
                    scene_idx=scene_idx,
                    total_scenes=total_scenes,
                    visual_type=scene["visual_type"],
                    visual_spec=scene["visual_spec"],
                    subtitle_text=scene["script"],
                    is_speaking=is_speaking,
                    frame_idx=f_idx,
                    elapsed_time_s=elapsed_s
                )
                writer.send(frame_arr)

            writer.close()
            scene_video_segments.append(scene_video_path)

        # 4. Concatenate all scenes into final master MP4 video
        concat_txt = os.path.join(temp_dir, "concat.txt")
        with open(concat_txt, "w") as f:
            for v_path in scene_video_segments:
                # Escape backslashes for ffmpeg concat
                esc_path = v_path.replace("\\", "/")
                f.write(f"file '{esc_path}'\n")

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        import subprocess
        subprocess.run([
            ffmpeg_exe, "-y", "-f", "concat", "-safe", "0",
            "-i", concat_txt, "-c", "copy", output_mp4
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        file_size = os.path.getsize(output_mp4) if os.path.exists(output_mp4) else 0

        return {
            "video_url": f"/static/videos/{session_id}.mp4",
            "file_path": output_mp4,
            "file_size_bytes": file_size,
            "total_duration_seconds": round(current_time, 2),
            "scenes": scene_metadata,
            "status": "ready"
        }

video_generator = VideoGeneratorService()

import os
import re
import math
import tempfile
import subprocess
import logging
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg
from gtts import gTTS

logger = logging.getLogger(__name__)

class VideoGeneratorService:
    def __init__(self, output_dir: str = "./static/videos"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        self.fps = 24
        self.width = 1280
        self.height = 720

    def _get_font(self, size: int = 18, bold: bool = False):
        try:
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
        """
        Multi-tier resilient audio generation with smart sentence chunking:
        Tier 1: Cloud gTTS with sentence chunking & FFmpeg seamless audio concatenation
        Tier 2: Local pyttsx3 speech engine
        Tier 3: Valid emergency MP3 synthesis via libmp3lame
        """
        clean_text = text.replace("*", "").replace("#", "").replace("`", "").strip()
        if not clean_text:
            clean_text = "Let us explore this fundamental educational concept together."

        # Estimate expected duration (~130 words per minute)
        words_count = len(clean_text.split())
        estimated_duration = max(3.5, round((words_count / 130.0) * 60.0, 2))

        # Map language codes
        lang_code = "en"
        tld = "co.in"
        lang_lower = language.lower()
        if "hindi" in lang_lower or lang_lower == "hi":
            lang_code = "hi"
            tld = "com"
        elif "tamil" in lang_lower or lang_lower == "ta":
            lang_code = "ta"
            tld = "co.in"
        elif "bengali" in lang_lower or lang_lower == "bn":
            lang_code = "bn"
            tld = "co.in"
        elif "marathi" in lang_lower or lang_lower == "mr":
            lang_code = "mr"
            tld = "co.in"
        elif "hinglish" in lang_lower:
            lang_code = "en"
            tld = "co.in"

        audio_generated = False

        # Tier 1: gTTS Cloud Synthesis with sentence-level chunking for scripts > 250 chars
        try:
            sentences = [s.strip() for s in re.split(r'(?<=[.!?।\n])\s+', clean_text) if s.strip()]
            if not sentences:
                sentences = [clean_text]

            # Group into chunks under 300 characters
            chunks = []
            cur_chunk = ""
            for s in sentences:
                if len(cur_chunk) + len(s) + 1 <= 300:
                    cur_chunk = f"{cur_chunk} {s}".strip()
                else:
                    if cur_chunk:
                        chunks.append(cur_chunk)
                    cur_chunk = s[:300]
            if cur_chunk:
                chunks.append(cur_chunk)

            if len(chunks) == 1:
                tts = gTTS(text=chunks[0], lang=lang_code, tld=tld, slow=False, timeout=2.5)
                tts.save(output_path)
                if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
                    audio_generated = True
            elif len(chunks) > 1:
                chunk_files = []
                ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
                for i, c in enumerate(chunks):
                    temp_chunk_mp3 = output_path.replace(".mp3", f"_part_{i}.mp3")
                    tts = gTTS(text=c, lang=lang_code, tld=tld, slow=False, timeout=2.5)
                    tts.save(temp_chunk_mp3)
                    if os.path.exists(temp_chunk_mp3) and os.path.getsize(temp_chunk_mp3) > 500:
                        chunk_files.append(temp_chunk_mp3)

                if chunk_files:
                    # Write concat manifest
                    manifest_path = output_path.replace(".mp3", "_concat.txt")
                    with open(manifest_path, "w", encoding="utf-8") as mf:
                        for cf in chunk_files:
                            clean_cf = cf.replace("\\", "/")
                            mf.write(f"file '{clean_cf}'\n")

                    subprocess.run([
                        ffmpeg_exe, "-y", "-f", "concat", "-safe", "0",
                        "-i", manifest_path, "-c", "copy", output_path
                    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

                    if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
                        audio_generated = True

                    # Clean up temporary parts
                    for cf in chunk_files:
                        try:
                            os.remove(cf)
                        except Exception:
                            pass
                    try:
                        os.remove(manifest_path)
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"Tier 1 (gTTS) unavailable: {e}. Attempting local engine.")

        # Tier 2: Local Engine Fallback (pyttsx3)
        if not audio_generated:
            try:
                import pyttsx3
                engine = pyttsx3.init()
                temp_wav = output_path.replace(".mp3", ".wav")
                engine.save_to_file(clean_text, temp_wav)
                engine.runAndWait()
                if os.path.exists(temp_wav) and os.path.getsize(temp_wav) > 1000:
                    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
                    subprocess.run([
                        ffmpeg_exe, "-y", "-i", temp_wav,
                        "-c:a", "libmp3lame", "-b:a", "128k", output_path
                    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    if os.path.exists(output_path) and os.path.getsize(output_path) > 500:
                        audio_generated = True
                    try:
                        os.remove(temp_wav)
                    except Exception:
                        pass
            except Exception as e:
                logger.warning(f"Tier 2 (pyttsx3) unavailable: {e}. Engaging Tier 3 valid audio synthesis.")

        # Tier 3: Valid Audio Fallback (libmp3lame sine/silence container)
        if not audio_generated:
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            subprocess.run([
                ffmpeg_exe, "-y", "-f", "lavfi",
                "-i", f"sine=frequency=440:duration={estimated_duration}",
                "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "24000", "-ac", "1",
                output_path
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Accurately probe duration using FFmpeg
        try:
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            res = subprocess.run([ffmpeg_exe, "-i", output_path], stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
            duration = estimated_duration
            for line in res.stderr.splitlines():
                if "Duration:" in line:
                    time_str = line.split("Duration:")[1].split(",")[0].strip()
                    parts = time_str.split(":")
                    duration = float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                    break
            return max(3.0, duration)
        except Exception:
            return estimated_duration

    def _draw_avatar(self, draw: ImageDraw.ImageDraw, is_speaking: bool, frame_idx: int):
        """Draw high-fidelity animated teacher avatar with realistic skin shading, breathing sway, and visemes."""
        # Subtle idle breathing / micro-saccades
        sway_y = int(math.sin(frame_idx / 8.0) * 3)
        sway_x = int(math.cos(frame_idx / 16.0) * 1.5)
        cx, cy = 230 + sway_x, 310 + sway_y

        # Background avatar card
        draw.rounded_rectangle([40, 100, 420, 580], radius=16, fill=(15, 23, 42), outline=(51, 65, 85), width=2)
        
        # Avatar status badge with animated pulse
        status_text = "• AI TEACHER (SPEAKING)" if is_speaking else "• AI TEACHER (LISTENING)"
        badge_color = (16, 185, 129) if is_speaking else (148, 163, 184)
        draw.text((60, 115), status_text, fill=badge_color, font=self._get_font(12, bold=True))

        # Academic Suit & Layered Blazer
        draw.polygon([(cx - 115, cy + 220), (cx - 75, cy + 100), (cx + 75, cy + 100), (cx + 115, cy + 220)], fill=(30, 41, 59))
        draw.polygon([(cx - 75, cy + 100), (cx - 35, cy + 150), (cx - 30, cy + 100)], fill=(45, 55, 75))
        draw.polygon([(cx + 75, cy + 100), (cx + 35, cy + 150), (cx + 30, cy + 100)], fill=(45, 55, 75))
        
        # Shirt Collar & Emerald Tie
        draw.polygon([(cx - 32, cy + 98), (cx + 32, cy + 98), (cx, cy + 165)], fill=(248, 250, 252))
        draw.polygon([(cx - 11, cy + 112), (cx + 11, cy + 112), (cx, cy + 200)], fill=(16, 185, 129))
        draw.polygon([(cx - 8, cy + 112), (cx + 8, cy + 112), (cx, cy + 130)], fill=(4, 120, 87))

        # Neck & Shadow
        draw.rectangle([cx - 20, cy + 65, cx + 20, cy + 105], fill=(226, 185, 150))
        draw.rectangle([cx - 18, cy + 70, cx + 18, cy + 102], fill=(246, 210, 180))

        # Head & Natural Warm Skin
        draw.ellipse([cx - 66, cy - 72, cx + 66, cy + 70], fill=(226, 185, 150))
        draw.ellipse([cx - 64, cy - 70, cx + 64, cy + 68], fill=(246, 210, 180))

        # Hair (Rich dark indigo waves)
        draw.pieslice([cx - 70, cy - 82, cx + 70, cy + 18], 180, 360, fill=(30, 27, 75))
        draw.arc([cx - 68, cy - 80, cx + 68, cy + 10], 200, 340, fill=(49, 46, 129), width=4)

        # Glasses (Modern indigo wireframes)
        draw.rounded_rectangle([cx - 52, cy - 22, cx - 12, cy + 12], radius=5, outline=(79, 70, 229), width=3)
        draw.rounded_rectangle([cx + 12, cy - 22, cx + 52, cy + 12], radius=5, outline=(79, 70, 229), width=3)
        draw.line([(cx - 12, cy - 5), (cx + 12, cy - 5)], fill=(79, 70, 229), width=3)
        # Lens glint
        draw.line([(cx - 45, cy - 16), (cx - 35, cy - 16)], fill=(199, 210, 254), width=1)
        draw.line([(cx + 19, cy - 16), (cx + 29, cy - 16)], fill=(199, 210, 254), width=1)

        # Eyes & Blinking
        is_blinking = (frame_idx % 48 in [45, 46])
        if is_blinking:
            draw.line([(cx - 36, cy - 5), (cx - 24, cy - 5)], fill=(15, 23, 42), width=3)
            draw.line([(cx + 24, cy - 5), (cx + 36, cy - 5)], fill=(15, 23, 42), width=3)
        else:
            # Sclera
            draw.ellipse([cx - 38, cy - 12, cx - 22, cy + 2], fill=(255, 255, 255))
            draw.ellipse([cx + 22, cy - 12, cx + 38, cy + 2], fill=(255, 255, 255))
            # Pupil / Iris
            draw.ellipse([cx - 33, cy - 9, cx - 25, cy - 1], fill=(30, 27, 75))
            draw.ellipse([cx + 27, cy - 9, cx + 35, cy - 1], fill=(30, 27, 75))
            # Catchlight
            draw.ellipse([cx - 31, cy - 8, cx - 28, cy - 5], fill=(255, 255, 255))
            draw.ellipse([cx + 29, cy - 8, cx + 32, cy - 5], fill=(255, 255, 255))

        # Viseme-based Modulated Mouth Animation
        if is_speaking:
            mouth_phase = frame_idx % 8
            if mouth_phase in [1, 2]: # Wide vowel (A / E)
                draw.ellipse([cx - 18, cy + 25, cx + 18, cy + 47], fill=(136, 19, 55), outline=(76, 5, 25), width=1)
                draw.rectangle([cx - 10, cy + 27, cx + 10, cy + 32], fill=(255, 255, 255)) # Teeth
                draw.ellipse([cx - 8, cy + 39, cx + 8, cy + 45], fill=(244, 63, 94)) # Tongue
            elif mouth_phase in [3, 4]: # Open rounded (O / U)
                draw.ellipse([cx - 14, cy + 26, cx + 14, cy + 44], fill=(136, 19, 55), outline=(76, 5, 25), width=1)
                draw.ellipse([cx - 7, cy + 32, cx + 7, cy + 40], fill=(244, 63, 94))
            elif mouth_phase in [5, 6]: # Narrow / Dental (S / T / D)
                draw.ellipse([cx - 12, cy + 28, cx + 12, cy + 38], fill=(136, 19, 55), outline=(76, 5, 25), width=1)
                draw.rectangle([cx - 8, cy + 30, cx + 8, cy + 34], fill=(255, 255, 255))
            else: # Closed / Consonant transition (M / P / B)
                draw.arc([cx - 16, cy + 28, cx + 16, cy + 38], 10, 170, fill=(159, 18, 57), width=3)
        else:
            draw.arc([cx - 16, cy + 28, cx + 16, cy + 38], 15, 165, fill=(159, 18, 57), width=3)

        # Academic Gurukul Badge
        draw.rounded_rectangle([60, 520, 400, 560], radius=8, fill=(30, 41, 59))
        draw.text((80, 532), "Bharat Academix • Autonomous Gurukul", fill=(203, 213, 225), font=self._get_font(12))

    def _draw_whiteboard(self, draw: ImageDraw.ImageDraw, visual_type: str, visual_spec: dict, frame_idx: int, lesson_topic: str = ""):
        """Draw subject-aware technical whiteboard (ML, Mechanics, Induction, Thermo, Circuits, Math, Code, Biology, Chemistry, Timelines)."""
        wx, wy, ww, wh = 460, 100, 780, 480
        topic_lower = (lesson_topic + " " + visual_type + " " + visual_spec.get("title", "")).lower()

        # Whiteboard Background
        draw.rounded_rectangle([wx, wy, wx + ww, wy + wh], radius=16, fill=(255, 255, 255), outline=(203, 213, 225), width=2)
        
        # Whiteboard Header
        draw.rounded_rectangle([wx, wy, wx + ww, wy + 45], radius=16, fill=(248, 250, 252))
        header_text = f"SUBJECT VISUALIZATION • {lesson_topic.upper()}"
        draw.text((wx + 20, wy + 14), header_text[:50], fill=(15, 23, 42), font=self._get_font(14, bold=True))

        # 1. TIMELINE (Explicit visual_type priority)
        if visual_type == "timeline" or ("history" in topic_lower and visual_type != "math" and visual_type != "code"):
            draw.line([(wx + 80, wy + 240), (wx + 700, wy + 240)], fill=(71, 85, 105), width=4)
            milestones = [("1780s", "Context", "Initial Causes"), ("1789", "Outbreak", "Key Turning Point"), ("1793", "Transformation", "Structural Shift"), ("1799+", "Legacy", "Enduring Impact")]
            for i, (period, title, desc) in enumerate(milestones):
                mx = wx + 120 + (i * 180)
                is_active = ((frame_idx // 12) % 4) == i
                draw.ellipse([mx - 14, wy + 226, mx + 14, wy + 254], fill=(16, 185, 129) if is_active else (255, 255, 255), outline=(16, 185, 129) if is_active else (15, 23, 42), width=3)
                draw.rounded_rectangle([mx - 40, wy + 160, mx + 40, wy + 195], radius=6, fill=(15, 23, 42))
                draw.text((mx - 22, wy + 172), period, fill=(255, 255, 255), font=self._get_font(11, bold=True))
                draw.text((mx - 45, wy + 270), title, fill=(15, 23, 42), font=self._get_font(12, bold=True))
            draw.text((wx + 220, wy + 420), "Chronological Evolution & Conceptual Milestones", fill=(15, 23, 42), font=self._get_font(13, bold=True))

        # 2. BIOLOGY CELLULAR & GENETICS
        elif visual_type == "biology" or ("cell" in topic_lower and visual_type != "math" and visual_type != "code"):
            cx, cy = wx + 380, wy + 240
            draw.ellipse([cx - 240, cy - 140, cx + 240, cy + 140], fill=(240, 253, 244), outline=(34, 197, 94), width=3)
            draw.text((cx - 220, cy - 120), "Cell Membrane", fill=(22, 101, 52), font=self._get_font(12, bold=True))
            draw.ellipse([cx - 70, cy - 60, cx + 70, cy + 60], fill=(254, 243, 199), outline=(217, 119, 6), width=3)
            draw.text((cx - 30, cy - 10), "Nucleus", fill=(146, 64, 14), font=self._get_font(14, bold=True))
            draw.ellipse([cx + 120, cy - 40, cx + 180, cy], fill=(254, 226, 226), outline=(220, 38, 38), width=2)
            draw.text((cx + 105, cy + 10), "Mitochondria", fill=(153, 27, 27), font=self._get_font(11, bold=True))
            draw.text((wx + 260, wy + 420), "Structure & Functional Dynamics of Biological Systems", fill=(15, 23, 42), font=self._get_font(13, bold=True))

        # 3. CHEMISTRY REACTION KINETICS
        elif visual_type == "chemistry" or ("reaction" in topic_lower and visual_type != "math" and visual_type != "code"):
            draw.line([(wx + 100, wy + 380), (wx + 700, wy + 380)], fill=(203, 213, 225), width=2)
            points = []
            for px in range(100, 700, 10):
                nx = (px - 100) / 600.0
                py = wy + 380 - int(240 * math.exp(-((nx - 0.4) ** 2) / 0.05))
                points.append((wx + px, py))
            draw.line(points, fill=(79, 70, 229), width=4)
            draw.text((wx + 280, wy + 120), "Activation Energy (Ea)", fill=(79, 70, 229), font=self._get_font(14, bold=True))
            draw.text((wx + 120, wy + 350), "Reactants [A + B]", fill=(16, 185, 129), font=self._get_font(13, bold=True))
            draw.text((wx + 580, wy + 350), "Products [C + D]", fill=(239, 68, 68), font=self._get_font(13, bold=True))

        # 4. PROGRAMMING & CODE
        elif visual_type == "code":
            draw.rounded_rectangle([wx + 40, wy + 80, wx + 740, wy + 420], radius=12, fill=(15, 23, 42))
            draw.text((wx + 60, wy + 100), f"# Python 3.11 Execution Environment • {lesson_topic}", fill=(148, 163, 184), font=self._get_font(13, bold=True))
            draw.text((wx + 60, wy + 140), "def execute_algorithm(input_features, parameters):", fill=(248, 250, 252), font=self._get_font(14))
            draw.text((wx + 90, wy + 180), "processed_data = transform_pipeline(input_features)", fill=(251, 146, 60), font=self._get_font(14))
            draw.text((wx + 90, wy + 220), "model_output = compute_forward_pass(processed_data, parameters)", fill=(56, 189, 248), font=self._get_font(14))
            draw.text((wx + 90, wy + 260), "return evaluate_convergence(model_output)", fill=(56, 189, 248), font=self._get_font(14))
            draw.text((wx + 60, wy + 330), ">>> Process Finished with Exit Code 0 [Success]", fill=(74, 222, 128), font=self._get_font(14, bold=True))

        # 5. CHARTS & DATA
        elif visual_type == "chart":
            if "thermo" in topic_lower or "carnot" in topic_lower or "heat" in topic_lower or "entropy" in topic_lower:
                # Carnot Cycle
                draw.line([(wx + 80, wy + 380), (wx + 680, wy + 380)], fill=(71, 85, 105), width=2)
                draw.line([(wx + 80, wy + 120), (wx + 80, wy + 380)], fill=(71, 85, 105), width=2)
                draw.text((wx + 600, wy + 390), "Volume (V) →", fill=(100, 116, 139), font=self._get_font(12, bold=True))
                draw.text((wx + 20, wy + 110), "Pressure (P)", fill=(100, 116, 139), font=self._get_font(12, bold=True))
                draw.line([(wx + 160, wy + 160), (wx + 360, wy + 200)], fill=(239, 68, 68), width=3)
                draw.line([(wx + 360, wy + 200), (wx + 520, wy + 320)], fill=(245, 158, 11), width=3)
                draw.line([(wx + 520, wy + 320), (wx + 320, wy + 300)], fill=(59, 130, 246), width=3)
                draw.line([(wx + 320, wy + 300), (wx + 160, wy + 160)], fill=(16, 185, 129), width=3)
                draw.text((wx + 200, wy + 420), "Carnot Efficiency: η = 1 - (T_Cold / T_Hot)  •  Maximum Work", fill=(15, 23, 42), font=self._get_font(13, bold=True))
            else:
                # Scatter Plot & Curve
                draw.line([(wx + 60, wy + 380), (wx + 680, wy + 380)], fill=(71, 85, 105), width=2)
                draw.line([(wx + 60, wy + 140), (wx + 60, wy + 380)], fill=(71, 85, 105), width=2)
                draw.text((wx + 600, wy + 390), "Independent Variable (X)", fill=(100, 116, 139), font=self._get_font(11, bold=True))
                draw.text((wx + 20, wy + 120), "Output (Y)", fill=(100, 116, 139), font=self._get_font(11, bold=True))
                pts = [(90, 340), (160, 300), (240, 250), (340, 200), (450, 170), (560, 145)]
                for px, py in pts:
                    draw.ellipse([wx + px - 4, wy + py - 4, wx + px + 4, wy + py + 4], fill=(56, 189, 248), outline=(15, 23, 42), width=1)
                draw.line([(wx + 70, wy + 350), (wx + 600, wy + 140)], fill=(16, 185, 129), width=3)
                draw.text((wx + 220, wy + 420), f"Empirical Observation & Trend Analysis • {lesson_topic}", fill=(15, 23, 42), font=self._get_font(13, bold=True))

        # 6. MATHEMATICAL FORMULATION
        elif visual_type == "math":
            draw.rounded_rectangle([wx + 40, wy + 80, wx + 740, wy + 420], radius=12, fill=(248, 250, 252), outline=(226, 232, 240))
            draw.text((wx + 70, wy + 110), f"MATHEMATICAL FORMULATION • {lesson_topic.upper()}", fill=(71, 85, 105), font=self._get_font(12, bold=True))
            formula_text = visual_spec.get("formula", f"Governing Relationship for {lesson_topic}")
            draw.text((wx + 70, wy + 160), str(formula_text), fill=(15, 23, 42), font=self._get_font(20, bold=True))
            draw.line([(wx + 70, wy + 220), (wx + 710, wy + 220)], fill=(203, 213, 225), width=1)
            draw.text((wx + 70, wy + 250), "• Step 1: Establish foundational governing principles", fill=(30, 41, 59), font=self._get_font(14))
            draw.text((wx + 70, wy + 290), "• Step 2: Differentiate input parameters and operational limits", fill=(30, 41, 59), font=self._get_font(14))
            draw.text((wx + 70, wy + 330), "• Step 3: Verify quantitative response and solution validity", fill=(16, 185, 129), font=self._get_font(14, bold=True))

        # 7. DIAGRAM & PHYSICAL SCHEMATICS
        else:
            if "circuit" in topic_lower or "ohm" in topic_lower or "voltage" in topic_lower:
                draw.ellipse([wx + 100, wy + 200, wx + 180, wy + 280], outline=(16, 185, 129), width=3)
                draw.text((wx + 125, wy + 225), "V", fill=(16, 185, 129), font=self._get_font(24, bold=True))
                draw.text((wx + 115, wy + 295), "Potential (V)", fill=(15, 23, 42), font=self._get_font(13, bold=True))
                draw.line([(wx + 140, wy + 200), (wx + 140, wy + 140), (wx + 640, wy + 140), (wx + 640, wy + 200)], fill=(71, 85, 105), width=3)
                draw.line([(wx + 140, wy + 280), (wx + 140, wy + 340), (wx + 640, wy + 340), (wx + 640, wy + 280)], fill=(71, 85, 105), width=3)
                draw.rectangle([wx + 580, wy + 200, wx + 700, wy + 280], fill=(254, 242, 242), outline=(239, 68, 68), width=3)
                draw.text((wx + 605, wy + 225), "R", fill=(239, 68, 68), font=self._get_font(24, bold=True))
                draw.text((wx + 595, wy + 295), "Resistance (R)", fill=(15, 23, 42), font=self._get_font(13, bold=True))
                offset = (frame_idx * 12) % 400
                curr_x = wx + 180 + offset
                if curr_x < wx + 580:
                    draw.ellipse([curr_x - 5, wy + 135, curr_x + 5, wy + 145], fill=(234, 179, 8))
                draw.text((wx + 340, wy + 115), "Current Flow I = V / R", fill=(16, 185, 129), font=self._get_font(14, bold=True))
            elif "newton" in topic_lower or "force" in topic_lower or "mechanics" in topic_lower:
                draw.polygon([(wx + 80, wy + 380), (wx + 680, wy + 380), (wx + 680, wy + 160)], fill=(241, 245, 249), outline=(71, 85, 105))
                draw.text((wx + 140, wy + 360), "Angle θ = 30°", fill=(71, 85, 105), font=self._get_font(12, bold=True))
                bx, by = wx + 380, wy + 260
                draw.rectangle([bx - 40, by - 30, bx + 40, by + 30], fill=(254, 243, 199), outline=(217, 119, 6), width=3)
                draw.text((bx - 12, by - 10), "M", fill=(146, 64, 14), font=self._get_font(18, bold=True))
                draw.line([(bx, by), (bx, by + 90)], fill=(239, 68, 68), width=3)
                draw.text((bx + 8, by + 70), "m·g", fill=(239, 68, 68), font=self._get_font(13, bold=True))
                draw.line([(bx, by), (bx - 45, by - 70)], fill=(16, 185, 129), width=3)
                draw.text((bx - 110, by - 75), "N = mg cosθ", fill=(16, 185, 129), font=self._get_font(12, bold=True))
                draw.text((wx + 220, wy + 420), "Newton's 2nd Law: Σ F = m · a  •  Dynamic Vector Equilibrium", fill=(15, 23, 42), font=self._get_font(13, bold=True))
            elif "induction" in topic_lower or "magnetic" in topic_lower:
                draw.rounded_rectangle([wx + 80, wy + 160, wx + 180, wy + 320], radius=8, fill=(254, 226, 226), outline=(239, 68, 68), width=3)
                draw.text((wx + 115, wy + 220), "NORTH", fill=(185, 28, 28), font=self._get_font(16, bold=True))
                draw.rounded_rectangle([wx + 580, wy + 160, wx + 680, wy + 320], radius=8, fill=(219, 234, 254), outline=(59, 130, 246), width=3)
                draw.text((wx + 615, wy + 220), "SOUTH", fill=(29, 78, 216), font=self._get_font(16, bold=True))
                for y_off in [190, 240, 290]:
                    draw.line([(wx + 180, wy + y_off), (wx + 580, wy + y_off)], fill=(56, 189, 248), width=2)
                draw.text((wx + 340, wy + 160), "Magnetic Field Lines (B)", fill=(2, 132, 199), font=self._get_font(12, bold=True))
                draw.text((wx + 220, wy + 420), "Faraday-Lenz Law: ℰ = -N · (dΦ_B / dt)", fill=(15, 23, 42), font=self._get_font(13, bold=True))
            else:
                # Generic Conceptual Block Diagram
                draw.rounded_rectangle([wx + 80, wy + 150, wx + 260, wy + 310], radius=12, fill=(240, 249, 255), outline=(56, 189, 248), width=2)
                draw.text((wx + 110, wy + 210), "Inputs / Context", fill=(2, 132, 199), font=self._get_font(14, bold=True))
                draw.line([(wx + 260, wy + 230), (wx + 360, wy + 230)], fill=(71, 85, 105), width=3)
                draw.polygon([(wx + 360, wy + 230), (wx + 345, wy + 220), (wx + 345, wy + 240)], fill=(71, 85, 105))
                draw.rounded_rectangle([wx + 360, wy + 130, wx + 560, wy + 330], radius=12, fill=(254, 243, 199), outline=(245, 158, 11), width=3)
                draw.text((wx + 390, wy + 200), f"Core System\n{lesson_topic[:20]}", fill=(146, 64, 14), font=self._get_font(14, bold=True))
                draw.line([(wx + 560, wy + 230), (wx + 660, wy + 230)], fill=(71, 85, 105), width=3)
                draw.polygon([(wx + 660, wy + 230), (wx + 645, wy + 220), (wx + 645, wy + 240)], fill=(71, 85, 105))
                draw.rounded_rectangle([wx + 660, wy + 150, wx + 750, wy + 310], radius=12, fill=(240, 253, 244), outline=(34, 197, 94), width=2)
                draw.text((wx + 680, wy + 210), "Outcomes", fill=(22, 101, 52), font=self._get_font(14, bold=True))
                draw.text((wx + 220, wy + 420), f"Conceptual Systems Framework • {lesson_topic}", fill=(15, 23, 42), font=self._get_font(13, bold=True))

    def _render_frame(
        self,
        lesson_topic: str,
        scene_title: str,
        scene_idx: int,
        total_scenes: int,
        visual_type: str,
        visual_spec: dict,
        subtitle_text: str,
        is_speaking: bool,
        frame_idx: int,
        elapsed_time_s: float
    ) -> np.ndarray:
        """Render individual 720p video frame composed with avatar, whiteboard, headers, and subtitles."""
        img = Image.new("RGB", (self.width, self.height), color=(241, 245, 249))
        draw = ImageDraw.Draw(img)

        # 1. Top Navbar / Header
        draw.rectangle([0, 0, self.width, 70], fill=(15, 23, 42))
        draw.text((40, 22), "BHARAT ACADEMIX", fill=(255, 255, 255), font=self._get_font(18, bold=True))
        draw.text((230, 25), f"|  {lesson_topic}  •  Scene {scene_idx}/{total_scenes}: {scene_title}", fill=(148, 163, 184), font=self._get_font(14))

        # Time Counter
        mins = int(elapsed_time_s // 60)
        secs = int(elapsed_time_s % 60)
        draw.text((self.width - 160, 24), f"{mins:02d}:{secs:02d} / 720p", fill=(16, 185, 129), font=self._get_font(14, bold=True))

        # 2. Draw Left Column Teacher Avatar
        self._draw_avatar(draw, is_speaking, frame_idx)

        # 3. Draw Right Column Technical Whiteboard
        self._draw_whiteboard(draw, visual_type, visual_spec, frame_idx, lesson_topic=lesson_topic)

        # 4. Live Subtitle Banner at bottom
        draw.rounded_rectangle([40, 600, self.width - 40, 690], radius=12, fill=(15, 23, 42), outline=(51, 65, 85), width=1)
        draw.text((60, 610), "LIVE SUBTITLES (SYNCHRONIZED SPEECH)", fill=(16, 185, 129), font=self._get_font(10, bold=True))
        
        # Word wrap subtitle
        sub_words = subtitle_text.split()
        sub_line1 = " ".join(sub_words[:16])
        sub_line2 = " ".join(sub_words[16:32]) if len(sub_words) > 16 else ""
        draw.text((60, 630), sub_line1, fill=(255, 255, 255), font=self._get_font(14))
        if sub_line2:
            draw.text((60, 655), sub_line2, fill=(203, 213, 225), font=self._get_font(13))

        return np.array(img)

    def generate_lesson_video(
        self,
        session_id: str,
        lesson_topic: str,
        segments: list,
        language: str = "English"
    ) -> dict:
        """
        Generates a complete multi-scene educational MP4 video.
        Ensures valid audio container output and returns full scene metadata.
        """
        output_mp4 = os.path.join(self.output_dir, f"{session_id}.mp4")
        temp_dir = tempfile.mkdtemp()
        
        scene_metadata = []
        scene_video_segments = []
        current_time = 0.0

        # Build in-depth pedagogical scenes directly from real lesson segments
        scenes = []
        
        if segments and len(segments) > 0:
            for idx, seg in enumerate(segments):
                concept_name = seg.get("concept") or f"Concept {idx+1}"
                raw_script = seg.get("spoken_script") or seg.get("explanation_text") or f"Let us examine {concept_name} in detail."
                # For video scenes, use crisp high-yield spoken narration sentences (up to ~350 chars) for optimal video pacing
                if len(raw_script) > 350:
                    sentences = [s.strip() for s in re.split(r'(?<=[.!?।\n])\s+', raw_script) if s.strip()]
                    trimmed_script = ""
                    for s in sentences:
                        if len(trimmed_script) + len(s) + 1 <= 350:
                            trimmed_script = f"{trimmed_script} {s}".strip()
                        else:
                            break
                    scene_script = trimmed_script or raw_script[:350]
                else:
                    scene_script = raw_script

                v_type = seg.get("visual_type") or "diagram"
                v_spec = seg.get("visual_spec") or {}
                
                scenes.append({
                    "title": f"{idx+1}. {concept_name}",
                    "visual_type": v_type,
                    "visual_spec": v_spec,
                    "script": scene_script
                })
        else:
            # Topic-aware fallback when no segments are provided
            is_stem = any(k in lesson_topic.lower() for k in ["physics", "circuit", "ohm", "current", "voltage", "mechanics", "newton", "force", "math", "calculus", "thermo", "chemistry", "quantum"])
            is_history = any(k in lesson_topic.lower() for k in ["history", "revolution", "war", "century", "timeline", "empire", "civilization", "literature"])
            
            if is_history:
                scenes = [
                    {
                        "title": f"1. Historical Context of {lesson_topic}",
                        "visual_type": "timeline",
                        "visual_spec": {"title": f"Context of {lesson_topic}"},
                        "script": f"Welcome to Bharat Academix. Today we examine {lesson_topic}. We begin by exploring the historical context, key social dynamics, and primary factors."
                    },
                    {
                        "title": f"2. Chronological Milestones & Pivotal Events",
                        "visual_type": "timeline",
                        "visual_spec": {"title": "Key Milestones"},
                        "script": f"Next, we trace the chronological development and significant events that shaped {lesson_topic}."
                    },
                    {
                        "title": f"3. Impact, Legacy & Historical Significance",
                        "visual_type": "diagram",
                        "visual_spec": {"title": "Historical Impact"},
                        "script": f"To conclude, let us analyze the enduring legacy and historical transformations resulting from {lesson_topic}."
                    }
                ]
            elif is_stem:
                scenes = [
                    {
                        "title": f"1. Foundations & Intuition of {lesson_topic}",
                        "visual_type": "diagram",
                        "visual_spec": {"description": f"Physical and intuitive model of {lesson_topic}"},
                        "script": f"Welcome to Bharat Academix. Today, we explore {lesson_topic}. In any physical, biological, or computational domain, deep understanding begins with identifying the primary driving forces and how they interact with systemic constraints."
                    },
                    {
                        "title": f"2. Quantitative Mechanics & Derivation",
                        "visual_type": "math",
                        "visual_spec": {"formula": f"Governing Formulation for {lesson_topic}"},
                        "script": f"Now, let us examine the mathematical formulation of {lesson_topic}. Notice how varying the input parameters leads directly to proportional changes in the output state."
                    },
                    {
                        "title": f"3. Practical Applications & Dynamics",
                        "visual_type": "chart",
                        "visual_spec": {"title": f"Analytical Model for {lesson_topic}"},
                        "script": f"Let us apply {lesson_topic} to practical engineering and analytical scenarios. In modern systems, these dynamics allow us to optimize efficiency and predict system behavior."
                    },
                    {
                        "title": f"4. Synthesis & Formative Check",
                        "visual_type": "math",
                        "visual_spec": {"formula": "Conceptual Check & Worked Solution"},
                        "script": f"Remember to verify your units and boundary limits. Excellent work today! You have mastered the core foundations of {lesson_topic}."
                    }
                ]
            else:
                scenes = [
                    {
                        "title": f"1. Overview & Foundations of {lesson_topic}",
                        "visual_type": "diagram",
                        "visual_spec": {"title": f"Overview of {lesson_topic}"},
                        "script": f"Welcome to Bharat Academix. Today we explore {lesson_topic}, establishing core principles and structured understanding."
                    },
                    {
                        "title": f"2. Detailed Analysis of {lesson_topic}",
                        "visual_type": "chart",
                        "visual_spec": {"title": f"Analysis"},
                        "script": f"Let us analyze the key components and relationships that define {lesson_topic} in depth."
                    },
                    {
                        "title": f"3. Summary & Key Takeaways",
                        "visual_type": "diagram",
                        "visual_spec": {"title": "Summary"},
                        "script": f"In summary, we have synthesized the essential concepts of {lesson_topic} for comprehensive mastery."
                    }
                ]

        total_scenes = len(scenes)

        for idx, scene in enumerate(scenes):
            scene_idx = idx + 1
            scene_audio_path = os.path.join(temp_dir, f"scene_{scene_idx}.mp3")
            scene_video_path = os.path.join(temp_dir, f"scene_{scene_idx}.mp4")

            # 1. Synthesize Scene Audio via Multi-Tier Engine
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

            # 3. Render Visual Frames for Scene with audio muxing
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
            writer.send(None)

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

        # 4. Concatenate all scenes into final MP4 video
        concat_txt = os.path.join(temp_dir, "concat.txt")
        with open(concat_txt, "w") as f:
            for v_path in scene_video_segments:
                esc_path = v_path.replace("\\", "/")
                f.write(f"file '{esc_path}'\n")

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
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

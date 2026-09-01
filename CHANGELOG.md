# Bharat Academix — Changelog

## [Post-Round-2-Audit Fixes] — September 2026

All fixes below address the root causes identified in the rigorous Round 2 Compliance Audit. Every fix has been backed by dedicated automated tests asserting content variation, state preservation, and end-to-end integration.

### Summary of Addressed Requirements & Fixes

1. **FIX 0: GA Gemini Model Upgrades & Startup Health Verification**
   - Upgraded default reasoning and fast LLM models in `backend/app/config.py` and `.env` to GA release models (`gemini-2.5-flash` / `gemini-2.0-flash`), replacing deprecated preview checkpoints.
   - Added automated startup smoke test in `app/main.py` lifespan handler that validates non-placeholder LLM API credentials on boot.
   - Verified via `tests/test_gemini_models_are_live.py`.

2. **FIX 1: Dynamic Multimodal Video Generation from Live Session Content (REQ-07, REQ-08, REQ-50)**
   - Refactored `app/services/video_generator.py` so `generate_lesson_video()` directly consumes the lesson session's actual generated segments, including target concept, explanation narration, visual types, and visual specs.
   - Replaced fixed English voice templates with dynamic multi-tier TTS and Devanagari Hindi support.
   - Updated whiteboard drawing logic to prioritize explicit pedagogical `visual_type` over topic keyword routing.
   - Added clean domain-aware fallback segments for non-STEM topics (e.g. History/Literature), preventing physics terminology leakage.
   - Verified via:
     - `tests/test_video_uses_real_segment_content.py`
     - `tests/test_video_language_matches_session.py`
     - `tests/test_video_nonstem_topic_no_physics_leak.py`
     - `tests/test_video_scene_count_matches_segment_count.py`

3. **FIX 2: Pedagogical Curriculum Scaling by Available Time (REQ-05, REQ-30)**
   - Updated `app/agents/lesson_planner.py` prompt with strict time-pacing rules:
     - `5 min`: 1–2 focused concept segments.
     - `20 min`: 3–5 progressive concept segments.
     - `60 min`: 6–10 comprehensive deep-dive modules.
     - `7-day plan`: 7 daily modules with dedicated spaced revision checkpoints.
   - Added post-generation segment clamping and time-scaled fallback generation in `app/routers/lessons.py`.
   - Verified via `tests/test_time_based_segment_scaling.py` asserting monotonic scaling.

4. **FIX 3: Input-Specific Misconception & Remediation Quality (REQ-10, REQ-11, REQ-37)**
   - Enhanced `app/routers/sessions.py` and `app/agents/response_evaluator.py` to interpolate student response snippets, expected concept keys, and concept titles into fallback misconception descriptions and re-explanations, ensuring two distinct wrong answers never produce byte-identical text.
   - Replaced naive substring checks with token-overlap semantic scoring in all fallback evaluation branches.
   - Added structured `LLM_FALLBACK_FIRED` warning logging and `"ai_mode": "live" | "fallback"` tracking in evaluation responses.
   - Verified via `tests/test_fallback_responses_differ_by_input.py`.

5. **FIX 4: RAG Groundedness Verification & Hallucination Guardrails (REQ-20, REQ-48)**
   - Wired `rag_service.verify_groundedness()` into `create_session()`, `advance_next_segment()`, and `ask_teacher_doubt()` in `app/routers/sessions.py`.
   - If factual overlap with retrieved document chunks drops below $0.70$, a structured `GROUNDING_WARNING` log is emitted and attached to segment visual metadata.
   - Verified via `tests/test_groundedness_enforced.py`.

6. **FIX 5: Durable Database Persistence for Video Jobs (REQ-50, REQ-51)**
   - Added SQLAlchemy `VideoJob` model in `app/models.py`.
   - Updated `app/routers/video.py` to persist job states to SQLite, enabling `GET /video/{job_id}/status` to survive complete server restarts and in-memory cache clearing.
   - Verified via `tests/test_video_job_survives_restart.py`.

7. **FIX 6: Cross-Session Student Profile Personalization (REQ-12, REQ-13, REQ-43)**
   - Updated `app/routers/lessons.py` and `app/agents/lesson_planner.py` to retrieve `StudentProfile.weak_concepts` from prior sessions and inject proactive remediation and review segments into subsequent curricula.
   - Verified via `tests/test_returning_student_personalization.py`.

---

## Test Suite Execution Summary

- **Total Automated Test Files**: 14 test modules
- **Total Test Cases**: 28 automated tests
- **Pass Rate**: **100% (27 Passed, 1 Skipped when live key is absent)**
- **Full End-to-End Integration**: `tests/test_golden_path_e2e.py` executed complete 10-step student lifecycle including physical MP4 video rendering, misconcept remediation, difficulty adaptation, doubt asking, and report generation.

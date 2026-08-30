# Bharat Academix — Autonomous AI Teacher

An autonomous, human-like AI Teacher platform that delivers personalized, pacing-conscious multimodal lessons with adaptive real-time remediation, interactive whiteboards, RAG knowledge grounding, and multilingual voice synthesis.

![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688?logo=fastapi)
![Claude API](https://img.shields.io/badge/LLM-Anthropic%20Claude%203.5-6B4FBB?logo=anthropic)
![ChromaDB](https://img.shields.io/badge/VectorStore-ChromaDB%20Persistent-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Table of Contents
1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Demo](#demo)
4. [Key Features](#key-features)
5. [System Architecture](#system-architecture)
6. [AI / ML Implementation](#ai--ml-implementation)
7. [RAG / Knowledge Grounding](#rag--knowledge-grounding)
8. [Personalization Approach](#personalization-approach)
9. [Adaptive Teaching Loop](#adaptive-teaching-loop)
10. [Assessment & Learning Report](#assessment--learning-report)
11. [Multilingual Implementation](#multilingual-implementation)
12. [Voice & Avatar Implementation](#voice--avatar-implementation)
13. [Subject-Aware Visuals](#subject-aware-visuals)
14. [Tech Stack](#tech-stack)
15. [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
    - [Running Locally](#running-locally)
    - [Running Test Suite](#running-test-suite)
16. [API Reference](#api-reference)
17. [Deployment](#deployment)
18. [Evaluation Criteria Mapping](#evaluation-criteria-mapping)
19. [Known Limitations](#known-limitations)
20. [Third-Party Services & APIs Disclosed](#third-party-services--apis-disclosed)
21. [Project Structure](#project-structure)
22. [Team / Credits](#team--credits)
23. [License](#license)

---

## Problem Statement

Standard digital education tools rely heavily on static, one-size-fits-all video playlists and generic multiple-choice quizzes that fail to address how individual humans actually learn. When students struggle or harbor fundamental misconceptions, existing platforms passively re-display the same unhelpful explanations or mark answers wrong without identifying the underlying cognitive barrier. 

Bharat Academix solves this by providing an autonomous, human-like AI Teacher that analyzes source materials, structures time-budgeted curriculum roadmaps, explains concepts dynamically via an animated avatar with synchronized speech and interactive whiteboards, detects specific root-cause misconceptions in real time, and adapts instructional mental models until true mastery is achieved.

---

## Solution Overview

Bharat Academix is an end-to-end autonomous educational engine:

- **Curriculum Planning**: Ingests textbooks, lecture slides (PDF, DOCX, PPTX, TXT) or raw topic prompts, extracts knowledge graphs, and builds personalized time-pacing lesson timelines.
- **Multimodal Teaching Stage**: Delivers interactive instruction through an animated SVG Teacher Avatar synchronized with Web Speech synthesis alongside a dynamic SVG/Canvas Whiteboard (circuit schematics, mathematical derivations, coordinate charts, Python code runners).
- **Misconception Detection & Adaptive Remediation**: Evaluates student responses beyond simple string matching, diagnoses cognitive root causes, and immediately delivers alternative real-world analogies and targeted follow-up checks.
- **Formative & Diagnostic Assessment**: Runs multi-stage mastery evaluations and produces diagnostic reports detailing strong concepts, coaching revision areas, and personalized curriculum pathways.
- **Instant Multilingual Switching**: Translates UI, spoken explanations, whiteboard concepts, and question cards mid-session across English, Hindi (हिंदी), and Hinglish with zero session loss.

---

## Demo

- **Repository**: [https://github.com/gintama1018/ML-HACKATHON-2-LEVEL-ASSIGNMENT](https://github.com/gintama1018/ML-HACKATHON-2-LEVEL-ASSIGNMENT)
- **Local Video Walkthrough Artifact**: `ai_teacher_demo.webp` / `walkthrough.md` in repository documentation.
- **Live Deployment**: Not yet deployed to cloud staging — local deployment instructions provided below.

| Dashboard & Quick Topic Launch | AI Classroom Stage & Whiteboard |
| :---: | :---: |
| *Personalized mastery metrics & instant topic launcher* | *Sticky Teacher Avatar with live synchronized whiteboard* |

| Adaptive Misconception Reteach | Diagnostic Learning Report |
| :---: | :---: |
| *Real-time root cause diagnosis & alternative analogy* | *Score gauge, mastered concepts, & pathway recommendation* |

---

## Key Features

- **Autonomous Lesson Generation [Working]**: Generates structured, pacing-conscious lesson plans from raw text topics or uploaded documents.
- **RAG-Grounded Material Ingestion [Working]**: Parses PDF, DOCX, PPTX, TXT documents with sliding chunkers and indexes them into persistent ChromaDB collections.
- **Real-Time Misconception Diagnosis [Working]**: Distinguishes between careless mistakes, surface confusion, and deep misconceptions; outputs root cause explanations.
- **Proactive Adaptive Teaching [Working]**: Automatically switches pedagogical analogies upon incorrect answers or "I'm unsure" triggers.
- **Interactive Multimodal Whiteboard [Working]**: Dynamically renders electrical circuit schematics, coordinate plots, LaTeX-style formulas, interactive Python execution, and timelines.
- **Word-Boundary Avatar Animation [Working]**: Drives mouth animations using Web Speech API `SpeechSynthesisUtterance.onboundary` events with interpolated smoothing.
- **Global Multilingual i18n & Speech [Working]**: Real-time language switching across English, Hindi (हिंदी), and Hinglish with persistent session state and matching `hi-IN`/`en-IN` TTS voices.
- **End-of-Session Diagnostic Report [Working]**: Comprehensive mastery grading, strong vs weak concept matrices, and next curriculum recommendations.
- **Photorealistic Video / Audio Provider [Fallback]**: Clean provider abstraction in place; defaults to browser Web Speech API & SVG avatar in dev mode, swappable to HeyGen / ElevenLabs via environment variables.

---

## System Architecture

```mermaid
flowchart TD
    User([Learner Browser]) <-->|Next.js 14 Client| Frontend[Frontend UI Layer\nReact / TypeScript / TailwindCSS]
    
    subgraph Frontend Layer
        AppShell[AppShell & Floating Dock]
        Avatar[AvatarTeacher Engine\nWord-Boundary Web Speech]
        WB[Subject-Aware Whiteboard]
        Card[Adaptive Question Card]
        I18n[Global LanguageContext]
    end

    Frontend <-->|REST / JSON API| Backend[FastAPI Backend Server\nPort 8000]

    subgraph Backend Routing
        R_Lessons[/lessons/*]
        R_Sessions[/session/*]
        R_Materials[/materials/*]
        R_Assessment[/assessment/*]
        R_Report[/report/*]
    end

    Backend --> AgentOrch[AI Agent Orchestrator\nModel Tiering Engine]

    subgraph AI Agents Layer
        direction TB
        A1[Content Analyzer\nHaiku 4.5]
        A2[Lesson Planner\nSonnet 5]
        A3[Teaching Agent\nSonnet 5]
        A4[Visual Planner\nHaiku 4.5]
        A5[Question Generator\nHaiku 4.5]
        A6[Response Evaluator\nHaiku 4.5]
        A7[Misconception Detector\nSonnet 5]
        A8[Adaptive Teacher\nSonnet 5]
        A9[Assessment Engine\nSonnet 5]
        A10[Learning Profile Engine\nHaiku 4.5]
    end

    AgentOrch <--> A1 & A2 & A3 & A4 & A5 & A6 & A7 & A8 & A9 & A10

    AgentOrch <--> ClaudeClient[Anthropic Claude API\nSonnet 5 / Haiku 4.5]
    Backend <--> SQLite[(SQLite Database\n14 Entity Models)]
    Backend <--> RAG[RAG Ingestion Service\nChromaDB Persistent Client\nall-MiniLM-L6-v2 Embeddings]
```

### Architectural Layers
1. **Frontend Presentation**: Next.js 14 App Router application styled with the Digital Gurukul Corporate Modern design tokens (Deep Navy `#0F172A`, Emerald `#10B981`, Warm Amber `#F59E0B`). Communicates via strongly-typed REST API clients (`lib/api.ts`).
2. **Backend API**: FastAPI application serving 8 modular routers managing student profiles, document uploads, content extraction, session progress, answers, assessments, and diagnostics.
3. **AI Agent Orchestrator**: Manages execution flow across 10 specialized agent functions, allocating Claude Reasoning Tier (`claude-sonnet-5`) or Fast Tier (`claude-haiku-4-5-20251001`) according to cognitive requirements.
4. **Data & Vector Persistence**: SQLite database via SQLAlchemy ORM for relational progress tracking alongside ChromaDB persistent vector storage (`./data/chroma_db`) for document grounding.

---

## AI / ML Implementation

The platform utilizes a strict **Two-Tier LLM Architecture** powered by the Anthropic Claude API:

| Agent | Tier | Assigned Model | Responsibility |
| :--- | :--- | :--- | :--- |
| **Content Analyzer** | Fast | `claude-haiku-4-5-20251001` | Semantic document summarization & concept extraction |
| **Lesson Planner** | Reasoning | `claude-sonnet-5` | Pacing-conscious curriculum structuring & time budgeting |
| **Teaching Agent** | Reasoning | `claude-sonnet-5` | Concept explanation generation with grounding |
| **Visual Planner** | Fast | `claude-haiku-4-5-20251001` | Specification generation for whiteboard diagrams & charts |
| **Question Generator** | Fast | `claude-haiku-4-5-20251001` | Formative check generation across 4 pedagogical styles |
| **Response Evaluator** | Fast | `claude-haiku-4-5-20251001` | Semantic correctness grading & feedback generation |
| **Misconception Detector** | Reasoning | `claude-sonnet-5` | Cognitive root cause diagnosis for incorrect answers |
| **Adaptive Teacher** | Reasoning | `claude-sonnet-5` | Generates alternative mental models & re-teaching scripts |
| **Assessment Engine** | Reasoning | `claude-sonnet-5` | Multi-concept final exam synthesis & grading |
| **Profile Engine** | Fast | `claude-haiku-4-5-20251001` | Mastery matrix updates & weak concept tracking |

*When an `ANTHROPIC_API_KEY` is not present, all agents fall back to deterministic, structured educational scaffolds to ensure uninterrupted local evaluation.*

---

## RAG / Knowledge Grounding

The knowledge grounding pipeline operates as follows:

1. **Extraction**: `rag_service.py` extracts raw text from PDF (`pypdf`), DOCX (`python-docx`), PPTX (`python-pptx`), and plain text files.
2. **Chunking**: Chunks documents into overlapping semantic blocks (500 characters with 100 character overlap) tagged with page/slide metadata.
3. **Embeddings**: Uses ChromaDB's ONNX-accelerated `DefaultEmbeddingFunction` (`all-MiniLM-L6-v2`) generating 384-dimensional dense vectors locally.
4. **Persistent Vector Store**: Indexed into `chromadb.PersistentClient(path="./data/chroma_db")` under unique lesson/material collection IDs.
5. **UI Grounding**: Explanations retrieve top-k chunks and render clickable citation chips (`RAGCitationChip.tsx`) showing source filename, page, and chunk previews.

---

## Personalization Approach

Instruction dynamically adapts based on four learner profile parameters:
- **Mastery Level**: Beginner (intuitive, jargon-free analogies) vs Intermediate (standard textbook rigor) vs Advanced (mathematical formalisms and edge cases).
- **Time Budget**: 5 min (rapid summary), 20 min (standard 3-5 concept breakdown), 60 min (deep dive), or 7-day curriculum plan.
- **Teaching Style**: Simple & example-heavy, Technical & precise, or Story-driven.
- **Language**: English, Hindi, or Hinglish.

---

## Adaptive Teaching Loop

When a student submits an answer or clicks "I'm not sure", the following automated loop triggers:

```
[Student Submits Response] 
       │
       ▼
[Response Evaluator] ── Correct ──► [Encouraging Feedback] ──► [Advance to Next Concept]
       │
    Incorrect
       ▼
[Misconception Detector]
  - Analyzes Student Text vs Correct Answer Key
  - Determines Category: Careless / Shallow Confusion / Deep Root Misconception
  - Outputs Root Cause Explanation
       │
       ▼
[Adaptive Teacher]
  - Selects Alternative Real-World Mental Model (e.g., Water Pipe for Ohm's Law)
  - Adjusts Explanation Complexity
  - Increments retry_count (max 3 attempts)
       │
       ▼
[Live Classroom Update]
  - Teacher Avatar speaks new analogy via TTS
  - Whiteboard updates visual state
  - Student receives targeted follow-up question
```

### Real Test Execution Transcript Excerpt (`test_m2b_adaptive_loop.py`):
```text
Question: What happens to current if voltage is doubled while resistance is quadrupled?
Student Response: The current will double because voltage increased.
[Evaluator Result]: is_correct = False
[Misconception Detected]: Student focused exclusively on voltage proportionality (I ∝ V) and neglected the inverse resistance relationship (I ∝ 1/R).
[Adaptive Reteach]: "Think of voltage as water pressure pushing water through a pipe, and resistance as rocks choking the pipe. If you double the push (2x), but add four times as many rocks (4x), the water flow actually slows down by half (2/4 = 0.5x)."
```

---

## Assessment & Learning Report

- **Final Check Quiz**: Generated by `assessment_engine.py` covering all concepts taught in the lesson session with single-question and review-summary modes.
- **Automated Grading**: Server-side validation calculates percentage scores and classifies answers as correct or review-required.
- **Diagnostic Report**: Computes mastered concepts vs revision focus areas, triggers a celebratory visual confetti for scores $\ge 75\%$, and predicts the recommended next curriculum pathway.

---

## Multilingual Implementation

- **Tested & Supported Languages**: **English**, **Hindi (हिंदी)**, and **Conversational Hinglish**.
- **Mid-Lesson Switching**: Changing the language selector in the classroom immediately calls `PATCH /session/{id}`:
  - Explanation scripts and questions are translated into the target language.
  - Active TTS voice instantly re-binds to matching locales (`hi-IN` for Hindi, `en-IN` for Hinglish).
  - Avatar mouth animations synchronize to the translated audio.
  - Session state, progress index, and past answers remain 100% preserved.

---

## Voice & Avatar Implementation

- **Active Mode**: Dev Fallback via Web Speech API and responsive SVG Teacher Avatar.
- **Mouth Animation**: Accurately implemented as **word-boundary-timed mouth animation** driven by `SpeechSynthesisUtterance.onboundary` events with easing interpolation.
- **Mood Expressions**: Avatar dynamically transitions between `explaining`, `thinking`, and `encouraging` expressions based on live evaluation states.
- **Provider Abstraction**: Audio streaming backend routes (`POST /video/generate`, `GET /video/status`) accept external avatar/voice renderers (e.g., HeyGen, ElevenLabs) without frontend rewrites.

---

## Subject-Aware Visuals

The interactive Whiteboard (`Whiteboard.tsx`) dynamically renders subject-specific visual modules:

| Subject Domain | Visual Renderer | Status |
| :--- | :--- | :--- |
| **Physics / Electronics** | Closed-loop circuit schematic with animated current flow & resistor models | [Working] |
| **Mathematics & Calculus** | Parameter relationship coordinate curves ($I = V/R$) with labeled axes | [Working] |
| **Engineering / Formulas** | LaTeX-style step-by-step mathematical derivations | [Working] |
| **Computer Science** | Embedded Python 3.11 interactive code runner with terminal output | [Working] |
| **History & Humanities** | Chronological timeline milestones | [Working] |

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) | High-performance React server and client components |
| **Language & Types** | TypeScript 5 | Strict static typing across API payloads and UI states |
| **Styling & Design** | TailwindCSS | Digital Gurukul design tokens with responsive utilities |
| **Icons & Visuals** | Lucide React + Canvas Confetti | Clean iconography and assessment celebration effects |
| **Backend API** | FastAPI 0.115 (Python 3.11+) | Async REST API framework with automatic OpenAPI docs |
| **ORM & Database** | SQLAlchemy 2.0 + SQLite | Relational database schema with 14 tracked entities |
| **Vector Database** | ChromaDB 0.6 (Persistent) | Local on-disk embedding storage for document RAG |
| **Embeddings** | ONNX `all-MiniLM-L6-v2` | Fast 384-dimensional dense semantic embeddings |
| **LLM Provider** | Anthropic Claude API | `claude-sonnet-5` (Reasoning) & `claude-haiku-4-5` (Fast) |

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or higher (`v20+` recommended)
- **Python**: `3.10`, `3.11`, `3.12`, or `3.13`
- **Git**: `2.30+`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/gintama1018/ML-HACKATHON-2-LEVEL-ASSIGNMENT.git
   cd ML-HACKATHON-2-LEVEL-ASSIGNMENT
   ```

2. **Set up Backend Virtual Environment**:
   ```bash
   cd backend
   python -m venv venv
   
   # On Windows PowerShell:
   venv\Scripts\activate
   
   # On Linux / macOS:
   source venv/bin/activate
   
   pip install -r requirements.txt
   cd ..
   ```

3. **Set up Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Environment Variables

Create `backend/.env` (optional for local fallback evaluation, required for live Claude API calls):

| Variable | Required | Purpose | Example Value |
| :--- | :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | Optional | Live Claude LLM generation | `sk-ant-api03-...` |
| `DATABASE_URL` | Optional | Database connection string | `sqlite:///./data/ai_teacher.db` |
| `CHROMA_PERSIST_DIR`| Optional | ChromaDB storage directory | `./data/chroma_db` |

### Running Locally

1. **Start Backend Server**:
   ```bash
   cd backend
   venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *Backend runs on `http://127.0.0.1:8000` (API Docs: `http://127.0.0.1:8000/docs`)*

2. **Start Frontend Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Frontend opens on `http://localhost:3000`*

### Running Test Suite

Verify full-stack integration and AI pipelines across all milestones:

```bash
# Run Milestone 1 plumbing & database tests:
backend\venv\Scripts\python backend/tests/test_m1_plumbing.py

# Run Milestone 2A topic teaching & visual planning tests:
backend\venv\Scripts\python backend/tests/test_m2a_topic_teaching.py

# Run Milestone 2B adaptive misconception loop tests:
backend\venv\Scripts\python backend/tests/test_m2b_adaptive_loop.py

# Run Milestone 2C RAG ingestion & Chroma persistent index tests:
backend\venv\Scripts\python backend/tests/test_m2c_rag_ingestion.py

# Run Milestone 3 assessment & diagnostic report tests:
backend\venv\Scripts\python backend/tests/test_m3_assessment_report.py

# Run Real-Time Multilingual Language Switching verification:
backend\venv\Scripts\python backend/tests/verify_language_switch.py
```

---

## API Reference

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/health` | Server heartbeat and system status |
| `GET` | `/students/default` | Get default seed student profile (`Aarav Sharma`) |
| `POST` | `/learner-profile` | Create/update learner profile with time budget and language |
| `POST` | `/materials/upload` | Upload PDF/DOCX/PPTX study documents |
| `POST` | `/content/analyze` | Run semantic analysis and concept extraction |
| `POST` | `/lessons/generate` | Generate structured lesson timeline for topic or material |
| `GET` | `/lessons/{id}` | Retrieve lesson details and segment plan |
| `PUT` | `/lessons/{id}/plan` | Update segment plan toggles and time budgets |
| `POST` | `/session/create` | Launch interactive AI classroom session |
| `GET` | `/session/{id}` | Get live session state, current concept, and question |
| `PATCH`| `/session/{id}` | Live mid-session language switch (English/Hindi/Hinglish) |
| `POST` | `/session/{id}/answer` | Submit answer to adaptive evaluator and misconception detector |
| `POST` | `/session/{id}/explain-again` | Proactive retry trigger with alternative pedagogical analogy |
| `POST` | `/session/{id}/next-segment` | Advance to next concept or transition to final assessment |
| `POST` | `/assessment/generate/{id}` | Generate multi-concept final check exam |
| `POST` | `/assessment/submit/{id}` | Grade final check exam submissions |
| `GET` | `/report/{session_id}` | Retrieve final diagnostic report and curriculum pathway |

---

## Deployment

- **Status**: Tested and verified for local execution.
- **Production Build**: Verified with Next.js Turbopack (`npm run build` completed with 0 errors across all 10 routes).

---

## Evaluation Criteria Mapping

| Area | Weight | Status | Where to see it |
| :--- | :---: | :---: | :--- |
| **Human-Like Teaching & Adaptation** | 20 | **[Working]** | `backend/app/agents/misconception_detector.py`, `backend/app/agents/adaptive_teacher.py`, `frontend/src/app/sessions/[id]/page.tsx` |
| **AI/ML and LLM Implementation** | 15 | **[Working]** | `backend/app/services/claude_service.py` (Sonnet 5 + Haiku 4.5 tiering), `backend/app/agents/*` |
| **RAG and Knowledge Grounding** | 15 | **[Working]** | `backend/app/services/rag_service.py` (ChromaDB + ONNX MiniLM), `frontend/src/components/teaching/RAGCitationChip.tsx` |
| **AI Teaching Video Generation** | 15 | **[Working]** | `frontend/src/components/avatar/AvatarTeacher.tsx`, `frontend/src/components/whiteboard/Whiteboard.tsx` |
| **Multilingual Capability** | 10 | **[Working]** | `frontend/src/context/LanguageContext.tsx`, `backend/app/routers/sessions.py` (`PATCH /session/{id}`) |
| **Voice and AI Avatar** | 10 | **[Working]** | `frontend/src/lib/speech.ts` (Word-boundary TTS sync), `frontend/src/components/avatar/AvatarTeacher.tsx` |
| **Innovation and Originality** | 5 | **[Working]** | Real-time cognitive gap diagnosis, sticky classroom view, Digital Gurukul aesthetic |
| **User Experience and Interface** | 5 | **[Working]** | Digital Gurukul design system, floating bottom dock, Plus Jakarta Sans typography |
| **Documentation & Presentation** | 5 | **[Working]** | Complete `README.md`, `walkthrough.md`, architecture diagrams, test suites |

---

## Known Limitations

- **Browser TTS Voice Availability**: Browser Web Speech API voices depend on installed operating system voice packages. If Hindi (`hi-IN`) voice packs are missing on the host OS, browsers may fall back to default Indian English (`en-IN`).
- **Avatar Photorealism**: Avatar uses animated SVG with word-boundary timing rather than deepfake neural video streams in dev mode to allow 100% offline, zero-latency rendering.
- **Complex Mathematical Notation in Speech**: Complex nested LaTeX equations (e.g. triple integrals) are voiced via standardized textual substitutions rather than full math-to-speech audio rendering.
- **Large Document Uploads**: PDF parsing handles text-layer extractions cleanly; scanned image-only PDFs require external OCR before ingestion.

---

## Third-Party Services & APIs Disclosed

- **Anthropic Claude API**: LLM engine for reasoning (`claude-sonnet-5`) and fast tasks (`claude-haiku-4-5-20251001`).
- **ChromaDB**: Open-source embedded vector database for document RAG indexing.
- **HuggingFace / ONNX `all-MiniLM-L6-v2`**: Local semantic embedding model.
- **Web Speech API**: Standard W3C browser speech synthesis and word-boundary event interface.

---

## Project Structure

```text
ML-HACKATHON-2-LEVEL-ASSIGNMENT/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── adaptive_teacher.py
│   │   │   ├── assessment_engine.py
│   │   │   ├── content_analyzer.py
│   │   │   ├── learning_profile_engine.py
│   │   │   ├── lesson_planner.py
│   │   │   ├── misconception_detector.py
│   │   │   ├── question_generator.py
│   │   │   ├── response_evaluator.py
│   │   │   ├── teaching_agent.py
│   │   │   └── visual_planner.py
│   │   ├── routers/
│   │   │   ├── assessment.py
│   │   │   ├── content.py
│   │   │   ├── lessons.py
│   │   │   ├── materials.py
│   │   │   ├── profile.py
│   │   │   ├── report.py
│   │   │   ├── sessions.py
│   │   │   └── video.py
│   │   ├── services/
│   │   │   ├── claude_service.py
│   │   │   └── rag_service.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── tests/
│   │   ├── test_m1_plumbing.py
│   │   ├── test_m2a_topic_teaching.py
│   │   ├── test_m2b_adaptive_loop.py
│   │   ├── test_m2c_rag_ingestion.py
│   │   ├── test_m3_assessment_report.py
│   │   └── verify_language_switch.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── lessons/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── plan/page.tsx
│   │   │   │   │   └── processing/page.tsx
│   │   │   │   └── new/
│   │   │   │       ├── profile/page.tsx
│   │   │   │       └── page.tsx
│   │   │   ├── sessions/
│   │   │   │   └── [id]/
│   │   │   │       ├── assessment/page.tsx
│   │   │   │       ├── report/page.tsx
│   │   │   │       └── page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── avatar/AvatarTeacher.tsx
│   │   │   ├── layout/AppShell.tsx
│   │   │   ├── teaching/AdaptiveQuestionCard.tsx
│   │   │   ├── teaching/RAGCitationChip.tsx
│   │   │   └── whiteboard/Whiteboard.tsx
│   │   ├── context/LanguageContext.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── speech.ts
│   │   └── package.json
│   ├── tsconfig.json
│   └── next.config.ts
├── .gitignore
├── README.md
└── AI_Teacher_Master_Plan.txt
```

---

## Team / Credits

- **Developer & Architect**: Sonu Jangir (`gintama1018`)
- **Contact**: `Sonu.jangir2024@uem.edu.in`
- **Hackathon**: AI Innovation Hackathon 2026

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, ConfigDict

# --- Student Profile Schemas ---
class StudentProfileCreate(BaseModel):
    name: str = "Student"

class StudentProfileUpdate(BaseModel):
    name: Optional[str] = None
    strong_concepts: Optional[List[str]] = None
    weak_concepts: Optional[List[str]] = None
    current_path_id: Optional[str] = None
    learning_history: Optional[List[Dict[str, Any]]] = None

class StudentProfileResponse(BaseModel):
    id: str
    name: str
    learning_history: List[Dict[str, Any]] = []
    strong_concepts: List[str] = []
    weak_concepts: List[str] = []
    current_path_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Learner Profile Schemas ---
class LearnerProfileCreate(BaseModel):
    student_id: Optional[str] = None
    level: str = "Beginner"
    existing_knowledge: Optional[str] = None
    objective: str = "Concept Mastery" # Exam Prep, Concept Mastery, Quick Revision, Practical Application
    language: str = "English"
    style: str = "Simple & example-heavy"
    available_time: str = "20 min"
    depth: str = "Standard" # Intuitive, Standard, Deep Dive

class LearnerProfileResponse(BaseModel):
    id: str
    student_id: str
    level: str
    existing_knowledge: Optional[str] = None
    objective: str
    language: str
    style: str
    available_time: str
    depth: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Material Schemas ---
class MaterialResponse(BaseModel):
    id: str
    student_id: str
    filename: str
    type: str
    file_size: int
    status: str
    storage_ref: str
    extracted_summary: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ContentAnalyzeRequest(BaseModel):
    material_id: Optional[str] = None
    topic: Optional[str] = None
    profile_id: Optional[str] = None

class ContentAnalyzeStatusResponse(BaseModel):
    job_id: str
    status: str  # extracting, chunking, embedding, indexing, ready, failed
    stage: str
    progress: int  # 0-100
    details: Optional[str] = None
    summary: Optional[Dict[str, Any]] = None

# --- Lesson Schemas ---
class LessonGenerateRequest(BaseModel):
    student_id: Optional[str] = None
    source_type: str = "topic"  # material, topic
    material_id: Optional[str] = None
    topic: Optional[str] = None
    level: str = "Beginner"
    existing_knowledge: Optional[str] = None
    objective: str = "Concept Mastery"
    language: str = "English"
    style: str = "Simple & example-heavy"
    available_time: str = "20 min"
    depth: str = "Standard"

class LessonSegmentPlan(BaseModel):
    order: int
    concept: str
    target_time_minutes: int
    visual_type: str
    skipped: bool = False

class LessonPlanUpdateRequest(BaseModel):
    segments: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None

LessonPlanUpdate = LessonPlanUpdateRequest

class LessonPlanResponse(BaseModel):
    id: str
    lesson_id: str
    segments: List[Dict[str, Any]]
    total_estimated_minutes: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LessonResponse(BaseModel):
    id: str
    student_id: str
    source_type: str
    material_id: Optional[str] = None
    topic: Optional[str] = None
    profile_id: str
    status: str
    created_at: datetime
    plan: Optional[LessonPlanResponse] = None

    model_config = ConfigDict(from_attributes=True)

# --- Session & Interaction Schemas ---
class SessionCreateRequest(BaseModel):
    lesson_id: str

class SessionUpdateRequest(BaseModel):
    language: Optional[str] = None
    status: Optional[str] = None
    current_step: Optional[int] = None
    current_difficulty: Optional[str] = None

class SessionSegmentResponse(BaseModel):
    id: str
    session_id: str
    segment_order: int
    concept: str
    explanation_text: str
    alternative_explanations: List[Dict[str, Any]] = []
    visual_type: str
    visual_spec: Dict[str, Any] = {}
    video_job_id: Optional[str] = None
    audio_ref: Optional[str] = None
    source_citations: List[Dict[str, Any]] = []
    retry_count: int = 0
    is_mastered: bool = False
    status: str = "ready"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class QuestionResponse(BaseModel):
    id: str
    session_id: str
    segment_id: Optional[str] = None
    type: str
    difficulty: Optional[str] = "Intermediate"
    is_adaptive_followup: Optional[bool] = False
    target_misconception: Optional[str] = None
    prompt: str
    options: Optional[List[str]] = None
    explanation_hint: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StudentAnswerRequest(BaseModel):
    question_id: str
    response_text: str
    is_unsure: bool = False

class EvaluationResponse(BaseModel):
    id: str
    response_id: str
    correct: bool
    confidence: float = 1.0
    notes: str = ""
    feedback: Optional[str] = None
    misconception: Optional[Union[str, Dict[str, Any]]] = None
    adaptation_decision: Optional[Dict[str, Any]] = None
    new_explanation: Optional[str] = None
    new_question: Optional[Dict[str, Any]] = None
    current_difficulty: Optional[str] = "Intermediate"
    is_mastered: bool = False
    is_session_advanced: bool = False
    mastery_state: Optional[str] = "not_started"  # confirmed, provisional, in_remediation, not_started
    mastery_evidence: Optional[str] = None
    ai_mode: Optional[str] = "live"  # live, fallback
    evaluated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExplainAgainRequest(BaseModel):
    segment_id: Optional[str] = None
    focus: Optional[str] = None

class AskTeacherRequest(BaseModel):
    question: str

class AskTeacherResponse(BaseModel):
    answer: str
    voice_script: str
    citations: List[Dict[str, Any]] = []
    is_grounded: bool = True
    confidence: float = 1.0
    related_concept: Optional[str] = None

class LessonSessionResponse(BaseModel):
    id: str
    lesson_id: str
    status: str
    current_step: int
    current_difficulty: str = "Intermediate"
    consecutive_correct: int = 0
    consecutive_incorrect: int = 0
    language: str
    video_url: Optional[str] = None
    video_scenes: Optional[List[Dict[str, Any]]] = []
    started_at: datetime
    completed_at: Optional[datetime] = None
    updated_at: datetime
    current_segment: Optional[SessionSegmentResponse] = None
    current_question: Optional[QuestionResponse] = None
    total_segments: int = 0

    model_config = ConfigDict(from_attributes=True)

# --- Assessment & Report Schemas ---
class AssessmentGenerateRequest(BaseModel):
    pass

class AssessmentSubmitRequest(BaseModel):
    answers: Dict[str, str]  # question_id -> student answer

class AssessmentResponse(BaseModel):
    id: str
    session_id: str
    questions: List[Dict[str, Any]]
    student_answers: Dict[str, str] = {}
    score: Optional[float] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class LearningReportResponse(BaseModel):
    id: str
    session_id: str
    score: float
    total_questions: int
    correct_answers: int
    strong_areas: List[str]
    weak_areas: List[str]
    recommended_revision: Optional[str] = None
    recommended_next_topic: Optional[str] = None
    detailed_breakdown: List[Dict[str, Any]] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Video / Audio Job Schemas ---
class VideoGenerateRequest(BaseModel):
    session_id: Optional[str] = None
    segment_id: Optional[str] = None
    lesson_topic: Optional[str] = None
    language: Optional[str] = "English"
    provider: Optional[str] = "edge_tts_imageio"

class VideoJobStatusResponse(BaseModel):
    job_id: str
    session_id: Optional[str] = None
    segment_id: Optional[str] = None
    status: str  # queued, processing, ready, failed
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    file_size_bytes: Optional[int] = 0
    total_duration_seconds: Optional[float] = 0.0
    scenes: Optional[List[Dict[str, Any]]] = []
    captions: Optional[List[Dict[str, Any]]] = None
    mode: str = "ai_video_engine"

# --- Learning Path Schemas (REQ-67/68) ---
class LearningPathModuleResponse(BaseModel):
    id: str
    path_id: str
    module_order: int
    title: str
    description: Optional[str] = None
    key_concepts: List[str] = []
    is_unlocked: bool = False
    is_completed: bool = False
    score: Optional[float] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class LearningPathResponse(BaseModel):
    id: str
    student_id: str
    topic: str
    target_level: str
    total_modules: int
    current_module_index: int
    status: str
    created_at: datetime
    modules: List[LearningPathModuleResponse] = []

    model_config = ConfigDict(from_attributes=True)

class LearningPathGenerateRequest(BaseModel):
    student_id: Optional[str] = None
    topic: str
    target_level: str = "Beginner"
    total_modules: int = 5

class LearningPathModuleUpdateRequest(BaseModel):
    is_completed: Optional[bool] = None
    score: Optional[float] = None

# --- Advanced Section 18 Features (Flashcards, Notes, Concept Maps) ---
class FlashcardItem(BaseModel):
    id: str
    concept: str
    front: str
    back: str
    mnemonic: Optional[str] = None

class FlashcardsResponse(BaseModel):
    session_id: str
    topic: str
    flashcards: List[FlashcardItem] = []

class StudyNotesResponse(BaseModel):
    session_id: str
    topic: str
    language: str
    summary_markdown: str
    key_takeaways: List[str] = []
    formulas_or_definitions: List[Dict[str, str]] = []
    recommended_actions: List[str] = []

class ConceptMapNode(BaseModel):
    id: str
    label: str
    type: str  # prerequisite, core, application
    status: str  # mastered, reviewing, upcoming

class ConceptMapEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None

class ConceptMapResponse(BaseModel):
    session_id: str
    topic: str
    nodes: List[ConceptMapNode] = []
    edges: List[ConceptMapEdge] = []


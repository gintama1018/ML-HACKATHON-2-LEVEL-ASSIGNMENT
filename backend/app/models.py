import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, default="Student")
    learning_history = Column(JSON, default=list)  # list of completed lesson summaries
    strong_concepts = Column(JSON, default=list)   # list of concept strings
    weak_concepts = Column(JSON, default=list)     # list of concept strings
    current_path_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    learner_profiles = relationship("LearnerProfile", back_populates="student", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="student", cascade="all, delete-orphan")
    lessons = relationship("Lesson", back_populates="student", cascade="all, delete-orphan")

class LearnerProfile(Base):
    __tablename__ = "learner_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id"), nullable=False)
    level = Column(String(50), nullable=False, default="Beginner")  # Beginner, Intermediate, Advanced
    existing_knowledge = Column(Text, nullable=True)
    objective = Column(String(255), nullable=False, default="Concept Mastery") # Exam Prep, Concept Mastery, Quick Revision, Practical Application
    language = Column(String(50), nullable=False, default="English")  # English, Hindi, Hinglish, etc.
    style = Column(String(100), nullable=False, default="Simple & example-heavy")
    available_time = Column(String(50), nullable=False, default="20 min")  # 5 min, 20 min, 60 min, 7-day plan
    depth = Column(String(50), nullable=False, default="Standard") # Intuitive, Standard, Deep Dive
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("StudentProfile", back_populates="learner_profiles")
    lessons = relationship("Lesson", back_populates="profile")

class Material(Base):
    __tablename__ = "materials"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # pdf, docx, pptx, txt, md
    file_size = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="uploaded")  # uploaded, processing, ready, failed
    storage_ref = Column(String(500), nullable=False)
    extracted_summary = Column(JSON, nullable=True)  # sections, key_concepts, summary
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("StudentProfile", back_populates="materials")
    chunks = relationship("MaterialChunk", back_populates="material", cascade="all, delete-orphan")
    lessons = relationship("Lesson", back_populates="material")

class MaterialChunk(Base):
    __tablename__ = "material_chunks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=False)
    text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    section_ref = Column(String(255), nullable=True)
    page_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    material = relationship("Material", back_populates="chunks")

class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id"), nullable=False)
    source_type = Column(String(50), nullable=False)  # material, topic
    material_id = Column(String(36), ForeignKey("materials.id"), nullable=True)
    topic = Column(String(255), nullable=True)
    profile_id = Column(String(36), ForeignKey("learner_profiles.id"), nullable=False)
    status = Column(String(50), nullable=False, default="draft")  # draft, active, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("StudentProfile", back_populates="lessons")
    material = relationship("Material", back_populates="lessons")
    profile = relationship("LearnerProfile", back_populates="lessons")
    plan = relationship("LessonPlan", back_populates="lesson", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("LessonSession", back_populates="lesson", cascade="all, delete-orphan")

class LessonPlan(Base):
    __tablename__ = "lesson_plans"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    lesson_id = Column(String(36), ForeignKey("lessons.id"), nullable=False, unique=True)
    segments = Column(JSON, nullable=False, default=list)  # list of {order, concept, target_time, visual_type, skipped}
    total_estimated_minutes = Column(Integer, nullable=False, default=20)
    status = Column(String(50), nullable=False, default="draft")  # draft, active
    created_at = Column(DateTime, default=datetime.utcnow)
    
    lesson = relationship("Lesson", back_populates="plan")

class LessonSession(Base):
    __tablename__ = "lesson_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    lesson_id = Column(String(36), ForeignKey("lessons.id"), nullable=False)
    status = Column(String(50), nullable=False, default="in_progress")  # in_progress, assessment, completed
    current_step = Column(Integer, nullable=False, default=0)
    current_difficulty = Column(String(50), nullable=False, default="Intermediate") # Beginner, Intermediate, Advanced
    consecutive_correct = Column(Integer, default=0)
    consecutive_incorrect = Column(Integer, default=0)
    language = Column(String(50), nullable=False, default="English")
    video_url = Column(String(500), nullable=True)
    video_scenes = Column(JSON, nullable=True, default=list)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    lesson = relationship("Lesson", back_populates="sessions")
    segments = relationship("SessionSegment", back_populates="session", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="session", cascade="all, delete-orphan")
    assessment = relationship("Assessment", back_populates="session", uselist=False, cascade="all, delete-orphan")
    report = relationship("LearningReport", back_populates="session", uselist=False, cascade="all, delete-orphan")

class SessionSegment(Base):
    __tablename__ = "session_segments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("lesson_sessions.id"), nullable=False)
    segment_order = Column(Integer, nullable=False)
    concept = Column(String(255), nullable=False)
    explanation_text = Column(Text, nullable=False)
    alternative_explanations = Column(JSON, default=list)  # list of re-explanations/analogies
    visual_type = Column(String(100), nullable=False, default="diagram")  # chart, math, code, diagram, timeline
    visual_spec = Column(JSON, nullable=False, default=dict)
    video_job_id = Column(String(255), nullable=True)
    audio_ref = Column(String(500), nullable=True)
    source_citations = Column(JSON, default=list)  # list of chunk citations [{section, page, excerpt}]
    retry_count = Column(Integer, default=0)
    is_mastered = Column(Boolean, default=False)
    status = Column(String(50), default="ready")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("LessonSession", back_populates="segments")
    questions = relationship("Question", back_populates="segment")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("lesson_sessions.id"), nullable=False)
    segment_id = Column(String(36), ForeignKey("session_segments.id"), nullable=True)
    type = Column(String(50), nullable=False)  # mcq, short_answer, problem_solving, own_words
    difficulty = Column(String(50), default="Intermediate")
    is_adaptive_followup = Column(Boolean, default=False)
    target_misconception = Column(Text, nullable=True)
    prompt = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)  # list of options if mcq
    answer_key = Column(Text, nullable=False)
    explanation_hint = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("LessonSession", back_populates="questions")
    segment = relationship("SessionSegment", back_populates="questions")
    responses = relationship("StudentResponse", back_populates="question", cascade="all, delete-orphan")

class StudentResponse(Base):
    __tablename__ = "student_responses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    response_text = Column(Text, nullable=False)
    is_unsure = Column(Boolean, default=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    question = relationship("Question", back_populates="responses")
    evaluation = relationship("Evaluation", back_populates="response", uselist=False, cascade="all, delete-orphan")

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    response_id = Column(String(36), ForeignKey("student_responses.id"), nullable=False, unique=True)
    correct = Column(Boolean, nullable=False)
    confidence = Column(Float, default=1.0)
    notes = Column(Text, nullable=True)
    misconception = Column(JSON, nullable=True)  # structured misconception {category, description, root_cause}
    adaptation_decision = Column(JSON, nullable=True) # {strategy, complexity, change_visual}
    evaluated_at = Column(DateTime, default=datetime.utcnow)
    
    response = relationship("StudentResponse", back_populates="evaluation")

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("lesson_sessions.id"), nullable=False, unique=True)
    questions = Column(JSON, nullable=False, default=list) # [{id, prompt, options, answer_key, concept}]
    student_answers = Column(JSON, default=dict) # {q_id: answer}
    score = Column(Float, nullable=True)
    status = Column(String(50), default="pending") # pending, submitted, graded
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    session = relationship("LessonSession", back_populates="assessment")

class LearningReport(Base):
    __tablename__ = "learning_reports"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("lesson_sessions.id"), nullable=False, unique=True)
    score = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    strong_areas = Column(JSON, default=list)
    weak_areas = Column(JSON, default=list)
    recommended_revision = Column(Text, nullable=True)
    recommended_next_topic = Column(String(255), nullable=True)
    detailed_breakdown = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("LessonSession", back_populates="report")

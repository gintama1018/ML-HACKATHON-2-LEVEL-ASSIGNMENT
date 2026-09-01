export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function getVideoUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export interface StudentProfile {
  id: string;
  name: string;
  learning_history: Array<{
    lesson_id: string;
    topic: string;
    score: number;
    completed_at: string;
    strong_concepts: string[];
    weak_concepts: string[];
  }>;
  strong_concepts: string[];
  weak_concepts: string[];
  current_path_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LearnerProfile {
  id: string;
  student_id: string;
  level: string;
  existing_knowledge?: string;
  objective: string;
  language: string;
  style: string;
  available_time: string;
  depth: string;
  created_at: string;
}

export interface Material {
  id: string;
  student_id: string;
  filename: string;
  type: string;
  file_size: number;
  status: string;
  storage_ref: string;
  extracted_summary?: {
    title?: string;
    subject_domain?: string;
    key_concepts?: string[];
    sections?: Array<{ name: string; summary?: string; concepts?: string[] }>;
    total_chunks?: number;
  };
  created_at: string;
}

export interface LessonPlanSegment {
  order: number;
  concept: string;
  target_time: string;
  visual_type: "chart" | "math" | "code" | "diagram" | "timeline";
  learning_objective?: string;
  skipped: boolean;
}

export interface LessonPlan {
  id: string;
  lesson_id: string;
  segments: LessonPlanSegment[];
  total_estimated_minutes: number;
  status: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  student_id: string;
  source_type: "material" | "topic";
  material_id?: string;
  topic?: string;
  profile_id: string;
  status: "draft" | "active" | "completed";
  created_at: string;
  plan?: LessonPlan;
}

export interface Citation {
  section_ref?: string;
  section?: string;
  page_number?: number;
  page?: number;
  excerpt: string;
}

export interface SessionSegment {
  id: string;
  session_id: string;
  segment_order: number;
  concept: string;
  explanation_text: string;
  alternative_explanations: Array<{ analogy: string; timestamp: string }>;
  visual_type: string;
  visual_spec: Record<string, any>;
  video_job_id?: string;
  audio_ref?: string;
  source_citations: Citation[];
  retry_count: number;
  is_mastered: boolean;
  status: string;
  created_at: string;
}

export interface Question {
  id: string;
  session_id: string;
  segment_id?: string;
  type: "mcq" | "short_answer" | "problem_solving" | "own_words";
  difficulty?: string;
  is_adaptive_followup?: boolean;
  target_misconception?: string;
  prompt: string;
  options?: string[];
  explanation_hint?: string;
  created_at: string;
}

export interface EvaluationResponse {
  id: string;
  response_id: string;
  correct: boolean;
  confidence: number;
  notes: string;
  feedback?: string;
  misconception?: string | {
    description?: string;
    root_cause?: string;
    misconception_category?: string;
  };
  adaptation_decision?: {
    action: string;
    pedagogical_rationale?: string;
    new_analogy?: string;
  };
  new_explanation?: string;
  new_question?: {
    id?: string;
    type: string;
    prompt: string;
    options?: string[];
    answer_key?: string;
    explanation_hint?: string;
  };
  current_difficulty?: string;
  is_mastered?: boolean;
  is_session_advanced: boolean;
  mastery_state?: string;
  mastery_evidence?: string;
  evaluated_at: string;
}

export interface VideoSceneMetadata {
  scene_index: number;
  title: string;
  start_time: number;
  end_time: number;
  duration_seconds: number;
  visual_type: string;
}

export interface VideoJobResponse {
  job_id: string;
  session_id?: string;
  status: string;
  video_url?: string;
  audio_url?: string;
  file_size_bytes?: number;
  total_duration_seconds?: number;
  scenes?: VideoSceneMetadata[];
  captions?: any[];
  mode: string;
}

export interface AskTeacherResponse {
  answer: string;
  voice_script: string;
  citations: Citation[];
  is_grounded: boolean;
  confidence: number;
  related_concept?: string;
}

export interface LessonSession {
  id: string;
  lesson_id: string;
  lesson?: Lesson;
  status: "in_progress" | "assessment" | "completed";
  current_step: number;
  current_difficulty: string;
  consecutive_correct: number;
  consecutive_incorrect: number;
  language: string;
  video_url?: string;
  video_scenes?: VideoSceneMetadata[];
  started_at: string;
  completed_at?: string;
  updated_at: string;
  current_segment?: SessionSegment;
  current_question?: Question;
  total_segments: number;
}

export interface Assessment {
  id: string;
  session_id: string;
  questions: Array<{
    id: string;
    concept: string;
    type: string;
    prompt: string;
    options?: string[];
    answer_key: string;
    explanation?: string;
  }>;
  student_answers: Record<string, string>;
  score?: number;
  status: string;
  created_at: string;
  completed_at?: string;
}

export interface LearningReport {
  id: string;
  session_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  strong_areas: string[];
  weak_areas: string[];
  recommended_revision?: string;
  recommended_next_topic?: string;
  detailed_breakdown: Array<{
    question_id: string;
    prompt: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    concept: string;
  }>;
  created_at: string;
}

export interface LearningPathModule {
  id: string;
  path_id: string;
  module_order: number;
  title: string;
  description?: string;
  key_concepts: string[];
  is_unlocked: boolean;
  is_completed: boolean;
  score?: number;
  completed_at?: string;
}

export interface LearningPath {
  id: string;
  student_id: string;
  topic: string;
  target_level: string;
  total_modules: number;
  current_module_index: number;
  status: "in_progress" | "completed";
  created_at: string;
  modules: LearningPathModule[];
}

export const api = {
  // Student Profile
  async getDefaultStudent(): Promise<StudentProfile> {
    const res = await fetch(`${API_BASE}/students/default`);
    if (!res.ok) throw new Error("Failed to get default student");
    return res.json();
  },

  async updateStudentProfile(id: string, updates: Partial<StudentProfile>): Promise<StudentProfile> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update student profile");
    return res.json();
  },

  // Material Ingestion
  async uploadMaterial(file: File, studentId?: string): Promise<Material> {
    let sId = studentId;
    if (!sId) {
      const std = await api.getDefaultStudent();
      sId = std.id;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("student_id", sId);

    const res = await fetch(`${API_BASE}/materials/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload material");
    return res.json();
  },

  async getMaterial(materialId: string): Promise<Material> {
    const res = await fetch(`${API_BASE}/materials/${materialId}`);
    if (!res.ok) throw new Error("Failed to get material");
    return res.json();
  },

  async analyzeContent(payload: { material_id?: string; topic?: string; profile_id?: string }) {
    const res = await fetch(`${API_BASE}/content/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to start content analysis");
    return res.json();
  },

  async getContentAnalysisStatus(jobId: string) {
    const res = await fetch(`${API_BASE}/content/analysis/${jobId}`);
    if (!res.ok) throw new Error("Failed to get analysis status");
    return res.json();
  },

  async getAnalysisStatus(jobId: string) {
    return this.getContentAnalysisStatus(jobId);
  },

  // Lessons
  async listLessons(studentId?: string): Promise<Lesson[]> {
    const url = studentId ? `${API_BASE}/lessons?student_id=${studentId}` : `${API_BASE}/lessons`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  async generateLesson(payload: {
    student_id?: string;
    source_type: "material" | "topic";
    material_id?: string;
    topic?: string;
    level?: string;
    existing_knowledge?: string;
    objective?: string;
    language?: string;
    style?: string;
    available_time?: string;
    depth?: string;
    profile_id?: string;
  }): Promise<Lesson> {
    const res = await fetch(`${API_BASE}/lessons/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to generate lesson");
    return res.json();
  },

  async getLesson(id: string): Promise<Lesson> {
    const res = await fetch(`${API_BASE}/lessons/${id}`);
    if (!res.ok) throw new Error("Failed to get lesson");
    return res.json();
  },

  async updateLessonPlan(lessonId: string, segments: LessonPlanSegment[]): Promise<LessonPlan> {
    const res = await fetch(`${API_BASE}/lessons/${lessonId}/plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segments }),
    });
    if (!res.ok) throw new Error("Failed to update lesson plan");
    return res.json();
  },

  // Interactive Sessions & Teaching Loop
  async createSession(lessonId: string): Promise<LessonSession> {
    const res = await fetch(`${API_BASE}/session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: lessonId }),
    });
    if (!res.ok) throw new Error("Failed to create session");
    return res.json();
  },

  async getSession(sessionId: string): Promise<LessonSession> {
    const res = await fetch(`${API_BASE}/session/${sessionId}`);
    if (!res.ok) throw new Error("Failed to get session");
    return res.json();
  },

  async updateSession(sessionId: string, updates: { language?: string; status?: string; current_step?: number; current_difficulty?: string }): Promise<LessonSession> {
    const res = await fetch(`${API_BASE}/session/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update session");
    return res.json();
  },

  async submitAnswer(sessionId: string, questionId: string, responseText: string, isUnsure: boolean = false): Promise<EvaluationResponse> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: questionId,
        response_text: responseText,
        is_unsure: isUnsure,
      }),
    });
    if (!res.ok) throw new Error("Failed to submit answer");
    return res.json();
  },

  async explainAgain(sessionId: string, focus?: string): Promise<{ status: string; new_explanation: string; retry_count: number }> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/explain-again`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ focus }),
    });
    if (!res.ok) throw new Error("Failed to request re-explanation");
    return res.json();
  },

  async askTeacher(sessionId: string, question: string): Promise<AskTeacherResponse> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error("Failed to ask teacher");
    return res.json();
  },

  async nextSegment(sessionId: string): Promise<LessonSession> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/next-segment`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to advance segment");
    return res.json();
  },

  // Video Generation Engine
  async generateVideo(payload: { session_id?: string; lesson_topic?: string; language?: string }): Promise<VideoJobResponse> {
    const res = await fetch(`${API_BASE}/video/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to generate video");
    return res.json();
  },

  // Assessment & Report
  async generateAssessment(sessionId: string): Promise<Assessment> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/assessment/generate`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to generate assessment");
    return res.json();
  },

  async submitAssessment(sessionId: string, answers: Record<string, string>): Promise<Assessment> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/assessment/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) throw new Error("Failed to submit assessment");
    return res.json();
  },

  async getReport(sessionId: string): Promise<LearningReport> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/report`);
    if (!res.ok) throw new Error("Failed to get learning report");
    return res.json();
  },

  // Learning Path Multi-Module Progression (REQ-67/68)
  async getLearningPaths(studentId?: string): Promise<LearningPath[]> {
    const url = studentId ? `${API_BASE}/learning-paths?student_id=${studentId}` : `${API_BASE}/learning-paths`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  },

  async getLearningPath(pathId: string): Promise<LearningPath> {
    const res = await fetch(`${API_BASE}/learning-paths/${pathId}`);
    if (!res.ok) throw new Error("Failed to get learning path");
    return res.json();
  },

  async generateLearningPath(payload: { topic: string; target_level?: string; total_modules?: number; student_id?: string }): Promise<LearningPath> {
    const res = await fetch(`${API_BASE}/learning-paths/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to generate learning path");
    return res.json();
  },
  async updateModuleProgress(pathId: string, moduleId: string, payload: { is_completed?: boolean; score?: number }): Promise<LearningPathModule> {
    const res = await fetch(`${API_BASE}/learning-paths/${pathId}/modules/${moduleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update module progress");
    return res.json();
  },

  async getSystemStatus(): Promise<{
    is_live_ai: boolean;
    active_provider: string;
    has_gemini: boolean;
    has_claude: boolean;
    gemini_model: string;
    claude_model: string;
    rag_embeddings: string;
    video_engine: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/system/status`);
      if (!res.ok) throw new Error("Failed to get system status");
      return res.json();
    } catch {
      return {
        is_live_ai: false,
        active_provider: "Resilient Offline Mode",
        has_gemini: false,
        has_claude: false,
        gemini_model: "gemini-1.5-pro",
        claude_model: "claude-3-7-sonnet-20250219",
        rag_embeddings: "Deterministic 384-dim fallback",
        video_engine: "FFmpeg 720p H.264 / Viseme Muxer"
      };
    }
  },
};

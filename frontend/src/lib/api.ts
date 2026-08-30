const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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
  objective?: string;
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
  source_citations: Array<{ section_ref: string; page_number?: number; excerpt: string }>;
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
  misconception?: {
    description: string;
    root_cause: string;
    misconception_category?: string;
  };
  adaptation_decision?: {
    action: string;
    pedagogical_rationale?: string;
    new_analogy?: string;
  };
  new_explanation?: string;
  new_question?: {
    type: string;
    prompt: string;
    options?: string[];
    answer_key: string;
    explanation_hint?: string;
  };
  is_session_advanced: boolean;
  evaluated_at: string;
}

export interface LessonSession {
  id: string;
  lesson_id: string;
  status: "in_progress" | "assessment" | "completed";
  current_step: number;
  language: string;
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
    concept: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
  }>;
  created_at: string;
}

// API Helper functions
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Profiles
  getDefaultStudent: () => request<StudentProfile>("/students/default"),
  getStudentProfile: (id: string) => request<StudentProfile>(`/students/${id}/profile`),
  updateStudentProfile: (id: string, data: Partial<StudentProfile>) =>
    request<StudentProfile>(`/students/${id}/profile`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  createLearnerProfile: (data: Partial<LearnerProfile>) =>
    request<LearnerProfile>("/learner-profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Materials
  uploadMaterial: async (file: File, studentId?: string): Promise<Material> => {
    const formData = new FormData();
    formData.append("file", file);
    if (studentId) formData.append("student_id", studentId);

    const res = await fetch(`${API_BASE}/materials/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "File upload failed");
    }
    return res.json();
  },
  getMaterial: (id: string) => request<Material>(`/materials/${id}`),

  // Content Analysis
  analyzeContent: (materialId?: string, topic?: string, profileId?: string) =>
    request<{ job_id: string; status: string; stage: string }>("/content/analyze", {
      method: "POST",
      body: JSON.stringify({ material_id: materialId, topic, profile_id: profileId }),
    }),
  getAnalysisStatus: (jobId: string) =>
    request<{
      job_id: string;
      status: string;
      stage: string;
      progress: number;
      details?: string;
      summary?: any;
    }>(`/content/analyze/${jobId}/status`),

  // Lessons
  listLessons: (studentId?: string) =>
    request<Lesson[]>(`/lessons${studentId ? `?student_id=${studentId}` : ""}`),
  getLesson: (id: string) => request<Lesson>(`/lessons/${id}`),
  generateLesson: (data: {
    student_id?: string;
    source_type: "material" | "topic";
    material_id?: string;
    topic?: string;
    profile_id: string;
  }) =>
    request<Lesson>("/lessons/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateLessonPlan: (id: string, data: { segments?: LessonPlanSegment[]; status?: string }) =>
    request<Lesson>(`/lessons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Sessions
  createSession: (lessonId: string) =>
    request<LessonSession>("/session/create", {
      method: "POST",
      body: JSON.stringify({ lesson_id: lessonId }),
    }),
  getSession: (id: string) => request<LessonSession>(`/session/${id}`),
  updateSession: (id: string, data: { language?: string; status?: string; current_step?: number }) =>
    request<LessonSession>(`/session/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  nextSegment: (sessionId: string) =>
    request<LessonSession>(`/session/${sessionId}/next-segment`, {
      method: "POST",
    }),
  explainAgain: (sessionId: string, focus?: string) =>
    request<{ status: string; new_explanation: string; retry_count: number }>(
      `/session/${sessionId}/explain-again`,
      {
        method: "POST",
        body: JSON.stringify({ focus }),
      }
    ),
  submitAnswer: (sessionId: string, questionId: string, responseText: string, isUnsure: boolean = false) =>
    request<EvaluationResponse>(`/session/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({ question_id: questionId, response_text: responseText, is_unsure: isUnsure }),
    }),

  // Assessment & Reports
  generateAssessment: (sessionId: string) =>
    request<Assessment>(`/session/${sessionId}/assessment/generate`, {
      method: "POST",
    }),
  submitAssessment: (sessionId: string, answers: Record<string, string>) =>
    request<Assessment>(`/session/${sessionId}/assessment/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  getReport: (sessionId: string) => request<LearningReport>(`/session/${sessionId}/report`),
};

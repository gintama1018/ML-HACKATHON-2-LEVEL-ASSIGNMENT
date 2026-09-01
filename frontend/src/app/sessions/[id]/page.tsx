"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AvatarTeacher } from "@/components/avatar/AvatarTeacher";
import { Whiteboard } from "@/components/whiteboard/Whiteboard";
import { AdaptiveQuestionCard } from "@/components/teaching/AdaptiveQuestionCard";
import { RAGCitationChip } from "@/components/teaching/RAGCitationChip";
import { speechController } from "@/lib/speech";
import { api, LessonSession, EvaluationResponse, AskTeacherResponse, VideoJobResponse } from "@/lib/api";
import { useLanguage, SupportedLanguage } from "@/context/LanguageContext";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  LogOut,
  Subtitles,
  Languages,
  MessageSquare,
  Video,
  Send,
  Sparkles,
  Download,
  AlertCircle
} from "lucide-react";

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default function TeachingSessionPage({ params }: SessionPageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const router = useRouter();
  const { language: globalLang, setLanguage: setGlobalLang, t } = useLanguage();

  const [session, setSession] = useState<LessonSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"interactive" | "video">("interactive");

  // Audio / Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [currentSpokenWord, setCurrentSpokenWord] = useState("");
  const [activeCharIndex, setActiveCharIndex] = useState(-1);

  // Evaluation & Remediation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResponse | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [languageToast, setLanguageToast] = useState<string | null>(null);

  // Ask Teacher State
  const [doubtInput, setDoubtInput] = useState("");
  const [isAskingDoubt, setIsAskingDoubt] = useState(false);
  const [doubtHistory, setDoubtHistory] = useState<Array<{ q: string; a: AskTeacherResponse }>>([]);
  const [showDoubtDrawer, setShowDoubtDrawer] = useState(false);

  // Video Generation State
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoData, setVideoData] = useState<VideoJobResponse | null>(null);

  const loadSession = async () => {
    try {
      const s = await api.getSession(sessionId);
      setSession(s);
      if (s.language && (s.language === "Hindi" || s.language === "Hinglish" || s.language === "English" || s.language === "Tamil" || s.language === "Bengali")) {
        setGlobalLang(s.language as SupportedLanguage);
      }
      if (s.video_url) {
        setVideoData({
          job_id: "persisted",
          status: "ready",
          video_url: s.video_url,
          scenes: s.video_scenes || [],
          mode: "ai_video_engine"
        });
      }

      if (s.status === "assessment") {
        router.push(`/sessions/${sessionId}/assessment`);
      } else if (s.status === "completed") {
        router.push(`/sessions/${sessionId}/report`);
      }
    } catch (err: any) {
      console.error("Failed to load session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    speechController.setCallbacks(
      (charIndex, charLength, word) => {
        setActiveCharIndex(charIndex);
        setCurrentSpokenWord(word);
      },
      (speaking, paused) => {
        setIsSpeaking(speaking);
        setIsPaused(paused);
      }
    );

    return () => {
      speechController.stop();
    };
  }, []);

  useEffect(() => {
    if (session?.current_segment?.explanation_text && !isMuted && activeTab === "interactive") {
      speechController.speak(session.current_segment.explanation_text, session.language);
    }
  }, [session?.current_segment?.id, session?.current_segment?.explanation_text, activeTab]);

  const handlePlayPause = () => {
    if (isSpeaking) {
      if (isPaused) {
        speechController.resume();
      } else {
        speechController.pause();
      }
    } else if (session?.current_segment?.explanation_text) {
      speechController.speak(session.current_segment.explanation_text, session.language);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (session?.current_segment?.explanation_text) {
        speechController.speak(session.current_segment.explanation_text, session.language);
      }
    } else {
      setIsMuted(true);
      speechController.stop();
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    speechController.setRate(speed);
  };

  const handleLanguageSwitch = async (newLang: string) => {
    if (!session) return;
    try {
      speechController.stop();
      setLanguageToast(`Translating teaching session to ${newLang}...`);
      const updated = await api.updateSession(session.id, { language: newLang });
      setSession(updated);
      setGlobalLang(newLang as SupportedLanguage);
      setTimeout(() => setLanguageToast(null), 3000);
    } catch (err: any) {
      console.error("Failed to switch language:", err);
      setLanguageToast(err.message || "Failed to switch language.");
      setTimeout(() => setLanguageToast(null), 4000);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!session || !session.current_question) return;
    setIsEvaluating(true);
    try {
      const result = await api.submitAnswer(session.id, session.current_question.id, answer, false);
      setEvaluationResult(result);
      const voiceText = result.feedback || result.notes;
      if (voiceText) {
        speechController.speak(voiceText, session.language);
      }
    } catch (err: any) {
      console.error("Failed to submit answer:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleContinue = async () => {
    if (!session) return;
    setEvaluationResult(null);
    try {
      const updated = await api.nextSegment(session.id);
      setSession(updated);
      if (updated.status === "assessment") {
        router.push(`/sessions/${session.id}/assessment`);
      } else if (updated.status === "completed") {
        router.push(`/sessions/${session.id}/report`);
      }
    } catch (err: any) {
      console.error("Failed to advance segment:", err);
    }
  };

  const handleExplainAgain = async () => {
    if (!session) return;
    setEvaluationResult(null);
    try {
      const res = await api.explainAgain(session.id);
      if (session.current_segment) {
        setSession({
          ...session,
          current_segment: {
            ...session.current_segment,
            explanation_text: res.new_explanation,
            retry_count: res.retry_count
          }
        });
        speechController.speak(res.new_explanation, session.language);
      }
    } catch (err: any) {
      console.error("Failed to re-explain:", err);
    }
  };

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtInput.trim() || !session) return;
    setIsAskingDoubt(true);
    const q = doubtInput.trim();
    setDoubtInput("");
    try {
      const ans = await api.askTeacher(session.id, q);
      setDoubtHistory((prev) => [...prev, { q, a: ans }]);
      speechController.speak(ans.answer, session.language);
    } catch (err: any) {
      console.error("Failed to ask doubt:", err);
    } finally {
      setIsAskingDoubt(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!session) return;
    setIsGeneratingVideo(true);
    try {
      const job = await api.generateVideo({
        session_id: session.id,
        lesson_topic: session.lesson?.topic || "Comprehensive AI Lesson",
        language: session.language
      });
      setVideoData(job);
      if (job.video_url) {
        setActiveTab("video");
      }
    } catch (err: any) {
      console.error("Failed to generate video:", err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  if (isLoading || !session) {
    return (
      <AppShell pageTitle="Autonomous AI Classroom">
        <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Entering interactive classroom workspace...</p>
        </div>
      </AppShell>
    );
  }

  const currentSegment = session.current_segment;
  const currentSegmentIdx = session.current_step || 0;
  const totalSegments = session.total_segments || 1;

  return (
    <AppShell pageTitle="Autonomous AI Classroom">
      <div className="space-y-4 max-w-6xl mx-auto">
        {/* Workspace Telemetry Header Capsule (P1 Surface) */}
        <div className="p-4 sm:px-6 sm:py-3.5 bg-[#0f172a] text-white rounded-3xl sm:rounded-full border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
              0{currentSegmentIdx + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-300">
                  Segment {currentSegmentIdx + 1} of {totalSegments}
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {session.lesson?.topic || "Curriculum Session"}
                </span>
              </div>
              <h1 className="font-heading font-bold text-sm sm:text-base text-white tracking-tight">
                {currentSegment?.concept || "Interactive Classroom Concept"}
              </h1>
            </div>
          </div>

          {/* Mode Tabs & Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Mode Switcher Pill */}
            <div className="flex bg-slate-900 p-1 rounded-full border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("interactive")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer interactive-tactile ${
                  activeTab === "interactive"
                    ? "bg-white text-[#0f172a] shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Live Interactive
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("video")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer interactive-tactile flex items-center gap-1.5 ${
                  activeTab === "video"
                    ? "bg-white text-[#0f172a] shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Video className="w-3 h-3 text-emerald-400" />
                <span>AI Video</span>
              </button>
            </div>

            {/* Ask Doubt Pill */}
            <button
              type="button"
              onClick={() => setShowDoubtDrawer(!showDoubtDrawer)}
              className={`px-4 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer interactive-tactile flex items-center gap-1.5 ${
                showDoubtDrawer
                  ? "bg-white text-[#0f172a] border-white"
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Ask Doubt</span>
            </button>

            {/* Language Switcher Pill */}
            <select
              value={session.language}
              onChange={(e) => handleLanguageSwitch(e.target.value)}
              className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs font-medium text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Bengali">Bengali (বাংলা)</option>
            </select>

            {/* Exit Session Pill Button */}
            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
              title="Exit Lesson"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Language Switching Alert */}
        {languageToast && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-900 flex items-center gap-2 px-6">
            <Languages className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{languageToast}</span>
          </div>
        )}

        {/* MODE 1: INTERACTIVE CLASSROOM VIEW */}
        {activeTab === "interactive" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (5 cols): Teacher Avatar + Synchronized Audio & Captions */}
            <div className="lg:col-span-5 flex flex-col space-y-4 lg:sticky lg:top-18 self-start">
              {/* Teacher Avatar Canvas */}
              <div className="h-48 sm:h-56 w-full bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <AvatarTeacher
                  isSpeaking={isSpeaking && !isPaused}
                  mood={isEvaluating ? "thinking" : evaluationResult?.correct ? "encouraging" : "explaining"}
                  currentWord={currentSpokenWord}
                  playbackSpeed={playbackSpeed}
                />
              </div>

              {/* Audio Controls Capsule Bar */}
              <div className="p-2.5 sm:px-4 bg-white rounded-full border border-slate-200 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    className="p-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-full transition interactive-tactile cursor-pointer"
                  >
                    {isSpeaking && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`p-2 rounded-full border transition interactive-tactile cursor-pointer ${
                      isMuted
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full text-xs">
                  {[0.75, 1.0, 1.25].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold transition cursor-pointer interactive-tactile ${
                        playbackSpeed === speed
                          ? "bg-white text-[#0f172a] shadow-xs"
                          : "text-slate-500"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCaptions(!showCaptions)}
                  className={`p-2 rounded-full border transition interactive-tactile cursor-pointer ${
                    showCaptions
                      ? "bg-slate-100 border-slate-300 text-[#0f172a]"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                  title="Toggle Captions"
                >
                  <Subtitles className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Spoken Script Captions */}
              {showCaptions && currentSegment && (
                <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2 max-h-52 overflow-y-auto">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <Subtitles className="w-3.5 h-3.5 text-slate-600" />
                    Teacher Script
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    {currentSegment.explanation_text}
                  </p>
                </div>
              )}

              {/* RAG Source Citation Chip */}
              {currentSegment?.source_citations && currentSegment.source_citations.length > 0 && (
                <RAGCitationChip citations={currentSegment.source_citations} />
              )}
            </div>

            {/* RIGHT COLUMN (7 cols): Primary Whiteboard & Adaptive Question Card */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              {/* Whiteboard Canvas (Primary Focus) */}
              <div className="h-64 sm:h-72 w-full bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <Whiteboard
                  concept={currentSegment?.concept || "Core Concept"}
                  visualType={currentSegment?.visual_type || "chart"}
                  visualSpec={currentSegment?.visual_spec || {}}
                />
              </div>

              {/* Adaptive Question Stream */}
              {session.current_question && (
                <AdaptiveQuestionCard
                  question={session.current_question}
                  isEvaluating={isEvaluating}
                  evaluationResult={evaluationResult}
                  onSubmitAnswer={handleSubmitAnswer}
                  onContinue={handleContinue}
                  onExplainAgain={handleExplainAgain}
                  retryCount={currentSegment?.retry_count || 0}
                />
              )}
            </div>
          </div>
        )}

        {/* MODE 2: AI-GENERATED TEACHING VIDEO (.MP4) */}
        {activeTab === "video" && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {videoData && videoData.video_url ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading font-bold text-base text-[#0f172a]">
                      AI Video: {session.current_segment?.concept || "Comprehensive Lesson"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Multi-scene 720p MP4 with animated avatar, whiteboard visuals & synchronized TTS
                    </p>
                  </div>
                  <a
                    href={`http://localhost:8000${videoData.video_url}`}
                    download
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition interactive-tactile"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </a>
                </div>

                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-md">
                  <video
                    controls
                    autoPlay
                    src={`http://localhost:8000${videoData.video_url}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
                <Video className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-heading font-bold text-base text-[#0f172a]">Generate Educational Video</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Synthesize a composite 720p teaching video with TTS narration and whiteboard diagrams.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo}
                  className="px-6 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-full transition interactive-tactile inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isGeneratingVideo ? "Synthesizing Scenes..." : "Generate AI Video"}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contextual Ask Doubt Drawer Capsule */}
        {showDoubtDrawer && (
          <div className="fixed bottom-20 right-4 sm:right-8 w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-6 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <h3 className="font-heading font-bold text-xs text-[#0f172a]">Ask AI Teacher a Doubt</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDoubtDrawer(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAskDoubt} className="flex gap-2">
              <input
                type="text"
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
                placeholder="Ask any question about this concept..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-[#0f172a] focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isAskingDoubt || !doubtInput.trim()}
                className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-40 text-white rounded-full transition interactive-tactile cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="max-h-56 overflow-y-auto space-y-2.5 pt-1">
              {isAskingDoubt && (
                <div className="p-2 bg-slate-50 rounded-full text-xs text-slate-500 flex items-center gap-2 px-4">
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>Teacher is formulating grounded answer...</span>
                </div>
              )}

              {doubtHistory.map((item, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="px-3.5 py-1.5 bg-slate-100 rounded-full font-semibold text-[#0f172a]">
                    You: {item.q}
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-slate-800">
                    <p className="leading-relaxed">{item.a.answer}</p>
                    {item.a.citations && item.a.citations.length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-500 font-mono">
                        Citations: {item.a.citations.map((c, i) => `[p.${c.page || 1}]`).join(" ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exit Modal */}
        {showExitModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="max-w-xs w-full bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-xl">
              <h3 className="font-heading text-sm font-bold text-[#0f172a]">Exit Teaching Session?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your progress will be saved. You can resume this session anytime from the dashboard.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition interactive-tactile cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="px-4 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-full transition interactive-tactile cursor-pointer"
                >
                  Exit to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

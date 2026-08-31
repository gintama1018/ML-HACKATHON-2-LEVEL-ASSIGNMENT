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
  Layers,
  Send,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle
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
      if (s.language && (s.language === "Hindi" || s.language === "Hinglish" || s.language === "English")) {
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
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    speechController.setMuted(nextMute);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    speechController.setRate(speed);
    if (isSpeaking && session?.current_segment?.explanation_text) {
      speechController.speak(session.current_segment.explanation_text, session?.language);
    }
  };

  const handleLanguageSwitch = async (newLang: string) => {
    try {
      setLanguageToast(`Switching to ${newLang}...`);
      setGlobalLang(newLang as SupportedLanguage);
      const updatedSession = await api.updateSession(sessionId, { language: newLang });
      setSession(updatedSession);
      setLanguageToast(`Switched to ${newLang}!`);
      setTimeout(() => setLanguageToast(null), 2500);

      if (updatedSession?.current_segment?.explanation_text && !isMuted) {
        speechController.speak(updatedSession.current_segment.explanation_text, newLang);
      }
    } catch (err) {
      console.error("Failed to switch language:", err);
    }
  };

  const handleSubmitAnswer = async (responseText: string, isUnsure: boolean = false) => {
    if (!session?.current_question) return;
    setIsEvaluating(true);

    try {
      const evalRes = await api.submitAnswer(sessionId, session.current_question.id, responseText, isUnsure);
      setEvaluationResult(evalRes);

      // Refresh session difficulty & state
      const refreshed = await api.getSession(sessionId);
      setSession(refreshed);

      if (!evalRes.correct && evalRes.new_explanation && !isMuted) {
        speechController.speak(evalRes.new_explanation, session.language);
      }
    } catch (err: any) {
      console.error("Failed to evaluate answer:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExplainAgain = async () => {
    try {
      const res = await api.explainAgain(sessionId);
      if (session && session.current_segment) {
        const updatedSeg = {
          ...session.current_segment,
          explanation_text: res.new_explanation,
          retry_count: res.retry_count,
        };
        setSession({ ...session, current_segment: updatedSeg });
        setEvaluationResult(null);
        if (!isMuted) {
          speechController.speak(res.new_explanation, session.language);
        }
      }
    } catch (err) {
      console.error("Failed to re-explain:", err);
    }
  };

  const handleContinue = async () => {
    setEvaluationResult(null);
    setIsLoading(true);

    try {
      const nextSession = await api.nextSegment(sessionId);
      setSession(nextSession);

      if (nextSession.status === "assessment") {
        router.push(`/sessions/${sessionId}/assessment`);
      }
    } catch (err) {
      console.error("Failed to advance segment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtInput.trim() || isAskingDoubt) return;

    const qText = doubtInput.trim();
    setDoubtInput("");
    setIsAskingDoubt(true);

    try {
      const resp = await api.askTeacher(sessionId, qText);
      setDoubtHistory((prev) => [{ q: qText, a: resp }, ...prev]);

      // Voice response through avatar
      if (!isMuted && resp.voice_script) {
        speechController.speak(resp.voice_script, session?.language || "English");
      }
    } catch (err) {
      console.error("Failed to ask doubt:", err);
    } finally {
      setIsAskingDoubt(false);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    try {
      const res = await api.generateVideo({
        session_id: sessionId,
        language: session?.language || "English"
      });
      setVideoData(res);
      setActiveTab("video");
    } catch (err) {
      console.error("Video generation failed:", err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  if (isLoading || !session) {
    return (
      <AppShell pageTitle="AI Classroom">
        <div className="max-w-xl mx-auto py-12 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Connecting to AI Teacher...</p>
        </div>
      </AppShell>
    );
  }

  const currentSegment = session.current_segment;
  const currentStep = session.current_step + 1;
  const totalSegments = session.total_segments || 3;
  const progressPct = Math.min(100, Math.round((currentStep / totalSegments) * 100));

  return (
    <AppShell pageTitle={`${t("class.concept")} ${currentStep}: ${currentSegment?.concept || "Interactive Lesson"}`}>
      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Top Control Bar with Mode Switcher & Difficulty */}
        <div className="px-4 py-2.5 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          {/* Progress & Difficulty Badge */}
          <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
            <span className="text-xs font-bold text-[#0b1c30] shrink-0">
              {t("class.concept")} {currentStep}/{totalSegments}
            </span>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              />
            </div>
            {/* Dynamic Difficulty Badge */}
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border ${
              session.current_difficulty === "Advanced"
                ? "bg-purple-50 text-purple-800 border-purple-200"
                : session.current_difficulty === "Beginner"
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}>
              Level: {session.current_difficulty}
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("interactive")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "interactive"
                  ? "bg-white text-[#0b1c30] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Classroom</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!videoData) handleGenerateVideo();
                else setActiveTab("video");
              }}
              disabled={isGeneratingVideo}
              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "video"
                  ? "bg-white text-[#0b1c30] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isGeneratingVideo ? "Rendering MP4..." : "AI Teaching Video"}</span>
            </button>
          </div>

          {/* Utilities: Ask Doubt, Language, Exit */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDoubtDrawer(!showDoubtDrawer)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                showDoubtDrawer
                  ? "bg-[#0f172a] text-white border-[#0f172a]"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Ask Doubt</span>
            </button>

            <select
              value={session.language}
              onChange={(e) => handleLanguageSwitch(e.target.value)}
              className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-[#0b1c30] cursor-pointer"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish</option>
            </select>

            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              title="Exit Lesson"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Language Toast */}
        {languageToast && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 flex items-center gap-2">
            <Languages className="w-3.5 h-3.5 text-amber-600" />
            <span>{languageToast}</span>
          </div>
        )}

        {/* MODE 1: INTERACTIVE CLASSROOM VIEW */}
        {activeTab === "interactive" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Sticky Teacher & Captions */}
            <div className="lg:col-span-5 flex flex-col space-y-3 lg:sticky lg:top-18 self-start">
              {/* Teacher Avatar */}
              <div className="h-44 sm:h-52 w-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <AvatarTeacher
                  isSpeaking={isSpeaking && !isPaused}
                  mood={isEvaluating ? "thinking" : evaluationResult?.correct ? "encouraging" : "explaining"}
                  currentWord={currentSpokenWord}
                  playbackSpeed={playbackSpeed}
                />
              </div>

              {/* Audio Controls */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    className="p-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg transition cursor-pointer"
                  >
                    {isSpeaking && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`p-2 rounded-lg border transition cursor-pointer ${
                      isMuted
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                  {[0.75, 1.0, 1.25].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold transition cursor-pointer ${
                        playbackSpeed === speed
                          ? "bg-white text-[#0b1c30] shadow-xs"
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
                  className={`p-2 rounded-lg border transition cursor-pointer ${
                    showCaptions
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                  title="Toggle Captions"
                >
                  <Subtitles className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Spoken Script Captions */}
              {showCaptions && currentSegment && (
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5 max-h-48 overflow-y-auto">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Subtitles className="w-3 h-3 text-emerald-600" /> {t("class.speaking_script")}
                  </p>
                  <p className="text-xs text-[#0b1c30] leading-relaxed italic">
                    {currentSegment.explanation_text}
                  </p>
                </div>
              )}

              {/* RAG Source Citation Chip */}
              {currentSegment?.source_citations && currentSegment.source_citations.length > 0 && (
                <RAGCitationChip citations={currentSegment.source_citations} />
              )}
            </div>

            {/* RIGHT COLUMN: Whiteboard & Seamless Adaptive Question Stream */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              {/* Whiteboard */}
              <div className="h-56 sm:h-64 w-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <Whiteboard
                  concept={currentSegment?.concept || "Core Concept"}
                  visualType={currentSegment?.visual_type || "chart"}
                  visualSpec={currentSegment?.visual_spec || {}}
                />
              </div>

              {/* Adaptive Question Card */}
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

        {/* MODE 2: REAL AI-GENERATED TEACHING VIDEO (.MP4) */}
        {activeTab === "video" && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {videoData && videoData.video_url ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-[#0b1c30]">
                      AI Teaching Video: {session.current_segment?.concept || "Comprehensive Lesson"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Multi-scene composite 720p MP4 with animated avatar, whiteboard visuals & synchronized speech audio
                    </p>
                  </div>
                  <a
                    href={`http://localhost:8000${videoData.video_url}`}
                    download
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP4</span>
                  </a>
                </div>

                {/* Real HTML5 Video Player */}
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 shadow-md">
                  <video
                    controls
                    autoPlay
                    src={`http://localhost:8000${videoData.video_url}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Scene Storyboard Timeline Markers */}
                {videoData.scenes && videoData.scenes.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Video Scene Storyboard Breakdown
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {videoData.scenes.map((sc, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700">Scene {sc.scene_index} ({sc.start_time}s - {sc.end_time}s)</span>
                          <p className="font-bold text-[#0b1c30] truncate">{sc.title}</p>
                          <span className="text-[10px] font-mono uppercase text-slate-500">[{sc.visual_type}]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 bg-white rounded-xl border border-slate-200 text-center space-y-3">
                <Video className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-heading font-bold text-sm text-[#0b1c30]">Generate Educational MP4 Video</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Render a complete 720p multi-scene teaching video with synchronized TTS audio tracks, whiteboard animations, and animated avatar narration.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo}
                  className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isGeneratingVideo ? "Synthesizing Scenes..." : "Generate AI Video"}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ASK THE TEACHER DOUBT DRAWER (Contextual Q&A) */}
        {showDoubtDrawer && (
          <div className="fixed bottom-16 right-4 sm:right-8 w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h4 className="font-heading font-bold text-xs text-[#0b1c30]">Ask AI Teacher a Doubt</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDoubtDrawer(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Doubt Input Form */}
            <form onSubmit={handleAskDoubt} className="flex gap-2">
              <input
                type="text"
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
                placeholder="Ask any question about this concept..."
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:border-[#0f172a]"
              />
              <button
                type="submit"
                disabled={isAskingDoubt || !doubtInput.trim()}
                className="p-2 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Conversation History */}
            <div className="max-h-56 overflow-y-auto space-y-2.5 pt-1">
              {isAskingDoubt && (
                <div className="p-2 bg-slate-50 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>Teacher is formulating grounded answer...</span>
                </div>
              )}

              {doubtHistory.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="p-2 bg-slate-100 rounded-lg font-bold text-[#0b1c30]">
                    You: {item.q}
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1 text-[#0b1c30]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800">
                      <span>AI Teacher</span>
                      <span>{item.a.is_grounded ? "✓ Verified Grounded" : "General Principles"}</span>
                    </div>
                    <p className="leading-relaxed">{item.a.answer}</p>
                    {item.a.citations && item.a.citations.length > 0 && (
                      <div className="pt-1 text-[10px] text-emerald-700 font-mono">
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
            <div className="max-w-xs w-full bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xl">
              <h3 className="font-heading text-sm font-bold text-[#0b1c30]">{t("class.exit_confirm")}</h3>
              <p className="text-xs text-slate-500">
                {t("class.exit_desc")}
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  {t("class.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg"
                >
                  {t("class.exit_dashboard")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

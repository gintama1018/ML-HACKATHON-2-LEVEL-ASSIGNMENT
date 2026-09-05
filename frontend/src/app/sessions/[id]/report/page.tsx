"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  api,
  LearningReport,
  FlashcardsResponse,
  StudyNotesResponse,
  ConceptMapResponse
} from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import confetti from "canvas-confetti";
import {
  Trophy,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Layers,
  FileText,
  GitFork,
  RotateCw,
  Copy,
  Check,
  Sparkles,
  Bookmark
} from "lucide-react";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default function LearningReportPage({ params }: ReportPageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const router = useRouter();
  const { t } = useLanguage();

  const [report, setReport] = useState<LearningReport | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Section 18 Advanced Features State
  const [activeTab, setActiveTab] = useState<"overview" | "flashcards" | "notes" | "concept_map">("overview");
  const [flashcardsData, setFlashcardsData] = useState<FlashcardsResponse | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyNotesData, setStudyNotesData] = useState<StudyNotesResponse | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [conceptMapData, setConceptMapData] = useState<ConceptMapResponse | null>(null);
  const [isLoadingFeature, setIsLoadingFeature] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const r = await api.getReport(sessionId);
        setReport(r);

        if (r.score >= 70) {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load report.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  const loadFlashcards = async () => {
    if (flashcardsData) return;
    setIsLoadingFeature(true);
    try {
      const data = await api.getFlashcards(sessionId);
      setFlashcardsData(data);
    } catch (e) {
      console.error("Failed to load flashcards:", e);
    } finally {
      setIsLoadingFeature(false);
    }
  };

  const loadStudyNotes = async () => {
    if (studyNotesData) return;
    setIsLoadingFeature(true);
    try {
      const data = await api.getStudyNotes(sessionId);
      setStudyNotesData(data);
    } catch (e) {
      console.error("Failed to load study notes:", e);
    } finally {
      setIsLoadingFeature(false);
    }
  };

  const loadConceptMap = async () => {
    if (conceptMapData) return;
    setIsLoadingFeature(true);
    try {
      const data = await api.getConceptMap(sessionId);
      setConceptMapData(data);
    } catch (e) {
      console.error("Failed to load concept map:", e);
    } finally {
      setIsLoadingFeature(false);
    }
  };

  const handleTabChange = (tab: "overview" | "flashcards" | "notes" | "concept_map") => {
    setActiveTab(tab);
    if (tab === "flashcards") loadFlashcards();
    if (tab === "notes") loadStudyNotes();
    if (tab === "concept_map") loadConceptMap();
  };

  const handleCopyNotes = () => {
    if (!studyNotesData) return;
    navigator.clipboard.writeText(studyNotesData.summary_markdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStartRecommended = (nextTopic: string) => {
    sessionStorage.setItem("draft_source_type", "topic");
    sessionStorage.setItem("draft_topic", nextTopic);
    router.push("/lessons/new/profile");
  };

  if (isLoading || !report) {
    return (
      <AppShell pageTitle="Diagnostic Learning Report">
        <div className="max-w-xl mx-auto py-16 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Compiling personalized mastery assessment...</p>
        </div>
      </AppShell>
    );
  }

  const scorePct = report.score;
  const isMastered = scorePct >= 70;

  return (
    <AppShell pageTitle="Diagnostic Learning Report">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Score Header (P1 Surface Capsule) */}
        <div className="p-6 bg-[#0f172a] text-white rounded-3xl text-center space-y-2 shadow-sm border border-slate-800">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h1 className="font-heading text-4xl font-extrabold text-white tracking-tight">
              {scorePct}%
            </h1>
          </div>
          <p className="text-xs font-semibold text-emerald-400">
            {isMastered ? "Concept Mastery Verified" : "Revision & Targeted Practice Recommended"}
          </p>
          <p className="text-xs text-slate-400">
            {report.correct_answers} of {report.total_questions} questions answered correctly
          </p>
        </div>

        {/* Section 18 Advanced Pedagogical Features Tab Switcher */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100 rounded-full max-w-xl mx-auto border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "overview" ? "bg-white text-[#0f172a] shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("flashcards")}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "flashcards" ? "bg-white text-[#0f172a] shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Flashcards</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("notes")}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "notes" ? "bg-white text-[#0f172a] shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Study Notes</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("concept_map")}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "concept_map" ? "bg-white text-[#0f172a] shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-amber-600" />
            <span>Concept Map</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & DIAGNOSTICS */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 2-Column Mastery vs Revision Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Mastered Concepts</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.strong_areas.map((area, idx) => (
                    <span key={idx} className="px-3 py-1 bg-emerald-50 text-slate-800 border border-emerald-200 rounded-full text-xs font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Target Revision Areas</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.weak_areas.length > 0 ? (
                    report.weak_areas.map((area, idx) => (
                      <span key={idx} className="px-3 py-1 bg-amber-50 text-slate-800 border border-amber-200 rounded-full text-xs font-medium">
                        {area}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No cognitive misconceptions detected!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recommended Next Step Capsule */}
            {report.recommended_next_topic && (
              <div className="px-6 py-4 bg-white border border-slate-200 rounded-full shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Recommended Next Step
                  </span>
                  <h2 className="font-heading font-bold text-sm text-[#0f172a] truncate">
                    {report.recommended_next_topic}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartRecommended(report.recommended_next_topic!)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition interactive-tactile flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <span>Start Next Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Detailed Question Diagnostic Breakdown */}
            {report.detailed_breakdown && report.detailed_breakdown.length > 0 && (
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="w-full flex items-center justify-between text-xs font-bold text-[#0f172a] cursor-pointer"
                >
                  <span>Detailed Question Diagnostic Log</span>
                  {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showBreakdown && (
                  <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                    {report.detailed_breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border text-xs space-y-2 ${
                          item.is_correct ? "bg-slate-50 border-slate-200" : "bg-rose-50/50 border-rose-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-500">
                            Q0{idx + 1} · {item.concept}
                          </span>
                          <span
                            className={`font-bold px-2.5 py-0.5 rounded-full ${
                              item.is_correct ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {item.is_correct ? "✓ Correct" : "✗ Needs Review"}
                          </span>
                        </div>

                        <p className="font-semibold text-[#0f172a]">{item.prompt}</p>

                        <div className="space-y-1 text-slate-600">
                          <p>
                            <span className="font-semibold text-slate-700">Your Answer:</span>{" "}
                            {item.student_answer}
                          </p>
                          {!item.is_correct && (
                            <p>
                              <span className="font-semibold text-emerald-800">Correct Answer:</span>{" "}
                              {item.correct_answer}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE RECALL FLASHCARDS */}
        {activeTab === "flashcards" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {isLoadingFeature ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Synthesizing active recall flashcards...
              </div>
            ) : flashcardsData && flashcardsData.flashcards.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 px-2">
                  <span className="font-semibold">
                    Card {currentCardIdx + 1} of {flashcardsData.flashcards.length}
                  </span>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                    {flashcardsData.flashcards[currentCardIdx].concept}
                  </span>
                </div>

                {/* Tactile Flashcard */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-56 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between select-none relative overflow-hidden group"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      {isFlipped ? "Answer & Explanation" : "Prompt / Question"}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1 group-hover:underline">
                      <RotateCw className="w-3 h-3" />
                      Click to {isFlipped ? "flip back" : "reveal answer"}
                    </span>
                  </div>

                  <div className="py-6 text-center">
                    <p className={`font-heading text-base sm:text-lg font-bold ${isFlipped ? "text-emerald-900" : "text-[#0f172a]"}`}>
                      {isFlipped ? flashcardsData.flashcards[currentCardIdx].back : flashcardsData.flashcards[currentCardIdx].front}
                    </p>
                    {isFlipped && flashcardsData.flashcards[currentCardIdx].mnemonic && (
                      <div className="mt-4 inline-block px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800 font-medium">
                        💡 Mnemonic: {flashcardsData.flashcards[currentCardIdx].mnemonic}
                      </div>
                    )}
                  </div>

                  <div className="text-center text-[11px] text-slate-400">
                    Spaced Recall · Test yourself before revealing
                  </div>
                </div>

                {/* Flashcard Controls */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={currentCardIdx === 0}
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentCardIdx((prev) => Math.max(0, prev - 1));
                    }}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-full transition cursor-pointer"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="px-6 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Flip Card</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentCardIdx >= flashcardsData.flashcards.length - 1}
                    onClick={() => {
                      setIsFlipped(false);
                      setCurrentCardIdx((prev) => Math.min(flashcardsData.flashcards.length - 1, prev + 1));
                    }}
                    className="px-5 py-2 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-full transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
                No flashcards available for this lesson.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDY NOTES & FORMULA CHEAT SHEET */}
        {activeTab === "notes" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {isLoadingFeature ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Assembling structured study notes...
              </div>
            ) : studyNotesData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#0f172a]">
                      Revision Cheat Sheet: {studyNotesData.topic}
                    </h3>
                    <p className="text-xs text-slate-500">Comprehensive summary & core governing principles</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyNotes}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-full transition cursor-pointer flex items-center gap-1.5"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied!" : "Copy Notes"}</span>
                  </button>
                </div>

                {/* Key Takeaways */}
                <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Key Takeaways & Core Rules
                  </span>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {studyNotesData.key_takeaways.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Definitions & Formulas */}
                <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
                  <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-indigo-600" />
                    Essential Concepts & Definitions
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {studyNotesData.formulas_or_definitions.map((item, i) => (
                      <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                        <h4 className="font-bold text-[#0f172a]">{item.term}</h4>
                        <p className="text-slate-600 leading-relaxed">{item.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Next Actions */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-xs text-emerald-900 space-y-1.5 px-6">
                  <span className="font-bold">Next Action Plan:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                    {studyNotesData.recommended_actions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 4: INTERACTIVE CONCEPT MAP */}
        {activeTab === "concept_map" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {isLoadingFeature ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
                <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Generating conceptual pathway graph...
              </div>
            ) : conceptMapData ? (
              <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#0f172a]">
                      Curriculum Knowledge Graph: {conceptMapData.topic}
                    </h3>
                    <p className="text-xs text-slate-500">Prerequisites $\rightarrow$ Core Concepts $\rightarrow$ Real-World Applications</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered
                    </span>
                    <span className="flex items-center gap-1 text-amber-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Reviewing
                    </span>
                  </div>
                </div>

                {/* Visual Flow Pipeline */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-6 flex-wrap">
                  {conceptMapData.nodes.map((node, idx) => (
                    <React.Fragment key={node.id}>
                      <div
                        className={`px-4 py-3 rounded-2xl border text-center shadow-xs min-w-[140px] max-w-[200px] space-y-1 transition hover:scale-105 ${
                          node.status === "mastered"
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                            : "bg-amber-50/70 border-amber-300 text-amber-950"
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          {node.type}
                        </span>
                        <p className="text-xs font-bold truncate">{node.label}</p>
                      </div>

                      {idx < conceptMapData.nodes.length - 1 && (
                        <div className="hidden sm:flex flex-col items-center justify-center text-slate-400">
                          <span className="text-[10px] font-mono mb-0.5">{conceptMapData.edges[idx]?.label || "→"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Return to Dashboard */}
        <div className="flex items-center justify-center pt-2">
          <Link
            href="/"
            className="px-5 py-2 bg-slate-100 hover:bg-[#0f172a] hover:text-white rounded-full text-xs font-bold text-[#0f172a] flex items-center gap-2 transition interactive-tactile"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Student Dashboard</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

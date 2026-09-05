"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import {
  CheckCircle2,
  FileSearch,
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  AlertCircle
} from "lucide-react";

interface ProcessingPageProps {
  params: Promise<{ id: string }>;
}

export default function ProcessingPage({ params }: ProcessingPageProps) {
  const resolvedParams = use(params);
  const materialId = resolvedParams.id;
  const router = useRouter();

  const [jobStatus, setJobStatus] = useState<string>("extracting");
  const [progress, setProgress] = useState<number>(20);
  const [stageMessage, setStageMessage] = useState<string>("Reading file and extracting semantic sections");
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const jobId = sessionStorage.getItem("current_analysis_job_id");
    
    // Direct check on material in case extraction already completed
    if (materialId) {
      api.getMaterial(materialId).then((mat) => {
        if (mat && (mat.status === "ready" || mat.extracted_summary)) {
          if (mat.extracted_summary) setSummary(mat.extracted_summary);
          setJobStatus("ready");
          setProgress(100);
        }
      }).catch(() => {});
    }

    if (!jobId) {
      return;
    }

    let intervalId: any = null;

    const pollStatus = async () => {
      setPollCount((prev) => prev + 1);
      try {
        const res = await api.getAnalysisStatus(jobId);
        setJobStatus(res.status);
        setProgress(res.progress);
        setStageMessage(res.stage);
        if (res.summary) {
          setSummary(res.summary);
        }

        if (res.status === "ready") {
          clearInterval(intervalId);
        } else if (res.status === "failed") {
          setError(res.details || "Content analysis failed.");
          clearInterval(intervalId);
        }
      } catch (err: any) {
        console.error("Polling error:", err);
        // Fallback: check material table directly
        if (materialId) {
          api.getMaterial(materialId).then((mat) => {
            if (mat && (mat.status === "ready" || mat.extracted_summary)) {
              if (mat.extracted_summary) setSummary(mat.extracted_summary);
              setJobStatus("ready");
              setProgress(100);
              clearInterval(intervalId);
            }
          }).catch(() => {});
        }
      }
    };

    intervalId = setInterval(pollStatus, 1200);
    pollStatus();

    return () => clearInterval(intervalId);
  }, [materialId]);

  const handleContinueToPlan = async () => {
    setIsGeneratingLesson(true);
    setError(null);
    try {
      const student = await api.getDefaultStudent();
      const level = (sessionStorage.getItem("draft_level") || "Beginner") as any;
      const available_time = (sessionStorage.getItem("draft_time") || "20 min") as any;
      const language = sessionStorage.getItem("draft_language") || "English";
      const objective = sessionStorage.getItem("draft_objective") || "Concept Mastery";
      const depth = sessionStorage.getItem("draft_depth") || "Standard";
      const style = sessionStorage.getItem("draft_style") || "Simple & example-heavy";
      const existingKnowledge = sessionStorage.getItem("draft_existing_knowledge") || "";
      const specialInstruction = sessionStorage.getItem("draft_special_instruction") || "";

      const combinedContext = [
        existingKnowledge.trim(),
        specialInstruction.trim() ? `Instruction: ${specialInstruction.trim()}` : ""
      ].filter(Boolean).join(". ");

      const lesson = await api.generateLesson({
        student_id: student.id,
        source_type: "material",
        material_id: materialId,
        level,
        available_time,
        language,
        objective,
        depth,
        style,
        existing_knowledge: combinedContext || undefined
      });

      router.push(`/lessons/${lesson.id}/plan`);
    } catch (err: any) {
      setError(err.message || "Failed to generate lesson structure.");
      setIsGeneratingLesson(false);
    }
  };

  const stages = [
    { label: "Reading & Parsing File", minProgress: 25 },
    { label: "1500-Char Semantic Chunking", minProgress: 50 },
    { label: "384-Dim ChromaDB Vector Indexing", minProgress: 75 },
    { label: "Pedagogical Knowledge Synthesis", minProgress: 100 },
  ];

  return (
    <AppShell pageTitle="Analyzing Document">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with Pill Badge */}
        <div className="p-6 bg-[#0f172a] text-white rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-300 bg-slate-800 px-3 py-0.5 rounded-full border border-slate-700">
              RAG Ingestion Pipeline
            </span>
          </div>

          <h1 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
            {jobStatus === "ready" ? "Document Analysis Complete" : "Analyzing Educational Document"}
          </h1>

          <p className="text-xs text-slate-300">
            {stageMessage}...
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Multi-Stage Breakdown */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-heading font-bold text-sm text-[#0f172a]">
            Ingestion Pipeline Stages
          </h2>

          <div className="space-y-2.5">
            {stages.map((stg, idx) => {
              const isDone = progress >= stg.minProgress;
              const isCurrent = progress < stg.minProgress && (idx === 0 || progress >= stages[idx - 1].minProgress);

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    isDone
                      ? "bg-slate-50 border-slate-200 text-slate-800 font-medium"
                      : isCurrent
                      ? "bg-white border-emerald-600 shadow-xs font-semibold"
                      : "bg-slate-50/50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span>{stg.label}</span>
                  </div>

                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    isDone ? "bg-emerald-50 text-emerald-800" : isCurrent ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-500"
                  }`}>
                    {isDone ? "Completed" : isCurrent ? "Processing" : "Queued"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Extracted Concepts & Structure Display (REQ-18, RAG Grounding Proof) */}
          {summary && (
            <div className="p-4.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h3 className="font-heading font-bold text-xs text-[#0f172a] uppercase tracking-wider">
                  Grounding Knowledge Extracted from Document
                </h3>
              </div>

              {summary.summary && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {summary.summary}
                </p>
              )}

              {summary.key_concepts && summary.key_concepts.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Core Concepts Extracted:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.key_concepts.map((concept: any, cIdx: number) => {
                      const text = typeof concept === "string" ? concept : concept?.name || concept?.title || String(concept);
                      return (
                        <span
                          key={cIdx}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-800 shadow-2xs"
                        >
                          {text}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {summary.sections && summary.sections.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Detected Sections & Chapters:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.sections.map((sec: any, sIdx: number) => {
                      const label = typeof sec === "string" ? sec : sec?.name || sec?.title || `Section ${sIdx + 1}`;
                      return (
                        <span
                          key={sIdx}
                          className="px-2.5 py-0.5 bg-slate-200/70 rounded-md text-[11px] font-mono text-slate-700"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action on Complete or after initial polling with Pill Button */}
          {(jobStatus === "ready" || pollCount >= 6 || error) && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 text-center sm:text-left">
                {jobStatus === "ready"
                  ? "✓ Concept extraction ready."
                  : "Document analysis active in background. You can proceed directly to curriculum planning."}
              </span>
              <button
                type="button"
                onClick={handleContinueToPlan}
                disabled={isGeneratingLesson}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition interactive-tactile flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
              >
                {isGeneratingLesson ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Structuring Plan...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Lesson Structure</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

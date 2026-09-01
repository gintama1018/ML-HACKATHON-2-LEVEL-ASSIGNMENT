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

  useEffect(() => {
    const jobId = sessionStorage.getItem("current_analysis_job_id");
    if (!jobId) {
      api.getMaterial(materialId).then((mat) => {
        if (mat.extracted_summary) {
          setSummary(mat.extracted_summary);
          setJobStatus("ready");
          setProgress(100);
        }
      });
      return;
    }

    let intervalId: any = null;

    const pollStatus = async () => {
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
      }
    };

    intervalId = setInterval(pollStatus, 800);
    pollStatus();

    return () => clearInterval(intervalId);
  }, [materialId]);

  const handleContinueToPlan = async () => {
    setIsGeneratingLesson(true);
    setError(null);
    try {
      const student = await api.getDefaultStudent();
      const profileId = sessionStorage.getItem("current_profile_id");

      const lesson = await api.generateLesson({
        student_id: student.id,
        source_type: "material",
        material_id: materialId,
        profile_id: profileId || "default",
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
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
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

          {/* Action on Complete with Pill Button */}
          {jobStatus === "ready" && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleContinueToPlan}
                disabled={isGeneratingLesson}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition interactive-tactile flex items-center gap-2 cursor-pointer shadow-xs"
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

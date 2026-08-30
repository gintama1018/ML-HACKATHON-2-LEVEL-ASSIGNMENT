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
  AlertCircle,
  RotateCcw
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
      // Fallback direct status check
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

      // Generate lesson from analyzed material
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
    { label: "Chunking & Structuring", minProgress: 50 },
    { label: "Vector Embedding & Chroma Index", minProgress: 75 },
    { label: "Extracting Pedagogical Concepts", minProgress: 90 },
  ];

  return (
    <AppShell pageTitle="Content Understanding">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 3 of 3</span>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Understanding your material
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Our AI Content Analyzer is extracting key concepts, chapter structures, and building vector embeddings.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => router.push("/lessons/new")}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold"
            >
              Switch to Topic Mode
            </button>
          </div>
        )}

        {/* Multi-Stage Stepped Progress Bar */}
        <div className="p-6 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-indigo-300">{stageMessage}</span>
              <span className="text-slate-400">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500 shadow"
              />
            </div>
          </div>

          {/* Checklist of stages */}
          <div className="space-y-2.5 pt-2">
            {stages.map((st, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                {progress >= st.minProgress ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-700 shrink-0" />
                )}
                <span className={progress >= st.minProgress ? "text-slate-200 font-medium" : "text-slate-500"}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* "Here's what I found" Proof Card (Appears once ready) */}
        {summary && jobStatus === "ready" && (
          <div className="p-6 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Here&apos;s what the AI understood:</span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Detected Subject Title</p>
                <p className="text-sm font-bold text-slate-100">{summary.title || "Study Material"}</p>
              </div>

              {summary.key_concepts && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Extracted Key Concepts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {summary.key_concepts.map((concept: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-900 border border-indigo-500/20 text-indigo-200 text-xs rounded-lg font-medium"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-indigo-500/20 flex justify-end">
              <button
                type="button"
                onClick={handleContinueToPlan}
                disabled={isGeneratingLesson}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                {isGeneratingLesson ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Structuring Plan...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Lesson Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

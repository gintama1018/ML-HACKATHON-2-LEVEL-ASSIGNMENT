"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api, LearningReport } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import confetti from "canvas-confetti";
import {
  Trophy,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard
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

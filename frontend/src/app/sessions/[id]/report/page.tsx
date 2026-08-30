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
  RotateCcw,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Zap
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

        if (r.score >= 75) {
          confetti({
            particleCount: 70,
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
      <AppShell pageTitle={t("report.title")}>
        <div className="max-w-xl mx-auto py-12 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Compiling report...</p>
        </div>
      </AppShell>
    );
  }

  const scorePct = report.score;
  const isPassing = scorePct >= 65;

  return (
    <AppShell pageTitle={t("report.title")}>
      <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
        {/* Score Header */}
        <div className="p-6 bg-[#0f172a] text-white rounded-xl text-center space-y-2 shadow-md">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-heading text-3xl font-black text-white">
              {scorePct}%
            </h2>
          </div>
          <p className="text-xs text-emerald-300 font-bold">
            {scorePct >= 80 ? "Mastery Achieved" : scorePct >= 60 ? "Solid Progress" : "Revision Recommended"}
          </p>
          <p className="text-[11px] text-slate-400">
            {report.correct_answers} of {report.total_questions} questions correct
          </p>
        </div>

        {/* 2-Column Mastery vs Revision */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("report.mastered_concepts")}</span>
            </div>
            <div className="space-y-1">
              {report.strong_areas.map((area, idx) => (
                <p key={idx} className="text-xs text-emerald-950 font-medium truncate">
                  • {area}
                </p>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{t("report.needs_improvement")}</span>
            </div>
            <div className="space-y-1">
              {report.weak_areas.length > 0 ? (
                report.weak_areas.map((area, idx) => (
                  <p key={idx} className="text-xs text-amber-950 font-medium truncate">
                    • {area}
                  </p>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No gaps detected!</p>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Next Step */}
        {report.recommended_next_topic && (
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Next Recommended Topic</span>
              <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0b1c30] truncate">
                {report.recommended_next_topic}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => handleStartRecommended(report.recommended_next_topic!)}
              className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>{t("report.start_topic")}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        )}

        {/* Question Breakdown */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between text-xs font-bold text-[#0b1c30] cursor-pointer"
          >
            <span>{t("report.full_breakdown")} ({report.detailed_breakdown.length})</span>
            {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showBreakdown && (
            <div className="space-y-2 pt-1">
              {report.detailed_breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    item.is_correct ? "bg-slate-50 border-slate-200" : "bg-amber-50/50 border-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#0b1c30] truncate">
                      {idx + 1}. {item.prompt}
                    </p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.is_correct ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {item.is_correct ? "Correct" : "Review"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Answer: <span className={item.is_correct ? "text-emerald-700" : "text-amber-700"}>{item.student_answer}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href="/"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0b1c30] text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t("report.back_dashboard")}</span>
          </Link>

          {!isPassing && (
            <Link
              href={`/sessions/${sessionId}/assessment`}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("report.retake")}</span>
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}

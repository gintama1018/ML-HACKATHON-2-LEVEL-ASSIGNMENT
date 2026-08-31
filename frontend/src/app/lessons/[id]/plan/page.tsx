"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api, Lesson, LessonPlanSegment } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  Clock,
  LineChart,
  Code2,
  Layers,
  Cpu,
  ArrowRight,
  EyeOff,
  Eye,
  Sparkles
} from "lucide-react";

interface PlanPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default function LessonPlanPreviewPage({ params }: PlanPageProps) {
  const resolvedParams = use(params);
  const lessonId = resolvedParams.id;
  const router = useRouter();
  const { t } = useLanguage();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [segments, setSegments] = useState<LessonPlanSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      setIsLoading(true);
      try {
        const l = await api.getLesson(lessonId);
        setLesson(l);
        if (l.plan && l.plan.segments) {
          setSegments(l.plan.segments);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load lesson plan.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, [lessonId]);

  const toggleSkip = (index: number) => {
    const updated = [...segments];
    updated[index].skipped = !updated[index].skipped;
    setSegments(updated);
  };

  const handleStartClass = async () => {
    setIsStarting(true);
    setError(null);
    try {
      await api.updateLessonPlan(lessonId, segments);

      const session = await api.createSession(lessonId);
      router.push(`/sessions/${session.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start teaching session.");
      setIsStarting(false);
    }
  };

  const activeSegments = segments.filter((s) => !s.skipped);
  const totalMinutes = activeSegments.reduce((acc, s) => {
    const match = s.target_time.match(/\d+/);
    return acc + (match ? parseInt(match[0]) : 5);
  }, 0);

  const getVisualIcon = (type: string) => {
    switch (type) {
      case "chart":
        return <LineChart className="w-3.5 h-3.5 text-emerald-600" />;
      case "math":
        return <Layers className="w-3.5 h-3.5 text-indigo-600" />;
      case "code":
        return <Code2 className="w-3.5 h-3.5 text-amber-600" />;
      case "diagram":
        return <Cpu className="w-3.5 h-3.5 text-cyan-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  if (isLoading) {
    return (
      <AppShell pageTitle={t("plan.structure")}>
        <div className="max-w-2xl mx-auto py-12 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading structured curriculum...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle={t("plan.structure")}>
      <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
        {/* Header Summary */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {t("plan.structure")}
            </span>
            <h2 className="font-heading text-base sm:text-lg font-bold text-[#0b1c30] mt-1">
              {lesson?.topic || "Study Material Mastery"}
            </h2>
          </div>

          <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{totalMinutes} min</span>
          </div>
        </div>

        {/* Segment Timeline List */}
        <div className="space-y-2">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                seg.skipped
                  ? "bg-slate-50 border-slate-200 opacity-40"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {seg.order || idx + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {getVisualIcon(seg.visual_type)}
                    <h4 className={`text-xs sm:text-sm font-bold truncate ${seg.skipped ? "line-through text-slate-400" : "text-[#0b1c30]"}`}>
                      {seg.concept}
                    </h4>
                  </div>
                  {seg.learning_objective && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{seg.learning_objective}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {seg.target_time}
                </span>

                <button
                  type="button"
                  onClick={() => toggleSkip(idx)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title={seg.skipped ? "Include segment" : "Skip segment"}
                >
                  {seg.skipped ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleStartClass}
            disabled={isStarting || activeSegments.length === 0}
            className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 text-white font-heading font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isStarting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Launching Session...</span>
              </>
            ) : (
              <>
                <span>{t("plan.start_class_btn")}</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

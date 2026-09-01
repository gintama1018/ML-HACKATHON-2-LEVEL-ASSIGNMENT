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
  Sparkles,
  Play,
  Calendar,
  ShieldCheck,
  CheckCircle2
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

  const is7DayPlan = segments.some((s: any) => s.day_number && s.day_number > 1) || (lesson?.topic || "").toLowerCase().includes("7 day") || ((lesson?.plan as any)?.pacing_strategy || "").toLowerCase().includes("7-day");

  const getVisualIcon = (type: string) => {
    switch (type) {
      case "chart":
        return <LineChart className="w-4 h-4 text-emerald-600" />;
      case "math":
        return <Layers className="w-4 h-4 text-indigo-600" />;
      case "code":
        return <Code2 className="w-4 h-4 text-amber-600" />;
      case "diagram":
        return <Cpu className="w-4 h-4 text-cyan-600" />;
      case "timeline":
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
  };

  if (isLoading) {
    return (
      <AppShell pageTitle={t("plan.structure")}>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading structured curriculum roadmap...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle={t("plan.structure")}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Summary with Pill Badge and Pill CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-[#0f172a] text-white rounded-2xl border border-slate-800 shadow-md">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 bg-slate-800 px-3 py-0.5 rounded-full border border-slate-700">
                Curriculum Roadmap
              </span>
              {is7DayPlan && (
                <span className="text-xs font-semibold text-amber-300 bg-amber-950/60 px-3 py-0.5 rounded-full border border-amber-800/80">
                  7-Day Spaced Repetition
                </span>
              )}
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lesson?.topic || "Study Material Mastery"}
            </h1>
            <p className="text-xs text-slate-300">
              {activeSegments.length} concept modules · {totalMinutes} min estimated runtime
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartClass}
            disabled={isStarting || activeSegments.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-full text-xs font-bold transition interactive-tactile flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
          >
            {isStarting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Enter Live Classroom</span>
              </>
            )}
          </button>
        </div>

        {/* 7-Day Spaced Learning Calendar Schedule Bar (REQ-08/26) */}
        {is7DayPlan && (
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="font-heading font-bold text-xs text-[#0f172a]">
                  7-Day Spaced Mastery Schedule & Revision Milestones
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Day 1 Active</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                const isRevision = d === 4;
                const isFinal = d === 7;
                return (
                  <div
                    key={d}
                    className={`p-2 rounded-xl border text-[11px] font-medium transition ${
                      d === 1
                        ? "bg-[#0f172a] text-white border-[#0f172a]"
                        : isRevision
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : isFinal
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <div className="font-bold">Day {d}</div>
                    <div className="text-[9px] opacity-80 truncate">
                      {isRevision ? "Revision" : isFinal ? "Capstone" : "Module"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* Plan Segments List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm text-[#0f172a]">
              Lesson Sequence & Teaching Visuals
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Click eye icon to skip/include
            </span>
          </div>

          <div className="space-y-3">
            {segments.map((seg: any, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition flex flex-col gap-2.5 ${
                  seg.skipped
                    ? "bg-slate-50 border-slate-200 opacity-60"
                    : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                        seg.skipped ? "bg-slate-200 text-slate-400" : "bg-[#0f172a] text-white"
                      }`}
                    >
                      0{seg.order}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {seg.day_number && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                            Day {seg.day_number}
                          </span>
                        )}
                        <h3
                          className={`font-heading font-semibold text-sm truncate ${
                            seg.skipped ? "text-slate-400 line-through" : "text-[#0f172a]"
                          }`}
                        >
                          {seg.concept}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {seg.target_time}
                        </span>
                        <span className="flex items-center gap-1 font-medium capitalize">
                          {getVisualIcon(seg.visual_type)}
                          {seg.visual_type} Visual
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Skip Pill Button */}
                  <button
                    type="button"
                    onClick={() => toggleSkip(idx)}
                    className={`p-2 rounded-full text-xs font-medium transition cursor-pointer interactive-tactile shrink-0 ${
                      seg.skipped
                        ? "text-slate-400 hover:text-slate-700 bg-slate-100"
                        : "text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100"
                    }`}
                    title={seg.skipped ? "Include segment" : "Skip segment"}
                  >
                    {seg.skipped ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Visual Rationale Explainability Badge (REQ-35) */}
                {seg.visual_rationale && (
                  <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong className="text-slate-700">Visual Choice Rationale:</strong> {seg.visual_rationale}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

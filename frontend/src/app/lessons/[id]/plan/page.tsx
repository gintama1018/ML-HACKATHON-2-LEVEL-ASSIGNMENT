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
  Play
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
        return <LineChart className="w-4 h-4 text-emerald-600" />;
      case "math":
        return <Layers className="w-4 h-4 text-indigo-600" />;
      case "code":
        return <Code2 className="w-4 h-4 text-amber-600" />;
      case "diagram":
        return <Cpu className="w-4 h-4 text-cyan-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Summary with Pill Badge and Pill CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-[#0f172a] text-white rounded-2xl border border-slate-800">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300 bg-slate-800 px-3 py-0.5 rounded-full border border-slate-700">
              Curriculum Roadmap
            </span>
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

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* Plan Segments List */}
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-sm text-[#0f172a]">
            Lesson Sequence & Teaching Visuals
          </h2>

          <div className="space-y-3">
            {segments.map((seg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                  seg.skipped
                    ? "bg-slate-50 border-slate-200 opacity-60"
                    : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                      seg.skipped ? "bg-slate-200 text-slate-400" : "bg-slate-100 text-[#0f172a]"
                    }`}
                  >
                    0{seg.order}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
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
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

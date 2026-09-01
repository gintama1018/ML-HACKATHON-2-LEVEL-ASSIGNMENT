"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api, StudentProfile, Lesson, LearningPath } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  Plus,
  Play,
  BookOpen,
  Clock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Compass,
  Lock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [quickTopic, setQuickTopic] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quickPicks = [
    "Ohm's Law",
    "Linear Regression",
    "Newton's Laws",
    "Binary Search",
  ];

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const student = await api.getDefaultStudent();
      setProfile(student);
      const [lessonList, pathList] = await Promise.all([
        api.listLessons(student.id),
        api.getLearningPaths(student.id)
      ]);
      setLessons(lessonList);
      setLearningPaths(pathList);
    } catch (err: any) {
      setError(err.message || "Failed to load lessons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartQuickTopic = (topicName: string) => {
    if (!topicName.trim()) return;
    sessionStorage.setItem("draft_source_type", "topic");
    sessionStorage.setItem("draft_topic", topicName.trim());
    sessionStorage.removeItem("draft_material_id");
    sessionStorage.removeItem("draft_material_name");
    router.push("/lessons/new/profile");
  };

  const activeLesson = lessons.find((l) => l.status === "active");
  const activePath = learningPaths[0];

  return (
    <AppShell pageTitle={t("nav.dashboard")}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-full text-rose-800 text-xs flex items-center gap-2 px-6">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. UNIFIED COMMAND HUB HERO (Fully Multilingual Bound) */}
        <div className="bg-[#0f172a] text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-sm space-y-5">
          {/* Top Row: Welcome + Learner Stats Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {profile?.name ? profile.name[0] : "S"}
              </div>
              <div>
                <h1 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
                  {t("dash.welcome")}, {profile?.name || t("user.student")}
                </h1>
                <p className="text-xs text-slate-400">
                  {profile?.learning_history?.length
                    ? `${profile.learning_history.length} ${t("dash.completed_lessons")} · ${t("dash.ai_ready")}`
                    : t("dash.ai_standby")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3.5 py-1.5 bg-slate-900/90 rounded-full border border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{profile?.strong_concepts?.length || 0} {t("dash.mastered")}</span>
              </div>
              <div className="px-3.5 py-1.5 bg-slate-900/90 rounded-full border border-slate-800 text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{profile?.weak_concepts?.length || 0} {t("dash.to_revise")}</span>
              </div>
            </div>
          </div>

          {/* Center: Command Search Input Bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 pl-4 rounded-full border border-slate-700/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                type="text"
                value={quickTopic}
                onChange={(e) => setQuickTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartQuickTopic(quickTopic)}
                placeholder={t("dash.search_placeholder")}
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleStartQuickTopic(quickTopic)}
                disabled={!quickTopic.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-full transition interactive-tactile cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <span>{t("dash.start_lesson")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Pick Chips + Upload Link */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[11px] text-slate-400 font-medium">{t("dash.quick_topics")}</span>
              {quickPicks.map((pick, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleStartQuickTopic(pick)}
                  className="px-3 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-full text-[11px] font-medium text-slate-300 transition interactive-tactile cursor-pointer"
                >
                  {pick}
                </button>
              ))}
              <Link
                href="/lessons/new"
                className="px-3 py-1 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 rounded-full text-[11px] font-semibold text-emerald-400 hover:underline sm:ml-auto flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{t("dash.upload_notes")}</span>
              </Link>
            </div>
          </div>

          {/* Integrated Active Lesson / Next Milestone Bottom Strip */}
          {activeLesson ? (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 -mx-6 -mb-6 sm:-mx-7 sm:-mb-7 p-4 sm:px-7 sm:py-3.5 rounded-b-3xl">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {t("dash.in_progress")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-white truncate">
                    {activeLesson.topic || "Study Document Lesson"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeLesson.plan?.segments.length || 3} {t("dash.concepts_planned")} · {activeLesson.plan?.total_estimated_minutes || 20} {t("dash.min_session")}
                  </p>
                </div>
              </div>

              <Link
                href={`/lessons/${activeLesson.id}/plan`}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-full transition interactive-tactile flex items-center gap-1.5 shrink-0 self-end sm:self-center shadow-xs"
              >
                <span>{t("dash.resume_lesson")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 -mx-6 -mb-6 sm:-mx-7 sm:-mb-7 p-4 sm:px-7 sm:py-3.5 rounded-b-3xl">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  {t("dash.recommended")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-white truncate">
                    {profile?.weak_concepts?.length
                      ? `Revision: ${profile.weak_concepts[0]}`
                      : "Kirchhoff's Laws & Multi-Loop Circuits"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t("dash.next_milestone")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartQuickTopic(profile?.weak_concepts?.[0] || "Kirchhoff's Laws")}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-full border border-slate-700 transition interactive-tactile flex items-center gap-1.5 shrink-0 self-end sm:self-center"
              >
                <span>{t("dash.start_milestone")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 2. Active Multi-Module Learning Path Progression Capsule */}
        {activePath && (
          <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-slate-100 text-[#0f172a] rounded-full">
                  <Compass className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#0f172a]">
                    {t("dash.active_pathway")}: {activePath.topic}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activePath.target_level} Level · {activePath.modules?.length || 0} Modules
                  </p>
                </div>
              </div>

              <Link
                href="/learning-paths"
                className="px-4 py-1.5 bg-slate-100 hover:bg-[#0f172a] hover:text-white rounded-full text-xs font-bold text-[#0f172a] flex items-center gap-1.5 transition interactive-tactile cursor-pointer"
              >
                <span>{t("dash.view_pathway")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Modules Scroller in Compact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {activePath.modules?.slice(0, 4).map((mod) => (
                <div
                  key={mod.id}
                  className={`group px-4 py-2.5 rounded-full border text-xs flex items-center justify-between gap-2.5 transition ${
                    mod.is_completed
                      ? "bg-slate-50 border-slate-200 hover:border-slate-300"
                      : mod.is_unlocked
                      ? "bg-white border-2 border-emerald-600 shadow-xs hover:shadow-md"
                      : "bg-slate-100/60 border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {mod.is_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : mod.is_unlocked ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="font-bold text-[#0f172a] truncate text-xs">
                      {mod.title}
                    </span>
                  </div>

                  {mod.is_unlocked && !mod.is_completed ? (
                    <button
                      onClick={() => handleStartQuickTopic(`${activePath.topic}: ${mod.title}`)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[10px] font-bold transition interactive-tactile flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{t("dash.start_lesson")}</span>
                    </button>
                  ) : mod.is_completed ? (
                    <span className="text-[10px] font-semibold text-emerald-700 shrink-0">
                      {mod.score ? `${mod.score.toFixed(0)}%` : "100%"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {t("dash.locked")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Recent Lessons List — COMPACT CAPSULE PILL GRID */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>{t("dash.recent_lessons")}</span>
            </h3>
            {lessons.length > 0 && (
              <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {lessons.length} {t("dash.total")}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-white rounded-full border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
              <p className="text-xs text-slate-500">{t("dash.no_lessons")}</p>
              <Link
                href="/lessons/new"
                className="px-5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold hover:bg-emerald-100 inline-block transition interactive-tactile"
              >
                {t("dash.create_first")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lessons.slice(0, 6).map((l) => (
                <div
                  key={l.id}
                  className="group px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full border border-slate-200 bg-white hover:border-[#0f172a] hover:shadow-md transition-all flex items-center justify-between gap-2.5"
                >
                  {/* Left: Icon Badge + Topic Title + Metadata */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#0f172a] group-hover:text-white flex items-center justify-center shrink-0 transition-all text-slate-700">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-heading font-bold text-xs text-[#0f172a] truncate max-w-[130px] sm:max-w-[150px] md:max-w-[180px]">
                        {l.topic || "Study Document Lesson"}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">
                        {l.source_type === "material" ? "Doc" : "Topic"} · {l.plan?.total_estimated_minutes || 20}m
                      </p>
                    </div>
                  </div>

                  {/* Right: Pill 'View Plan' Action Button (Transforms on Hover) */}
                  <Link
                    href={`/lessons/${l.id}/plan`}
                    className="px-3 py-1 bg-slate-100 group-hover:bg-[#0f172a] group-hover:text-white text-[#0f172a] rounded-full text-[11px] font-bold transition-all interactive-tactile flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                  >
                    <span>{t("dash.view_plan")}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

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
  const { t } = useLanguage();
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
      <div className="space-y-6">
        {/* 1. Header Bar: Welcome + Progression Summary Capsule */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 sm:py-4 bg-white rounded-full border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {profile?.name ? profile.name[0] : "S"}
            </div>
            <div>
              <h1 className="font-heading text-base sm:text-lg font-bold text-[#0f172a] tracking-tight">
                {t("dash.welcome")}, {profile?.name || "Student"}
              </h1>
              <p className="text-xs text-slate-500">
                {profile?.learning_history?.length
                  ? `${profile.learning_history.length} completed lessons · ${profile.strong_concepts?.length || 0} mastered`
                  : "AI Teacher ready for today's session"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>{profile?.strong_concepts?.length || 0} Mastered</span>
            </div>
            <div className="px-4 py-1.5 bg-amber-50 rounded-full border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>{profile?.weak_concepts?.length || 0} Revise</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-full text-rose-800 text-xs flex items-center gap-2 px-6">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2. Primary Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Quick Topic Launch */}
          <div className="lg:col-span-7 bg-[#0f172a] text-white p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 px-3.5 py-1 rounded-full border border-slate-700">
                  Instant Classroom
                </span>
              </div>
              <h2 className="font-heading text-lg font-bold text-white tracking-tight">
                What would you like to learn today?
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                Enter any subject or upload course notes. Your AI Teacher will structure a pacing-conscious lesson with an animated avatar & dynamic whiteboard.
              </p>
            </div>

            {/* Quick Input Bar with Pill Button */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickTopic}
                  onChange={(e) => setQuickTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartQuickTopic(quickTopic)}
                  placeholder="e.g. Newton's Laws, Semiconductor Diodes, Binary Trees..."
                  className="flex-1 px-5 py-2.5 bg-slate-900 border border-slate-700 rounded-full text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => handleStartQuickTopic(quickTopic)}
                  disabled={!quickTopic.trim()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-full transition interactive-tactile cursor-pointer shrink-0"
                >
                  Start
                </button>
              </div>

              {/* Quick Pick Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400">Popular:</span>
                {quickPicks.map((pick, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStartQuickTopic(pick)}
                    className="px-3.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-[11px] font-medium text-slate-200 transition interactive-tactile cursor-pointer"
                  >
                    {pick}
                  </button>
                ))}
                <Link
                  href="/lessons/new"
                  className="text-[11px] text-emerald-400 hover:underline font-semibold ml-1"
                >
                  + Upload Document
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: In-Progress Lesson OR Curriculum Recommendation */}
          <div className="lg:col-span-5 flex flex-col">
            {activeLesson ? (
              <div className="p-6 bg-white rounded-3xl border-2 border-emerald-600 shadow-sm flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                      In Progress
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {activeLesson.plan?.total_estimated_minutes || 20} min
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#0f172a]">
                    {activeLesson.topic || "Study Material Lesson"}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {activeLesson.plan?.segments.length || 3} concepts planned in this active session.
                  </p>
                </div>

                <Link
                  href={`/lessons/${activeLesson.id}/plan`}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full transition interactive-tactile flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Resume Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
                      Recommended Next Step
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#0f172a]">
                    {profile?.weak_concepts?.length
                      ? `Revision: ${profile.weak_concepts[0]}`
                      : "Kirchhoff's Laws & Multi-Loop Circuits"}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Recommended next milestone in your curriculum path based on past assessments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartQuickTopic(profile?.weak_concepts?.[0] || "Kirchhoff's Laws")}
                  className="w-full py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-full transition interactive-tactile cursor-pointer"
                >
                  Start Recommended Topic
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Active Multi-Module Learning Path Progression Capsule */}
        {activePath && (
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-slate-100 text-[#0f172a] rounded-full">
                  <Compass className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#0f172a]">
                    Active Pathway: {activePath.topic}
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
                <span>View Full Pathway</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Modules Scroller with Pill Capsules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {activePath.modules?.slice(0, 4).map((mod) => (
                <div
                  key={mod.id}
                  className={`px-4 py-3 rounded-full border text-xs flex items-center justify-between gap-3 transition ${
                    mod.is_completed
                      ? "bg-slate-50 border-slate-200"
                      : mod.is_unlocked
                      ? "bg-white border-2 border-emerald-600 shadow-xs"
                      : "bg-slate-100/60 border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
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
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[11px] font-bold transition interactive-tactile flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Start</span>
                    </button>
                  ) : mod.is_completed ? (
                    <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
                      {mod.score ? `${mod.score.toFixed(0)}%` : "100%"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">
                      Locked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Recent Lessons List — SLEEK HORIZONTAL PILL CAPSULES */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>Recent Lessons</span>
            </h3>
            {lessons.length > 0 && (
              <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {lessons.length} total
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-white rounded-full border border-slate-200 animate-pulse" />
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
            <div className="space-y-2.5">
              {lessons.map((l) => (
                <div
                  key={l.id}
                  className="group px-4 py-2.5 sm:px-5 sm:py-3 rounded-full border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md transition flex items-center justify-between gap-4"
                >
                  {/* Left: Icon Badge + Topic Title + Metadata */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#0f172a] group-hover:text-white flex items-center justify-center shrink-0 transition text-slate-700">
                      <BookOpen className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-[#0f172a] truncate">
                          {l.topic || "Study Document Lesson"}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === "completed"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {l.status === "completed" ? "Completed" : "Draft"}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 hidden sm:inline-block">
                        {l.source_type === "material" ? "Uploaded Doc" : "Curriculum Topic"} · {l.plan?.total_estimated_minutes || 20} min
                      </span>
                    </div>
                  </div>

                  {/* Right: Pill 'View Plan' Action Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500 flex items-center gap-1 sm:hidden">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{l.plan?.total_estimated_minutes || 20}m</span>
                    </span>
                    <Link
                      href={`/lessons/${l.id}/plan`}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-[#0f172a] hover:text-white text-[#0f172a] rounded-full text-xs font-bold transition interactive-tactile flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>View Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

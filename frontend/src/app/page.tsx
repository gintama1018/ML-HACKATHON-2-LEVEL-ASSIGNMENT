"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api, StudentProfile, Lesson } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  PlusCircle,
  PlayCircle,
  BookOpen,
  Clock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Zap,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
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
      const lessonList = await api.listLessons(student.id);
      setLessons(lessonList);
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

  return (
    <AppShell pageTitle={t("nav.dashboard")}>
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* 1. Header Bar: Welcome + Compact Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-[#0b1c30]">
              {t("dash.welcome")}, {profile?.name || "Student"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile?.learning_history?.length
                ? `${profile.learning_history.length} completed lessons • ${profile.strong_concepts?.length || 0} mastered topics`
                : "Personalized AI Teacher ready for today's session"}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>{profile?.strong_concepts?.length || 0} {t("dash.mastered")}</span>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>{profile?.weak_concepts?.length || 0} {t("dash.to_revise")}</span>
            </div>
          </div>
        </div>

        {/* 2. Core Interactive Area (2-Columns Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Start New Lesson & Quick Input */}
          <div className="lg:col-span-7 bg-[#0f172a] text-white p-5 sm:p-6 rounded-xl shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  {t("dash.cta_badge")}
                </span>
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
                {t("dash.cta_title")}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                Enter any topic or upload study documents. Your AI Teacher will structure a pacing-conscious lesson with an animated avatar & live whiteboard.
              </p>
            </div>

            {/* Quick Topic Input directly in Dashboard */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickTopic}
                  onChange={(e) => setQuickTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartQuickTopic(quickTopic)}
                  placeholder="e.g. Newton's Laws, Semiconductor Diodes..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleStartQuickTopic(quickTopic)}
                  disabled={!quickTopic.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition cursor-pointer shrink-0"
                >
                  Start
                </button>
              </div>

              {/* Quick Pick Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">Quick:</span>
                {quickPicks.map((pick, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStartQuickTopic(pick)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-medium text-slate-300 transition cursor-pointer"
                  >
                    {pick}
                  </button>
                ))}
                <Link
                  href="/lessons/new"
                  className="text-[11px] text-emerald-400 hover:underline ml-1 font-semibold"
                >
                  + Upload doc
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Resume Class OR Recommended Pathway */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {activeLesson ? (
              <div className="p-5 bg-white rounded-xl border-l-4 border-amber-500 border-y border-r border-slate-200 shadow-xs flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {t("dash.continue_learning")}
                    </span>
                    <span className="text-slate-500 text-[11px]">{activeLesson.plan?.total_estimated_minutes || 20}m budget</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#0b1c30] mt-1">
                    {activeLesson.topic || "Study Material Lesson"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {activeLesson.plan?.segments.length || 3} concepts planned
                  </p>
                </div>

                <Link
                  href={`/lessons/${activeLesson.id}/plan`}
                  className="w-full py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>{t("dash.resume_class")}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </Link>
              </div>
            ) : (
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t("dash.curriculum_rec")}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#0b1c30]">
                    {profile?.weak_concepts?.length
                      ? `Revision: ${profile.weak_concepts[0]}`
                      : "Kirchhoff's Laws & Multi-Loop Circuits"}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Recommended next milestone in your curriculum path based on past assessments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartQuickTopic(profile?.weak_concepts?.[0] || "Kirchhoff's Laws")}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#0b1c30] text-xs font-bold rounded-lg border border-slate-200 transition"
                >
                  Start This Topic
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Recent Lessons List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xs font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-600" />
              <span>{t("dash.recent_lessons")}</span>
            </h3>
            {lessons.length > 0 && (
              <span className="text-xs text-slate-500">{lessons.length} total</span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-xl border border-slate-200 space-y-1.5">
              <p className="text-xs text-slate-500">{t("dash.no_lessons")}</p>
              <Link
                href="/lessons/new"
                className="text-xs font-bold text-emerald-700 hover:underline inline-block"
              >
                {t("dash.create_first")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {lessons.map((l) => (
                <div
                  key={l.id}
                  className={`p-4 rounded-xl border bg-white shadow-xs space-y-2.5 ${
                    l.status === "completed" ? "border-l-4 border-l-emerald-500 border-slate-200" : "border-l-4 border-l-amber-500 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 text-slate-600">
                      {l.source_type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>

                  <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0b1c30] line-clamp-1">
                    {l.topic || "Study Document Lesson"}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {l.plan?.total_estimated_minutes || 20}m
                    </span>
                    <Link
                      href={`/lessons/${l.id}/plan`}
                      className="text-xs font-bold text-[#0f172a] hover:text-emerald-600 flex items-center gap-1"
                    >
                      <span>{t("dash.view")}</span>
                      <ArrowRight className="w-3 h-3" />
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

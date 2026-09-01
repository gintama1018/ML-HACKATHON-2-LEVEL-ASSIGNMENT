"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api, StudentProfile } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight
} from "lucide-react";

export default function LearningProfileHistoryPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const student = await api.getDefaultStudent();
        setProfile(student);
      } catch (err) {
        console.error("Failed to load student profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading || !profile) {
    return (
      <AppShell pageTitle={t("nav.history")}>
        <div className="max-w-xl mx-auto py-16 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading your learning history...</p>
        </div>
      </AppShell>
    );
  }

  const history = profile.learning_history || [];
  const strongConcepts = profile.strong_concepts || [];
  const weakConcepts = profile.weak_concepts || [];

  return (
    <AppShell pageTitle={t("nav.history")}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Summary Header (P1 Surface Capsule) */}
        <div className="p-6 sm:px-8 sm:py-5 bg-[#0f172a] text-white rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-heading font-black text-xl">
              {profile.name[0]}
            </div>
            <div className="space-y-1">
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
                {profile.name}
              </h1>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Active Student · Bharat Academix</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-4 py-2 bg-slate-900 rounded-full border border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{strongConcepts.length} Mastered</span>
            </div>
            <div className="px-4 py-2 bg-slate-900 rounded-full border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{history.length} Lessons</span>
            </div>
          </div>
        </div>

        {/* 2-Column Mastery vs Revision Focus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mastered Concepts */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mastered Concepts ({strongConcepts.length})</span>
              </h2>
            </div>

            {strongConcepts.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No concepts mastered yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {strongConcepts.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-full text-xs font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Concepts to Revise */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xs font-bold text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Revision & Coaching Focus ({weakConcepts.length})</span>
              </h2>
            </div>

            {weakConcepts.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No knowledge gaps detected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {weakConcepts.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Chronological Learning History — SLEEK CAPSULE PILLS */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-sm text-[#0f172a] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>Lesson Progression Log</span>
            </h2>
            <span className="px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
              {history.length} completed sessions
            </span>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
              <p className="text-xs text-slate-500">No session history yet.</p>
              <Link
                href="/lessons/new"
                className="px-5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold hover:bg-emerald-100 inline-block transition interactive-tactile"
              >
                Start your first AI lesson
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="group px-4 py-2.5 sm:px-5 sm:py-3 rounded-full border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#0f172a] group-hover:text-white flex items-center justify-center shrink-0 transition text-slate-700">
                      <BookOpen className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm text-[#0f172a] truncate">
                          {item.topic}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.score}% score
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 hidden sm:inline-block">
                        {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : "Recent Session"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/lessons/new`}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-[#0f172a] hover:text-white text-[#0f172a] rounded-full text-xs font-bold flex items-center gap-1.5 transition interactive-tactile shrink-0"
                  >
                    <span>Practice Again</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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

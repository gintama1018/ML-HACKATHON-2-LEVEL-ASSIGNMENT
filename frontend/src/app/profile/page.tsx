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
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  Zap,
  PlusCircle
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
          <div className="w-8 h-8 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading your complete learning profile...</p>
        </div>
      </AppShell>
    );
  }

  const history = profile.learning_history || [];
  const strongConcepts = profile.strong_concepts || [];
  const weakConcepts = profile.weak_concepts || [];

  return (
    <AppShell pageTitle={t("nav.history")}>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* 1. Profile Summary Banner (Deep Navy Institutional Card) */}
        <div className="p-8 bg-[#0f172a] text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-heading font-black text-2xl shadow-sm">
              {profile.name[0]}
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-2xl font-extrabold text-white tracking-tight">
                {profile.name}
              </h2>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Standard Learner • Autonomous AI Classroom</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-bold text-emerald-400 flex items-center gap-2 shadow-inner">
              <TrendingUp className="w-4 h-4" />
              <span>{strongConcepts.length} Mastered</span>
            </div>
            <div className="px-4 py-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-bold text-amber-400 flex items-center gap-2 shadow-inner">
              <Sparkles className="w-4 h-4" />
              <span>{history.length} Completed</span>
            </div>
          </div>
        </div>

        {/* 2. Concept Mastery Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Mastered Concepts */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 card-elevation-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Strong / Mastered Concepts ({strongConcepts.length})</span>
              </h3>
            </div>

            {strongConcepts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No concepts mastered yet. Complete your first lesson!</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {strongConcepts.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Concepts to Revise */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 card-elevation-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Revision & Coaching Focus ({weakConcepts.length})</span>
              </h3>
            </div>

            {weakConcepts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No gaps detected. Excellent retention!</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {weakConcepts.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold shadow-xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Chronological Learning History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-[#0b1c30] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Completed Learning Lessons</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{history.length} total entries</span>
          </div>

          {history.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 card-elevation-1 space-y-3">
              <p className="text-sm text-slate-500">No completed lessons recorded yet.</p>
              <Link
                href="/lessons/new"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline"
              >
                Create and master your first lesson →
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-white rounded-2xl border border-slate-200 card-elevation-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-300"
                >
                  <div className="space-y-1">
                    <h4 className="font-heading text-sm sm:text-base font-bold text-[#0b1c30]">
                      {item.topic || `Lesson #${idx + 1}`}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.completed_at ? new Date(item.completed_at).toLocaleDateString() : "Recently Completed"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {item.score !== undefined && (
                      <span className="px-3.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        Score: {item.score}%
                      </span>
                    )}

                    <Link
                      href={`/lessons/new`}
                      className="text-xs font-bold text-[#0f172a] hover:text-emerald-600 flex items-center gap-1 transition"
                    >
                      <span>Study Again</span>
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

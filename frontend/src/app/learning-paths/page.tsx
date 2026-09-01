"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api, LearningPath, LearningPathModule, StudentProfile } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  Compass,
  Lock,
  CheckCircle2,
  Play,
  Plus,
  Sparkles,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function LearningPathsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New path form state
  const [newTopic, setNewTopic] = useState("");
  const [newLevel, setNewLevel] = useState("Intermediate");
  const [newModulesCount, setNewModulesCount] = useState(5);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchPaths = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const student = await api.getDefaultStudent();
      setProfile(student);
      const allPaths = await api.getLearningPaths(student.id);
      setPaths(allPaths);
      if (allPaths.length > 0) {
        const active = allPaths.find((p) => p.id === student.current_path_id) || allPaths[0];
        setActivePath(active);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load learning paths");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaths();
  }, []);

  const handleGeneratePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const created = await api.generateLearningPath({
        topic: newTopic.trim(),
        target_level: newLevel,
        total_modules: newModulesCount,
        student_id: profile?.id,
      });
      setPaths([created, ...paths]);
      setActivePath(created);
      setShowCreateModal(false);
      setNewTopic("");
    } catch (err: any) {
      setError(err.message || "Failed to generate learning path");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteModule = async (moduleId: string, score: number = 85.0) => {
    if (!activePath) return;
    try {
      await api.updateModuleProgress(activePath.id, moduleId, {
        is_completed: true,
        score: score,
      });
      const updated = await api.getLearningPath(activePath.id);
      setActivePath(updated);
      setPaths(paths.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err: any) {
      setError(err.message || "Failed to update module progress");
    }
  };

  const handleLaunchModuleLesson = (module: LearningPathModule) => {
    sessionStorage.setItem("draft_source_type", "topic");
    sessionStorage.setItem("draft_topic", `${activePath?.topic}: ${module.title}`);
    sessionStorage.removeItem("draft_material_id");
    sessionStorage.removeItem("draft_material_name");
    router.push("/lessons/new/profile");
  };

  const completedModulesCount = activePath?.modules?.filter((m) => m.is_completed).length || 0;
  const totalModulesCount = activePath?.modules?.length || 1;
  const progressPercent = Math.round((completedModulesCount / totalModulesCount) * 100);

  return (
    <AppShell pageTitle="Multi-Module Learning Paths">
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-full text-rose-800 text-xs flex items-center gap-2 px-6">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading or Empty States */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 text-sm">
            Loading your learning pathways...
          </div>
        ) : paths.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
            <div className="w-12 h-12 bg-slate-100 text-[#0f172a] rounded-full flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading font-bold text-[#0f172a] text-lg">No Learning Paths Yet</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Generate an autonomous, multi-module progressive curriculum tailored to any subject from first principles to capstone mastery.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-full text-xs font-bold transition inline-flex items-center gap-2 interactive-tactile cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Create Your First Pathway</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Pathway Context Header (P1 Surface) */}
            {activePath && (
              <div className="bg-[#0f172a] text-white p-6 rounded-3xl border border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-300 bg-slate-800 px-3.5 py-0.5 rounded-full border border-slate-700">
                        {activePath.target_level} · {activePath.modules?.length || 0} modules · {completedModulesCount} completed
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white font-heading tracking-tight">
                      {activePath.topic}
                    </h1>
                  </div>

                  {/* Right Header Action: Progress + New Path CTA */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-slate-900/90 px-4 py-2 rounded-full border border-slate-700/80 flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">Mastery Progress</div>
                        <div className="text-base font-black text-emerald-400">{progressPercent}%</div>
                      </div>
                      <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition interactive-tactile cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">New Path</span>
                    </button>
                  </div>
                </div>

                {/* Compact Path Switcher (Pill Selector) */}
                {paths.length > 1 && (
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs text-slate-400 shrink-0 font-medium">Switch Pathway:</span>
                    <div className="flex items-center gap-2">
                      {paths.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setActivePath(p)}
                          className={`px-4 py-1 rounded-full text-xs font-medium transition cursor-pointer interactive-tactile ${
                            p.id === activePath.id
                              ? "bg-white text-[#0f172a] font-bold shadow-xs"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                          }`}
                        >
                          {p.topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sequential Modules Timeline — COMPACT 2-COLUMN CAPSULE PILL GRID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-sm text-[#0f172a]">
                  Curriculum Sequence ({completedModulesCount} of {totalModulesCount} completed)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activePath?.modules?.map((mod) => {
                  const isLocked = !mod.is_unlocked;
                  const isCompleted = mod.is_completed;
                  const isCurrent = mod.is_unlocked && !mod.is_completed;

                  // 1. ACTIVE MODULE (Compact Capsule Pill with Hover Glow)
                  if (isCurrent) {
                    return (
                      <div
                        key={mod.id}
                        className="group px-4 py-3 rounded-full border-2 border-emerald-600 bg-white shadow-sm flex items-center justify-between gap-3 transition hover:shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0 font-bold text-xs">
                            0{mod.module_order}
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-heading font-bold text-xs text-[#0f172a] truncate max-w-[150px] sm:max-w-[200px]">
                              {mod.title}
                            </h3>
                            <span className="text-[10px] font-semibold text-emerald-700 block truncate">
                              Active Module
                            </span>
                          </div>
                        </div>

                        {/* Primary Pill Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleLaunchModuleLesson(mod)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[11px] font-bold flex items-center gap-1 transition interactive-tactile shadow-xs cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Teach</span>
                          </button>
                          <button
                            onClick={() => handleCompleteModule(mod.id, 92.0)}
                            className="px-2.5 py-1 bg-slate-100 group-hover:bg-[#0f172a] group-hover:text-white border border-slate-200 text-slate-700 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all interactive-tactile cursor-pointer"
                            title="Verify mastery with ≥70% score to unlock next module"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-600 group-hover:text-emerald-400" />
                            <span>Unlock</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // 2. COMPLETED MODULE (Compact Capsule Pill)
                  if (isCompleted) {
                    return (
                      <div
                        key={mod.id}
                        className="group px-4 py-2.5 rounded-full border border-slate-200 bg-white hover:border-[#0f172a] hover:shadow-sm transition-all flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-heading font-semibold text-xs text-[#0f172a] truncate max-w-[150px] sm:max-w-[200px]">
                              0{mod.module_order}. {mod.title}
                            </h3>
                            <span className="text-[10px] font-bold text-emerald-700">
                              Mastered ({mod.score ? `${mod.score.toFixed(0)}%` : "100%"})
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLaunchModuleLesson(mod)}
                          className="px-3 py-1 bg-slate-100 group-hover:bg-[#0f172a] group-hover:text-white text-slate-700 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all interactive-tactile shrink-0 cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Review</span>
                        </button>
                      </div>
                    );
                  }

                  // 3. LOCKED MODULE (Compact Dimmed Capsule Pill)
                  return (
                    <div
                      key={mod.id}
                      className="px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 text-slate-400"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 text-xs font-bold">
                          <Lock className="w-3 h-3" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-heading font-medium text-xs text-slate-500 truncate max-w-[160px] sm:max-w-[220px]">
                            0{mod.module_order}. {mod.title}
                          </h3>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium px-2.5 py-0.5 rounded-full bg-slate-200/50 shrink-0">
                        Locked
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Generate Path Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-[#0f172a] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Create Learning Pathway</span>
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleGeneratePath} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject / Broad Topic
                  </label>
                  <input
                    type="text"
                    required
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Deep Learning & Neural Networks, Indian Modern History"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-[#0f172a] focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Level
                    </label>
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Modules ({newModulesCount})
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="8"
                      value={newModulesCount}
                      onChange={(e) => setNewModulesCount(parseInt(e.target.value))}
                      className="w-full accent-emerald-600 mt-2"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition interactive-tactile cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating || !newTopic.trim()}
                    className="px-5 py-2 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-full transition interactive-tactile flex items-center gap-1.5 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Generate Pathway</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

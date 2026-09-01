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
  Unlock,
  CheckCircle2,
  PlayCircle,
  PlusCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Award,
  Layers,
  Clock,
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
        // Find active path from student profile or default to first
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
      // Refresh path
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
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <Compass className="w-5 h-5" />
              </span>
              <h1 className="font-heading text-xl font-bold text-[#0b1c30]">
                Autonomous Learning Paths
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Personalized multi-module curricula with gated sequential unlocking and diagnostic mastery verification.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Generate New Curriculum</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Content: Active Path Details + Module Timeline */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-sm">
            Loading your learning pathways...
          </div>
        ) : paths.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">No Learning Paths Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Generate an autonomous, multi-module progressive curriculum tailored to any subject from first principles to capstone mastery.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Your First Learning Path</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Path Header Card */}
            {activePath && (
              <div className="bg-[#0f172a] text-white p-6 rounded-xl shadow-md space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                        {activePath.target_level} Level
                      </span>
                      <span className="text-xs text-slate-400">
                        • {activePath.modules?.length || 0} Sequential Modules
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-white font-heading">
                      {activePath.topic}
                    </h2>
                  </div>

                  {/* Progress Ring / Bar */}
                  <div className="flex items-center gap-4 bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 shrink-0">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Curriculum Progress</div>
                      <div className="text-lg font-black text-emerald-400">
                        {progressPercent}%
                      </div>
                    </div>
                    <div className="w-24 bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Path Switcher Tabs */}
                {paths.length > 1 && (
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-[11px] text-slate-400 shrink-0">Your Paths:</span>
                    {paths.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setActivePath(p)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                          p.id === activePath.id
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {p.topic}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modules Timeline */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-[#0b1c30] flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Sequential Curriculum Modules ({completedModulesCount}/{totalModulesCount} Completed)</span>
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {activePath?.modules?.map((mod, idx) => {
                  const isLocked = !mod.is_unlocked;
                  const isCompleted = mod.is_completed;
                  const isCurrent = mod.is_unlocked && !mod.is_completed;

                  return (
                    <div
                      key={mod.id}
                      className={`p-4 sm:p-5 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCompleted
                          ? "bg-emerald-50/40 border-emerald-200"
                          : isCurrent
                          ? "bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20"
                          : "bg-slate-100/60 border-slate-200 opacity-70"
                      }`}
                    >
                      {/* Left: Module Index + Title + Description */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                            isCompleted
                              ? "bg-emerald-600 text-white"
                              : isCurrent
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            `0${mod.module_order}`
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-heading font-bold text-sm text-[#0b1c30]">
                              {mod.title}
                            </h4>
                            {isCompleted && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                                Mastery {mod.score ? `${mod.score.toFixed(0)}%` : "Verified"}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                                Active Module
                              </span>
                            )}
                            {isLocked && (
                              <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                                Locked (Requires Module {mod.module_order - 1} ≥ 70%)
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 max-w-2xl">
                            {mod.description}
                          </p>

                          {/* Key concepts chips */}
                          {mod.key_concepts && mod.key_concepts.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {mod.key_concepts.map((concept, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/80 font-medium"
                                >
                                  {concept}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {isCurrent && (
                          <>
                            <button
                              onClick={() => handleLaunchModuleLesson(mod)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Teach Module</span>
                            </button>
                            <button
                              onClick={() => handleCompleteModule(mod.id, 92.0)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Simulate completing module with 92% score to unlock next"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pass & Unlock Next</span>
                            </button>
                          </>
                        )}

                        {isCompleted && (
                          <button
                            onClick={() => handleLaunchModuleLesson(mod)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        )}

                        {isLocked && (
                          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Locked</span>
                          </div>
                        )}
                      </div>
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
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-[#0b1c30] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Create Learning Path</span>
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleGeneratePath} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject / Broad Topic
                  </label>
                  <input
                    type="text"
                    required
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Deep Learning & Neural Networks, Indian Modern History"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Level
                    </label>
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total Modules ({newModulesCount})
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="8"
                      value={newModulesCount}
                      onChange={(e) => setNewModulesCount(parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating || !newTopic.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Curriculum...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5" />
                        <span>Generate Path</span>
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

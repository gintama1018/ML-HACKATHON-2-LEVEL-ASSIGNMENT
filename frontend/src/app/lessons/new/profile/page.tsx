"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { useLanguage, SupportedLanguage } from "@/context/LanguageContext";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  AlertCircle
} from "lucide-react";

export default function LearnerProfilePage() {
  const router = useRouter();
  const { t, language: globalLang } = useLanguage();

  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [availableTime, setAvailableTime] = useState<"5 min" | "20 min" | "60 min" | "7-day plan">("20 min");
  const [objective, setObjective] = useState("Concept Mastery");
  const [depth, setDepth] = useState("Standard");
  const [language, setLanguage] = useState<SupportedLanguage>(globalLang || "English");
  const [existingKnowledge, setExistingKnowledge] = useState("");
  const [teachingStyle, setTeachingStyle] = useState("Simple & example-heavy");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sourceType, setSourceType] = useState<"material" | "topic">("topic");
  const [topic, setTopic] = useState("");
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [materialName, setMaterialName] = useState<string | null>(null);

  useEffect(() => {
    setLanguage(globalLang);
  }, [globalLang]);

  useEffect(() => {
    const sType = (sessionStorage.getItem("draft_source_type") || "topic") as "material" | "topic";
    const sTopic = sessionStorage.getItem("draft_topic") || "";
    const sMatId = sessionStorage.getItem("draft_material_id");
    const sMatName = sessionStorage.getItem("draft_material_name");

    setSourceType(sType);
    setTopic(sTopic);
    setMaterialId(sMatId);
    setMaterialName(sMatName);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const student = await api.getDefaultStudent();

      const lesson = await api.generateLesson({
        student_id: student.id,
        source_type: sourceType,
        material_id: materialId || undefined,
        topic: topic || undefined,
        level,
        existing_knowledge: existingKnowledge.trim() || undefined,
        objective,
        language,
        style: teachingStyle,
        available_time: availableTime,
        depth
      });

      router.push(`/lessons/${lesson.id}/plan`);
    } catch (err: any) {
      console.error("Failed to create lesson:", err);
      setError(err.message || "Failed to generate lesson plan.");
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell pageTitle={t("profile.title")}>
      <div className="max-w-xl mx-auto space-y-6">
        {/* Step Indicator & Header */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Step 2 of 3 · Learner Profile
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
            Personalize Your Classroom
          </h1>
          <p className="text-sm text-slate-600">
            Configure pacing, target depth, and language to tailor the AI Teacher's explanations.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Target Topic Context */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Subject:</span>
            <span className="font-mono text-[#0f172a] font-bold truncate max-w-xs">
              {sourceType === "material" ? (materialName || "Uploaded Document") : (topic || "General Concept")}
            </span>
          </div>

          {/* Level Selection with Pill Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Your Current Level
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-2 px-3 rounded-full border text-xs font-semibold transition cursor-pointer interactive-tactile text-center ${
                    level === lvl
                      ? "bg-[#0f172a] border-[#0f172a] text-white shadow-xs font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Available Time Budget with Pill Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Time Budget
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["5 min", "20 min", "60 min", "7-day plan"] as const).map((tVal) => (
                <button
                  key={tVal}
                  type="button"
                  onClick={() => setAvailableTime(tVal)}
                  className={`py-2 px-3 rounded-full border text-xs font-medium transition cursor-pointer interactive-tactile flex items-center justify-center gap-1.5 ${
                    availableTime === tVal
                      ? "bg-[#0f172a] border-[#0f172a] text-white font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  <span>{tVal}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Teaching Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-[#0f172a] focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Conversational Hinglish</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Bengali">Bengali (বাংলা)</option>
            </select>
          </div>

          {/* Advanced Customization Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showAdvanced ? "Hide Advanced Options" : "Advanced Customization (Optional)"}</span>
            </button>

            {showAdvanced && (
              <div className="pt-4 space-y-4 animate-in fade-in duration-150">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Existing Knowledge / Prerequisites
                  </label>
                  <input
                    type="text"
                    value={existingKnowledge}
                    onChange={(e) => setExistingKnowledge(e.target.value)}
                    placeholder="e.g. Basic algebra and basic circuit terminology"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-[#0f172a] focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Objective
                    </label>
                    <select
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-[#0f172a] focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="Concept Mastery">Concept Mastery</option>
                      <option value="Quick Review">Quick Review</option>
                      <option value="Exam Preparation">Exam Preparation</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Pedagogical Depth
                    </label>
                    <select
                      value={depth}
                      onChange={(e) => setDepth(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-[#0f172a] focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Deep Intuition">Deep Intuition</option>
                      <option value="Rigorous Derivations">Rigorous Derivations</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit CTA Pill */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-50 text-white rounded-full text-xs font-bold transition interactive-tactile flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Structuring Curriculum...</span>
                </>
              ) : (
                <>
                  <span>Generate Lesson Plan</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

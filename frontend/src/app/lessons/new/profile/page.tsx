"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { useLanguage, SupportedLanguage } from "@/context/LanguageContext";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Languages,
  Target,
  Layers,
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
      <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
        <div>
          <h2 className="font-heading text-lg font-bold text-[#0b1c30]">
            {t("profile.title")}
          </h2>
          <p className="text-xs text-slate-500">
            {t("profile.subtitle")}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          {/* Target Topic or Material Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Subject / Topic:</span>
            <span className="font-mono text-emerald-800 font-bold truncate max-w-xs">
              {sourceType === "material" ? (materialName || "Uploaded Document") : (topic || "General Concept")}
            </span>
          </div>

          {/* Level Selection Chips */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              {t("profile.level")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer text-center ${
                    level === lvl
                      ? "bg-[#0f172a] border-[#0f172a] text-white shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {lvl === "Beginner" && t("profile.level_beginner")}
                  {lvl === "Intermediate" && t("profile.level_intermediate")}
                  {lvl === "Advanced" && t("profile.level_advanced")}
                </button>
              ))}
            </div>
          </div>

          {/* Available Time Budget */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{t("profile.time")}</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["5 min", "20 min", "60 min", "7-day plan"] as const).map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setAvailableTime(time)}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition cursor-pointer text-center ${
                    availableTime === time
                      ? "bg-emerald-700 border-emerald-700 text-white shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column: Learning Objective & Desired Depth */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3 h-3 text-slate-400" />
                <span>Learning Objective</span>
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
              >
                <option value="Concept Mastery">Concept Mastery</option>
                <option value="Exam Preparation">Exam Preparation</option>
                <option value="Quick Revision">Quick Revision</option>
                <option value="Practical Application">Practical Application</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" />
                <span>Desired Depth</span>
              </label>
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
              >
                <option value="Intuitive & High-Level">Intuitive & High-Level</option>
                <option value="Standard Curriculum">Standard Curriculum</option>
                <option value="Deep-Dive & Rigorous">Deep-Dive & Rigorous</option>
              </select>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Languages className="w-3 h-3 text-slate-400" />
              <span>{t("profile.language")}</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish</option>
            </select>
          </div>

          {/* Advanced Accordion: Existing Knowledge & Style */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-2.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
            >
              <span>{t("profile.advanced")}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="p-3 bg-white space-y-3 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    {t("profile.existing_knowledge")}
                  </label>
                  <textarea
                    rows={2}
                    value={existingKnowledge}
                    onChange={(e) => setExistingKnowledge(e.target.value)}
                    placeholder="e.g., I know basic algebra and basic definitions..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:border-[#0f172a]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    {t("profile.teaching_style")}
                  </label>
                  <select
                    value={teachingStyle}
                    onChange={(e) => setTeachingStyle(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
                  >
                    <option value="Simple & example-heavy">{t("profile.style_simple")}</option>
                    <option value="Technical & rigorous">{t("profile.style_technical")}</option>
                    <option value="Story-driven & conversational">{t("profile.style_story")}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Action CTA */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t("profile.generating")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t("profile.generate_plan")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

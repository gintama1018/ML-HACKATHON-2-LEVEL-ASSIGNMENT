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
  AlertCircle
} from "lucide-react";

export default function LearnerProfilePage() {
  const router = useRouter();
  const { t, language: globalLang } = useLanguage();

  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [availableTime, setAvailableTime] = useState<"5 min" | "20 min" | "60 min" | "7-day plan">("20 min");
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

      const profile = await api.createLearnerProfile({
        student_id: student.id,
        level,
        available_time: availableTime,
        language,
        style: teachingStyle,
        existing_knowledge: existingKnowledge.trim() || undefined,
      });

      if (sourceType === "material" && materialId) {
        const analysisJob = await api.analyzeContent(materialId, undefined, profile.id);
        sessionStorage.setItem("current_analysis_job_id", analysisJob.job_id);
        sessionStorage.setItem("current_profile_id", profile.id);
        router.push(`/lessons/${materialId}/processing`);
      } else {
        const generatedLesson = await api.generateLesson({
          student_id: student.id,
          source_type: "topic",
          topic: topic || "Foundations of Science & Engineering",
          profile_id: profile.id,
        });
        router.push(`/lessons/${generatedLesson.id}/plan`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate lesson profile.");
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell pageTitle={t("profile.title")}>
      <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {t("profile.step")}
            </span>
            <h2 className="font-heading text-lg font-bold text-[#0b1c30] mt-1">
              {t("profile.title")}
            </h2>
            <p className="text-xs text-slate-500">
              {sourceType === "material" ? `Material: ${materialName}` : `Topic: ${topic || "Selected Topic"}`}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-5">
          {/* Level */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {t("profile.mastery_level")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    level === lvl
                      ? "bg-[#0f172a] text-white border-[#0f172a] shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("profile.time_budget")}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["5 min", "20 min", "60 min", "7-day plan"] as const).map((tVal) => (
                <button
                  key={tVal}
                  type="button"
                  onClick={() => setAvailableTime(tVal)}
                  className={`py-2 px-2 rounded-lg border text-xs font-bold transition text-center cursor-pointer ${
                    availableTime === tVal
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {tVal}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("profile.teaching_lang")}</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish</option>
            </select>
          </div>

          {/* Style disclosure */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 font-semibold py-0.5 cursor-pointer"
            >
              <span>{t("profile.customize_style")}</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pt-1">
                <input
                  type="text"
                  value={existingKnowledge}
                  onChange={(e) => setExistingKnowledge(e.target.value)}
                  placeholder="Existing knowledge / background..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0b1c30] focus:outline-none"
                />

                <div className="grid grid-cols-3 gap-1.5">
                  {["Simple & example-heavy", "Technical & precise", "Story-driven"].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setTeachingStyle(style)}
                      className={`p-2 rounded-lg border text-[11px] font-medium text-center cursor-pointer ${
                        teachingStyle === style
                          ? "bg-[#0f172a] text-white border-[#0f172a]"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 text-white font-heading font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t("profile.planning")}</span>
                </>
              ) : (
                <>
                  <span>{t("profile.start_lesson_btn")}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

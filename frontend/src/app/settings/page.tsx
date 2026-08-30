"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api, StudentProfile } from "@/lib/api";
import { useLanguage, SupportedLanguage } from "@/context/LanguageContext";
import {
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  User
} from "lucide-react";

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [name, setName] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState<SupportedLanguage>(language);
  const [defaultLevel, setDefaultLevel] = useState("Beginner");
  const [isSaved, setIsSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setDefaultLanguage(language);
  }, [language]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const student = await api.getDefaultStudent();
        setProfile(student);
        setName(student.name);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      await api.updateStudentProfile(profile.id, { name });
      setLanguage(defaultLanguage);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleClearData = async () => {
    if (!profile) return;
    try {
      await api.updateStudentProfile(profile.id, {
        learning_history: [],
        strong_concepts: [],
        weak_concepts: [],
      });
      setShowDeleteModal(false);
      setProfile({
        ...profile,
        learning_history: [],
        strong_concepts: [],
        weak_concepts: [],
      });
    } catch (err) {
      console.error("Failed to clear data:", err);
    }
  };

  return (
    <AppShell pageTitle={t("settings.title")}>
      <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
        <div>
          <h2 className="font-heading text-lg font-bold text-[#0b1c30]">
            {t("settings.title")}
          </h2>
          <p className="text-xs text-slate-500">
            {t("settings.subtitle")}
          </p>
        </div>

        {/* Profile Settings */}
        <form onSubmit={handleSave} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t("settings.student_profile")}</span>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600">{t("settings.display_name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">{t("settings.default_lang")}</label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value as SupportedLanguage)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-[#0b1c30] focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">{t("settings.default_level")}</label>
              <select
                value={defaultLevel}
                onChange={(e) => setDefaultLevel(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-[#0b1c30] focus:outline-none"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? "Saved!" : t("settings.save")}</span>
            </button>
          </div>
        </form>

        {/* AI Model Status */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t("settings.model_tiers")}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-[#0f172a] text-[11px]">Reasoning Tier</p>
              <p className="font-mono text-emerald-700 font-bold text-[10px]">claude-sonnet-5</p>
              <p className="text-slate-500 text-[10px] mt-0.5">Teaching & Assessment</p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-[#0f172a] text-[11px]">Fast Tier</p>
              <p className="font-mono text-emerald-700 font-bold text-[10px]">claude-haiku-4-5-20251001</p>
              <p className="text-slate-500 text-[10px] mt-0.5">Analyzer & Questions</p>
            </div>
          </div>
        </div>

        {/* Reset */}
        <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between gap-3">
          <div className="text-xs">
            <p className="font-bold text-rose-900">{t("settings.danger_zone")}</p>
            <p className="text-[11px] text-rose-700">Reset learning history and concept mastery</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition shrink-0 cursor-pointer"
          >
            {t("settings.clear_data")}
          </button>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="max-w-xs w-full bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xl">
              <h3 className="font-heading text-sm font-bold text-[#0b1c30]">Reset History?</h3>
              <p className="text-xs text-slate-500">
                This will clear all completed lesson scores and mastery statistics.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearData}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

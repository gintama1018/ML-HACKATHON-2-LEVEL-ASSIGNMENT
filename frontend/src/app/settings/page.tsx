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
  User,
  Sliders
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
      <div className="max-w-xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
            {t("settings.title")}
          </h1>
          <p className="text-sm text-slate-600">
            {t("settings.subtitle")}
          </p>
        </div>

        {/* Profile Settings Form Capsule */}
        <form onSubmit={handleSave} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0f172a]">
            <User className="w-4 h-4 text-slate-600" />
            <span>Learner Profile</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              {t("settings.display_name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium text-[#0f172a] focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {t("settings.default_lang")}
              </label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value as SupportedLanguage)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-[#0f172a] focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Hinglish">Conversational Hinglish</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {t("settings.default_level")}
              </label>
              <select
                value={defaultLevel}
                onChange={(e) => setDefaultLevel(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-[#0f172a] focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-full transition interactive-tactile flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? "Saved!" : t("settings.save")}</span>
            </button>
          </div>
        </form>

        {/* Danger Zone: Clear History Capsule */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Reset Learning Telemetry</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Clear all recorded diagnostic mastery history, misconception logs, and progress metrics.
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-full transition interactive-tactile flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History Data</span>
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="max-w-xs w-full bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-xl">
              <h3 className="font-heading text-sm font-bold text-[#0f172a]">Reset Student Data?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will reset your recorded concepts, weak points, and lesson history.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition interactive-tactile cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearData}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-full transition interactive-tactile cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

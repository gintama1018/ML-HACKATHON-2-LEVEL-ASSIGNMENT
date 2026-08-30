"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  UploadCloud,
  Lightbulb,
  FileText,
  X,
  ArrowRight,
  AlertCircle
} from "lucide-react";

export default function CreateLessonPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"topic" | "upload">("topic");
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sampleTopicChips = [
    "Ohm's Law & Circuit Analysis",
    "Newton's Laws of Motion",
    "Machine Learning: Linear Regression",
    "Cellular Respiration & ATP",
    "Binary Search & Divide and Conquer",
  ];

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleContinue = async () => {
    setError(null);

    if (mode === "topic") {
      if (!topic.trim()) {
        setError("Please enter a topic to continue.");
        return;
      }
      sessionStorage.setItem("draft_source_type", "topic");
      sessionStorage.setItem("draft_topic", topic.trim());
      sessionStorage.removeItem("draft_material_id");
      sessionStorage.removeItem("draft_material_name");
      router.push("/lessons/new/profile");
    } else {
      if (!file) {
        setError("Please select a study material file to upload.");
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(40);
        const uploadedMaterial = await api.uploadMaterial(file);
        setUploadProgress(100);

        sessionStorage.setItem("draft_source_type", "material");
        sessionStorage.setItem("draft_material_id", uploadedMaterial.id);
        sessionStorage.setItem("draft_material_name", uploadedMaterial.filename);
        sessionStorage.removeItem("draft_topic");

        router.push("/lessons/new/profile");
      } catch (err: any) {
        setError(err.message || "Failed to upload study material.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <AppShell pageTitle={t("create.title")}>
      <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {t("create.step")}
            </span>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-[#0b1c30] mt-1">
              {t("create.title")}
            </h2>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabbed Creation Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1 gap-1">
            <button
              type="button"
              onClick={() => setMode("topic")}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                mode === "topic"
                  ? "bg-white text-[#0b1c30] shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>{t("create.topic_title")}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                mode === "upload"
                  ? "bg-white text-[#0b1c30] shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>{t("create.upload_title")}</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-5 sm:p-6 space-y-4">
            {mode === "topic" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {t("create.topic_label")}
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                    placeholder={t("create.topic_placeholder")}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400">
                    {t("create.popular_topics")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleTopicChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTopic(chip)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-xs text-slate-700 transition cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-6 text-center bg-slate-50 transition flex flex-col items-center justify-center space-y-2 cursor-pointer"
                >
                  <UploadCloud className="w-6 h-6 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">
                    {t("create.drag_drop")}{" "}
                    <label className="text-emerald-700 hover:underline font-bold cursor-pointer">
                      {t("create.browse")}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {t("create.supported_formats")}
                  </p>
                </div>

                {file && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${uploadProgress}%` }}
                        className="h-full bg-emerald-600 transition-all rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleContinue}
                disabled={isUploading || (mode === "topic" ? !topic.trim() : !file)}
                className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{isUploading ? "Uploading..." : t("create.continue_btn")}</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

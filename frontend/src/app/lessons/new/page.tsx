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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Step 1 of 3 · Source Content
          </span>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
            {t("create.title")}
          </h1>
          <p className="text-sm text-slate-600">
            Choose whether to enter a subject directly or upload lecture notes and textbook chapters.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabbed Creation Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Mode Switcher Pills */}
          <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("topic")}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer interactive-tactile ${
                mode === "topic"
                  ? "bg-white text-[#0f172a] shadow-xs border border-slate-200 font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Enter Subject or Topic</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer interactive-tactile ${
                mode === "upload"
                  ? "bg-white text-[#0f172a] shadow-xs border border-slate-200 font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Upload Notes / Book</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 space-y-5">
            {mode === "topic" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    What topic would you like to master?
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                    placeholder="e.g. Kirchhoff's Current Law, Convolutional Neural Networks..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm text-[#0f172a] focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Suggestions Pills */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-500 font-medium">Or choose a curriculum topic:</span>
                  <div className="flex flex-wrap gap-2">
                    {sampleTopicChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTopic(chip)}
                        className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-700 transition interactive-tactile cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-slate-50/50 transition cursor-pointer space-y-3"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-white rounded-full border border-slate-200 flex items-center justify-center mx-auto text-emerald-600">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#0f172a]">
                      Click to upload or drag & drop notes
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports PDF, DOCX, PPTX, TXT up to 25MB
                    </p>
                  </div>
                </div>

                {file && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-between text-xs px-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-900 truncate">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions with Pill Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleContinue}
                disabled={isUploading || (mode === "topic" ? !topic.trim() : !file)}
                className="px-6 py-2.5 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-40 text-white rounded-full text-xs font-bold transition interactive-tactile flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Continue to Profile</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

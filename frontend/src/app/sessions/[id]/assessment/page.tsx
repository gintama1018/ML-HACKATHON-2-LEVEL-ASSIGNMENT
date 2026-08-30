"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api, Assessment } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileCheck2
} from "lucide-react";

interface AssessmentPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default function AssessmentPage({ params }: AssessmentPageProps) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const router = useRouter();
  const { t } = useLanguage();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrCreateAssessment = async () => {
      setIsLoading(true);
      try {
        const exam = await api.generateAssessment(sessionId);
        setAssessment(exam);
        if (exam.student_answers) {
          setAnswers(exam.student_answers);
        }
      } catch (err: any) {
        setError(err.message || "Failed to prepare assessment.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrCreateAssessment();
  }, [sessionId]);

  const questions = assessment?.questions || [];
  const currentQ = questions[currentIndex];

  const handleSelectAnswer = (ans: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: ans }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsReviewMode(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.submitAssessment(sessionId, answers);
      router.push(`/sessions/${sessionId}/report`);
    } catch (err: any) {
      setError(err.message || "Failed to submit assessment.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !assessment) {
    return (
      <AppShell pageTitle={t("exam.title")}>
        <div className="max-w-xl mx-auto py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Preparing your final check questions...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle={t("exam.title")}>
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Header with progress */}
        <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 card-elevation-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <FileCheck2 className="w-4 h-4" />
            </span>
            <span className="font-heading font-bold text-sm text-[#0b1c30]">
              {isReviewMode ? t("exam.review") : `${t("exam.question")} ${currentIndex + 1} / ${questions.length}`}
            </span>
          </div>

          <div className="flex gap-1.5">
            {questions.map((_, idx) => (
              <span
                key={idx}
                className={`w-3 h-3 rounded-full transition ${
                  idx === currentIndex
                    ? "bg-[#0f172a] ring-2 ring-slate-300"
                    : answers[questions[idx].id]
                    ? "bg-emerald-500"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. STATE: Single Question Flow */}
        {!isReviewMode && currentQ && (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 card-elevation-1 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
                {currentQ.concept}
              </span>
              <h3 className="font-heading text-base sm:text-lg font-bold text-[#0b1c30] leading-relaxed">
                {currentQ.prompt}
              </h3>
            </div>

            {/* MCQ Options */}
            {currentQ.options && (
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAnswer(opt)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition flex items-start gap-3.5 cursor-pointer btn-tactile ${
                      answers[currentQ.id] === opt
                        ? "bg-[#eff4ff] border-[#0f172a] text-[#0b1c30] ring-1 ring-[#0f172a] font-semibold shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Free text input if not MCQ */}
            {!currentQ.options && (
              <textarea
                rows={3}
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleSelectAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="w-full p-4 bg-[#f8f9ff] border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-[#0b1c30] focus:outline-none focus:border-[#0f172a]"
              />
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 btn-tactile"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t("exam.previous")}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!answers[currentQ.id]}
                className="px-6 py-3 bg-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-white text-xs sm:text-sm font-heading font-bold rounded-xl shadow transition flex items-center gap-2 btn-tactile"
              >
                <span>{currentIndex === questions.length - 1 ? t("exam.review") : t("exam.next")}</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        )}

        {/* 2. STATE: Review Mode Summary */}
        {isReviewMode && (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 card-elevation-1 space-y-6">
            <div>
              <h3 className="font-heading text-lg font-bold text-[#0b1c30]">{t("exam.review")}</h3>
              <p className="text-xs text-slate-500 mt-1">
                You can review or edit any answer before server-side evaluation.
              </p>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-1 truncate">
                    <p className="font-bold text-[#0b1c30] truncate">
                      {idx + 1}. {q.prompt}
                    </p>
                    <p className="text-emerald-700 truncate font-mono text-[11px] font-semibold">
                      Answer: {answers[q.id] || "Not answered"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsReviewMode(false);
                    }}
                    className="text-xs text-[#0f172a] hover:text-emerald-600 font-bold underline shrink-0 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReviewMode(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl btn-tactile"
              >
                {t("exam.previous")}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs sm:text-sm rounded-xl shadow-lg transition btn-tactile flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Grading Assessment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t("exam.submit")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

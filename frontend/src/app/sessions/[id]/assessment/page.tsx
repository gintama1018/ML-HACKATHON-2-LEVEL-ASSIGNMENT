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
      <AppShell pageTitle="Mastery Assessment">
        <div className="max-w-xl mx-auto py-16 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Preparing diagnostic mastery questions...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Mastery Assessment">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress Header Capsule */}
        <div className="flex items-center justify-between p-4 sm:px-6 sm:py-3.5 bg-white rounded-full border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-full bg-slate-100 text-[#0f172a]">
              <FileCheck2 className="w-4 h-4" />
            </span>
            <span className="font-heading font-bold text-sm text-[#0f172a]">
              {isReviewMode ? "Review All Answers" : `Question ${currentIndex + 1} of ${questions.length}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {questions.map((_, idx) => (
              <span
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  idx === currentIndex
                    ? "bg-[#0f172a] ring-2 ring-slate-300"
                    : answers[questions[idx].id]
                    ? "bg-emerald-600"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-full text-xs text-rose-800 flex items-center gap-2 px-6">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. STATE: Single Question Flow */}
        {!isReviewMode && currentQ && (
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3.5 py-1 rounded-full">
                {currentQ.concept}
              </span>
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#0f172a] leading-snug pt-2">
                {currentQ.prompt}
              </h2>
            </div>

            {/* Options List (Capsule Pills) */}
            {currentQ.options && currentQ.options.length > 0 && (
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = answers[currentQ.id] === opt;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectAnswer(opt)}
                      className={`w-full px-5 py-3.5 rounded-full border text-left text-sm font-medium transition cursor-pointer interactive-tactile flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-slate-50 border-[#0f172a] text-[#0f172a] font-semibold ring-1 ring-[#0f172a]"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{opt}</span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-[#0f172a] bg-[#0f172a]" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Navigation Buttons (Capsule Pills) */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded-full transition interactive-tactile flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!answers[currentQ.id]}
                className="px-6 py-2 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-40 text-white rounded-full text-xs font-bold transition interactive-tactile flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{currentIndex === questions.length - 1 ? "Review Answers" : "Next Question"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        )}

        {/* 2. STATE: Review Mode (Capsule Pill Rows) */}
        {isReviewMode && (
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="space-y-1">
              <h2 className="font-heading font-bold text-lg text-[#0f172a]">
                Review Your Submissions
              </h2>
              <p className="text-xs text-slate-500">
                Ensure all questions are answered before submitting for diagnostic mastery evaluation.
              </p>
            </div>

            <div className="space-y-2.5">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsReviewMode(false);
                  }}
                  className="px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full flex items-center justify-between gap-3 cursor-pointer transition interactive-tactile"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Q0{idx + 1} · {q.concept}
                    </span>
                    <p className="text-xs font-medium text-[#0f172a] truncate">
                      {answers[q.id] || "No answer selected"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#0f172a] px-3 py-1 bg-white border border-slate-200 rounded-full shrink-0">
                    Edit
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsReviewMode(false)}
                className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition interactive-tactile cursor-pointer"
              >
                Back to Questions
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full text-xs font-bold transition interactive-tactile flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <span>Evaluating Mastery...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Diagnostic Exam</span>
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

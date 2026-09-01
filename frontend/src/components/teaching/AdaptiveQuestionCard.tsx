"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, HelpCircle, AlertCircle, ArrowRight, RotateCcw, Lightbulb, Target, Sparkles } from "lucide-react";
import { Question, EvaluationResponse } from "@/lib/api";

interface AdaptiveQuestionCardProps {
  question: Question;
  isEvaluating: boolean;
  evaluationResult: EvaluationResponse | null;
  onSubmitAnswer: (text: string, isUnsure?: boolean) => void;
  onContinue: () => void;
  onExplainAgain: () => void;
  retryCount: number;
}

export const AdaptiveQuestionCard: React.FC<AdaptiveQuestionCardProps> = ({
  question: initialQuestion,
  isEvaluating,
  evaluationResult,
  onSubmitAnswer,
  onContinue,
  onExplainAgain,
  retryCount,
}) => {
  const [activeQuestion, setActiveQuestion] = useState<Question>(initialQuestion);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [localEval, setLocalEval] = useState<EvaluationResponse | null>(evaluationResult);

  useEffect(() => {
    setActiveQuestion(initialQuestion);
    setSelectedOption("");
    setTextInput("");
  }, [initialQuestion.id]);

  useEffect(() => {
    setLocalEval(evaluationResult);
  }, [evaluationResult]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const answer = activeQuestion.type === "mcq" ? selectedOption : textInput;
    if (!answer.trim()) return;
    onSubmitAnswer(answer, false);
  };

  const handleUnsure = () => {
    onSubmitAnswer("I am unsure about this concept.", true);
  };

  const handleLoadFollowup = () => {
    if (localEval?.new_question) {
      const nq = localEval.new_question;
      setActiveQuestion({
        id: nq.id || `${activeQuestion.id}_followup`,
        session_id: activeQuestion.session_id,
        segment_id: activeQuestion.segment_id,
        type: (nq.type as any) || "mcq",
        is_adaptive_followup: true,
        prompt: nq.prompt,
        options: nq.options || [],
        explanation_hint: nq.explanation_hint || "Apply the alternative analogy",
        created_at: new Date().toISOString()
      });
      setSelectedOption("");
      setTextInput("");
      setLocalEval(null);
    } else {
      onContinue();
    }
  };

  const getMisconceptionText = () => {
    if (!localEval?.misconception) return null;
    if (typeof localEval.misconception === "string") return localEval.misconception;
    return localEval.misconception.description || localEval.misconception.root_cause || "Identified cognitive relationship inversion.";
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
      {/* Header with question type badge & retry counter */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-100 text-slate-700 font-semibold rounded-full text-[11px]">
            {activeQuestion.type === "mcq" && "Multiple Choice"}
            {activeQuestion.type === "short_answer" && "Short Answer"}
            {activeQuestion.type === "problem_solving" && "Problem Solving"}
            {activeQuestion.type === "own_words" && "In Your Own Words"}
          </span>

          {activeQuestion.is_adaptive_followup && (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-semibold text-[11px] flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-600" />
              <span>Targeted Follow-up</span>
            </span>
          )}
        </div>

        {retryCount > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <span>Attempt {retryCount + 1} of 3</span>
          </div>
        )}
      </div>

      {/* Question Prompt */}
      <p className="text-sm font-bold text-[#0f172a] leading-relaxed">
        {activeQuestion.prompt}
      </p>

      {/* Interactive Answer Area */}
      {!localEval && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {activeQuestion.type === "mcq" && activeQuestion.options && (
            <div className="space-y-2">
              {activeQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left px-5 py-3 rounded-full border text-xs sm:text-sm transition flex items-center justify-between gap-3 cursor-pointer interactive-tactile ${
                      isSelected
                        ? "bg-slate-50 border-[#0f172a] text-[#0f172a] font-semibold ring-1 ring-[#0f172a]"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeQuestion.type !== "mcq" && (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Explain the concept in your own words..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-[#0f172a] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
          )}

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleUnsure}
              disabled={isEvaluating}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer px-3 py-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>I'm unsure</span>
            </button>

            <button
              type="submit"
              disabled={isEvaluating || (activeQuestion.type === "mcq" ? !selectedOption : !textInput.trim())}
              className="px-5 py-2 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-full transition interactive-tactile flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isEvaluating ? (
                <span>Evaluating...</span>
              ) : (
                <>
                  <span>Submit Answer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Post-Evaluation Feedback State */}
      {localEval && (
        <div className="space-y-3 pt-1">
          {localEval.correct ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {localEval.mastery_state === "confirmed"
                      ? "Confirmed Mastery Achieved!"
                      : "Provisional Concept Mastery Verified"}
                  </span>
                </div>
                {localEval.mastery_state && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {localEval.mastery_state}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                {localEval.feedback || localEval.notes || "You have correctly applied the fundamental relationship."}
              </p>
              {localEval.mastery_evidence && (
                <p className="text-[11px] text-emerald-700 bg-emerald-100/60 p-2 rounded-xl border border-emerald-200/60 font-medium">
                  <span className="font-bold">Mastery Evidence:</span> {localEval.mastery_evidence}
                </p>
              )}
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={onContinue}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-full transition interactive-tactile flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Advance to Next Concept</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Misconception Detected — Let's Adapt</span>
              </div>

              {getMisconceptionText() && (
                <div className="p-3.5 bg-white rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-amber-800 text-[11px]">
                    Diagnosed Barrier:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {getMisconceptionText()}
                  </p>
                </div>
              )}

              {localEval.new_explanation && (
                <div className="p-3.5 bg-white rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-amber-800 text-[11px] flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Alternative Intuition:</span>
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{localEval.new_explanation}"
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={onExplainAgain}
                  className="px-3.5 py-1.5 bg-white border border-amber-300 rounded-full text-xs font-semibold text-slate-700 hover:text-[#0f172a] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Analogy</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadFollowup}
                  className="px-5 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-full transition interactive-tactile flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Solve Follow-up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

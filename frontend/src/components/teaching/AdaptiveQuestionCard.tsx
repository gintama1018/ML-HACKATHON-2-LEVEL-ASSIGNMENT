"use client";

import React, { useState } from "react";
import { CheckCircle2, HelpCircle, AlertCircle, ArrowRight, RotateCcw, Lightbulb } from "lucide-react";
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
  question,
  isEvaluating,
  evaluationResult,
  onSubmitAnswer,
  onContinue,
  onExplainAgain,
  retryCount,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const answer = question.type === "mcq" ? selectedOption : textInput;
    if (!answer.trim()) return;
    onSubmitAnswer(answer, false);
  };

  const handleUnsure = () => {
    onSubmitAnswer("I am unsure about this concept.", true);
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
      {/* Header with question type badge & retry counter */}
      <div className="flex items-center justify-between text-xs">
        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md border border-slate-200 text-[10px] uppercase tracking-wider">
          {question.type === "mcq" && "Multiple Choice"}
          {question.type === "short_answer" && "Short Answer"}
          {question.type === "problem_solving" && "Problem Solving"}
          {question.type === "own_words" && "In Your Own Words"}
        </span>

        {retryCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <span>Attempt {retryCount + 1}/3</span>
            <div className="flex gap-0.5 ml-1">
              {[0, 1, 2].map((idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full ${
                    idx < retryCount ? "bg-amber-500" : "bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Question Prompt */}
      <p className="text-xs sm:text-sm font-bold text-[#0b1c30] leading-snug">
        {question.prompt}
      </p>

      {/* Interactive Answer Area */}
      {!evaluationResult && (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {question.type === "mcq" && question.options && (
            <div className="space-y-1.5">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-start gap-2.5 cursor-pointer ${
                    selectedOption === opt
                      ? "bg-[#eff4ff] border-[#0f172a] text-[#0b1c30] font-bold ring-1 ring-[#0f172a]"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-tight">{opt}</span>
                </button>
              ))}
            </div>
          )}

          {question.type !== "mcq" && (
            <div className="space-y-1.5">
              <textarea
                rows={2}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your explanation..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:border-[#0f172a]"
              />
            </div>
          )}

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleUnsure}
              disabled={isEvaluating}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>I'm not sure</span>
            </button>

            <button
              type="submit"
              disabled={isEvaluating || (question.type === "mcq" ? !selectedOption : !textInput.trim())}
              className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isEvaluating ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
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

      {/* Post-Evaluation Adaptive Reteach State */}
      {evaluationResult && (
        <div className="space-y-2.5 animate-in fade-in duration-150 pt-1">
          {evaluationResult.correct ? (
            /* Correct Feedback */
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Correct! Excellent intuition.</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                {evaluationResult.feedback}
              </p>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={onContinue}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Continue Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Incorrect / Misconception Adaptation Feedback */
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Let's look at this differently</span>
              </div>

              {evaluationResult.misconception && (
                <div className="p-2 bg-white rounded border border-amber-200 text-xs text-slate-700">
                  <p className="font-bold text-[#0b1c30]">Identified Mental Gap:</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{evaluationResult.misconception}</p>
                </div>
              )}

              {evaluationResult.new_explanation && (
                <div className="p-2 bg-white rounded border border-amber-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-[#0b1c30] flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Alternative Analogy:</span>
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{evaluationResult.new_explanation}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={onExplainAgain}
                  className="text-[11px] font-bold text-slate-700 hover:text-[#0b1c30] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Explain with New Analogy</span>
                </button>

                <button
                  type="button"
                  onClick={onContinue}
                  className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Try Follow-up</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

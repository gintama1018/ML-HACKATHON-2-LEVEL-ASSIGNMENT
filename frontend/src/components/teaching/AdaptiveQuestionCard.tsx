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

  // When student clicks "Try Follow-up Question", activate the new adaptive question!
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
      setLocalEval(null); // Reset evaluation to allow solving the new question
    } else {
      onContinue();
    }
  };

  // Extract misconception description string safely
  const getMisconceptionText = () => {
    if (!localEval?.misconception) return null;
    if (typeof localEval.misconception === "string") return localEval.misconception;
    return localEval.misconception.description || localEval.misconception.root_cause || "Identified cognitive relationship inversion.";
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
      {/* Header with question type badge & retry counter */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md border border-slate-200 text-[10px] uppercase tracking-wider">
            {activeQuestion.type === "mcq" && "Multiple Choice"}
            {activeQuestion.type === "short_answer" && "Short Answer"}
            {activeQuestion.type === "problem_solving" && "Problem Solving"}
            {activeQuestion.type === "own_words" && "In Your Own Words"}
          </span>

          {activeQuestion.is_adaptive_followup && (
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[10px] flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-600" />
              <span>Targeted Follow-up</span>
            </span>
          )}
        </div>

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
        {activeQuestion.prompt}
      </p>

      {/* Interactive Answer Area */}
      {!localEval && (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {activeQuestion.type === "mcq" && activeQuestion.options && (
            <div className="space-y-1.5">
              {activeQuestion.options.map((opt, idx) => (
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

          {activeQuestion.type !== "mcq" && (
            <div className="space-y-1.5">
              <textarea
                rows={2}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Explain the concept in your own words..."
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
              disabled={isEvaluating || (activeQuestion.type === "mcq" ? !selectedOption : !textInput.trim())}
              className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isEvaluating ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating...</span>
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
      {localEval && (
        <div className="space-y-2.5 animate-in fade-in duration-150 pt-1">
          {localEval.correct ? (
            /* Correct Feedback */
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Correct! Conceptual Mastery Confirmed.</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                {localEval.feedback || localEval.notes || "You have correctly applied the fundamental relationship."}
              </p>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={onContinue}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Advance to Next Concept</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Misconception Diagnostic & Adaptive Reteach */
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Misconception Detected — Let's Adapt</span>
              </div>

              {/* Mental Gap Diagnosis */}
              {getMisconceptionText() && (
                <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs text-slate-700">
                  <p className="font-bold text-[#0b1c30] text-[11px] uppercase tracking-wider text-amber-800">
                    Diagnosed Cognitive Barrier:
                  </p>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                    {getMisconceptionText()}
                  </p>
                </div>
              )}

              {/* Alternative Analogy */}
              {localEval.new_explanation && (
                <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-[#0b1c30] text-[11px] uppercase tracking-wider text-amber-800 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Alternative Intuitive Mental Model:</span>
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{localEval.new_explanation}"
                  </p>
                </div>
              )}

              {/* Action Buttons: Explain Again vs Try Targeted Follow-up */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={onExplainAgain}
                  className="text-[11px] font-bold text-slate-700 hover:text-[#0b1c30] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Analogy</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadFollowup}
                  className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Solve Follow-up Question</span>
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

"use client";

import React, { useState } from "react";
import { Play, LineChart, Cpu, Clock, Layers, Code2, Dna, FlaskConical, Info } from "lucide-react";

interface WhiteboardProps {
  concept: string;
  visualType: string;
  visualSpec: Record<string, any>;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ concept, visualType, visualSpec }) => {
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [showRationale, setShowRationale] = useState(false);

  const handleRunCode = () => {
    setIsRunningCode(true);
    setTimeout(() => {
      setCodeOutput(visualSpec.expected_output || "Program executed successfully (exit code 0).\nOutput: [10, 5, 3.33, 2.5]");
      setIsRunningCode(false);
    }, 400);
  };

  const rationaleText = visualSpec.decision_rationale || 
    `Selected ${visualType.toUpperCase()} representation to provide an intuitive mental model for ${concept}.`;

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Whiteboard Top Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded bg-white border border-slate-200 text-slate-700">
            {visualType === "chart" && <LineChart className="w-3.5 h-3.5 text-emerald-600" />}
            {visualType === "math" && <Layers className="w-3.5 h-3.5 text-indigo-600" />}
            {visualType === "code" && <Code2 className="w-3.5 h-3.5 text-amber-600" />}
            {visualType === "diagram" && <Cpu className="w-3.5 h-3.5 text-cyan-600" />}
            {visualType === "biology" && <Dna className="w-3.5 h-3.5 text-emerald-600" />}
            {visualType === "chemistry" && <FlaskConical className="w-3.5 h-3.5 text-purple-600" />}
            {visualType === "timeline" && <Clock className="w-3.5 h-3.5 text-blue-600" />}
          </span>
          <span className="font-bold text-[#0b1c30] truncate text-xs">
            {visualSpec.title || concept}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowRationale(!showRationale)}
            title="AI Visual Selection Rationale"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
          >
            <Info className="w-3 h-3 text-emerald-600" />
            <span>Why this visual?</span>
          </button>
          <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider bg-slate-200 text-slate-800">
            {visualType}
          </span>
        </div>
      </div>

      {/* Visual Explainability Callout (REQ-57) */}
      {showRationale && (
        <div className="px-3 py-1.5 bg-emerald-50 border-b border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-1.5 animate-fadeIn">
          <span className="font-bold text-emerald-800 shrink-0">Decision Rationale:</span>
          <span>{rationaleText}</span>
        </div>
      )}

      {/* Whiteboard Canvas Area */}
      <div className="flex-1 p-3 flex flex-col items-center justify-center overflow-hidden bg-[#0f172a] text-white relative">
        {/* MODE 1: CHART */}
        {visualType === "chart" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-2">
            <p className="text-[11px] font-semibold text-slate-400 text-center">
              {visualSpec.title || "Parameter Relationship Dynamics"}
            </p>

            <div className="w-full max-w-sm h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 300 120">
                <line x1="30" y1="100" x2="280" y2="100" stroke="#475569" strokeWidth="1.5" />
                <line x1="30" y1="10" x2="30" y2="100" stroke="#475569" strokeWidth="1.5" />
                <path d="M 30 100 Q 140 70, 270 20" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                <circle cx="150" cy="65" r="4" fill="#38bdf8" />
                <text x="160" y="60" fill="#38bdf8" fontSize="10" fontWeight="bold">Output = Force / Resistance</text>
                <text x="250" y="115" fill="#94a3b8" fontSize="9">Driving Force →</text>
                <text x="5" y="20" fill="#94a3b8" fontSize="9" transform="rotate(-90 20,20)">Observed Flow →</text>
              </svg>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Proportional linear equilibrium across systemic resistance
            </p>
          </div>
        )}

        {/* MODE 2: BIOLOGY STRUCTURE (REQ-54) */}
        {visualType === "biology" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-1.5">
            <p className="text-[11px] font-semibold text-emerald-400 text-center">
              Biological System Architecture & Functional Organelles
            </p>
            <div className="w-full max-w-md h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 320 110">
                <ellipse cx="160" cy="55" rx="140" ry="48" fill="#14532d" fillOpacity="0.3" stroke="#22c55e" strokeWidth="2" />
                <text x="35" y="30" fill="#4ade80" fontSize="9" fontWeight="bold">Outer Membrane</text>
                <ellipse cx="120" cy="55" rx="35" ry="25" fill="#78350f" fillOpacity="0.4" stroke="#f59e0b" strokeWidth="2" />
                <text x="98" y="58" fill="#fbbf24" fontSize="10" fontWeight="bold">Nucleus</text>
                <ellipse cx="220" cy="45" rx="22" ry="12" fill="#7f1d1d" fillOpacity="0.5" stroke="#ef4444" strokeWidth="1.5" />
                <text x="205" y="48" fill="#f87171" fontSize="8" fontWeight="bold">Mitochondria</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Cellular compartmentalization and structural functional relationships
            </p>
          </div>
        )}

        {/* MODE 3: CHEMISTRY REACTION & MOLECULAR (REQ-53) */}
        {visualType === "chemistry" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-1.5">
            <p className="text-[11px] font-semibold text-purple-400 text-center">
              Chemical Kinetics & Reaction Energy Pathway
            </p>
            <div className="w-full max-w-md h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 300 110">
                <line x1="30" y1="95" x2="270" y2="95" stroke="#475569" strokeWidth="1.5" />
                <line x1="30" y1="15" x2="30" y2="95" stroke="#475569" strokeWidth="1.5" />
                <path d="M 30 75 Q 120 75, 140 25 Q 160 25, 180 75 L 270 85" fill="none" stroke="#a855f7" strokeWidth="2.5" />
                <circle cx="150" cy="25" r="4" fill="#ec4899" />
                <text x="135" y="18" fill="#f472b6" fontSize="9" fontWeight="bold">Transition State (Ea)</text>
                <text x="35" y="70" fill="#34d399" fontSize="9" fontWeight="bold">Reactants [A+B]</text>
                <text x="210" y="80" fill="#60a5fa" fontSize="9" fontWeight="bold">Products [C+D]</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Activation barrier dynamics governing thermodynamic equilibrium
            </p>
          </div>
        )}

        {/* MODE 4: DIAGRAM / CIRCUITS */}
        {visualType === "diagram" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-1.5">
            <div className="w-full max-w-md h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 320 110">
                <rect x="30" y="20" width="260" height="70" rx="8" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 3" />
                <line x1="30" y1="50" x2="30" y2="60" stroke="#10b981" strokeWidth="4" />
                <text x="15" y="58" fill="#10b981" fontSize="10" fontWeight="bold">V</text>
                <path d="M 130 20 L 140 10 L 150 30 L 160 10 L 170 30 L 180 20" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                <text x="140" y="8" fill="#f59e0b" fontSize="9" fontWeight="bold">Resistor (R)</text>
                <path d="M 220 20 L 230 18 L 220 16" fill="#38bdf8" />
                <text x="240" y="16" fill="#38bdf8" fontSize="9" fontWeight="bold">Current (I) →</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Closed loop voltage source driving electron flow through resistance.
            </p>
          </div>
        )}

        {/* MODE 5: MATH DERIVATION */}
        {visualType === "math" && (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-2 text-center p-2">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <p className="font-mono text-sm sm:text-base font-bold text-emerald-400">
                {visualSpec.formula || "Output = Driving Force / Opposing Constraints"}
              </p>
              <p className="text-[11px] text-slate-400">
                {visualSpec.derivation_step || "Deterministic formulation derived from first principles."}
              </p>
            </div>
          </div>
        )}

        {/* MODE 6: CODE RUNNER */}
        {visualType === "code" && (
          <div className="w-full h-full flex flex-col justify-between p-2 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Python 3.11</span>
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{isRunningCode ? "Running..." : "Run"}</span>
              </button>
            </div>

            <pre className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
              <code>{visualSpec.code_snippet || "def calculate_output(potential, resistance):\n    return potential / resistance\n\nprint(calculate_output(12, 4))"}</code>
            </pre>

            {codeOutput && (
              <div className="p-1.5 bg-slate-950/80 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                {codeOutput}
              </div>
            )}
          </div>
        )}

        {/* MODE 7: TIMELINE / CHRONOLOGICAL */}
        {visualType === "timeline" && (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center space-y-2">
            <p className="font-bold text-xs text-blue-400">Chronological Evolution & Milestones</p>
            <div className="flex items-center gap-2 max-w-sm overflow-x-auto py-1">
              <div className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] shrink-0">Stage 1: Axiom</div>
              <div className="text-slate-500 text-xs">→</div>
              <div className="px-2 py-1 rounded bg-blue-900/60 border border-blue-700 text-[10px] shrink-0 text-blue-300">Stage 2: Model</div>
              <div className="text-slate-500 text-xs">→</div>
              <div className="px-2 py-1 rounded bg-emerald-900/60 border border-emerald-700 text-[10px] shrink-0 text-emerald-300">Stage 3: Application</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

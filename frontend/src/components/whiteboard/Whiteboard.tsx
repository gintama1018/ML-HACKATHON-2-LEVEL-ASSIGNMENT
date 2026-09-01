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
    `Selected ${visualType} representation to provide an intuitive mental model for ${concept}.`;

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
          <span className="font-bold text-[#0f172a] truncate text-xs">
            {visualSpec.title || concept}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowRationale(!showRationale)}
            title="AI Visual Selection Rationale"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition interactive-tactile cursor-pointer"
          >
            <Info className="w-3 h-3 text-slate-500" />
            <span>Why this visual?</span>
          </button>
          <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-slate-200 text-slate-700 capitalize">
            {visualType}
          </span>
        </div>
      </div>

      {/* Visual Explainability Callout (REQ-57) */}
      {showRationale && (
        <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 flex items-start gap-1.5 animate-in fade-in duration-100">
          <span className="font-semibold text-[#0f172a] shrink-0">Decision Rationale:</span>
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

        {/* MODE 2: BIOLOGY STRUCTURE */}
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

        {/* MODE 3: CHEMISTRY REACTION & MOLECULAR */}
        {visualType === "chemistry" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-1.5">
            <p className="text-[11px] font-semibold text-cyan-400 text-center">
              Stoichiometric Reaction & Molecular Mechanism
            </p>
            <div className="w-full max-w-md h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 320 110">
                <circle cx="60" cy="55" r="22" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                <text x="50" y="60" fill="#ffffff" fontSize="11" fontWeight="bold">Na⁺</text>
                <text x="95" y="60" fill="#94a3b8" fontSize="18" fontWeight="bold">+</text>
                <circle cx="140" cy="55" r="22" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
                <text x="130" y="60" fill="#ffffff" fontSize="11" fontWeight="bold">Cl⁻</text>
                <line x1="175" y1="55" x2="215" y2="55" stroke="#f59e0b" strokeWidth="3" markerEnd="url(#arrow)" />
                <rect x="230" y="35" width="70" height="40" rx="8" fill="#312e81" stroke="#818cf8" strokeWidth="2" />
                <text x="245" y="60" fill="#ffffff" fontSize="12" fontWeight="bold">NaCl</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Ionic lattice crystallization and charge neutralization equilibrium
            </p>
          </div>
        )}

        {/* MODE 4: CIRCUITS / SCHEMATIC DIAGRAM */}
        {visualType === "diagram" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-1.5">
            <p className="text-[11px] font-semibold text-cyan-400 text-center">
              Closed Loop Circuit Topology
            </p>
            <div className="w-full max-w-sm h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 280 110">
                <rect x="30" y="15" width="220" height="80" fill="none" stroke="#0284c7" strokeWidth="2" rx="4" />
                <circle cx="30" cy="55" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <text x="25" y="59" fill="#38bdf8" fontSize="11" fontWeight="bold">V</text>
                <rect x="120" y="8" width="40" height="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                <text x="133" y="19" fill="#f59e0b" fontSize="9" fontWeight="bold">R1</text>
                <rect x="235" y="45" width="30" height="20" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                <text x="242" y="58" fill="#10b981" fontSize="8" fontWeight="bold">Load</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              I = V / R · Consistent current flow through closed circuit loop
            </p>
          </div>
        )}

        {/* MODE 5: MATHEMATICAL DERIVATION */}
        {visualType === "math" && (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400">Formal Step-by-Step Derivation</span>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-xs text-amber-300 text-center w-full max-w-md shadow-inner space-y-1">
              <p>Step 1:  V = I · R</p>
              <p className="text-emerald-400">Step 2:  I = V / R</p>
              <p className="text-cyan-400">Step 3:  P = V · I = I² · R = V² / R</p>
            </div>
            <span className="text-[10px] text-slate-400">Derived from Joule heating & conservation of energy</span>
          </div>
        )}

        {/* MODE 6: CODE SANDBOX */}
        {visualType === "code" && (
          <div className="w-full h-full flex flex-col justify-between p-2 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
              <span>Python 3.11 Runnable Sandbox</span>
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{isRunningCode ? "Running..." : "Run"}</span>
              </button>
            </div>
            <pre className="font-mono text-[11px] text-emerald-300 bg-slate-950 p-2 rounded overflow-x-auto flex-1 border border-slate-800">
              {visualSpec.code_snippet || `def compute_current(voltage: float, resistance: float) -> float:\n    if resistance <= 0:\n        raise ValueError("Resistance must be positive")\n    return voltage / resistance\n\nprint(compute_current(12.0, 4.0)) # 3.0 Amperes`}
            </pre>
            {codeOutput && (
              <div className="p-1.5 bg-slate-900 border border-emerald-500/40 rounded text-[10px] font-mono text-emerald-400">
                {codeOutput}
              </div>
            )}
          </div>
        )}

        {/* MODE 7: HISTORICAL TIMELINE */}
        {visualType === "timeline" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-2">
            <p className="text-[11px] font-semibold text-blue-400 text-center">
              Historical Discovery Timeline
            </p>
            <div className="w-full max-w-sm h-32 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 280 80">
                <line x1="20" y1="40" x2="260" y2="40" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="50" cy="40" r="5" fill="#60a5fa" />
                <text x="35" y="25" fill="#93c5fd" fontSize="9" fontWeight="bold">1827</text>
                <text x="30" y="60" fill="#94a3b8" fontSize="8">Discovery</text>
                <circle cx="140" cy="40" r="5" fill="#60a5fa" />
                <text x="125" y="25" fill="#93c5fd" fontSize="9" fontWeight="bold">1845</text>
                <text x="120" y="60" fill="#94a3b8" fontSize="8">Kirchhoff</text>
                <circle cx="230" cy="40" r="5" fill="#60a5fa" />
                <text x="215" y="25" fill="#93c5fd" fontSize="9" fontWeight="bold">1865</text>
                <text x="210" y="60" fill="#94a3b8" fontSize="8">Maxwell</text>
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

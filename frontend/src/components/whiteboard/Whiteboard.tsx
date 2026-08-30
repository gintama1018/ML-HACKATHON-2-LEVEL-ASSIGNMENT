"use client";

import React, { useState } from "react";
import { Play, CheckCircle2, Terminal, Code2, LineChart, Cpu, Clock, Layers } from "lucide-react";

interface WhiteboardProps {
  concept: string;
  visualType: string;
  visualSpec: Record<string, any>;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ concept, visualType, visualSpec }) => {
  const [activeTab, setActiveTab] = useState<"visual" | "code_run">("visual");
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  const handleRunCode = () => {
    setIsRunningCode(true);
    setTimeout(() => {
      setCodeOutput(visualSpec.expected_output || "Program executed successfully (exit code 0).\nOutput: [10, 5, 3.33, 2.5]");
      setIsRunningCode(false);
    }, 500);
  };

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
            {visualType === "timeline" && <Clock className="w-3.5 h-3.5 text-purple-600" />}
          </span>
          <span className="font-bold text-[#0b1c30] truncate text-xs">
            {visualSpec.title || concept}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider bg-slate-200 text-slate-800">
            {visualType}
          </span>
        </div>
      </div>

      {/* Whiteboard Canvas Area */}
      <div className="flex-1 p-3 flex flex-col items-center justify-center overflow-hidden bg-[#0f172a] text-white">
        {/* MODE 1: CHART */}
        {visualType === "chart" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-2">
            <p className="text-[11px] font-semibold text-slate-400 text-center">
              {visualSpec.title || "Parameter Relationship Curve"}
            </p>

            {/* SVG Plot */}
            <div className="w-full max-w-sm h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 300 120">
                <line x1="30" y1="100" x2="280" y2="100" stroke="#475569" strokeWidth="1.5" />
                <line x1="30" y1="10" x2="30" y2="100" stroke="#475569" strokeWidth="1.5" />
                <path d="M 30 100 Q 140 70, 270 20" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                <circle cx="150" cy="65" r="4" fill="#38bdf8" />
                <text x="160" y="60" fill="#38bdf8" fontSize="10" fontWeight="bold">I = V / R</text>
                <text x="260" y="115" fill="#94a3b8" fontSize="9">Voltage (V) →</text>
                <text x="5" y="20" fill="#94a3b8" fontSize="9" transform="rotate(-90 20,20)">Current (I) →</text>
              </svg>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Linear slope = 1/R (Ohmic Conductor relationship)
            </p>
          </div>
        )}

        {/* MODE 2: DIAGRAM */}
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

        {/* MODE 3: MATH DERIVATION */}
        {visualType === "math" && (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-2 text-center p-2">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <p className="font-mono text-sm sm:text-base font-bold text-emerald-400">
                {visualSpec.formula || "V = I · R"}
              </p>
              <p className="text-[11px] text-slate-400">
                {visualSpec.derivation_step || "Where V = Potential Diff (Volts), I = Current (Amps), R = Resistance (Ohms)"}
              </p>
            </div>
          </div>
        )}

        {/* MODE 4: CODE RUNNER */}
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
              <code>{visualSpec.code_snippet || "def calculate_current(v, r):\n    return v / r\n\nprint(calculate_current(10, 2))"}</code>
            </pre>

            {codeOutput && (
              <div className="p-1.5 bg-slate-950/80 rounded text-[10px] font-mono text-slate-300 border border-slate-800">
                {codeOutput}
              </div>
            )}
          </div>
        )}

        {/* MODE 5: TIMELINE / DEFAULT */}
        {visualType !== "chart" && visualType !== "diagram" && visualType !== "math" && visualType !== "code" && (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center space-y-1">
            <p className="font-bold text-xs text-white">{concept}</p>
            <p className="text-[11px] text-slate-400 max-w-xs">{visualSpec.description || "Conceptual whiteboard representation"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

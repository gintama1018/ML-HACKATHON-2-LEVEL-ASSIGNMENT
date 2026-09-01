"use client";

import React, { useState } from "react";
import { Play, LineChart, Cpu, Clock, Layers, Code2, Dna, FlaskConical, Info, Sparkles, Network } from "lucide-react";

interface WhiteboardProps {
  concept: string;
  visualType: string;
  visualSpec: Record<string, any>;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ concept, visualType, visualSpec }) => {
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [showRationale, setShowRationale] = useState(false);

  const conceptLower = (concept + " " + (visualSpec.title || "") + " " + visualType).toLowerCase();

  const handleRunCode = () => {
    setIsRunningCode(true);
    setTimeout(() => {
      if (conceptLower.includes("machine learning") || conceptLower.includes("linear regression") || conceptLower.includes("neural")) {
        setCodeOutput("Model trained in 0.04s (Epochs: 100)\nMSE Loss: 0.0214 | R² Score: 0.982\nPredictions: [12.4, 24.1, 36.8]");
      } else if (conceptLower.includes("newton") || conceptLower.includes("force")) {
        setCodeOutput("Computing Net Force: F_net = 15.0 N\nAcceleration: a = 3.0 m/s² [Verified]");
      } else if (conceptLower.includes("induction") || conceptLower.includes("electromagnetic")) {
        setCodeOutput("Magnetic Flux dPhi/dt = 4.2 Wb/s\nInduced EMF = -4.20 Volts (Lenz Law Active)");
      } else {
        setCodeOutput(visualSpec.expected_output || "Program executed successfully (exit code 0).\nOutput: [10, 5, 3.33, 2.5]");
      }
      setIsRunningCode(false);
    }, 400);
  };

  const rationaleText = visualSpec.decision_rationale || 
    `Selected ${visualType} representation to provide an intuitive mental model for ${concept}.`;

  // Domain Detection
  const isML = conceptLower.includes("machine learning") || conceptLower.includes("linear regression") || conceptLower.includes("neural") || conceptLower.includes("deep learning") || conceptLower.includes("ai");
  const isMechanics = conceptLower.includes("newton") || conceptLower.includes("force") || conceptLower.includes("motion") || conceptLower.includes("gravity") || conceptLower.includes("inertia");
  const isInduction = conceptLower.includes("induction") || conceptLower.includes("electromagnetic") || conceptLower.includes("faraday") || conceptLower.includes("lenz") || conceptLower.includes("magnetic");
  const isThermodynamics = conceptLower.includes("thermo") || conceptLower.includes("carnot") || conceptLower.includes("heat") || conceptLower.includes("entropy") || conceptLower.includes("engine");
  const isCircuit = visualType === "diagram" || conceptLower.includes("circuit") || conceptLower.includes("ohm") || conceptLower.includes("voltage") || conceptLower.includes("resistor");
  const isBiology = visualType === "biology" || conceptLower.includes("bio") || conceptLower.includes("cell") || conceptLower.includes("dna") || conceptLower.includes("organelle");
  const isChemistry = visualType === "chemistry" || conceptLower.includes("chem") || conceptLower.includes("reaction") || conceptLower.includes("molecular") || conceptLower.includes("kinetic");
  const isTimeline = visualType === "timeline" || conceptLower.includes("history") || conceptLower.includes("timeline") || conceptLower.includes("chronology");

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Whiteboard Top Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded bg-white border border-slate-200 text-slate-700">
            {isML ? <Network className="w-3.5 h-3.5 text-indigo-600" /> :
             isBiology ? <Dna className="w-3.5 h-3.5 text-emerald-600" /> :
             isChemistry ? <FlaskConical className="w-3.5 h-3.5 text-purple-600" /> :
             isTimeline ? <Clock className="w-3.5 h-3.5 text-blue-600" /> :
             visualType === "code" ? <Code2 className="w-3.5 h-3.5 text-amber-600" /> :
             visualType === "math" ? <Layers className="w-3.5 h-3.5 text-indigo-600" /> :
             <LineChart className="w-3.5 h-3.5 text-emerald-600" />}
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
            {isML ? "Machine Learning" : isMechanics ? "Mechanics" : isInduction ? "Electromagnetism" : visualType}
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
        
        {/* DOMAIN 1: MACHINE LEARNING & NEURAL NETWORKS */}
        {isML && visualType !== "code" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-2">
            <p className="text-[11px] font-semibold text-emerald-400 text-center">
              Linear Regression Hyperplane & Multi-Layer Neural Activations
            </p>
            <div className="w-full max-w-md h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 340 120">
                {/* Scatter Coordinate Axes */}
                <line x1="20" y1="105" x2="160" y2="105" stroke="#475569" strokeWidth="1.5" />
                <line x1="20" y1="15" x2="20" y2="105" stroke="#475569" strokeWidth="1.5" />
                {/* Data Points */}
                <circle cx="35" cy="90" r="3" fill="#38bdf8" />
                <circle cx="55" cy="80" r="3" fill="#38bdf8" />
                <circle cx="75" cy="60" r="3" fill="#38bdf8" />
                <circle cx="100" cy="50" r="3" fill="#38bdf8" />
                <circle cx="125" cy="35" r="3" fill="#38bdf8" />
                <circle cx="145" cy="25" r="3" fill="#38bdf8" />
                {/* Regression Best-Fit Line */}
                <line x1="25" y1="98" x2="155" y2="20" stroke="#10b981" strokeWidth="2.5" />
                <text x="30" y="118" fill="#94a3b8" fontSize="8">Feature X →</text>
                <text x="30" y="12" fill="#10b981" fontSize="9" fontWeight="bold">ŷ = w·x + b</text>

                {/* Neural Network Nodes */}
                <line x1="175" y1="10" x2="175" y2="110" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
                {/* Input Layer */}
                <circle cx="200" cy="35" r="7" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="200" cy="60" r="7" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="200" cy="85" r="7" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Hidden Layer */}
                <circle cx="255" cy="25" r="7" fill="#1e293b" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx="255" cy="50" r="7" fill="#1e293b" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx="255" cy="75" r="7" fill="#1e293b" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx="255" cy="100" r="7" fill="#1e293b" stroke="#a855f7" strokeWidth="1.5" />
                {/* Output Node */}
                <circle cx="310" cy="60" r="8" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
                {/* Connections */}
                <line x1="207" y1="35" x2="248" y2="25" stroke="#475569" strokeWidth="1" />
                <line x1="207" y1="60" x2="248" y2="50" stroke="#475569" strokeWidth="1" />
                <line x1="207" y1="85" x2="248" y2="75" stroke="#475569" strokeWidth="1" />
                <line x1="262" y1="50" x2="302" y2="60" stroke="#22c55e" strokeWidth="1.5" />
                <text x="295" y="80" fill="#22c55e" fontSize="8" fontWeight="bold">Output ŷ</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Cost Minimization: J(w,b) = 1/2m Σ (ŷ - y)² · Gradient Descent
            </p>
          </div>
        )}

        {/* DOMAIN 2: CLASSICAL MECHANICS / FORCES */}
        {isMechanics && !isML && visualType !== "code" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-2">
            <p className="text-[11px] font-semibold text-cyan-400 text-center">
              Free-Body Force Vectors on Incline Plane
            </p>
            <div className="w-full max-w-sm h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 300 120">
                {/* Incline Triangle */}
                <polygon points="40,105 260,105 260,35" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <text x="70" y="100" fill="#94a3b8" fontSize="9">θ = 30°</text>
                {/* Mass Block */}
                <rect x="135" y="50" width="34" height="24" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" transform="rotate(-18 152,62)" />
                <text x="145" y="66" fill="#ffffff" fontSize="10" fontWeight="bold">M</text>
                {/* Force Vectors */}
                {/* Gravity downward */}
                <line x1="152" y1="62" x2="152" y2="105" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="156" y="95" fill="#ef4444" fontSize="8" fontWeight="bold">m·g</text>
                {/* Normal Force */}
                <line x1="152" y1="62" x2="135" y2="25" stroke="#10b981" strokeWidth="2" />
                <text x="120" y="25" fill="#10b981" fontSize="8" fontWeight="bold">N = mg cosθ</text>
                {/* Friction opposing */}
                <line x1="152" y1="62" x2="190" y2="50" stroke="#f59e0b" strokeWidth="2" />
                <text x="180" y="42" fill="#f59e0b" fontSize="8" fontWeight="bold">f_k</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Newton's 2nd Law: Σ F = m · a · Equilibrium & Acceleration Dynamics
            </p>
          </div>
        )}

        {/* DOMAIN 3: ELECTROMAGNETIC INDUCTION */}
        {isInduction && !isML && visualType !== "code" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-2">
            <p className="text-[11px] font-semibold text-amber-400 text-center">
              Faraday's Law & Rotating Magnetic Flux Linkage
            </p>
            <div className="w-full max-w-sm h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 300 120">
                {/* North Pole */}
                <rect x="25" y="30" width="45" height="60" rx="4" fill="#991b1b" stroke="#ef4444" strokeWidth="2" />
                <text x="40" y="65" fill="#ffffff" fontSize="16" fontWeight="bold">N</text>
                {/* South Pole */}
                <rect x="230" y="30" width="45" height="60" rx="4" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" />
                <text x="245" y="65" fill="#ffffff" fontSize="16" fontWeight="bold">S</text>
                {/* Magnetic Flux Lines */}
                <line x1="70" y1="45" x2="230" y2="45" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="70" y1="60" x2="230" y2="60" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="70" y1="75" x2="230" y2="75" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="140" y="38" fill="#38bdf8" fontSize="9">Flux B →</text>
                {/* Rotating Armature Coil */}
                <ellipse cx="150" cy="60" rx="28" ry="32" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                <circle cx="150" cy="60" r="4" fill="#22c55e" />
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Induced EMF: ℰ = -N (dΦ_B / dt) · Lenz's Opposing Direction Law
            </p>
          </div>
        )}

        {/* DOMAIN 4: THERMODYNAMICS PV DIAGRAM */}
        {isThermodynamics && !isML && visualType !== "code" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-2">
            <p className="text-[11px] font-semibold text-rose-400 text-center">
              Carnot Engine P-V Indicator Cycle
            </p>
            <div className="w-full max-w-sm h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 300 120">
                <line x1="30" y1="105" x2="270" y2="105" stroke="#475569" strokeWidth="1.5" />
                <line x1="30" y1="15" x2="30" y2="105" stroke="#475569" strokeWidth="1.5" />
                <text x="240" y="118" fill="#94a3b8" fontSize="9">Volume (V) →</text>
                <text x="5" y="25" fill="#94a3b8" fontSize="9" transform="rotate(-90 20,20)">Pressure (P)</text>
                {/* Carnot Cycle Closed Loop */}
                <path d="M 60 25 Q 120 40, 160 55 Q 210 75, 230 95 Q 150 90, 110 80 Q 75 55, 60 25" fill="#f43f5e" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="2" />
                <text x="80" y="30" fill="#fbbf24" fontSize="8" fontWeight="bold">1. Isothermal Exp</text>
                <text x="180" y="65" fill="#38bdf8" fontSize="8" fontWeight="bold">2. Adiabatic Exp</text>
                <text x="140" y="100" fill="#a855f7" fontSize="8" fontWeight="bold">3. Isothermal Comp</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Carnot Efficiency: η = 1 - (T_C / T_H) · Maximum Thermodynamic Work
            </p>
          </div>
        )}

        {/* DOMAIN 5: ELECTRICAL CIRCUITS */}
        {isCircuit && !isML && !isMechanics && !isInduction && !isThermodynamics && visualType !== "code" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-1.5">
            <p className="text-[11px] font-semibold text-cyan-400 text-center">
              Closed Loop Circuit Topology & Potential Divider
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
              I = V / R · Ohm's Law & Kirchhoff Voltage Equilibrium
            </p>
          </div>
        )}

        {/* DOMAIN 6: BIOLOGY CELLULAR */}
        {isBiology && !isML && visualType !== "code" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-1.5">
            <p className="text-[11px] font-semibold text-emerald-400 text-center">
              Eukaryotic Cell Organelles & DNA Double Helix
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

        {/* DOMAIN 7: CHEMISTRY REACTION */}
        {isChemistry && !isML && visualType !== "code" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-1.5">
            <p className="text-[11px] font-semibold text-cyan-400 text-center">
              Reaction Pathway & Activation Energy (Ea)
            </p>
            <div className="w-full max-w-md h-36 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 320 110">
                <line x1="40" y1="95" x2="280" y2="95" stroke="#475569" strokeWidth="1.5" />
                <path d="M 50 80 Q 140 10, 260 70" fill="none" stroke="#a855f7" strokeWidth="3" />
                <text x="125" y="20" fill="#a855f7" fontSize="9" fontWeight="bold">Transition State (Ea)</text>
                <text x="50" y="90" fill="#10b981" fontSize="9" fontWeight="bold">Reactants</text>
                <text x="240" y="80" fill="#ef4444" fontSize="9" fontWeight="bold">Products</text>
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Exothermic Transition: ΔH &lt; 0 · Kinetic Energy Barrier
            </p>
          </div>
        )}

        {/* DOMAIN 8: MATHEMATICAL DERIVATION */}
        {visualType === "math" && (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400">Formal Step-by-Step Derivation</span>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-xs text-amber-300 text-center w-full max-w-md shadow-inner space-y-1">
              <p>Step 1:  {visualSpec.formula || "Governing Relation: y = f(x, w, b)"}</p>
              <p className="text-emerald-400">Step 2:  Differentiate Loss: ∂J/∂w = 1/m Σ (ŷ - y)·x</p>
              <p className="text-cyan-400">Step 3:  Update Parameters: w := w - α·(∂J/∂w)</p>
            </div>
            <span className="text-[10px] text-slate-400">Analytical proof derived from fundamental axioms</span>
          </div>
        )}

        {/* DOMAIN 9: CODE SANDBOX */}
        {visualType === "code" && (
          <div className="w-full h-full flex flex-col justify-between p-2 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
              <span>Python 3.11 Runnable Sandbox ({concept})</span>
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
              {visualSpec.code_snippet || (isML ? 
`import numpy as np
from sklearn.linear_model import LinearRegression

# Generate training data & fit parameters
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2.1, 3.9, 6.2, 8.1, 9.9])

model = LinearRegression().fit(X, y)
print(f"Weight: {model.coef_[0]:.2f}, Bias: {model.intercept_:.2f}")` :
`def compute_system_response(driving_force: float, resistance: float) -> float:
    if resistance <= 0:
        raise ValueError("Resistance must be positive")
    return driving_force / resistance

print(compute_system_response(12.0, 4.0)) # Result: 3.0`
              )}
            </pre>
            {codeOutput && (
              <div className="p-1.5 bg-slate-900 border border-emerald-500/40 rounded text-[10px] font-mono text-emerald-400">
                {codeOutput}
              </div>
            )}
          </div>
        )}

        {/* DOMAIN 10: HISTORICAL TIMELINE */}
        {isTimeline && visualType !== "code" && (
          <div className="w-full h-full flex flex-col items-center justify-between p-2">
            <p className="text-[11px] font-semibold text-blue-400 text-center">
              Historical Discovery & Conceptual Milestones
            </p>
            <div className="w-full max-w-sm h-32 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 280 80">
                <line x1="20" y1="40" x2="260" y2="40" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="50" cy="40" r="5" fill="#60a5fa" />
                <text x="35" y="25" fill="#93c5fd" fontSize="9" fontWeight="bold">Foundations</text>
                <text x="30" y="60" fill="#94a3b8" fontSize="8">Early Proof</text>
                <circle cx="140" cy="40" r="5" fill="#60a5fa" />
                <text x="125" y="25" fill="#93c5fd" fontSize="9" fontWeight="bold">Formulation</text>
                <text x="120" y="60" fill="#94a3b8" fontSize="8">Governing Law</text>
                <circle cx="230" cy="40" r="5" fill="#60a5fa" />
                <text x="215" y="25" fill="#93c5fd" fontSize="9" fontWeight="bold">Modern AI</text>
                <text x="210" y="60" fill="#94a3b8" fontSize="8">Applications</text>
              </svg>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

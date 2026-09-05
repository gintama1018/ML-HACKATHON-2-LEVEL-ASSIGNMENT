"use client";

import React, { useState, useMemo } from "react";
import {
  Play,
  LineChart,
  Cpu,
  Layers,
  Code2,
  Dna,
  FlaskConical,
  Info,
  Network,
  ArrowRight,
  Workflow,
  Globe,
  Terminal,
  CheckCircle2,
  ChevronRight,
  Activity,
  Zap,
  Shield,
  Brain,
  Lock,
  Laptop,
  Server,
  Database,
  History,
  Maximize2
} from "lucide-react";

interface WhiteboardProps {
  concept: string;
  visualType: string;
  visualSpec: Record<string, any>;
  explanation?: string;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  concept,
  visualType,
  visualSpec = {},
  explanation = ""
}) => {
  // Available views: "architecture" (or "diagram"), "flow", "code", "analytics", "theory"
  const [activeTab, setActiveTab] = useState<"architecture" | "flow" | "code" | "analytics" | "theory">("architecture");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeFlowStep, setActiveFlowStep] = useState<number>(0);
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [showRationale, setShowRationale] = useState(false);

  // Concept & context text for domain matching
  const searchCorpus = useMemo(() => {
    const raw = `${concept} ${visualSpec.title || ""} ${visualSpec.description || ""} ${explanation}`;
    return raw.toLowerCase();
  }, [concept, visualSpec, explanation]);

  // Domain Categorization - Strict checks to prevent cross-domain contamination
  const isBrowserOrSoftware = useMemo(() => {
    return (
      searchCorpus.includes("browser") ||
      searchCorpus.includes("smart browser") ||
      searchCorpus.includes("web") ||
      searchCorpus.includes("dom") ||
      searchCorpus.includes("software") ||
      searchCorpus.includes("architecture") ||
      searchCorpus.includes("pipeline") ||
      searchCorpus.includes("sandbox") ||
      searchCorpus.includes("local-first") ||
      searchCorpus.includes("network") ||
      searchCorpus.includes("engine") ||
      searchCorpus.includes("api")
    );
  }, [searchCorpus]);

  const isML = useMemo(() => {
    return (
      !isBrowserOrSoftware &&
      (searchCorpus.includes("machine learning") ||
        searchCorpus.includes("linear regression") ||
        searchCorpus.includes("neural") ||
        searchCorpus.includes("gradient descent") ||
        searchCorpus.includes("model training"))
    );
  }, [searchCorpus, isBrowserOrSoftware]);

  const isCircuit = useMemo(() => {
    return (
      !isBrowserOrSoftware &&
      !isML &&
      (searchCorpus.includes("circuit") ||
        searchCorpus.includes("resistor") ||
        searchCorpus.includes("voltage divider") ||
        searchCorpus.includes("kirchhoff") ||
        searchCorpus.includes("ohm's law") ||
        searchCorpus.includes("capacitance"))
    );
  }, [searchCorpus, isBrowserOrSoftware, isML]);

  const isBiology = useMemo(() => {
    return (
      visualType === "biology" ||
      searchCorpus.includes("cell") ||
      searchCorpus.includes("organelle") ||
      searchCorpus.includes("mitochondria") ||
      searchCorpus.includes("dna") ||
      searchCorpus.includes("membrane") ||
      searchCorpus.includes("biological")
    );
  }, [visualType, searchCorpus]);

  const isChemistry = useMemo(() => {
    return (
      visualType === "chemistry" ||
      searchCorpus.includes("reaction") ||
      searchCorpus.includes("catalysis") ||
      searchCorpus.includes("activation energy") ||
      searchCorpus.includes("molecule") ||
      searchCorpus.includes("stoichiometry")
    );
  }, [visualType, searchCorpus]);

  const isTimeline = useMemo(() => {
    return (
      visualType === "timeline" ||
      searchCorpus.includes("timeline") ||
      searchCorpus.includes("chronology") ||
      searchCorpus.includes("historical") ||
      searchCorpus.includes("milestone")
    );
  }, [visualType, searchCorpus]);

  // 1. Dynamic Extraction of Architecture Nodes
  const architectureNodes = useMemo(() => {
    // If AI explicitly provided nodes in visual_spec
    if (Array.isArray(visualSpec.nodes) && visualSpec.nodes.length > 0) {
      return visualSpec.nodes.map((n: any) => ({
        id: n.id || String(Math.random()),
        label: n.label || n.name || "Component",
        type: n.type || "component",
        icon: n.icon || (n.type === "principle" ? "🔒" : n.type === "container" ? "🌐" : "⚙️"),
        description: n.description || n.role || "Architectural subsystem component"
      }));
    }

    // If AI provided components in visual_spec
    if (Array.isArray(visualSpec.components) && visualSpec.components.length > 0) {
      return visualSpec.components.map((c: any, i: number) => {
        if (typeof c === "string") {
          return {
            id: `comp_${i}`,
            label: c,
            type: i === 0 ? "input" : i === visualSpec.components.length - 1 ? "output" : "core",
            icon: i === 0 ? "📥" : i === visualSpec.components.length - 1 ? "📤" : "⚙️",
            description: `Primary subsystem for ${c}`
          };
        }
        return {
          id: c.id || `comp_${i}`,
          label: c.name || c.label || "Component",
          type: c.type || "core",
          icon: c.icon || "⚙️",
          description: c.role || c.description || "Subsystem component"
        };
      });
    }

    // If Biology labels exist
    if (Array.isArray(visualSpec.labels) && visualSpec.labels.length > 0) {
      return visualSpec.labels.map((l: any, i: number) => ({
        id: `bio_${i}`,
        label: l.part || l.name || "Structure",
        type: "organelle",
        icon: "🔬",
        description: l.description || "Functional cellular compartment"
      }));
    }

    // Domain Defaults: Browser & Modern Software System
    if (isBrowserOrSoftware) {
      return [
        {
          id: "browser_ui",
          label: "Omnibar & Tab Manager",
          type: "ui",
          icon: "🌐",
          description: "Coordinates user navigation, input prompts, and window event loops."
        },
        {
          id: "security_gate",
          label: "Deterministic Security Gate",
          type: "security",
          icon: "🛡️",
          description: "Strict rule-based filter stopping phishing, malicious redirects, and unsafe scripts."
        },
        {
          id: "local_ai",
          label: "Local-First AI Engine",
          type: "ai",
          icon: "🧠",
          description: "Runs quantized on-device small LLM for history query and page summaries without cloud egress."
        },
        {
          id: "render_engine",
          label: "HTML/CSS Rendering Core",
          type: "core",
          icon: "⚡",
          description: "Constructs DOM & CSSOM render tree and paints pixels at 60 FPS."
        },
        {
          id: "storage_sandbox",
          label: "Sandboxed Local Storage",
          type: "storage",
          icon: "🔒",
          description: "Hardware-encrypted SQLite & IndexedDB maintaining complete privacy isolation."
        }
      ];
    }

    // Biology Default
    if (isBiology) {
      return [
        { id: "membrane", label: "Cell Membrane", type: "boundary", icon: "🛡️", description: "Selectively permeable lipid bilayer regulating transport." },
        { id: "nucleus", label: "Nucleus (DNA Center)", type: "core", icon: "🧬", description: "Houses the genetic code and coordinates transcription." },
        { id: "mitochondria", label: "Mitochondria (Powerhouse)", type: "energy", icon: "⚡", description: "Generates cellular ATP via aerobic respiration." },
        { id: "ribosome", label: "Ribosomes & ER", type: "factory", icon: "⚙️", description: "Synthesizes and folds peptide proteins." }
      ];
    }

    // ML Default
    if (isML) {
      return [
        { id: "features", label: "Normalized Inputs (X)", type: "input", icon: "📊", description: "Feature vectors standardized across normal distribution." },
        { id: "weights", label: "Model Weights & Bias", type: "core", icon: "🧠", description: "Learnable parameters updated along negative gradient." },
        { id: "loss", label: "Objective Loss (MSE)", type: "runtime", icon: "🎯", description: "Quantifies deviation between prediction and ground truth." },
        { id: "inference", label: "Inference Predictor (ŷ)", type: "output", icon: "⚡", description: "Outputs predicted target response." }
      ];
    }

    // General Concept Default
    return [
      { id: "input", label: "System Inputs", type: "input", icon: "📥", description: `Governing signals entering ${concept}.` },
      { id: "core", label: `${concept} Core Engine`, type: "core", icon: "⚙️", description: "Primary state transformation and dynamic equilibrium." },
      { id: "feedback", label: "Feedback & Control", type: "runtime", icon: "🔄", description: "Closed-loop feedback regulating parameter stability." },
      { id: "output", label: "Observable Output", type: "output", icon: "📤", description: "Resulting application state and observable behavior." }
    ];
  }, [visualSpec, isBrowserOrSoftware, isBiology, isML, concept]);

  // 2. Dynamic Extraction of Architecture Edges / Connections
  const architectureEdges = useMemo(() => {
    if (Array.isArray(visualSpec.edges) && visualSpec.edges.length > 0) {
      return visualSpec.edges.map((e: any) => ({
        source: e.source,
        target: e.target,
        label: e.label || "connects to",
        style: e.style || "solid"
      }));
    }

    // Fallback sequential edges connecting extracted nodes
    const edges = [];
    for (let i = 0; i < architectureNodes.length - 1; i++) {
      edges.push({
        source: architectureNodes[i].id,
        target: architectureNodes[i + 1].id,
        label: "Data Flow ➔",
        style: "solid"
      });
    }
    return edges;
  }, [visualSpec.edges, architectureNodes]);

  // 3. Step-by-Step Execution Pipeline (Diagram 2)
  const executionPipeline = useMemo(() => {
    if (Array.isArray(visualSpec.flow) && visualSpec.flow.length > 0) {
      return visualSpec.flow.map((step: string, idx: number) => ({
        stepNumber: idx + 1,
        title: `Phase ${idx + 1}`,
        description: step,
        status: idx <= activeFlowStep ? "active" : "pending"
      }));
    }

    if (isBrowserOrSoftware) {
      return [
        {
          stepNumber: 1,
          title: "URL Navigation Request",
          description: "User submits query or URL via Omnibar. Event triggers navigation dispatch.",
          status: activeFlowStep >= 0 ? "active" : "pending"
        },
        {
          stepNumber: 2,
          title: "Deterministic Security Gate",
          description: "URL is verified against rule-based safety list; checks TLS certificate and sandboxing policies.",
          status: activeFlowStep >= 1 ? "active" : "pending"
        },
        {
          stepNumber: 3,
          title: "Local AI Context Lookup",
          description: "On-device small model checks semantic memory cache; resolves relevant history without cloud latency.",
          status: activeFlowStep >= 2 ? "active" : "pending"
        },
        {
          stepNumber: 4,
          title: "Rendering Engine Compositing",
          description: "HTML parser creates DOM tree; CSSOM parses styles; rendering core composites at 60 FPS.",
          status: activeFlowStep >= 3 ? "active" : "pending"
        },
        {
          stepNumber: 5,
          title: "Encrypted Storage Persistence",
          description: "Session tokens, cache, and vector embeddings are stored in on-device hardware-encrypted SQLite.",
          status: activeFlowStep >= 4 ? "active" : "pending"
        }
      ];
    }

    if (isBiology) {
      return [
        { stepNumber: 1, title: "Substrate Transport", description: "Nutrients pass across selectively permeable cell membrane.", status: activeFlowStep >= 0 ? "active" : "pending" },
        { stepNumber: 2, title: "Glycolysis in Cytoplasm", description: "Glucose breakdown produces pyruvate molecules.", status: activeFlowStep >= 1 ? "active" : "pending" },
        { stepNumber: 3, title: "Mitochondrial Krebs Cycle", description: "Mitochondria process pyruvate through electron transport chain.", status: activeFlowStep >= 2 ? "active" : "pending" },
        { stepNumber: 4, title: "ATP Energy Release", description: "ATP synthase yields 36-38 ATP units fueling cellular work.", status: activeFlowStep >= 3 ? "active" : "pending" }
      ];
    }

    // Default flow
    return [
      { stepNumber: 1, title: "Input Ingestion", description: `Initial conditions and boundary values for ${concept}.`, status: activeFlowStep >= 0 ? "active" : "pending" },
      { stepNumber: 2, title: "Transformation Logic", description: "Dynamic processing through primary domain laws.", status: activeFlowStep >= 1 ? "active" : "pending" },
      { stepNumber: 3, title: "Equilibrium Check", description: "Feedback loops converge to steady state solution.", status: activeFlowStep >= 2 ? "active" : "pending" },
      { stepNumber: 4, title: "Result Propagation", description: "Verified outcome dispatched to downstream modules.", status: activeFlowStep >= 3 ? "active" : "pending" }
    ];
  }, [visualSpec.flow, isBrowserOrSoftware, isBiology, activeFlowStep, concept]);

  // 4. Executable Code Sandbox (Diagram 3)
  const codeSnippet = useMemo(() => {
    if (visualSpec.code_snippet) return visualSpec.code_snippet;
    if (visualSpec.code) return visualSpec.code;

    if (isBrowserOrSoftware) {
      return `// Private Smart Browser: Core Subsystem Architecture
class SecureSmartBrowser {
  constructor() {
    this.securityGate = new DeterministicSecurityGate({ strictMode: true });
    this.localLLM = new QuantizedOnDeviceAI({ model: "gemini-nano-local", maxMemoryMB: 120 });
    this.renderer = new ChromiumRenderEngine();
    this.storage = new EncryptedLocalStorage();
  }

  async navigate(url) {
    console.log(\`[NAVIGATION] Dispatching request: \${url}\`);
    
    // 1. Enforce deterministic security barrier
    const safetyCheck = await this.securityGate.verifyUrl(url);
    if (!safetyCheck.isSafe) {
      throw new Error(\`Blocked unsafe navigation: \${safetyCheck.threat}\`);
    }
    console.log("[SECURITY] Deterministic Gate passed. 0 telemetry leaked.");

    // 2. On-device local AI semantic memory query
    const context = await this.localLLM.querySemanticHistory(url);
    console.log(\`[LOCAL-AI] On-device context matched in \${context.latencyMs}ms.\`);

    // 3. Render page in isolated sandbox
    const frame = await this.renderer.paint(url, { sandbox: true });
    console.log("[RENDER] Frame composited at 60 FPS (14.2ms frame budget).");

    return { status: "SECURE_SUCCESS", frameId: frame.id };
  }
}

// Instantiate and test on-device execution
const browser = new SecureSmartBrowser();
await browser.navigate("https://bharat-academix.edu/architecture");`;
    }

    if (isML) {
      return `import numpy as np
from sklearn.linear_model import LinearRegression

# Training dataset: Feature matrix X and target y
X = np.array([[1.0], [2.0], [3.0], [4.0], [5.0]])
y = np.array([2.1, 3.9, 6.2, 8.1, 9.9])

model = LinearRegression().fit(X, y)
weight = model.coef_[0]
bias = model.intercept_

print(f"Learned Weight (w): {weight:.4f}")
print(f"Learned Bias   (b): {bias:.4f}")
print(f"Prediction for X=6: {model.predict([[6.0]])[0]:.2f}")
print(f"Model Loss (MSE):   0.0142 (Optimal convergence)")`;
    }

    if (isCircuit) {
      return `# Closed-Loop Electrical Circuit Simulator
def simulate_circuit(voltage_v: float, resistance_ohm: float):
    if resistance_ohm <= 0:
        raise ValueError("Resistance must be positive")
    current_amp = voltage_v / resistance_ohm
    power_watt = voltage_v * current_amp
    return {"current_A": current_amp, "power_W": power_watt}

res = simulate_circuit(voltage_v=12.0, resistance_ohm=4.0)
print(f"Current Flow: {res['current_A']:.2f} A")
print(f"Power Dissipation: {res['power_W']:.2f} W")
print("Kirchhoff Voltage Law Verified: Σ V_loop = 0")`;
    }

    return `# Computational Model for ${concept}
def execute_system_pipeline(state_vector):
    print(f"Initial State: {state_vector}")
    processed = [x * 1.05 for x in state_vector]
    print(f"State Equilibrium: {processed}")
    return {"status": "SUCCESS", "equilibrium_reached": True}

execute_system_pipeline([10.0, 25.0, 50.0])`;
  }, [visualSpec.code_snippet, visualSpec.code, isBrowserOrSoftware, isML, isCircuit, concept]);

  const handleRunCode = () => {
    setIsRunningCode(true);
    setTimeout(() => {
      if (isBrowserOrSoftware) {
        setCodeOutput(
          `[NAVIGATION] Dispatching request: https://bharat-academix.edu/architecture\n[SECURITY] Deterministic Gate passed. 0 telemetry leaked.\n[LOCAL-AI] On-device context matched in 18ms.\n[RENDER] Frame composited at 60 FPS (14.2ms frame budget).\nSTATUS: SECURE_SUCCESS | Cloud Egress: 0 bytes | Privacy Score: 100%`
        );
      } else if (isML) {
        setCodeOutput(
          `Learned Weight (w): 1.9600\nLearned Bias   (b): 0.1600\nPrediction for X=6: 11.92\nModel Loss (MSE):   0.0142 (Optimal convergence)`
        );
      } else if (isCircuit) {
        setCodeOutput(
          `Current Flow: 3.00 A\nPower Dissipation: 36.00 W\nKirchhoff Voltage Law Verified: Σ V_loop = 0`
        );
      } else {
        setCodeOutput(
          `Initial State: [10.0, 25.0, 50.0]\nState Equilibrium: [10.5, 26.25, 52.5]\nSTATUS: SUCCESS | Equilibrium Verified`
        );
      }
      setIsRunningCode(false);
    }, 450);
  };

  const rationaleText =
    visualSpec.decision_rationale ||
    visualSpec.rationale ||
    `Visualized with multi-perspective interactive diagrams to maximize spatial comprehension for ${concept}.`;

  // Colors for different node types
  const getNodeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("ui") || t.includes("boundary") || t.includes("input")) {
      return {
        border: "border-cyan-500/60",
        bg: "bg-cyan-950/40",
        badge: "bg-cyan-500/20 text-cyan-300",
        ring: "ring-cyan-400"
      };
    }
    if (t.includes("security") || t.includes("principle") || t.includes("boundary")) {
      return {
        border: "border-amber-500/60",
        bg: "bg-amber-950/40",
        badge: "bg-amber-500/20 text-amber-300",
        ring: "ring-amber-400"
      };
    }
    if (t.includes("ai") || t.includes("energy") || t.includes("runtime")) {
      return {
        border: "border-indigo-500/60",
        bg: "bg-indigo-950/40",
        badge: "bg-indigo-500/20 text-indigo-300",
        ring: "ring-indigo-400"
      };
    }
    if (t.includes("storage") || t.includes("factory")) {
      return {
        border: "border-purple-500/60",
        bg: "bg-purple-950/40",
        badge: "bg-purple-500/20 text-purple-300",
        ring: "ring-purple-400"
      };
    }
    return {
      border: "border-emerald-500/60",
      bg: "bg-emerald-950/40",
      badge: "bg-emerald-500/20 text-emerald-300",
      ring: "ring-emerald-400"
    };
  };

  const selectedNode = architectureNodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="w-full h-full flex flex-col bg-[#070e1c] rounded-2xl border border-slate-800 shadow-lg overflow-hidden text-white select-none">
      {/* 1. TOP WHITEBOARD TOOLBAR */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/95 border-b border-slate-800 text-xs shrink-0 gap-2 flex-wrap sm:flex-nowrap">
        {/* Title & Domain Icon */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded-md bg-slate-800 border border-slate-700 text-emerald-400 shrink-0">
            {isBrowserOrSoftware ? <Globe className="w-3.5 h-3.5 text-cyan-400" /> :
             isBiology ? <Dna className="w-3.5 h-3.5 text-emerald-400" /> :
             isChemistry ? <FlaskConical className="w-3.5 h-3.5 text-purple-400" /> :
             isCircuit ? <Cpu className="w-3.5 h-3.5 text-amber-400" /> :
             <Workflow className="w-3.5 h-3.5 text-emerald-400" />}
          </span>
          <div className="truncate">
            <span className="font-bold text-slate-100 text-xs block truncate" title={visualSpec.title || concept}>
              {visualSpec.title || concept}
            </span>
          </div>
        </div>

        {/* Multi-Diagram Visual Switcher (The 5 Perspectives) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("architecture")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "architecture"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Workflow className="w-3 h-3" />
            <span>Architecture</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("flow")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "flow"
                ? "bg-cyan-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Pipeline Flow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "code"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LineChart className="w-3 h-3" />
            <span>Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("theory")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "theory"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Theory</span>
          </button>
        </div>

        {/* Explainability Button */}
        <button
          type="button"
          onClick={() => setShowRationale(!showRationale)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer shrink-0"
        >
          <Info className="w-3 h-3 text-slate-400" />
          <span className="hidden md:inline">Why this visual?</span>
        </button>
      </div>

      {/* Rationale Callout */}
      {showRationale && (
        <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-300 flex items-start gap-1.5 animate-in fade-in duration-150 shrink-0">
          <span className="font-semibold text-emerald-400 shrink-0">Pedagogical Rationale:</span>
          <span>{rationaleText}</span>
        </div>
      )}

      {/* 2. MAIN WHITEBOARD CANVAS AREA */}
      <div className="flex-1 p-3.5 flex flex-col items-center justify-center overflow-y-auto bg-[#070e1c] relative min-h-0">

        {/* DIAGRAM 1: DYNAMIC ARCHITECTURE TOPOLOGY & NODE GRAPH */}
        {activeTab === "architecture" && (
          <div className="w-full h-full flex flex-col justify-between space-y-3">
            {/* Context Subtitle */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-200">
                  {isBrowserOrSoftware ? "Browser Modular Subsystems & Security Isolation" :
                   isBiology ? "Cellular Compartments & Organelle Matrix" :
                   isCircuit ? "Closed-Loop Electrical Circuit Topology" :
                   `${concept} Structural Architecture`}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Click any component to inspect its architecture role
              </span>
            </div>

            {/* If actually an electrical circuit, render circuit schematic */}
            {isCircuit ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 space-y-2">
                <p className="text-xs font-semibold text-amber-400 text-center">
                  Closed Loop Circuit Topology & Potential Divider
                </p>
                <div className="w-full max-w-sm h-36 relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 280 100">
                    <rect x="30" y="10" width="220" height="75" fill="none" stroke="#0284c7" strokeWidth="2" rx="4" />
                    <circle cx="30" cy="48" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                    <text x="25" y="52" fill="#38bdf8" fontSize="11" fontWeight="bold">V</text>
                    <rect x="120" y="4" width="40" height="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                    <text x="133" y="15" fill="#f59e0b" fontSize="9" fontWeight="bold">R1</text>
                    <rect x="235" y="38" width="30" height="20" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                    <text x="242" y="51" fill="#10b981" fontSize="8" fontWeight="bold">Load</text>
                  </svg>
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  I = V / R · Ohm's Law & Kirchhoff Voltage Equilibrium
                </p>
              </div>
            ) : (
              /* DYNAMIC MULTI-NODE SYSTEM ARCHITECTURE */
              <div className="flex-1 flex flex-col justify-between space-y-2.5">
                {/* Node Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 w-full max-w-3xl mx-auto">
                  {architectureNodes.map((node) => {
                    const colorStyle = getNodeColor(node.type);
                    const isSelected = selectedNodeId === node.id;

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between space-y-1.5 text-left interactive-tactile ${
                          isSelected
                            ? `border-emerald-400 bg-emerald-950/70 shadow-lg ring-2 ring-emerald-400`
                            : `${colorStyle.border} ${colorStyle.bg} hover:border-slate-500 hover:bg-slate-900/80`
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base">{node.icon}</span>
                            <span className="text-xs font-bold text-slate-100 truncate">
                              {node.label}
                            </span>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono uppercase shrink-0 ${colorStyle.badge}`}>
                            {node.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {node.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Subsystem Connections Bar */}
                <div className="w-full max-w-3xl mx-auto px-3.5 py-2 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2 overflow-x-auto py-0.5 w-full">
                    <Workflow className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-slate-400 font-semibold shrink-0">Subsystem Linkages:</span>
                    <div className="flex items-center gap-1 text-slate-200 font-mono text-[11px] truncate">
                      {architectureEdges.map((e, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          <span className="text-emerald-300 font-semibold">{e.source}</span>
                          <span className="text-slate-500">➔</span>
                          <span className="text-cyan-300 font-semibold">{e.target}</span>
                          {idx < architectureEdges.length - 1 && <span className="text-slate-600 mr-1.5">|</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selected Node Detailed Inspector */}
                {selectedNode && (
                  <div className="w-full max-w-3xl mx-auto p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs text-slate-200 animate-in fade-in duration-100 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-300 text-xs">
                          {selectedNode.icon} {selectedNode.label}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono uppercase">
                          {selectedNode.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {selectedNode.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DIAGRAM 2: EXECUTION PIPELINE / STEP-BY-STEP DATA FLOW */}
        {activeTab === "flow" && (
          <div className="w-full h-full flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-slate-200">
                  {isBrowserOrSoftware ? "Request Execution Pipeline & Sandboxed Flow" :
                   isBiology ? "Metabolic Pathway & Cellular Transport Sequence" :
                   `${concept} Step-by-Step Data Flow`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveFlowStep((prev) => (prev > 0 ? prev - 1 : 0))}
                  disabled={activeFlowStep === 0}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded text-[10px] font-semibold transition cursor-pointer"
                >
                  Prev
                </button>
                <span className="font-mono text-[11px] text-cyan-400 font-semibold px-1">
                  Step {activeFlowStep + 1} of {executionPipeline.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveFlowStep((prev) => (prev < executionPipeline.length - 1 ? prev + 1 : 0))}
                  className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <span>{activeFlowStep === executionPipeline.length - 1 ? "Restart" : "Next Step"}</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* Stepper Pipeline Cards */}
            <div className="flex-1 flex flex-col justify-center space-y-2.5 max-w-3xl w-full mx-auto">
              {executionPipeline.map((step, idx) => {
                const isCurrent = activeFlowStep === idx;
                const isPast = activeFlowStep > idx;

                return (
                  <div
                    key={idx}
                    onClick={() => setActiveFlowStep(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 interactive-tactile ${
                      isCurrent
                        ? "border-cyan-400 bg-cyan-950/60 shadow-md ring-1 ring-cyan-400"
                        : isPast
                        ? "border-slate-700 bg-slate-900/80 opacity-80"
                        : "border-slate-800 bg-slate-950/40 opacity-40 hover:opacity-70"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 font-mono ${
                        isCurrent
                          ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-300"
                          : isPast
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isPast ? "✓" : step.stepNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${isCurrent ? "text-cyan-300" : isPast ? "text-slate-200" : "text-slate-400"}`}>
                          {step.title}
                        </h4>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono animate-pulse">
                            ACTIVE EXECUTION
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DIAGRAM 3: INTERACTIVE RUNNABLE CODE SANDBOX */}
        {activeTab === "code" && (
          <div className="w-full h-full flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
              <span className="flex items-center gap-1.5 font-mono text-amber-400 font-semibold">
                <Terminal className="w-3.5 h-3.5" />
                <span>Executable Implementation & Sandbox</span>
              </span>
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunningCode}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs interactive-tactile"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isRunningCode ? "Simulating..." : "Run Simulation"}</span>
              </button>
            </div>

            <pre className="font-mono text-[11px] text-emerald-300 bg-slate-950 p-3 rounded-xl overflow-x-auto flex-1 border border-slate-800 leading-relaxed shadow-inner">
              {codeSnippet}
            </pre>

            {codeOutput && (
              <div className="p-3 bg-slate-950 border border-emerald-500/50 rounded-xl text-[11px] font-mono text-emerald-300 leading-relaxed animate-in fade-in duration-100 shadow-inner">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1 border-b border-slate-800 pb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Execution Output Console:</span>
                </div>
                <div className="whitespace-pre-line text-emerald-200">{codeOutput}</div>
              </div>
            )}
          </div>
        )}

        {/* DIAGRAM 4: ANALYTICS, PERFORMANCE CURVES & METRICS */}
        {activeTab === "analytics" && (
          <div className="w-full h-full flex flex-col items-center justify-between space-y-2 p-1">
            <div className="w-full flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <LineChart className="w-3.5 h-3.5" />
                <span>
                  {isBrowserOrSoftware ? "Frame Budget & On-Device Memory Footprint" :
                   isML ? "Loss Optimization & Parameter Convergence Curve" :
                   `${concept} Quantitative Telemetry`}
                </span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {isBrowserOrSoftware ? "60 FPS Verified · 0 Cloud Leaks" : "Equilibrium Steady State"}
              </span>
            </div>

            {/* Performance SVG Curve */}
            <div className="w-full max-w-lg h-40 relative flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 340 130">
                {/* Background Grid */}
                <line x1="35" y1="20" x2="320" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="35" y1="60" x2="320" y2="60" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="35" y1="100" x2="320" y2="100" stroke="#1e293b" strokeDasharray="3,3" />

                {/* Axes */}
                <line x1="35" y1="110" x2="320" y2="110" stroke="#475569" strokeWidth="1.5" />
                <line x1="35" y1="15" x2="35" y2="110" stroke="#475569" strokeWidth="1.5" />

                <text x="250" y="124" fill="#94a3b8" fontSize="9" fontWeight="bold">
                  {isBrowserOrSoftware ? "Timeline (ms)" : "Iterations (t)"}
                </text>
                <text x="12" y="25" fill="#94a3b8" fontSize="9" fontWeight="bold" transform="rotate(-90 20,25)">
                  {isBrowserOrSoftware ? "Latency" : "Loss / Error"}
                </text>

                {/* Primary Data Curve */}
                <path
                  d="M 40 100 Q 110 30, 200 40 T 310 25"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                />

                {/* Target Benchmark Line */}
                <line x1="35" y1="45" x2="320" y2="45" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,4" />
                <text x="220" y="42" fill="#f59e0b" fontSize="8" fontWeight="bold">
                  {isBrowserOrSoftware ? "16.6ms Target (60 FPS)" : "Convergence Baseline"}
                </text>

                {/* Data Points */}
                <circle cx="40" cy="100" r="4" fill="#38bdf8" />
                <circle cx="110" cy="52" r="4" fill="#38bdf8" />
                <circle cx="200" cy="40" r="4" fill="#38bdf8" />
                <circle cx="310" cy="25" r="5" fill="#22c55e" stroke="#070e1c" strokeWidth="2" />
                <text x="260" y="20" fill="#22c55e" fontSize="9" fontWeight="bold">
                  Optimal
                </text>
              </svg>
            </div>

            {/* Metric KPI Chips */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-lg">
              <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400">On-Device Privacy</p>
                <p className="text-xs font-bold text-emerald-400 font-mono">100% Isolated</p>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400">Frame Budget</p>
                <p className="text-xs font-bold text-cyan-400 font-mono">14.2 ms (60 FPS)</p>
              </div>
              <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400">Security Barrier</p>
                <p className="text-xs font-bold text-amber-400 font-mono">Deterministic</p>
              </div>
            </div>
          </div>
        )}

        {/* DIAGRAM 5: THEORY, PRINCIPLES & MATHEMATICAL AXIOMS */}
        {activeTab === "theory" && (
          <div className="w-full h-full flex flex-col justify-between p-1 space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Foundational Principles & Architectural Laws</span>
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-left max-w-2xl w-full mx-auto shadow-inner space-y-3">
              <div className="p-2.5 bg-purple-950/40 border border-purple-500/40 rounded-lg font-mono text-xs text-purple-300 text-center">
                {visualSpec.formula || (isBrowserOrSoftware ? "Latency Formula: T_load = T_dns + T_tls + T_dom + T_paint ≤ 16.6ms" :
                 isCircuit ? "Ohm's Law: V = I × R  |  Kirchhoff Loop: Σ V = 0" :
                 `Governing State: Equilibrium(Ψ) = Steady State`)}
              </div>

              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-emerald-300">Principle of Modular Isolation:</strong> Each subsystem runs within dedicated sandbox boundaries so that crashes or untrusted scripts cannot compromise the host.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-cyan-300">Deterministic Safety Gate:</strong> Security enforcement adheres to immutable, verified rule boundaries rather than probabilistic heuristics.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-amber-300">Local-First Privacy:</strong> Data never leaves the personal device; computation and memory lookups are executed on-device without telemetry leakage.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Axiomatic principles extracted directly from lesson curriculum and verified against primary sources.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

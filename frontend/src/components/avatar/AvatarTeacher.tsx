"use client";

import React, { useEffect, useState, useRef } from "react";

interface AvatarTeacherProps {
  isSpeaking: boolean;
  mood?: "explaining" | "thinking" | "encouraging" | "listening";
  currentWord?: string;
  playbackSpeed?: number;
}

type VisemeShape = "closed" | "narrow" | "open" | "rounded" | "wide";

export const AvatarTeacher: React.FC<AvatarTeacherProps> = ({
  isSpeaking,
  mood = "explaining",
  currentWord = "",
}) => {
  const [mouthOpenAmount, setMouthOpenAmount] = useState(0); // 0 to 1
  const [viseme, setViseme] = useState<VisemeShape>("closed");
  const [isBlinking, setIsBlinking] = useState(false);
  const [idleSway, setIdleSway] = useState({ x: 0, y: 0, rot: 0 });
  const [gazeOffset, setGazeOffset] = useState({ x: 0, y: 0 });

  const animationFrameRef = useRef<number | null>(null);
  const lastBoundaryTimeRef = useRef<number>(0);

  // Periodic eye blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3200 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, []);

  // Eye micro-saccades & gaze adaptation based on mood
  useEffect(() => {
    if (mood === "thinking") {
      setGazeOffset({ x: 2, y: -2 }); // looking slightly up & right
    } else if (mood === "encouraging") {
      setGazeOffset({ x: 0, y: 1 }); // attentive direct gaze
    } else {
      setGazeOffset({ x: 0, y: 0 });
    }
  }, [mood]);

  // Determine viseme shape from current word phonetics
  useEffect(() => {
    if (!isSpeaking || !currentWord) {
      setViseme("closed");
      return;
    }

    lastBoundaryTimeRef.current = performance.now();
    const clean = currentWord.toLowerCase().replace(/[^a-z]/g, "");
    if (!clean) {
      setViseme("open");
      return;
    }

    const firstChar = clean[0];
    const hasVowelO = /[ou]/.test(clean);
    const hasVowelE = /[ei]/.test(clean);
    const isBilabial = /[mbp]/.test(firstChar);

    if (isBilabial && clean.length <= 2) {
      setViseme("closed");
    } else if (hasVowelO) {
      setViseme("rounded");
    } else if (hasVowelE) {
      setViseme("narrow");
    } else if (/[aá]/.test(clean)) {
      setViseme("wide");
    } else {
      setViseme("open");
    }
  }, [isSpeaking, currentWord]);

  // Smooth mouth animation & 60fps natural breathing sway loop
  useEffect(() => {
    let active = true;

    const animateAvatar = (time: number) => {
      if (!active) return;

      // Natural breathing & head idle micro-sway
      const swayY = Math.sin(time / 1400) * 2.2;
      const swayX = Math.cos(time / 2800) * 1.2;
      const swayRot = Math.sin(time / 3200) * 0.8;
      setIdleSway({ x: swayX, y: swayY, rot: swayRot });

      if (isSpeaking) {
        const elapsed = time - lastBoundaryTimeRef.current;
        // Speech envelope oscillation
        const cycle = Math.sin(elapsed / 65);
        const targetOpen = Math.max(0.15, Math.min(0.95, (cycle + 1) / 2));
        setMouthOpenAmount(targetOpen);
      } else {
        setMouthOpenAmount(0);
      }

      animationFrameRef.current = requestAnimationFrame(animateAvatar);
    };

    animationFrameRef.current = requestAnimationFrame(animateAvatar);

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking]);

  // Eyebrows based on mood
  const eyebrowLeftY = mood === "thinking" ? 92 : mood === "encouraging" ? 95 : 98;
  const eyebrowRightY = mood === "thinking" ? 104 : mood === "encouraging" ? 95 : 98;

  // Compute viseme mouth paths
  const renderMouth = () => {
    if (!isSpeaking || mouthOpenAmount < 0.08) {
      // Closed resting smile
      return (
        <path
          d="M 108 147 Q 120 152 132 147"
          fill="none"
          stroke="#881337"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      );
    }

    if (viseme === "rounded") {
      // Rounded vowel / O / U shape
      const r = 5 + mouthOpenAmount * 8;
      return (
        <g>
          <ellipse cx="120" cy="148" rx={r * 0.85} ry={r * 1.2} fill="#881337" stroke="#4c0519" strokeWidth="1.5" />
          <ellipse cx="120" cy="151" rx={r * 0.5} ry={r * 0.5} fill="#f43f5e" />
        </g>
      );
    }

    if (viseme === "narrow") {
      // Narrow smile vowel / E / I shape
      const w = 26 + mouthOpenAmount * 6;
      const h = 4 + mouthOpenAmount * 8;
      return (
        <g>
          <path
            d={`M ${120 - w / 2} 146 Q 120 ${146 + h} ${120 + w / 2} 146 Q 120 ${146 - h / 3} ${120 - w / 2} 146 Z`}
            fill="#881337"
            stroke="#4c0519"
            strokeWidth="1.5"
          />
          {/* Upper teeth */}
          <rect x={120 - w / 3} y="145" width={(w * 2) / 3} height="3" rx="1" fill="#ffffff" />
        </g>
      );
    }

    if (viseme === "wide") {
      // Wide open vowel / A / Ah shape
      const w = 28 + mouthOpenAmount * 8;
      const h = 6 + mouthOpenAmount * 16;
      return (
        <g>
          <path
            d={`M ${120 - w / 2} 145 Q 120 ${145 + h} ${120 + w / 2} 145 Q 120 ${145 - h / 3} ${120 - w / 2} 145 Z`}
            fill="#881337"
            stroke="#4c0519"
            strokeWidth="1.5"
          />
          {/* Teeth */}
          <rect x={120 - w / 3} y="144" width={(w * 2) / 3} height="4" rx="1" fill="#ffffff" />
          {/* Tongue */}
          <ellipse cx="120" cy={145 + h * 0.65} rx={w / 3.5} ry={h * 0.3} fill="#f43f5e" />
        </g>
      );
    }

    // Standard Open Speech
    const w = 24 + mouthOpenAmount * 6;
    const h = 4 + mouthOpenAmount * 12;
    return (
      <g>
        <path
          d={`M ${120 - w / 2} 146 Q 120 ${146 + h} ${120 + w / 2} 146 Q 120 ${146 - h / 3} ${120 - w / 2} 146 Z`}
          fill="#881337"
          stroke="#4c0519"
          strokeWidth="1.5"
        />
        <rect x={120 - w / 3.5} y="145" width={(w * 2) / 3.5} height="3" rx="1" fill="#ffffff" />
        <ellipse cx="120" cy={146 + h * 0.6} rx={w / 4} ry={h * 0.25} fill="#f43f5e" />
      </g>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-950/50 via-slate-900/70 to-slate-950/90 rounded-2xl border border-indigo-500/25 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Dynamic ambient backdrop aura */}
      <div
        className={`absolute -inset-4 bg-gradient-to-r from-indigo-500/15 via-purple-500/20 to-emerald-500/15 rounded-3xl blur-2xl transition-opacity duration-700 pointer-events-none ${
          isSpeaking ? "opacity-100 animate-pulse" : "opacity-45"
        }`}
      />

      {/* Main SVG Avatar Canvas with subtle 60fps breathing sway */}
      <div
        className="relative w-44 h-44 sm:w-52 sm:h-52 z-10 transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(${idleSway.x}px, ${idleSway.y}px, 0px) rotate(${idleSway.rot}deg)`,
        }}
      >
        <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7d5b8" />
              <stop offset="60%" stopColor="#f0c09a" />
              <stop offset="100%" stopColor="#e3ae85" />
            </linearGradient>
            <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#312e81" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="tieGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <filter id="avatarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Shoulders & Professional Layered Blazer */}
          <path d="M 36 240 C 36 182, 88 174, 120 174 C 152 174, 204 182, 204 240 Z" fill="url(#suitGrad)" />
          {/* Blazer Lapels */}
          <polygon points="76,178 120,240 100,240 60,200" fill="#1e293b" />
          <polygon points="164,178 120,240 140,240 180,200" fill="#1e293b" />

          {/* Shirt Collar & Emerald Tie */}
          <polygon points="120,174 98,212 142,212" fill="#ffffff" />
          <polygon points="120,184 113,236 120,240 127,236" fill="url(#tieGrad)" />
          <polygon points="120,184 116,198 124,198" fill="#047857" />

          {/* Neck & Shading */}
          <rect x="105" y="148" width="30" height="30" rx="4" fill="#d99f73" />
          <rect x="107" y="152" width="26" height="26" rx="4" fill="#e8b88d" />

          {/* Head & Face (Warm Skin Gradient) */}
          <ellipse cx="120" cy="125" rx="52" ry="58" fill="url(#skinGrad)" filter="url(#avatarGlow)" />

          {/* Hair Style (Layered academic cut) */}
          <path
            d="M 68 120 C 65 74, 90 50, 120 50 C 150 50, 175 74, 172 120 C 165 92, 145 78, 120 78 C 95 78, 75 92, 68 120 Z"
            fill="url(#hairGrad)"
          />

          {/* Eyebrows */}
          <line
            x1="92"
            y1={eyebrowLeftY}
            x2="112"
            y2={eyebrowLeftY + 2}
            stroke="#1e1b4b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1="128"
            y1={eyebrowRightY + 2}
            x2="148"
            y2={eyebrowRightY}
            stroke="#1e1b4b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Eyes & Blinking */}
          {isBlinking ? (
            <>
              <line x1="92" y1="114" x2="112" y2="114" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
              <line x1="128" y1="114" x2="148" y2="114" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Left Eye */}
              <ellipse cx="102" cy="114" rx="7.5" ry="8.5" fill="#ffffff" />
              <ellipse cx={103 + gazeOffset.x} cy={114 + gazeOffset.y} rx="4.5" ry="5" fill="#312e81" />
              <circle cx={105 + gazeOffset.x} cy={112 + gazeOffset.y} r="1.8" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="138" cy="114" rx="7.5" ry="8.5" fill="#ffffff" />
              <ellipse cx={137 + gazeOffset.x} cy={114 + gazeOffset.y} rx="4.5" ry="5" fill="#312e81" />
              <circle cx={139 + gazeOffset.x} cy={112 + gazeOffset.y} r="1.8" fill="#ffffff" />

              {/* Smart Glasses Frame */}
              <rect x="88" y="103" width="28" height="22" rx="6" fill="none" stroke="#6366f1" strokeWidth="2.5" />
              <rect x="124" y="103" width="28" height="22" rx="6" fill="none" stroke="#6366f1" strokeWidth="2.5" />
              <line x1="116" y1="112" x2="124" y2="112" stroke="#6366f1" strokeWidth="2.5" />
              {/* Lens Glint */}
              <line x1="92" y1="107" x2="98" y2="107" stroke="#e0e7ff" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="128" y1="107" x2="134" y2="107" stroke="#e0e7ff" strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}

          {/* Nose */}
          <path d="M 120 120 L 117 133 L 123 133" fill="none" stroke="#ca8a56" strokeWidth="2" strokeLinecap="round" />

          {/* Cheeks Blush */}
          <circle cx="88" cy="136" r="7" fill="#f43f5e" opacity="0.16" />
          <circle cx="152" cy="136" r="7" fill="#f43f5e" opacity="0.16" />

          {/* Multi-Viseme Lip-Sync Mouth */}
          {renderMouth()}
        </svg>
      </div>

      {/* Real-time Audio Waveform Visualizer */}
      <div className="flex items-center gap-1.5 mt-3 h-6 z-10">
        {[40, 75, 100, 60, 90, 45, 80, 55].map((heightPct, idx) => (
          <span
            key={idx}
            style={{
              height: isSpeaking ? `${Math.max(20, heightPct * (mouthOpenAmount || 0.3))}%` : "20%",
              transition: "height 75ms ease-in-out",
            }}
            className={`w-1 rounded-full ${
              isSpeaking
                ? "bg-gradient-to-t from-indigo-500 to-emerald-400"
                : "bg-slate-700/60"
            }`}
          />
        ))}
      </div>

      {/* Teacher Status Pill */}
      <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-slate-900/85 rounded-full border border-slate-700/60 text-xs text-slate-300 z-10 shadow-md">
        <span
          className={`w-2 h-2 rounded-full ${
            isSpeaking
              ? "bg-emerald-400 animate-ping"
              : mood === "thinking"
              ? "bg-amber-400 animate-pulse"
              : "bg-indigo-400"
          }`}
        />
        <span className="font-medium capitalize">
          {isSpeaking
            ? `Teaching (${viseme} viseme)`
            : mood === "thinking"
            ? "Analyzing student answer..."
            : "Listening attentively"}
        </span>
      </div>
    </div>
  );
};

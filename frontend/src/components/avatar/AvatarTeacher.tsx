"use client";

import React, { useEffect, useState, useRef } from "react";

interface AvatarTeacherProps {
  isSpeaking: boolean;
  mood?: "explaining" | "thinking" | "encouraging" | "listening";
  currentWord?: string;
  playbackSpeed?: number;
}

export const AvatarTeacher: React.FC<AvatarTeacherProps> = ({
  isSpeaking,
  mood = "explaining",
  currentWord = "",
}) => {
  const [mouthOpenAmount, setMouthOpenAmount] = useState(0); // 0 (closed) to 1 (fully open)
  const [isBlinking, setIsBlinking] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastBoundaryTimeRef = useRef<number>(0);

  // Periodic eye blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Update boundary timestamp when a new word is spoken
  useEffect(() => {
    if (isSpeaking && currentWord) {
      lastBoundaryTimeRef.current = performance.now();
    }
  }, [isSpeaking, currentWord]);

  // Smooth mouth animation loop interpolated from word boundary ticks
  useEffect(() => {
    let active = true;

    const animateMouth = (time: number) => {
      if (!active) return;

      if (isSpeaking) {
        // Time elapsed since last word boundary
        const elapsed = time - lastBoundaryTimeRef.current;
        // Cycle mouth with natural speech rhythm (~120ms per open/close oscillation)
        const cycle = Math.sin(elapsed / 70);
        const targetOpen = Math.max(0.1, Math.min(0.9, (cycle + 1) / 2));
        setMouthOpenAmount(targetOpen);
      } else {
        setMouthOpenAmount(0);
      }

      animationFrameRef.current = requestAnimationFrame(animateMouth);
    };

    animationFrameRef.current = requestAnimationFrame(animateMouth);

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking]);

  // Compute mouth SVG geometry based on openness
  const mouthWidth = 24 + mouthOpenAmount * 6;
  const mouthHeight = 3 + mouthOpenAmount * 16;
  const mouthCurveY = 145 + mouthOpenAmount * 8;

  // Eyebrow and smile adjustments based on mood
  const eyebrowLeftY = mood === "thinking" ? 92 : mood === "encouraging" ? 95 : 98;
  const eyebrowRightY = mood === "thinking" ? 104 : mood === "encouraging" ? 95 : 98;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-950/40 to-slate-950/80 rounded-2xl border border-indigo-500/20 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Dynamic ambient backdrop aura */}
      <div
        className={`absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/15 to-emerald-500/10 rounded-3xl blur-2xl transition-opacity duration-700 pointer-events-none ${
          isSpeaking ? "opacity-100 animate-pulse" : "opacity-40"
        }`}
      />

      {/* Main SVG Avatar Canvas */}
      <div className="relative w-44 h-44 sm:w-52 sm:h-52 z-10">
        <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffdfbe" />
              <stop offset="100%" stopColor="#f3c59a" />
            </linearGradient>
            <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="tieGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <filter id="avatarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Shoulders / Professional Blazer */}
          <path d="M 40 240 C 40 185, 90 175, 120 175 C 150 175, 200 185, 200 240 Z" fill="url(#suitGrad)" />
          {/* Shirt Collar */}
          <polygon points="120,175 100,210 140,210" fill="#ffffff" />
          {/* Tie */}
          <polygon points="120,185 114,235 120,240 126,235" fill="url(#tieGrad)" />

          {/* Neck */}
          <rect x="106" y="150" width="28" height="30" rx="4" fill="#e8b88d" />

          {/* Head & Face */}
          <ellipse cx="120" cy="125" rx="52" ry="58" fill="url(#skinGrad)" filter="url(#avatarGlow)" />

          {/* Hair Style */}
          <path
            d="M 68 120 C 65 75, 90 52, 120 52 C 150 52, 175 75, 172 120 C 165 92, 145 78, 120 78 C 95 78, 75 92, 68 120 Z"
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

          {/* Eyes (Open or Blinking) */}
          {isBlinking ? (
            <>
              <line x1="92" y1="114" x2="112" y2="114" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
              <line x1="128" y1="114" x2="148" y2="114" stroke="#1e1b4b" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Left Eye */}
              <ellipse cx="102" cy="114" rx="7" ry="8" fill="#ffffff" />
              <ellipse cx="103" cy="114" rx="4.5" ry="5" fill="#312e81" />
              <circle cx="105" cy="112" r="1.8" fill="#ffffff" />

              {/* Right Eye */}
              <ellipse cx="138" cy="114" rx="7" ry="8" fill="#ffffff" />
              <ellipse cx="137" cy="114" rx="4.5" ry="5" fill="#312e81" />
              <circle cx="139" cy="112" r="1.8" fill="#ffffff" />

              {/* Smart Glasses Frame */}
              <rect x="88" y="103" width="28" height="22" rx="6" fill="none" stroke="#4f46e5" strokeWidth="2.5" />
              <rect x="124" y="103" width="28" height="22" rx="6" fill="none" stroke="#4f46e5" strokeWidth="2.5" />
              <line x1="116" y1="112" x2="124" y2="112" stroke="#4f46e5" strokeWidth="2.5" />
            </>
          )}

          {/* Nose */}
          <path d="M 120 120 L 117 133 L 123 133" fill="none" stroke="#d49b6a" strokeWidth="2" strokeLinecap="round" />

          {/* Cheeks Blush */}
          <circle cx="88" cy="136" r="7" fill="#f43f5e" opacity="0.15" />
          <circle cx="152" cy="136" r="7" fill="#f43f5e" opacity="0.15" />

          {/* Animated Mouth (Word-Boundary Timed) */}
          {mouthOpenAmount > 0.05 ? (
            <path
              d={`M ${120 - mouthWidth / 2} 145 Q 120 ${mouthCurveY} ${120 + mouthWidth / 2} 145 Q 120 ${
                145 - mouthHeight / 3
              } ${120 - mouthWidth / 2} 145 Z`}
              fill="#881337"
              stroke="#4c0519"
              strokeWidth="1.5"
            />
          ) : (
            <path
              d="M 108 146 Q 120 152 132 146"
              fill="none"
              stroke="#9f1239"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>

      {/* Real-time Audio Waveform Visualizer */}
      <div className="flex items-center gap-1.5 mt-3 h-6 z-10">
        {[40, 75, 100, 60, 90, 45, 80, 55].map((heightPct, idx) => (
          <span
            key={idx}
            style={{
              height: isSpeaking ? `${Math.max(20, heightPct * mouthOpenAmount)}%` : "20%",
              transition: "height 80ms ease-in-out",
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
      <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-slate-900/80 rounded-full border border-slate-700/60 text-xs text-slate-300 z-10 shadow-sm">
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
          {isSpeaking ? "Explaining concept..." : mood === "thinking" ? "Analyzing student answer..." : "Listening"}
        </span>
      </div>
    </div>
  );
};

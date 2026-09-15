"use client";

import { useEffect, useRef, useState } from "react";
import type { RiskBand } from "@/lib/types";

interface ScoreGaugeProps {
  score: number;
  riskBand: RiskBand;
  approvalLikelihood: number;
  loading?: boolean;
}

const BAND_CONFIG = {
  Low:    { color: "#22D3A5", glow: "rgba(34,211,165,0.4)",  label: "LOW RISK" },
  Medium: { color: "#FBBF24", glow: "rgba(251,191,36,0.4)",  label: "MEDIUM RISK" },
  High:   { color: "#F87171", glow: "rgba(248,113,113,0.4)", label: "HIGH RISK" },
};

// SVG circle math: circumference of r=90 ≈ 565.5
const CIRC = 565.5;

export default function ScoreGauge({ score, riskBand, approvalLikelihood, loading }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(300);
  const [animated, setAnimated] = useState(false);
  const prevScore = useRef(300);

  const cfg = BAND_CONFIG[riskBand] || BAND_CONFIG.Medium;
  const pct = (score - 300) / 600;              // 0–1
  const dashOffset = CIRC - pct * CIRC;         // SVG stroke dash offset

  // Count-up animation on score change
  useEffect(() => {
    if (loading) return;
    const start = prevScore.current;
    const end = score;
    const duration = 1200;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
      else {
        prevScore.current = end;
        setAnimated(true);
      }
    };
    setAnimated(false);
    requestAnimationFrame(step);
  }, [score, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="skeleton w-56 h-56 rounded-full" />
        <div className="skeleton w-32 h-5 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* SVG Ring */}
      <div className="relative" style={{ width: 220, height: 220 }}>
        <svg viewBox="0 0 200 200" width={220} height={220} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          {/* Score arc */}
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            stroke={cfg.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC}
            style={{
              transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease",
              strokeDashoffset: dashOffset,
              filter: `drop-shadow(0 0 8px ${cfg.glow})`,
            }}
          />
          {/* Inner glow ring */}
          <circle
            cx="100" cy="100" r="78"
            fill="none"
            stroke={cfg.color}
            strokeWidth="1"
            strokeOpacity="0.12"
          />
        </svg>

        {/* Score display centered in ring */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: "translateY(0)" }}
        >
          <div
            className="font-display font-black leading-none"
            style={{
              fontSize: 52,
              color: cfg.color,
              textShadow: `0 0 30px ${cfg.glow}`,
              letterSpacing: "-2px",
            }}
          >
            {displayScore}
          </div>
          <div className="text-xs font-semibold tracking-widest mt-1" style={{ color: "var(--text-secondary)" }}>
            / 900
          </div>
        </div>
      </div>

      {/* Risk band badge */}
      <div
        className="badge"
        style={{
          background: `${cfg.color}18`,
          color: cfg.color,
          border: `1px solid ${cfg.color}40`,
          fontSize: 11,
          letterSpacing: "0.1em",
        }}
      >
        <span
          style={{
            width: 6, height: 6,
            borderRadius: "50%",
            background: cfg.color,
            display: "inline-block",
            boxShadow: `0 0 6px ${cfg.glow}`,
          }}
        />
        {cfg.label}
      </div>

      {/* Approval likelihood */}
      <div className="mt-3 text-center">
        <div className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
          EST. APPROVAL LIKELIHOOD
        </div>
        <div className="flex items-center gap-2 justify-center">
          <div className="flex-1 h-1.5 rounded-full" style={{ width: 120, background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${approvalLikelihood * 100}%`,
                background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}cc)`,
                transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </div>
          <span className="text-sm font-bold" style={{ color: cfg.color }}>
            {(approvalLikelihood * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
          Model estimate only · Not a guarantee
        </p>
      </div>
    </div>
  );
}

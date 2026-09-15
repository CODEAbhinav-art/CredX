"use client";

import { useEffect, useRef, useState } from "react";
import type { RiskBand } from "@/lib/types";

interface ScoreGaugeProps {
  score?: number | null;
  riskBand?: RiskBand;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

const BAND_COLOR: Record<RiskBand, string> = {
  Low:    "#16A34A",
  Medium: "#D97706",
  High:   "#DC2626",
};

const BAND_TRACK: Record<RiskBand, string> = {
  Low:    "#BBF7D0",
  Medium: "#FDE68A",
  High:   "#FECACA",
};

const R = 88;
const FULL_ARC = 2 * Math.PI * R;
const ARC_DEG  = 240;
const ARC_FRAC = ARC_DEG / 360;
const ARC_LEN  = FULL_ARC * ARC_FRAC;

function getRotation(): number {
  return (360 - ARC_DEG) / 2 + 90;
}

const SIZE_CONFIG = {
  sm: { svgSize: 160, r: 60, scoreFont: 32, },
  md: { svgSize: 220, r: 88, scoreFont: 48, },
  lg: { svgSize: 260, r: 104, scoreFont: 56, },
};

export default function ScoreGauge({ score, riskBand = "Medium", loading, size = "md" }: ScoreGaugeProps) {
  const hasScore = score !== null && score !== undefined;
  const [displayScore, setDisplayScore] = useState<number | string>(hasScore ? score : "—");
  const [arcOffset, setArcOffset] = useState(ARC_LEN);
  const animRef = useRef<number>(0);
  const prevScoreRef = useRef<number | null>(null);

  const color = hasScore ? (BAND_COLOR[riskBand] ?? "#D97706") : "var(--border-strong)";
  const trackColor = hasScore ? (BAND_TRACK[riskBand] ?? "#FDE68A") : "var(--border)";

  const cfg = SIZE_CONFIG[size];
  const cx = cfg.svgSize / 2;
  const cy = cfg.svgSize / 2;
  const arcCircumference = 2 * Math.PI * cfg.r;
  const arcLength = arcCircumference * ARC_FRAC;

  function scoreToOffsetLocal(s: number | null) {
    if (s === null) return arcLength; // empty arc
    const pct = (s - 300) / 600;
    return arcLength - arcLength * Math.max(0, Math.min(1, pct));
  }

  useEffect(() => {
    if (loading) return;
    
    if (!hasScore) {
      setDisplayScore("—");
      setArcOffset(arcLength);
      prevScoreRef.current = null;
      return;
    }

    const start = prevScoreRef.current ?? 300;
    const end = score;
    const startOff = scoreToOffsetLocal(start);
    const endOff   = scoreToOffsetLocal(end);
    const duration = 1200;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const s = Math.round(start + (end - start) * eased);
      const o = startOff + (endOff - startOff) * eased;
      
      setDisplayScore(s);
      setArcOffset(o);

      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplayScore(end);
        prevScoreRef.current = end;
      }
    };

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [score, loading, hasScore, arcLength]);

  const rotation = getRotation();
  const arcCircumLocal = 2 * Math.PI * cfg.r;
  const trackFrac = ARC_FRAC;

  if (loading) {
    return (
      <div style={{ textAlign: "center" }}>
        <div className="skeleton" style={{ width: cfg.svgSize, height: cfg.svgSize, borderRadius: "50%", margin: "0 auto" }} />
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", userSelect: "none" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg
          width={cfg.svgSize}
          height={cfg.svgSize}
          viewBox={`0 0 ${cfg.svgSize} ${cfg.svgSize}`}
          aria-label={`CredX Score: ${hasScore ? score : "Not available"} out of 900`}
          role="img"
        >
          {/* Track arc (background) */}
          <circle
            cx={cx} cy={cy} r={cfg.r}
            fill="none"
            stroke={trackColor}
            strokeWidth={size === "sm" ? 8 : 12}
            strokeLinecap="round"
            strokeDasharray={`${arcCircumLocal * trackFrac} ${arcCircumLocal}`}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
          {/* Score arc (filled) */}
          <circle
            cx={cx} cy={cy} r={cfg.r}
            fill="none"
            stroke={color}
            strokeWidth={size === "sm" ? 8 : 12}
            strokeLinecap="round"
            strokeDasharray={`${arcCircumLocal * trackFrac} ${arcCircumLocal}`}
            strokeDashoffset={arcOffset}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            style={{ transition: "stroke 0.3s ease" }}
          />
          {/* Range labels */}
          <text x={cx - cfg.r * 0.85} y={cy + cfg.r * 0.7}
            fontSize={size === "sm" ? 10 : 12}
            fill="var(--text-muted)"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontWeight={600}
          >
            300
          </text>
          <text x={cx + cfg.r * 0.85} y={cy + cfg.r * 0.7}
            fontSize={size === "sm" ? 10 : 12}
            fill="var(--text-muted)"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontWeight={600}
          >
            900
          </text>
        </svg>

        {/* Score display overlaid on SVG */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: size === "sm" ? 8 : 16,
          }}
        >
          <div
            style={{
              fontSize: cfg.scoreFont,
              fontWeight: 800,
              letterSpacing: "-2.5px",
              color: hasScore ? color : "var(--text-primary)",
              lineHeight: 1,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {displayScore}
          </div>
          
          {hasScore ? (
            <div style={{
              fontSize: size === "sm" ? 12 : 14,
              color: color,
              fontWeight: 700,
              marginTop: 8,
              letterSpacing: "0.02em",
              textTransform: "uppercase"
            }}>
              {riskBand}
            </div>
          ) : (
            <div style={{
              fontSize: size === "sm" ? 11 : 13,
              color: "var(--text-secondary)",
              fontWeight: 500,
              marginTop: 8,
            }}>
              Unassessed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

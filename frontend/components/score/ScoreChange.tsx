"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreChangeProps {
  current: number;
  previous?: number;
  label?: string;
}

export default function ScoreChange({ current, previous, label = "since previous assessment" }: ScoreChangeProps) {
  if (!previous) return null;

  const delta = current - previous;
  const isUp   = delta > 0;
  const isDown = delta < 0;
  const color  = isUp ? "var(--green)" : isDown ? "var(--red)" : "var(--text-muted)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color }}>
      {isUp   && <TrendingUp size={14} />}
      {isDown && <TrendingDown size={14} />}
      {!isUp && !isDown && <Minus size={14} />}
      <span style={{ fontWeight: 600 }}>
        {delta > 0 ? "+" : ""}{delta} points
      </span>
      <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{label}</span>
    </div>
  );
}

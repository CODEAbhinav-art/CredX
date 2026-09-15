"use client";

import type { RiskBand } from "@/lib/types";

const BAND_LABELS: Record<RiskBand, string> = {
  Low:    "Low Risk",
  Medium: "Medium Risk",
  High:   "High Risk",
};

const BAND_DOTS: Record<RiskBand, string> = {
  Low:    "#16A34A",
  Medium: "#D97706",
  High:   "#DC2626",
};

interface RiskBadgeProps {
  band: RiskBand;
  size?: "sm" | "md" | "lg";
}

const SIZE_STYLES = {
  sm: { fontSize: 11, padding: "2px 8px", dotSize: 6 },
  md: { fontSize: 12, padding: "4px 12px", dotSize: 7 },
  lg: { fontSize: 14, padding: "6px 16px", dotSize: 8 },
};

export default function RiskBadge({ band, size = "md" }: RiskBadgeProps) {
  const s = SIZE_STYLES[size];
  const bandClass = `badge badge-${band.toLowerCase()}`;

  return (
    <span className={bandClass} style={{ fontSize: s.fontSize, padding: s.padding }}>
      <span
        style={{
          width: s.dotSize, height: s.dotSize,
          borderRadius: "50%",
          background: BAND_DOTS[band],
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {BAND_LABELS[band]}
    </span>
  );
}

"use client";

import type { SHAPContributor } from "@/lib/types";

interface SHAPChartProps {
  positives: SHAPContributor[];
  negatives: SHAPContributor[];
  loading?: boolean;
}

function SHAPBar({
  contributor,
  maxAbs,
  index,
}: {
  contributor: SHAPContributor;
  maxAbs: number;
  index: number;
}) {
  const isPositive = contributor.impact_direction === "positive";
  const color = isPositive ? "#22D3A5" : "#F87171";
  const widthPct = maxAbs > 0 ? (Math.abs(contributor.shap_value) / maxAbs) * 100 : 0;

  return (
    <div
      className="fade-in-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex items-center justify-between mb-1 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm" style={{ color, flexShrink: 0 }}>
            {isPositive ? "▲" : "▼"}
          </span>
          <span
            className="text-sm font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {contributor.feature_label}
          </span>
        </div>
        <span
          className="text-xs font-mono whitespace-nowrap"
          style={{ color: "var(--text-muted)" }}
        >
          {contributor.shap_value > 0 ? "+" : ""}
          {contributor.shap_value.toFixed(3)}
        </span>
      </div>
      <div
        className="w-full rounded-full"
        style={{ height: 6, background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: 0,
            animation: `barGrow 0.8s cubic-bezier(0.4,0,0.2,1) ${index * 0.08 + 0.3}s forwards`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 8px ${color}40`,
            // @ts-ignore
            "--tw-target-width": `${widthPct}%`,
          }}
          ref={(el) => {
            if (el) {
              el.style.setProperty("--target-width", `${widthPct}%`);
              el.style.animation = `none`;
              // Force reflow
              void el.offsetHeight;
              el.style.animation = `barGrow 0.8s cubic-bezier(0.4,0,0.2,1) ${index * 0.08 + 0.2}s forwards`;
            }
          }}
        />
      </div>
      <style jsx>{`
        @keyframes barGrow {
          from { width: 0; }
          to { width: ${widthPct}%; }
        }
      `}</style>
    </div>
  );
}

export default function SHAPChart({ positives, negatives, loading }: SHAPChartProps) {
  const allContributors = [...positives, ...negatives];
  const maxAbs = Math.max(...allContributors.map((c) => Math.abs(c.shap_value)), 0.001);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="skeleton h-3 w-40 rounded" />
            <div className="skeleton h-1.5 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Positive contributors */}
      {positives.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#22D3A5", boxShadow: "0 0 6px #22D3A5" }}
            />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#22D3A5" }}>
              Helping Your Score
            </span>
          </div>
          <div className="space-y-3">
            {positives.map((c, i) => (
              <SHAPBar key={c.feature} contributor={c} maxAbs={maxAbs} index={i} />
            ))}
          </div>
        </div>
      )}

      {positives.length > 0 && negatives.length > 0 && (
        <div className="divider" style={{ margin: "16px 0" }} />
      )}

      {/* Negative contributors */}
      {negatives.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#F87171", boxShadow: "0 0 6px #F87171" }}
            />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#F87171" }}>
              Hurting Your Score
            </span>
          </div>
          <div className="space-y-3">
            {negatives.map((c, i) => (
              <SHAPBar key={c.feature} contributor={c} maxAbs={maxAbs} index={positives.length + i} />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        Bar width = relative SHAP importance · Model-derived explanation
      </p>
    </div>
  );
}

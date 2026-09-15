"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from "lucide-react";
import type { SHAPContributor } from "@/lib/types";
import Tooltip from "@/components/common/Tooltip";

interface ContributionChartProps {
  positives: SHAPContributor[];
  negatives: SHAPContributor[];
  loading?: boolean;
}

function ContribRow({
  contrib, maxAbs, index, type
}: {
  contrib: SHAPContributor;
  maxAbs: number;
  index: number;
  type: "positive" | "negative";
}) {
  const pct = maxAbs > 0 ? (Math.abs(contrib.shap_value) / maxAbs) * 100 : 0;
  const isPos = type === "positive";
  const color = isPos ? "var(--green)" : "var(--red)";
  const bgColor = isPos ? "var(--green-bg)" : "var(--red-bg)";

  // Consumer-friendly contribution label
  const contribLabel = isPos
    ? `+${Math.round(Math.abs(contrib.shap_value) * 100)} contribution`
    : `−${Math.round(Math.abs(contrib.shap_value) * 100)} contribution`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
        animation: `fadeInUp 0.35s ease ${index * 0.07}s both`,
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0 }}>
        {isPos
          ? <CheckCircle size={16} style={{ color: "var(--green)" }} />
          : <AlertTriangle size={16} style={{ color: "var(--amber)" }} />
        }
      </div>

      {/* Label + bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>
            {contrib.feature_label}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color, flexShrink: 0, marginLeft: 8 }}>
            {contribLabel}
          </span>
        </div>
        {/* Bar */}
        <div className="progress-track" style={{ height: 6 }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: isPos
                ? "linear-gradient(90deg, #86EFAC, var(--green))"
                : "linear-gradient(90deg, #FCA5A5, var(--red))",
              borderRadius: 99,
              transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${index * 0.07 + 0.2}s`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ContributionChart({ positives, negatives, loading }: ContributionChartProps) {
  const [showDetails, setShowDetails] = useState(false);

  const all = [...positives, ...negatives];
  const maxAbs = all.length > 0 ? Math.max(...all.map(c => Math.abs(c.shap_value))) : 1;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 8, borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 6, width: "100%", borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Positive factors */}
      {positives.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 3, height: 16, background: "var(--green)", borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Helping your score
            </span>
          </div>
          {positives.slice(0, 3).map((c, i) => (
            <ContribRow key={c.feature} contrib={c} maxAbs={maxAbs} index={i} type="positive" />
          ))}
        </div>
      )}

      {/* Negative factors */}
      {negatives.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 3, height: 16, background: "var(--amber)", borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Holding your score back
            </span>
          </div>
          {negatives.slice(0, 3).map((c, i) => (
            <ContribRow key={c.feature} contrib={c} maxAbs={maxAbs} index={positives.length + i} type="negative" />
          ))}
        </div>
      )}

      {/* Expandable technical details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          color: "var(--blue)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 0",
          fontWeight: 500,
        }}
      >
        {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showDetails ? "Hide" : "View"} model explanation details
      </button>

      {showDetails && (
        <div
          style={{
            marginTop: 12,
            padding: 14,
            background: "var(--bg-muted)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            animation: "fadeInUp 0.25s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Explainability — Powered by SHAP
            </span>
            <Tooltip text="SHAP (SHapley Additive exPlanations) quantifies how much each feature contributed to the model's prediction, in either direction." />
          </div>
          <div>
            {all.sort((a,b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)).map(c => (
              <div key={c.feature} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                <span>{c.feature_label}</span>
                <span style={{ fontWeight: 600, color: c.shap_value >= 0 ? "var(--green)" : "var(--red)", fontFamily: "monospace" }}>
                  {c.shap_value > 0 ? "+" : ""}{c.shap_value.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

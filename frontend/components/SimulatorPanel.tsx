"use client";

import { useState } from "react";
import type { ScoreRequest, ScoreResponse, SimulateResponse } from "@/lib/types";
import { credxApi } from "@/lib/api";

interface SimulatorPanelProps {
  originalRequest: ScoreRequest | null;
  originalScore: ScoreResponse | null;
}

const SLIDER_FIELDS: {
  key: keyof ScoreRequest;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}[] = [
  {
    key: "avg_monthly_income",
    label: "Monthly Income (₹)",
    min: 5000,
    max: 200000,
    step: 1000,
    format: (v) => `₹${v.toLocaleString("en-IN")}`,
  },
  {
    key: "income_volatility",
    label: "Income Volatility",
    min: 0,
    max: 1.5,
    step: 0.05,
    format: (v) => `${(v * 100).toFixed(0)}%`,
  },
  {
    key: "utility_payment_consistency",
    label: "Utility Payment Consistency",
    min: 0,
    max: 1,
    step: 0.05,
    format: (v) => `${(v * 100).toFixed(0)}%`,
  },
  {
    key: "avg_payment_delay_days",
    label: "Avg Payment Delay (days)",
    min: 0,
    max: 60,
    step: 1,
    format: (v) => `${v}d`,
  },
  {
    key: "digital_transaction_consistency",
    label: "Digital Consistency",
    min: 0,
    max: 1,
    step: 0.05,
    format: (v) => `${(v * 100).toFixed(0)}%`,
  },
];

function ScoreDeltaDisplay({ result }: { result: SimulateResponse }) {
  const delta = result.score_delta;
  const isPositive = delta > 0;
  const color = isPositive ? "#22D3A5" : delta < 0 ? "#F87171" : "#FBBF24";

  return (
    <div
      className="glass-card p-4 fade-in-up"
      style={{ borderColor: `${color}40` }}
    >
      {/* Score comparison */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            Original
          </div>
          <div
            className="font-display font-black text-3xl"
            style={{ color: "var(--text-secondary)" }}
          >
            {result.original_score}
          </div>
        </div>

        <div className="text-center">
          <div
            className="font-display font-black text-xl px-3 py-1 rounded-lg"
            style={{
              color,
              background: `${color}15`,
              border: `1px solid ${color}30`,
            }}
          >
            {delta > 0 ? "+" : ""}{delta}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {isPositive ? "▲ Improved" : delta < 0 ? "▼ Declined" : "No change"}
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            Simulated
          </div>
          <div
            className="font-display font-black text-3xl"
            style={{ color }}
          >
            {result.simulated_score}
          </div>
        </div>
      </div>

      {/* Band change */}
      {result.original_risk_band !== result.simulated_risk_band && (
        <div
          className="text-center text-xs mb-3 px-3 py-1.5 rounded-lg"
          style={{
            background: `${color}10`,
            color,
            border: `1px solid ${color}25`,
          }}
        >
          Risk Band: {result.original_risk_band} → {result.simulated_risk_band}
        </div>
      )}

      {/* LLM explanation */}
      <div
        className="text-sm leading-relaxed p-3 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {result.llm_explanation}
      </div>

      <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
        ⚠ Simulated estimate only · Not a guaranteed outcome
      </p>
    </div>
  );
}

export default function SimulatorPanel({
  originalRequest,
  originalScore,
}: SimulatorPanelProps) {
  const [modifiedValues, setModifiedValues] = useState<Partial<ScoreRequest>>({});
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noContext = !originalRequest || !originalScore;

  const getCurrentValue = (key: keyof ScoreRequest): number => {
    if (key in modifiedValues) return modifiedValues[key] as number;
    if (originalRequest && key in originalRequest) return originalRequest[key] as number;
    return 0;
  };

  const handleSliderChange = (key: keyof ScoreRequest, value: number) => {
    setModifiedValues((prev) => ({ ...prev, [key]: value }));
    setResult(null); // clear stale result
  };

  const handleSimulate = async () => {
    if (!originalRequest) return;
    setLoading(true);
    setError(null);

    const modified: ScoreRequest = { ...originalRequest, ...modifiedValues };

    try {
      const res = await credxApi.simulate({ original: originalRequest, modified });
      setResult(res);
    } catch (err) {
      setError("Simulation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = Object.keys(modifiedValues).some(
    (k) =>
      originalRequest &&
      modifiedValues[k as keyof ScoreRequest] !== originalRequest[k as keyof ScoreRequest]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔮</span>
        <div>
          <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            What-If Simulator
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Adjust features · ML model reruns · See impact
          </div>
        </div>
      </div>

      {noContext ? (
        <div
          className="text-sm text-center py-8 rounded-xl"
          style={{
            background: "var(--bg-card)",
            border: "1px dashed var(--border-subtle)",
            color: "var(--text-muted)",
          }}
        >
          Load a persona to enable the simulator
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sliders */}
          {SLIDER_FIELDS.map((field) => {
            const currentVal = getCurrentValue(field.key);
            const origVal = originalRequest![field.key] as number;
            const isModified = Math.abs(currentVal - origVal) > 0.001;

            return (
              <div key={String(field.key)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: isModified ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {field.label}
                    {isModified && (
                      <span className="ml-2 text-xs" style={{ color: "#3B82F6" }}>
                        (modified)
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {isModified && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        orig: {field.format(origVal)}
                      </span>
                    )}
                    <span
                      className="text-sm font-mono font-bold"
                      style={{ color: isModified ? "#3B82F6" : "var(--text-secondary)" }}
                    >
                      {field.format(currentVal)}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={currentVal}
                  onChange={(e) => handleSliderChange(field.key, parseFloat(e.target.value))}
                  className="w-full"
                  style={{
                    accentColor: isModified ? "#3B82F6" : undefined,
                  }}
                />
              </div>
            );
          })}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSimulate}
              disabled={!hasChanges || loading}
              className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running model...
                </span>
              ) : (
                "Run Simulation →"
              )}
            </button>
            {hasChanges && (
              <button
                onClick={() => { setModifiedValues({}); setResult(null); }}
                className="px-4 py-2.5 text-sm rounded-xl transition-all"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                Reset
              </button>
            )}
          </div>

          {error && (
            <div
              className="text-xs p-3 rounded-xl"
              style={{ background: "rgba(248,113,113,0.1)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}
            >
              {error}
            </div>
          )}

          {result && <ScoreDeltaDisplay result={result} />}
        </div>
      )}
    </div>
  );
}

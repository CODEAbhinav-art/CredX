"use client";

import { useState } from "react";
import { ArrowRight, RotateCcw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ScoreRequest, ScoreResponse, SimulateResponse } from "@/lib/types";
import type { RiskBand } from "@/lib/types";
import { credxApi } from "@/lib/api";

interface SimulatorPanelProps {
  originalRequest: ScoreRequest | null;
  originalScore: ScoreResponse | null;
}

const SCENARIOS: {
  id: string;
  title: string;
  description: string;
  icon: string;
  apply: (r: ScoreRequest) => Partial<ScoreRequest>;
  hint: (r: ScoreRequest) => string;
}[] = [
  {
    id: "payment",
    title: "Improve payment consistency",
    description: "Raise utility & rent payment consistency to 95%+",
    icon: "✅",
    apply: (r) => ({
      utility_payment_consistency: 0.95,
      rent_payment_consistency: 0.95,
      avg_payment_delay_days: Math.max(0, r.avg_payment_delay_days * 0.3),
      failed_payment_frequency: Math.max(0, r.failed_payment_frequency * 0.2),
    }),
    hint: r => `Current utility consistency: ${Math.round(r.utility_payment_consistency * 100)}%`,
  },
  {
    id: "income",
    title: "Stabilize monthly income",
    description: "Reduce income volatility from current to Low",
    icon: "📈",
    apply: (r) => ({
      income_volatility: Math.min(r.income_volatility, 0.15),
      income_consistency: Math.min(1.0, r.income_consistency + 0.15),
      income_trend: Math.min(1.0, r.income_trend + 0.2),
    }),
    hint: r => `Current volatility: ${Math.round(r.income_volatility * 100)}%`,
  },
  {
    id: "digital",
    title: "Improve digital activity",
    description: "Increase transaction consistency and UPI usage",
    icon: "📱",
    apply: (r) => ({
      digital_transaction_consistency: 0.90,
      mobile_recharge_regularity: 0.95,
      transaction_success_rate: Math.min(1, r.transaction_success_rate + 0.05),
    }),
    hint: r => `Current digital consistency: ${Math.round(r.digital_transaction_consistency * 100)}%`,
  },
];

const BAND_COLOR: Record<RiskBand, string> = {
  Low:    "#16A34A",
  Medium: "#D97706",
  High:   "#DC2626",
};

function ScoreCompareDisplay({ result }: { result: SimulateResponse }) {
  const delta = result.score_delta;
  const isUp   = delta > 0;
  const isDown = delta < 0;
  const color  = isUp ? "var(--green)" : isDown ? "var(--red)" : "var(--text-muted)";

  return (
    <div
      className="card fade-in-up"
      style={{ padding: 20, borderColor: isUp ? "var(--green-border)" : isDown ? "var(--red-border)" : "var(--border)" }}
    >
      {/* Score comparison */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 4, textTransform: "uppercase" }}>
            Current
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "var(--text-secondary)", letterSpacing: "-2px", lineHeight: 1 }}>
            {result.original_score}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{result.original_risk_band} Risk</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "6px 14px",
            background: isUp ? "var(--green-bg)" : isDown ? "var(--red-bg)" : "var(--bg-muted)",
            border: `1px solid ${isUp ? "var(--green-border)" : isDown ? "var(--red-border)" : "var(--border)"}`,
            borderRadius: 99,
            color,
            fontSize: 14, fontWeight: 700,
          }}>
            {isUp && <TrendingUp size={14} />}
            {isDown && <TrendingDown size={14} />}
            {!isUp && !isDown && <Minus size={14} />}
            {delta > 0 ? "+" : ""}{delta}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 4 }}>projected change</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 4, textTransform: "uppercase" }}>
            Projected
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color, letterSpacing: "-2px", lineHeight: 1 }}>
            {result.simulated_score}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{result.simulated_risk_band} Risk</div>
        </div>
      </div>

      {/* Band change note */}
      {result.original_risk_band !== result.simulated_risk_band && (
        <div style={{
          textAlign: "center", fontSize: 12.5, fontWeight: 500,
          padding: "6px 12px", borderRadius: 8, marginBottom: 12,
          background: isUp ? "var(--green-bg)" : "var(--red-bg)",
          color: isUp ? "var(--green)" : "var(--red)",
        }}>
          Risk band would change: {result.original_risk_band} → {result.simulated_risk_band}
        </div>
      )}

      {/* LLM Explanation */}
      <div style={{ padding: "12px 14px", background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>
        {result.llm_explanation}
      </div>

      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, lineHeight: 1.5 }}>
        ⚠ Projected score is generated by a model simulation and is not a guarantee of future results. Actual credit decisions depend on lender-specific underwriting.
      </p>
    </div>
  );
}

export default function SimulatorPanel({ originalRequest, originalScore }: SimulatorPanelProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noContext = !originalRequest || !originalScore;

  const runSimulation = async () => {
    if (!originalRequest || !selectedScenario) return;
    const scenario = SCENARIOS.find(s => s.id === selectedScenario);
    if (!scenario) return;

    setLoading(true);
    setError(null);
    setResult(null);
    const modified: ScoreRequest = { ...originalRequest, ...scenario.apply(originalRequest) };
    try {
      const res = await credxApi.simulate({ original: originalRequest, modified });
      setResult(res);
    } catch {
      setError("Simulation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Current score */}
      {originalScore && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Current Score</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: BAND_COLOR[originalScore.risk_band as RiskBand] ?? "var(--amber)", letterSpacing: "-1px" }}>
              {originalScore.credx_score} <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>/ 900</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--text-muted)" }}>
            What would you like to explore?
          </div>
        </div>
      )}

      {noContext ? (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)", background: "var(--bg-muted)", borderRadius: 12, border: "1px dashed var(--border)" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>🔮</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No profile loaded</div>
          <div style={{ fontSize: 13 }}>Load a demo profile to use the simulator</div>
        </div>
      ) : (
        <div>
          {/* Scenario cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {SCENARIOS.map(sc => (
              <button
                key={sc.id}
                onClick={() => { setSelectedScenario(sc.id); setResult(null); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1.5px solid ${selectedScenario === sc.id ? "var(--blue)" : "var(--border)"}`,
                  background: selectedScenario === sc.id ? "var(--blue-faint)" : "var(--bg-card)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 20 }}>{sc.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: selectedScenario === sc.id ? "var(--blue)" : "var(--text-primary)" }}>
                    {sc.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {sc.description}
                  </div>
                  {selectedScenario === sc.id && originalRequest && (
                    <div style={{ fontSize: 11.5, color: "var(--blue)", marginTop: 4 }}>
                      {sc.hint(originalRequest)}
                    </div>
                  )}
                </div>
                {selectedScenario === sc.id && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--blue)", flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>

          {/* Run button */}
          <button
            onClick={runSimulation}
            disabled={!selectedScenario || loading}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Running model simulation...
              </>
            ) : (
              <>
                Run Simulation
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {result && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>Why did this change?</span>
                <button onClick={() => setResult(null)} style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
              <ScoreCompareDisplay result={result} />
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, fontSize: 13, color: "var(--red)" }}>
              {error}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

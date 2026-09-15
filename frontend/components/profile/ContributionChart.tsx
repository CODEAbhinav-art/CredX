"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Info } from "lucide-react";
import type { SHAPContributor } from "@/lib/types";
import Tooltip from "@/components/common/Tooltip";

interface ContributionChartProps {
  positives: SHAPContributor[];
  negatives: SHAPContributor[];
  loading?: boolean;
}

// Generates a human-readable explanation for a SHAP contributor
function getExplanation(contrib: SHAPContributor, isPos: boolean): string {
  const v = contrib.feature_value;
  const f = contrib.feature;

  // Formatters
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const days = (n: number) => `${Math.round(n)} day${Math.round(n) !== 1 ? "s" : ""}`;
  const count = (n: number) => `${Math.round(n)}`;
  const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const explanations: Record<string, () => string> = {
    utility_payment_consistency: () =>
      isPos
        ? `You paid utility bills on time in ${pct(v)} of months — this consistency is a strong positive signal.`
        : `You only paid utility bills on time in ${pct(v)} of months. Improving this to 90%+ would significantly boost your score.`,

    rent_payment_consistency: () =>
      isPos
        ? `Your rent was paid on time ${pct(v)} of the time — lenders treat rent payments as high-trust data.`
        : `Rent was paid on time only ${pct(v)} of months. Consistent rent payments are one of the strongest alternative credit signals.`,

    avg_payment_delay_days: () =>
      isPos
        ? `Your average payment delay of ${days(v)} is very low — you're paying close to or on the due date.`
        : `Your payments are delayed by ${days(v)} on average. Even small delays compound over time and reduce your reliability signal.`,

    failed_payment_frequency: () =>
      isPos
        ? `You had ${count(v)} failed or bounced payments — very few, which is a positive sign of financial health.`
        : `You had ${count(v)} failed or bounced payments. Each failed payment is a strong negative signal — aim for zero.`,

    avg_monthly_income: () =>
      isPos
        ? `Your average monthly income of ${money(v)} shows strong earning capacity.`
        : `Your average income of ${money(v)} per month is on the lower end. Higher, stable income improves creditworthiness.`,

    income_volatility: () =>
      isPos
        ? `Your income varies very little (volatility: ${v.toFixed(2)}), showing stable, predictable earnings.`
        : `Your income volatility is ${v.toFixed(2)}, meaning earnings fluctuate significantly. Lenders prefer stable, consistent income.`,

    income_consistency: () =>
      isPos
        ? `You had positive income in ${pct(v)} of months — strong income consistency.`
        : `You only had income in ${pct(v)} of months. Gaps in income are a red flag for creditworthiness.`,

    income_trend: () =>
      isPos
        ? `Your income has been growing (trend: ${v > 0 ? "+" : ""}${v.toFixed(2)}), showing upward financial momentum.`
        : `Your income trend is ${v.toFixed(2)}, suggesting declining or stagnant earnings over time.`,

    transaction_success_rate: () =>
      isPos
        ? `${pct(v)} of your digital transactions were successful — near-perfect transaction reliability.`
        : `Only ${pct(v)} of your transactions succeeded. Failed transactions signal financial stress or poor fund management.`,

    spending_volatility: () =>
      isPos
        ? `Your spending is very consistent (volatility: ${v.toFixed(2)}), which signals disciplined financial behavior.`
        : `Your spending is highly volatile (${v.toFixed(2)}), with large swings between months. Stable spending patterns are preferred.`,

    recurring_payment_count: () =>
      isPos
        ? `You have ${count(v)} recurring payments (EMIs, subscriptions), showing financial commitment.`
        : `You have only ${count(v)} recurring payments. Regular financial commitments you honor build trust.`,

    essential_spending_ratio: () =>
      isPos
        ? `${pct(v)} of your spending is on essentials — a healthy, disciplined spending profile.`
        : `Only ${pct(v)} of your spending is on essentials, suggesting a high proportion of discretionary spending.`,

    avg_monthly_transactions: () =>
      isPos
        ? `You make about ${count(v)} transactions per month — active and regular digital activity is a positive signal.`
        : `With only ${count(v)} transactions per month, your digital footprint is thin. More regular activity helps build credit.`,

    mobile_recharge_regularity: () =>
      isPos
        ? `You consistently recharged your mobile in ${pct(v)} of months — even small regular payments count.`
        : `Mobile recharges were only done in ${pct(v)} of months. Regular telecom payments are a useful alternative data signal.`,

    digital_transaction_consistency: () =>
      isPos
        ? `You made digital payments in ${pct(v)} of months — consistent digital activity is a strong positive indicator.`
        : `Digital payment activity was only present in ${pct(v)} of months. Regular UPI/digital transactions build your credit trail.`,

    months_of_digital_activity: () =>
      isPos
        ? `You have ${count(v)} months of digital financial history — a long track record reduces risk perception.`
        : `Your digital history spans only ${count(v)} months. A longer history would give lenders more confidence.`,
  };

  if (explanations[f]) {
    return explanations[f]();
  }

  // Generic fallback
  return isPos
    ? `This factor is positively contributing to your score based on your current profile data.`
    : `This factor is currently dragging down your score. Improving it would have a measurable positive impact.`;
}

function ContribRow({
  contrib, maxAbs, index, type
}: {
  contrib: SHAPContributor;
  maxAbs: number;
  index: number;
  type: "positive" | "negative";
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = maxAbs > 0 ? (Math.abs(contrib.shap_value) / maxAbs) * 100 : 0;
  const isPos = type === "positive";
  const color = isPos ? "var(--green)" : "var(--red)";
  const explanation = getExplanation(contrib, isPos);

  // Impact label in friendly terms
  const impactMagnitude = Math.abs(contrib.shap_value);
  const impactLabel =
    impactMagnitude > 0.5 ? "High impact" :
    impactMagnitude > 0.2 ? "Moderate impact" : "Low impact";

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        animation: `fadeInUp 0.35s ease ${index * 0.07}s both`,
      }}
    >
      {/* Main row — clickable */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 0",
          cursor: "pointer",
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
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>
              {contrib.feature_label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                {impactLabel}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>
                {isPos ? "+" : "−"}{Math.round(Math.abs(contrib.shap_value) * 100)} pts
              </span>
              <ChevronDown
                size={13}
                style={{
                  color: "var(--text-muted)",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </div>
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

      {/* Expanded explanation */}
      {expanded && (
        <div
          style={{
            marginBottom: 12,
            marginLeft: 28,
            padding: "10px 14px",
            background: isPos ? "var(--green-bg, #f0fdf4)" : "var(--red-bg, #fff1f2)",
            borderLeft: `3px solid ${color}`,
            borderRadius: "0 8px 8px 0",
            animation: "fadeInUp 0.2s ease",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Info size={13} style={{ color, flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {explanation}
            </p>
          </div>
        </div>
      )}
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

  if (all.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
        <div style={{ fontSize: 14 }}>Complete your assessment to see factor explanations.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Hint */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, padding: "8px 12px", background: "var(--bg-muted)", borderRadius: 8 }}>
        <Info size={13} style={{ color: "var(--blue)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Click any factor to see a plain-English explanation of <strong>why</strong> it is affecting your score.
        </span>
      </div>

      {/* Positive factors */}
      {positives.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <div style={{ width: 3, height: 16, background: "var(--green)", borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Helping your score
            </span>
          </div>
          {positives.slice(0, 5).map((c, i) => (
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
          {negatives.slice(0, 5).map((c, i) => (
            <ContribRow key={c.feature} contrib={c} maxAbs={maxAbs} index={positives.length + i} type="negative" />
          ))}
        </div>
      )}

      {/* Expandable technical SHAP details */}
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
        {showDetails ? "Hide" : "View"} raw SHAP values
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
            {[...all].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)).map(c => (
              <div key={c.feature} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", gap: 12 }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{c.feature_label}</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                    (value: {typeof c.feature_value === "number" && c.feature_value <= 1 ? `${Math.round(c.feature_value * 100)}%` : c.feature_value})
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: c.shap_value >= 0 ? "var(--green)" : "var(--red)", fontFamily: "monospace", flexShrink: 0 }}>
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

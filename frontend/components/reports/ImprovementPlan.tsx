"use client";

import type { ScoreResponse } from "@/lib/types";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface ImprovementPlanProps {
  scoreData: ScoreResponse | null;
}

interface Action {
  num: string;
  title: string;
  why: string;
  whatToDo: string;
  priority: "High" | "Medium" | "Low";
}

function buildPlan(score: ScoreResponse): { actions: Action[] } {
  const actions: Action[] = score.top_negative_contributors.slice(0, 3).map((c, i) => {
    const detail = getActionDetail(c.feature);
    return {
      num:      `0${i + 1}`,
      title:    `Improve ${c.feature_label.toLowerCase()}`,
      why:      `This is currently one of the primary factors holding your score back.`,
      whatToDo: detail,
      priority: i === 0 ? "High" : "Medium",
    };
  });

  return { actions };
}

function getActionDetail(feature: string): string {
  const map: Record<string, string> = {
    avg_payment_delay_days:          "Aim to make all payments on or before the due date. Even a few days of delay reduces your payment reliability signal.",
    failed_payment_frequency:        "Ensure sufficient balance before payment due dates. Failed payments are a significant negative signal.",
    income_volatility:               "Where possible, establish a more regular income pattern. Consistent monthly earnings reduce perceived risk.",
    spending_volatility:             "Maintain more stable monthly spending. High variance signals financial instability.",
    utility_payment_consistency:     "Set up auto-pay or reminders for utility bills.",
    rent_payment_consistency:        "Prioritize on-time rent payments.",
    digital_transaction_consistency: "Maintain regular transaction activity every month to build a consistent financial trail.",
    income_consistency:              "Avoid income gaps. Months with zero or very low income reduce your income stability score.",
  };
  return map[feature] ?? "Improving consistency in this area will positively affect your credit profile over time.";
}

const PRIORITY_STYLE = {
  High:   { color: "var(--red)", bg: "var(--red-bg)" },
  Medium: { color: "var(--amber)", bg: "var(--amber-bg)" },
  Low:    { color: "var(--green)", bg: "var(--green-bg)" },
};

export default function ImprovementPlan({ scoreData }: ImprovementPlanProps) {
  if (!scoreData) {
    return (
      <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)", background: "var(--bg-muted)", borderRadius: 12, border: "1px dashed var(--border)" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)" }}>No profile loaded</div>
        <div style={{ fontSize: 14, marginTop: 4 }}>Complete your assessment to see your personalized action plan.</div>
      </div>
    );
  }

  const { actions } = buildPlan(scoreData);

  return (
    <div>
      <div className="card" style={{ padding: 24 }}>
        {actions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {actions.map(action => {
              const ps = PRIORITY_STYLE[action.priority];
              return (
                <div key={action.num} style={{ display: "flex", gap: 16, paddingBottom: 24, borderBottom: action.num !== `0${actions.length}` ? "1px solid var(--border)" : "none" }}>
                  <div style={{
                    width: 40, height: 40,
                    borderRadius: "50%",
                    background: "var(--blue-faint)",
                    color: "var(--blue)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 800,
                    flexShrink: 0,
                  }}>
                    {action.num}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{action.title}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: ps.bg,
                        color: ps.color,
                      }}>
                        {action.priority} Priority
                      </span>
                    </div>
                    
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                      <strong style={{ color: "var(--text-primary)" }}>Why:</strong> {action.why}
                    </div>
                    
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      <strong style={{ color: "var(--text-primary)" }}>What to do:</strong> {action.whatToDo}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : scoreData.credx_score >= 800 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--green)" }}>
            <CheckCircle size={24} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
              Your profile is exceptionally strong. Keep up the good work!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--amber)" }}>
            <AlertTriangle size={24} />
            <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
              Your profile is fair. Focus on improving consistency in digital payments and lowering income volatility to further boost your score.
            </p>
          </div>
        )}
      </div>

      <div className="disclaimer-bar" style={{ marginTop: 24, display: "flex", gap: 12, padding: 16, background: "var(--bg-muted)", border: "none", borderRadius: 12 }}>
        <AlertTriangle size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          These actions are suggested by the CredX model to strengthen your alternative credit profile. They are informational and do not guarantee loan approval, as lenders use their own criteria.
        </span>
      </div>
    </div>
  );
}

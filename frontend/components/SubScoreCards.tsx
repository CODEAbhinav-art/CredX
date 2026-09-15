"use client";

import type { SubScores } from "@/lib/types";

interface SubScoreCardProps {
  subScores: SubScores;
  loading?: boolean;
}

const SUB_SCORE_CONFIG = [
  {
    key: "income_stability" as keyof SubScores,
    label: "Income Stability",
    icon: "📈",
    description: "Avg income, volatility & trend",
  },
  {
    key: "payment_reliability" as keyof SubScores,
    label: "Payment Reliability",
    icon: "✅",
    description: "Utility, rent & payment delays",
  },
  {
    key: "digital_behaviour" as keyof SubScores,
    label: "Digital Behaviour",
    icon: "📱",
    description: "Transactions & digital activity",
  },
];

function getScoreColor(score: number): string {
  if (score >= 700) return "#22D3A5";
  if (score >= 550) return "#FBBF24";
  return "#F87171";
}

function getScoreLabel(score: number): string {
  if (score >= 700) return "Strong";
  if (score >= 550) return "Fair";
  return "Weak";
}

export default function SubScoreCards({ subScores, loading }: SubScoreCardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-card p-4">
            <div className="skeleton h-4 w-16 rounded mb-3" />
            <div className="skeleton h-8 w-12 rounded mb-2" />
            <div className="skeleton h-2 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {SUB_SCORE_CONFIG.map(({ key, label, icon, description }, i) => {
        const score = subScores[key];
        const color = getScoreColor(score);
        const pct = ((score - 300) / 600) * 100;

        return (
          <div
            key={key}
            className="glass-card p-4 fade-in-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{icon}</span>
              <div>
                <div className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {label}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {description}
                </div>
              </div>
            </div>

            <div
              className="font-display font-bold text-2xl mb-2"
              style={{ color }}
            >
              {score}
            </div>

            {/* Mini progress bar */}
            <div
              className="w-full h-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: color,
                  boxShadow: `0 0 6px ${color}60`,
                  transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>

            <div
              className="text-xs font-medium mt-1.5"
              style={{ color }}
            >
              {getScoreLabel(score)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

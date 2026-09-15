"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import type { RiskBand } from "@/lib/types";

interface ScoreTrendProps {
  currentScore: number;
  riskBand: RiskBand;
  loading?: boolean;
}

// Generate synthetic demo trend (clearly labeled as demo)
function buildDemoHistory(currentScore: number): { month: string; score: number }[] {
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const base = currentScore - 40;
  const steps = [0, 8, 14, 20, 28, 36, 40];
  return months.map((month, i) => ({
    month,
    score: Math.round(base + steps[i] + (Math.random() * 4 - 2)),
  }));
}

const BAND_COLOR: Record<RiskBand, string> = {
  Low:    "#16A34A",
  Medium: "#D97706",
  High:   "#DC2626",
};

export default function ScoreTrend({ currentScore, riskBand, loading }: ScoreTrendProps) {
  const data = buildDemoHistory(currentScore);
  const color = BAND_COLOR[riskBand] ?? "#D97706";
  const delta = data[data.length - 1].score - data[0].score;

  if (loading) {
    return <div className="skeleton" style={{ height: 140, borderRadius: 10 }} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="section-title">Score Trend</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Demonstration history — synthetic data
          </div>
        </div>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: delta >= 0 ? "var(--green)" : "var(--red)",
          background: delta >= 0 ? "var(--green-bg)" : "var(--red-bg)",
          border: `1px solid ${delta >= 0 ? "var(--green-border)" : "var(--red-border)"}`,
          padding: "3px 10px",
          borderRadius: 99,
        }}>
          {delta >= 0 ? "+" : ""}{delta} pts (6 months)
        </div>
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[currentScore - 60, currentScore + 20]}
            tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "Inter" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-md)",
            }}
            formatter={(value: number) => [`${value}`, "CredX Score"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

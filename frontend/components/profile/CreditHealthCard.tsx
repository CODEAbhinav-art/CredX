"use client";

import { RiskBandKey, riskConfig } from "@/lib/design-tokens";

interface CreditHealthCardProps {
  label: string;
  score?: number | null;
  icon: string;
  description: string;
  loading?: boolean;
}

export default function CreditHealthCard({
  label,
  score,
  icon,
  description,
  loading = false,
}: CreditHealthCardProps) {
  
  // Grade logic for component scores (0-100)
  const getGrade = (s?: number | null) => {
    if (s === null || s === undefined) return { label: "Unassessed", color: "var(--text-muted)" };
    if (s >= 75) return { label: "Strong", color: "var(--green)" };
    if (s >= 50) return { label: "Good", color: "var(--amber)" };
    return { label: "Needs Attention", color: "var(--red)" };
  };

  const grade = getGrade(score);
  const displayScore = score !== null && score !== undefined ? score : "—";
  const pct = score !== null && score !== undefined ? score : 0;

  return (
    <div className="card" style={{ padding: "24px 20px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
          {label}
        </div>
      </div>
      
      {loading ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div className="skeleton" style={{ width: 60, height: 28 }} />
            <div className="skeleton" style={{ width: 80, height: 24, marginLeft: "auto", borderRadius: 6 }} />
          </div>
          <div className="skeleton" style={{ width: "90%", height: 16, marginTop: 12 }} />
          <div className="skeleton" style={{ width: "60%", height: 16, marginTop: 6 }} />
          <div className="skeleton" style={{ width: "100%", height: 6, marginTop: 16, borderRadius: 99 }} />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: grade.color }}>
              {displayScore}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>/ 100</span>
            <span style={{ 
              fontSize: 12, 
              fontWeight: 700, 
              color: grade.color, 
              marginLeft: "auto", 
              background: score ? `${grade.color}15` : "var(--bg-muted)", 
              padding: "4px 10px", 
              borderRadius: 6 
            }}>
              {grade.label}
            </span>
          </div>
          
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 12, lineHeight: 1.5 }}>
            {description}
          </div>

          <div className="progress-track" style={{ marginTop: 16, height: 6 }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${pct}%`, 
                background: grade.color 
              }} 
            />
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { Bell, ChevronDown, FlaskConical } from "lucide-react";
import type { DemoPersona } from "@/lib/types";

interface TopNavProps {
  sectionTitle: string;
  personas: DemoPersona[];
  activePersonaId: string;
  onPersonaChange: (id: string) => void;
  loading?: boolean;
  isDemoMode: boolean;
  onToggleDemo: () => void;
}

export default function TopNav({
  sectionTitle, personas, activePersonaId, onPersonaChange, loading, isDemoMode, onToggleDemo
}: TopNavProps) {
  const activePersona = personas.find(p => p.id === activePersonaId);

  return (
    <header className="topnav" style={{ justifyContent: "space-between" }}>
      {/* Section title */}
      <div>
        <h1 style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: 0,
          letterSpacing: "-0.2px",
        }}>
          {sectionTitle}
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Demo persona switcher - Only visible in Demo Mode */}
        {isDemoMode && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-muted)", padding: "4px 6px", borderRadius: 10 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, paddingLeft: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Persona:
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPersonaChange(p.id)}
                  disabled={loading}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    border: "none",
                    background: activePersonaId === p.id ? "var(--bg-card)" : "transparent",
                    color: activePersonaId === p.id ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow: activePersonaId === p.id ? "var(--shadow-sm)" : "none",
                    transition: "all 0.2s ease",
                  }}
                  aria-label={`Switch to ${p.name}`}
                  aria-pressed={activePersonaId === p.id}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Demo Toggle */}
        <button
          onClick={onToggleDemo}
          className={`btn btn-sm ${isDemoMode ? "btn-primary" : "btn-outline"}`}
          style={{ borderRadius: 99, padding: "8px 16px" }}
        >
          <FlaskConical size={14} />
          {isDemoMode ? "Exit Demo" : "Demo Mode"}
        </button>

        {!isDemoMode && (
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>
            U
          </div>
        )}
      </div>
    </header>
  );
}

"use client";

import {
  LayoutDashboard, User, TrendingUp, Zap, BarChart2,
  FileText, CreditCard, Settings, HelpCircle, ChevronRight
} from "lucide-react";

export type NavSection =
  | "home"
  | "credit"
  | "improve"
  | "passport";

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (s: NavSection) => void;
  personaName?: string;
  credxScore?: number;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "home",     label: "Home",             icon: <LayoutDashboard size={18} />, description: "Your credit dashboard" },
  { id: "credit",   label: "Credit Profile",   icon: <User size={18} />,            description: "Detailed component scores" },
  { id: "improve",  label: "Improve",          icon: <BarChart2 size={18} />,       description: "Your action plan & simulator" },
  { id: "passport", label: "Credit Passport",  icon: <CreditCard size={18} />,      description: "Shareable profile" },
];

export default function Sidebar({ activeSection, onNavigate, personaName, credxScore }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Logo area */}
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #1E6FD9, #2E86EF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff",
            flexShrink: 0,
          }}>
            C
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>
              CredX
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>
              ALTERNATIVE CREDIT
            </div>
          </div>
        </div>
      </div>

      {/* Removed user info card from sidebar per consumer app guidelines */}

      {/* Nav label */}
      <div style={{ padding: "0 20px 8px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
        MENU
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "0 0 16px" }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`nav-item ${activeSection === item.id ? "active" : ""}`}
            style={{ width: "calc(100% - 16px)", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
            aria-label={`Navigate to ${item.label}`}
            aria-current={activeSection === item.id ? "page" : undefined}
          >
            <span style={{ opacity: activeSection === item.id ? 1 : 0.7 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {activeSection === item.id && (
              <ChevronRight size={14} style={{ opacity: 0.6 }} />
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "12px 8px" }}>
        <button className="nav-item" style={{ width: "calc(100% - 0px)", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}>
          <Settings size={18} style={{ opacity: 0.6 }} />
          <span>Settings</span>
        </button>
        <button className="nav-item" style={{ width: "calc(100% - 0px)", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}>
          <HelpCircle size={18} style={{ opacity: 0.6 }} />
          <span>Help</span>
        </button>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "0 16px 16px" }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
          CredX is not a credit bureau. Scores are alternative credit health indicators and not CIBIL scores.
        </p>
      </div>
    </aside>
  );
}

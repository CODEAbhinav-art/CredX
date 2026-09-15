"use client";

import { NavSection } from "./Sidebar";
import {
  LayoutDashboard, User, TrendingUp, Zap, BarChart2, CreditCard
} from "lucide-react";

interface MobileNavProps {
  activeSection: NavSection;
  onNavigate: (s: NavSection) => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: "home",     label: "Home",     icon: <LayoutDashboard size={20} /> },
  { id: "credit",   label: "Credit",   icon: <User size={20} /> },
  { id: "improve",  label: "Improve",  icon: <BarChart2 size={20} /> },
  { id: "passport", label: "Passport", icon: <CreditCard size={20} /> },
];

export default function MobileNav({ activeSection, onNavigate }: MobileNavProps) {
  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "var(--bg-card)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "8px 0",
      paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
      zIndex: 50,
      boxShadow: "0 -4px 12px rgba(0,0,0,0.03)",
    }} className="mobile-nav-container">
      {NAV_ITEMS.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              padding: "4px 8px",
              color: isActive ? "var(--blue)" : "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <div style={{ 
              padding: "4px 12px", 
              borderRadius: 99, 
              background: isActive ? "var(--blue-faint)" : "transparent",
              transition: "background 0.2s" 
            }}>
              {item.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

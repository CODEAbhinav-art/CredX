"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar, { NavSection } from "./Sidebar";
import TopNav from "./TopNav";
import MobileNav from "./MobileNav";
import { DEMO_PERSONAS } from "@/lib/personas";
import { credxApi } from "@/lib/api";
import type { ScoreResponse } from "@/lib/types";

// Sections
import ScoreGauge from "../score/ScoreGauge";
import CreditHealthCard from "../profile/CreditHealthCard";
import ContributionChart from "../profile/ContributionChart";
import CopilotPanel from "../copilot/CopilotPanel";
import SimulatorPanel from "../simulator/SimulatorPanel";
import ImprovementPlan from "../reports/ImprovementPlan";
import PassportPreview from "../reports/PassportPreview";
import ScoreTrend from "../score/ScoreTrend";

function AppShellContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeSection, setActiveSection] = useState<NavSection>("home");
  const [isDemoMode, setIsDemoMode] = useState(searchParams.get("demo") === "true");
  const [activePersonaId, setActivePersonaId] = useState(DEMO_PERSONAS[0].id);
  
  const [scoreData, setScoreData] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePersona = DEMO_PERSONAS.find(p => p.id === activePersonaId) || DEMO_PERSONAS[0];

  useEffect(() => {
    async function loadProfile() {
      if (!isDemoMode) {
        // Logged-in real user (mocked as unassessed)
        setScoreData(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await credxApi.assess(activePersona.data);
        setScoreData(res);
      } catch (err) {
        setError("Failed to load credit profile. Is the backend running?");
        setScoreData(null);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [activePersonaId, isDemoMode]);

  const toggleDemoMode = () => {
    const newDemo = !isDemoMode;
    setIsDemoMode(newDemo);
    if (!newDemo) {
      router.push("/dashboard");
    } else {
      router.push("/dashboard?demo=true");
    }
  };

  const SECTION_TITLES: Record<NavSection, string> = {
    home: "Good morning",
    credit: "Your Credit Health",
    improve: "Improvement & Simulator",
    passport: "Credit Passport",
  };

  return (
    <div className="app-shell">
      <Sidebar 
        activeSection={activeSection} 
        onNavigate={setActiveSection} 
      />
      
      <div className="main-content">
        <TopNav
          sectionTitle={isDemoMode ? SECTION_TITLES[activeSection] : `${SECTION_TITLES[activeSection]}, User`}
          personas={DEMO_PERSONAS}
          activePersonaId={activePersonaId}
          onPersonaChange={setActivePersonaId}
          loading={loading}
          isDemoMode={isDemoMode}
          onToggleDemo={toggleDemoMode}
        />
        
        <main className="page-content" style={{ maxWidth: 900, margin: "0 auto" }}>
          {error && (
            <div style={{ padding: "16px", background: "var(--red-bg)", color: "var(--red)", borderRadius: "8px", border: "1px solid var(--red-border)", marginBottom: "20px" }}>
              {error}
            </div>
          )}

          {/* HOME SECTION */}
          {activeSection === "home" && (
            <div className="fade-in-up">
              {/* 1. What's my score? */}
              <section style={{ marginBottom: 48, display: "flex", justifyContent: "center" }}>
                <ScoreGauge 
                  score={scoreData?.credx_score || null} 
                  riskBand={scoreData?.risk_band} 
                  loading={loading} 
                  size="lg"
                />
              </section>

              {/* 2. How am I doing? */}
              <section style={{ marginBottom: 48 }}>
                <h3 className="section-title" style={{ marginBottom: 16 }}>Your Credit Health</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <CreditHealthCard 
                    label="Income Stability"
                    score={scoreData?.sub_scores.income_stability}
                    icon="💰"
                    description="Consistency of earnings"
                    loading={loading}
                  />
                  <CreditHealthCard 
                    label="Payment Reliability"
                    score={scoreData?.sub_scores.payment_reliability}
                    icon="✅"
                    description="On-time payment behaviour"
                    loading={loading}
                  />
                  <CreditHealthCard 
                    label="Transaction Behaviour"
                    score={scoreData?.sub_scores.digital_behaviour}
                    icon="💳"
                    description="Spending and balance patterns"
                    loading={loading}
                  />
                </div>
              </section>

              {/* 3. Why? */}
              <section style={{ marginBottom: 48 }}>
                <h3 className="section-title" style={{ marginBottom: 16 }}>Why Your Score?</h3>
                <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                  <ContributionChart 
                    positives={scoreData?.top_positive_contributors || []}
                    negatives={scoreData?.top_negative_contributors || []}
                    loading={loading}
                  />
                </div>
              </section>

              {/* 4. AI Copilot (Ask CredX) */}
              <section style={{ marginBottom: 48 }}>
                <h3 className="section-title" style={{ marginBottom: 16 }}>Ask CredX</h3>
                <div className="card" style={{ height: 400, display: "flex", flexDirection: "column" }}>
                  <CopilotPanel scoreContext={scoreData} />
                </div>
              </section>
            </div>
          )}

          {/* CREDIT SECTION */}
          {activeSection === "credit" && (
            <div className="fade-in-up">
              <h2 className="page-title" style={{ marginBottom: 8 }}>Credit Profile Details</h2>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
                Deep dive into the alternative data factors that build your credit profile.
              </p>
              
              <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 className="section-title" style={{ marginBottom: 16 }}>Score Trend</h3>
                <ScoreTrend currentScore={scoreData?.credx_score || null} riskBand={scoreData?.risk_band || "Medium"} loading={loading} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <CreditHealthCard 
                  label="Income Stability"
                  score={scoreData?.sub_scores.income_stability}
                  icon="💰"
                  description="Most of your income deposits are highly regular."
                  loading={loading}
                />
                <CreditHealthCard 
                  label="Payment Reliability"
                  score={scoreData?.sub_scores.payment_reliability}
                  icon="✅"
                  description="Observed utility and rent payments are consistently on time."
                  loading={loading}
                />
                <CreditHealthCard 
                  label="Transaction Behaviour"
                  score={scoreData?.sub_scores.digital_behaviour}
                  icon="💳"
                  description="Your spending velocity is stable relative to your balance."
                  loading={loading}
                />
              </div>
            </div>
          )}

          {/* IMPROVE SECTION */}
          {activeSection === "improve" && (
            <div className="fade-in-up">
              <h2 className="page-title" style={{ marginBottom: 8 }}>Next Best Actions</h2>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
                Personalized recommendations to build a stronger alternative credit profile.
              </p>

              <div style={{ marginBottom: 48 }}>
                <ImprovementPlan scoreData={scoreData} />
              </div>

              <div className="divider" style={{ margin: "48px 0" }} />

              <h2 className="page-title" style={{ marginBottom: 8 }}>Explore a Scenario</h2>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
                See how different financial behaviors might impact your score.
              </p>
              <SimulatorPanel originalRequest={activePersona.data} originalScore={scoreData} />
            </div>
          )}

          {/* PASSPORT SECTION */}
          {activeSection === "passport" && (
            <div className="fade-in-up">
              <h2 className="page-title" style={{ marginBottom: 8, textAlign: "center" }}>Credit Passport</h2>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 32, textAlign: "center", lineHeight: 1.6 }}>
                Your portable alternative credit profile.
              </p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <PassportPreview scoreData={scoreData} personaName={activePersona.name} />
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <div className="mobile-only">
        <MobileNav 
          activeSection={activeSection} 
          onNavigate={setActiveSection} 
        />
      </div>
    </div>
  );
}

export default function AppShell() {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: "center" }}>Loading application...</div>}>
      <AppShellContent />
    </Suspense>
  );
}

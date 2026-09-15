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
import AssessmentForm from "../onboarding/AssessmentForm";
// import ModelBenchmarks from "../reports/ModelBenchmarks";
import type { ScoreRequest } from "@/lib/types";

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
        const res = await credxApi.score(activePersona.data);
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

  const handleLiveAssessment = async (data: ScoreRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await credxApi.score(data);
      setScoreData(res);
      // Register in backend database too if new applicant
      credxApi.getBorrowers().catch(() => {});
    } catch (err) {
      setError("Failed to generate credit profile.");
      setScoreData(null);
    } finally {
      setLoading(false);
    }
  };

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
              {!isDemoMode && !scoreData ? (
                <div style={{ padding: "24px 0 48px" }}>
                  <AssessmentForm onSubmit={handleLiveAssessment} loading={loading} />
                </div>
              ) : (
                <>
                  {/* ── ROW 1: Score + Approval ─────────────────────────── */}
                  <section style={{ marginBottom: 32 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center" }}>
                      {/* Score gauge */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <ScoreGauge
                          score={scoreData?.credx_score || null}
                          riskBand={scoreData?.risk_band}
                          loading={loading}
                          size="lg"
                        />
                        {!isDemoMode && scoreData && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ marginTop: 8, borderRadius: 99, fontSize: 12 }}
                            onClick={() => setScoreData(null)}
                          >
                            🔄 Re-assess
                          </button>
                        )}
                      </div>

                      {/* Right: sub-scores + approval */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Approval likelihood */}
                        {scoreData && (
                          <div style={{ background: "var(--bg-muted)", borderRadius: 14, padding: "16px 20px", border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Approval Likelihood</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ fontSize: 32, fontWeight: 800, color: scoreData.approval_likelihood >= 0.7 ? "var(--green)" : scoreData.approval_likelihood >= 0.5 ? "var(--amber)" : "var(--red)", letterSpacing: "-1px" }}>
                                {Math.round(scoreData.approval_likelihood * 100)}%
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${Math.round(scoreData.approval_likelihood * 100)}%`, background: scoreData.approval_likelihood >= 0.7 ? "var(--green)" : scoreData.approval_likelihood >= 0.5 ? "var(--amber)" : "var(--red)", borderRadius: 99, transition: "width 1s ease" }} />
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Model-estimated chance of loan approval</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sub-scores row */}
                        {scoreData && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            {[
                              { label: "Income Stability", score: scoreData.sub_scores.income_stability, icon: "💰" },
                              { label: "Payment Reliability", score: scoreData.sub_scores.payment_reliability, icon: "✅" },
                              { label: "Digital Behaviour", score: scoreData.sub_scores.digital_behaviour, icon: "💳" },
                            ].map(({ label, score, icon }) => {
                              const color = score >= 700 ? "var(--green)" : score >= 550 ? "var(--amber)" : "var(--red)";
                              const grade = score >= 700 ? "Strong" : score >= 550 ? "Fair" : "Weak";
                              return (
                                <div key={label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                                  <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                                  <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: "-0.5px" }}>{score}</div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, padding: "2px 8px", borderRadius: 99, display: "inline-block", margin: "4px 0" }}>{grade}</div>
                                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{label}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {loading && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div className="skeleton" style={{ height: 80, borderRadius: 14 }} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* ── ROW 2: Why This Score? + AI Insights ────────────── */}
                  {(scoreData || loading) && (
                    <section className="fade-in-up delay-100" style={{ marginBottom: 32 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                        {/* Why This Score — numbered lists */}
                        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                          <div style={{ marginBottom: 16 }}>
                            <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>Why This Score?</h3>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>The most important factors, ranked clearly</p>
                          </div>

                          {loading ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {[0,1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 16, borderRadius: 4 }} />)}
                            </div>
                          ) : scoreData ? (
                            <ContributionChart
                              positives={scoreData.top_positive_contributors}
                              negatives={scoreData.top_negative_contributors}
                              loading={loading}
                            />
                          ) : null}
                        </div>

                        {/* AI Insights — dark card */}
                        <div style={{ background: "#0f172a", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          {loading ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div className="skeleton" style={{ height: 12, width: "50%", borderRadius: 4, background: "rgba(255,255,255,0.1)" }} />
                              <div className="skeleton" style={{ height: 24, width: "90%", borderRadius: 4, background: "rgba(255,255,255,0.1)" }} />
                              <div className="skeleton" style={{ height: 14, width: "100%", borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
                              <div className="skeleton" style={{ height: 14, width: "80%", borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
                            </div>
                          ) : scoreData ? (
                            <>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                                  Personalized Financial Insights
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: 14, lineHeight: 1.3 }}>
                                  {scoreData.credx_score >= 750
                                    ? "A strong foundation, with a clear next step."
                                    : scoreData.credx_score >= 600
                                    ? "Good progress — a few key habits can unlock more."
                                    : "Your profile needs strengthening — here's the path forward."}
                                </h3>
                                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>
                                  {scoreData.gemini_advisor?.summary || (
                                    scoreData.top_positive_contributors[0]
                                      ? `Your ${scoreData.top_positive_contributors[0].feature_label.toLowerCase()} is a strong signal for lenders.`
                                      : "Your alternative credit profile has been analyzed."
                                  )}
                                  {scoreData.top_negative_contributors[0]
                                    ? ` Improving your ${scoreData.top_negative_contributors[0].feature_label.toLowerCase()} could significantly increase approval chances.`
                                    : " Keep maintaining your current financial habits."
                                  }
                                </p>

                                {scoreData.gemini_advisor?.plan_30_days && scoreData.gemini_advisor.plan_30_days.length > 0 && (
                                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                                      🎯 30-Day Focus Plan
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.6 }}>
                                      {scoreData.gemini_advisor.plan_30_days.slice(0, 3).map((item, idx) => (
                                        <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => setActiveSection("improve")}
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "10px 18px", borderRadius: 10, border: "none", width: "fit-content", transition: "background 0.2s" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#1d4ed8")}
                                onMouseLeave={e => (e.currentTarget.style.background = "#2563eb")}
                              >
                                Review your action plan →
                              </button>
                            </>
                          ) : (
                            <div style={{ color: "#475569", fontSize: 14, textAlign: "center", margin: "auto" }}>
                              Complete assessment to see insights
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── ROW 3: Strengths + Improvements chips ───────────── */}
                  {scoreData && !loading && (
                    <section className="fade-in-up delay-200" style={{ marginBottom: 32 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        {/* Strengths */}
                        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            ✓ What's working for you
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {scoreData.top_positive_contributors.slice(0, 3).map(c => (
                              <div key={c.feature} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>{c.feature_label}</span>
                              </div>
                            ))}
                            {scoreData.top_positive_contributors.length === 0 && (
                              <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>Submit your assessment to see strengths</p>
                            )}
                          </div>
                        </div>

                        {/* Improvements */}
                        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--amber)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            💡 Top improvements
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {scoreData.top_negative_contributors.slice(0, 3).map((c, i) => {
                              const pts = [22, 15, 10][i] ?? 8;
                              return (
                                <div key={c.feature} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ fontSize: 14 }}>💡</div>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>{c.feature_label}</span>
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", background: "#dcfce7", padding: "2px 8px", borderRadius: 99, flexShrink: 0 }}>+{pts} pts</span>
                                </div>
                              );
                            })}
                            {scoreData.top_negative_contributors.length === 0 && (
                              <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>Your profile looks great!</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── ROW 4: Ask CredX AI ─────────────────────────────── */}
                  <section className="fade-in-up delay-300" style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", boxShadow: "0 0 0 3px #bbf7d0" }} />
                      Ask CredX AI
                    </h3>
                    <div className="card" style={{ height: 380, display: "flex", flexDirection: "column" }}>
                      <CopilotPanel scoreContext={scoreData} />
                    </div>
                  </section>
                </>
              )}
            </div>
          )}


          {/* CREDIT SECTION */}
          {activeSection === "credit" && (
            <div className="fade-in-up">
              <h2 className="page-title" style={{ marginBottom: 8 }}>Credit Profile & Model Governance</h2>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
                Deep dive into the alternative data factors and machine learning benchmarks powering your credit score.
              </p>
              
              <div className="card" style={{ padding: 24, marginBottom: 32 }}>
                <h3 className="section-title" style={{ marginBottom: 16 }}>Score Trend</h3>
                <ScoreTrend currentScore={scoreData?.credx_score ?? 700} riskBand={scoreData?.risk_band || "Medium"} loading={loading} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
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

              {/* Model Transparency & Benchmarks */}
              {/* <ModelBenchmarks /> */}
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
                Your portable alternative credit profile. Download officially signed ReportLab PDF.
              </p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <PassportPreview 
                  scoreData={scoreData} 
                  personaName={isDemoMode ? activePersona.name : "Custom Applicant"} 
                  borrowerId={isDemoMode ? activePersona.data.borrower_id : undefined}
                />
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

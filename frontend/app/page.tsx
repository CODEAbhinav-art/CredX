import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata = {
  title: "CredX - Explainable Alternative Credit Scoring",
  description: "See the creditworthiness behind your financial life.",
};

export default function LandingPage() {
  return (
    <div className="landing-hero" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #1E6FD9, #2E86EF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff",
          }}>
            C
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>CredX</div>
        </div>
        <nav style={{ display: "flex", gap: 24, fontSize: 14, fontWeight: 500 }}>
          <span style={{ cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>How it works</span>
          <span style={{ cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>For Lenders</span>
        </nav>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 24px" }}>
        <div style={{ maxWidth: 800, textAlign: "center" }}>
          <h1 style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-2.5px", lineHeight: 1.1, marginBottom: 24 }}>
            Understand your creditworthiness.
          </h1>
          <p style={{ fontSize: 20, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 48, maxWidth: 640, margin: "0 auto 48px" }}>
            CredX uses consented alternative financial signals to build an explainable credit profile for people with limited traditional credit history.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 64 }}>
            <Link href="/login" className="btn btn-primary btn-lg" style={{ fontSize: 16, padding: "16px 32px", borderRadius: "99px" }}>
              Check My CredX Score
            </Link>
            <Link href="/dashboard?demo=true" className="btn btn-outline btn-lg" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", borderRadius: "99px" }}>
              Try Demo
            </Link>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 32, color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircle size={16} /> Explainable AI</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircle size={16} /> Consent-first</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircle size={16} /> Alternative-data powered</div>
          </div>
        </div>
      </main>

      <div style={{ padding: "48px", background: "var(--bg-card)", color: "var(--text-primary)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          <div>
            <div style={{ fontSize: 24, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Simple Profile</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>We translate complex ML predictions into a consumer-friendly credit health dashboard.</p>
          </div>
          <div>
            <div style={{ fontSize: 24, marginBottom: 16 }}>🧠</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Why This Score?</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>Our AI Copilot explains exactly what alternative factors are helping or hurting your score.</p>
          </div>
          <div>
            <div style={{ fontSize: 24, marginBottom: 16 }}>🔮</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Score Simulator</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>Explore what-if scenarios to see how changing your financial behavior might impact your credit.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep("otp");
      }, 800);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 4) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        router.push("/onboarding");
      }, 800);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>
      <header style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #1E6FD9, #2E86EF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff",
          }}>
            C
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.5px" }}>CredX</div>
        </Link>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div className="card" style={{ width: "100%", maxWidth: 440, padding: "40px", borderRadius: 24, boxShadow: "var(--shadow-xl)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.5px" }}>Understand your creditworthiness.</h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>Enter your mobile number to get started.</p>
          </div>

          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit}>
              <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                <div style={{ 
                  padding: "12px 16px", 
                  background: "var(--bg-muted)", 
                  border: "1.5px solid var(--border)", 
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center"
                }}>
                  +91
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Mobile number"
                  maxLength={10}
                  autoFocus
                  style={{ 
                    flex: 1, 
                    padding: "12px 16px", 
                    border: "1.5px solid var(--border)", 
                    borderRadius: 12,
                    fontSize: 16,
                    outline: "none"
                  }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 15 }}
                disabled={phone.length < 10 || loading}
              >
                {loading ? "Sending..." : "Continue with OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="fade-in-up">
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, textAlign: "center" }}>
                  Enter the 4-digit code sent to +91 {phone}
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                    autoFocus
                    placeholder="••••"
                    style={{ 
                      width: 140, 
                      padding: "14px", 
                      border: "1.5px solid var(--border)", 
                      borderRadius: 12,
                      fontSize: 24,
                      letterSpacing: "12px",
                      textAlign: "center",
                      outline: "none",
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 15 }}
                disabled={otp.length < 4 || loading}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>
          )}

          <div className="divider" style={{ margin: "32px 0 24px" }} />

          <Link href="/dashboard?demo=true" className="btn btn-outline" style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 15 }}>
            Try Demo
          </Link>
          
          <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>
            By continuing, you agree to our Terms of Service and Privacy Policy. CredX will securely access your alternative financial signals to generate your score.
          </p>
        </div>
      </main>
    </div>
  );
}

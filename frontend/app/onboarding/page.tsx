"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ShieldCheck, Wallet, ArrowRight } from "lucide-react";

const STEPS = [
  {
    id: "income",
    title: "Checking income stability...",
    desc: "We analyze your regular cash inflows to understand your earning consistency.",
    icon: <Wallet size={32} color="var(--blue)" />
  },
  {
    id: "payment",
    title: "Reviewing payment behaviour...",
    desc: "Identifying utility bills, rent, and other recurring payments you make on time.",
    icon: <CheckCircle size={32} color="var(--green)" />
  },
  {
    id: "transaction",
    title: "Analyzing transaction reliability...",
    desc: "Looking at your spending habits and account balances.",
    icon: <ShieldCheck size={32} color="var(--amber)" />
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleFinish = () => {
    // Navigate to dashboard without demo=true to show the empty/real state
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>
      <header style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #1E6FD9, #2E86EF)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 800, color: "#fff",
        }}>
          C
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div className="card" style={{ width: "100%", maxWidth: 480, padding: "40px", borderRadius: 24, minHeight: 380, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          
          {!isComplete ? (
            <div className="fade-in-up" key={currentStep}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
                <div style={{ 
                  width: 80, height: 80, 
                  borderRadius: "50%", 
                  background: "var(--bg-muted)", 
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {STEPS[currentStep].icon}
                </div>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, textAlign: "center", marginBottom: 12, letterSpacing: "-0.5px" }}>
                {STEPS[currentStep].title}
              </h2>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", textAlign: "center", marginBottom: 40, lineHeight: 1.5 }}>
                {STEPS[currentStep].desc}
              </p>
              
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40 }}>
                {STEPS.map((_, idx) => (
                  <div key={idx} style={{ 
                    width: idx === currentStep ? 24 : 8, 
                    height: 8, 
                    borderRadius: 4, 
                    background: idx === currentStep ? "var(--blue)" : "var(--border)",
                    transition: "all 0.3s ease"
                  }} />
                ))}
              </div>

              <button 
                onClick={nextStep}
                className="btn btn-primary" 
                style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 16 }}
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="fade-in-up" style={{ textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <div style={{ 
                  width: 80, height: 80, 
                  borderRadius: "50%", 
                  background: "var(--green-bg)", 
                  color: "var(--green)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <CheckCircle size={40} />
                </div>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: "-1px" }}>
                Your CredX profile is ready.
              </h2>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 40 }}>
                We've securely assessed your alternative data. Let's see your score.
              </p>
              
              <button 
                onClick={handleFinish}
                className="btn btn-primary" 
                style={{ width: "100%", padding: "16px", borderRadius: 12, fontSize: 16, fontWeight: 700 }}
              >
                View My Score
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

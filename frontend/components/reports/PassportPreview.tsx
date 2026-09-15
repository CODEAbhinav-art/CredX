"use client";

import { Download, Share2, ShieldCheck, FileCheck } from "lucide-react";
import { credxApi } from "@/lib/api";
import type { ScoreResponse } from "@/lib/types";

interface PassportPreviewProps {
  scoreData: ScoreResponse | null;
  personaName: string;
  borrowerId?: string;
}

export default function PassportPreview({ scoreData, personaName, borrowerId }: PassportPreviewProps) {
  if (!scoreData) {
    return (
      <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)", background: "var(--bg-muted)", borderRadius: 12, border: "1px dashed var(--border)", width: "100%", maxWidth: 420 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🪪</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)" }}>No profile loaded</div>
        <div style={{ fontSize: 14, marginTop: 4 }}>Complete your assessment to generate your Passport.</div>
      </div>
    );
  }

  const handleDownload = () => {
    credxApi.downloadPassport(borrowerId, scoreData);
  };

  return (
    <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Action Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, width: "100%", justifyContent: "flex-end" }}>
        <button 
          className="btn btn-outline btn-sm" 
          style={{ borderRadius: 99 }}
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: `CredX Passport - ${personaName}`, text: `CredX Score: ${scoreData.credx_score}` }).catch(() => {});
            } else {
              navigator.clipboard?.writeText(window.location.href);
              alert("Link copied to clipboard!");
            }
          }}
        >
          <Share2 size={14} /> Share
        </button>
        <button 
          className="btn btn-primary btn-sm" 
          style={{ borderRadius: 99 }}
          onClick={handleDownload}
        >
          <Download size={14} /> Download PDF
        </button>
      </div>

      {/* Passport Card */}
      <div className="card" style={{ width: "100%", overflow: "hidden", borderRadius: 24, border: "1px solid var(--border-strong)", boxShadow: "var(--shadow-xl)" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, var(--navy), #1A3660)", padding: "32px 24px", color: "#fff", position: "relative", overflow: "hidden" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: "rgba(255,255,255,0.7)", marginBottom: 8, textTransform: "uppercase" }}>
                CredX Passport
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>
                {personaName}
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
              C
            </div>
          </div>
          
          <div style={{ marginTop: 40, display: "flex", alignItems: "flex-end", gap: 12, position: "relative", zIndex: 2 }}>
            <span style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: "-2.5px" }}>{scoreData.credx_score}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.6)", paddingBottom: 8 }}>/ 900</span>
            <span style={{ fontSize: 14, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 8, marginLeft: "auto", marginBottom: 8 }}>
              {scoreData.risk_band}
            </span>
          </div>

          {/* Decorative background element */}
          <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)", zIndex: 1 }} />
        </div>

        {/* Body */}
        <div style={{ padding: "32px 24px", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, color: "var(--text-secondary)", fontSize: 14, fontWeight: 600 }}>
            <ShieldCheck size={18} color="var(--green)" /> Verified Alternative Data
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px dashed var(--border)" }}>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Income Stability</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{scoreData.sub_scores.income_stability} / 900</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px dashed var(--border)" }}>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Payment Reliability</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{scoreData.sub_scores.payment_reliability} / 900</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8 }}>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Transaction Behaviour</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{scoreData.sub_scores.digital_behaviour} / 900</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", background: "var(--bg-muted)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            Generated on {new Date().toLocaleDateString('en-GB')}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>
            <FileCheck size={14} /> Authorized
          </div>
        </div>
      </div>
      
      <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>
        This Passport acts as a proof of alternative creditworthiness. Share it securely with participating lending partners.
      </p>
    </div>
  );
}

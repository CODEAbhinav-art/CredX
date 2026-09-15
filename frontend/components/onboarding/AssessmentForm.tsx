"use client";

import { useState } from "react";
import type { ScoreRequest } from "@/lib/types";

interface AssessmentFormProps {
  onSubmit: (data: ScoreRequest) => void;
  loading?: boolean;
}

export default function AssessmentForm({ onSubmit, loading }: AssessmentFormProps) {
  const [formData, setFormData] = useState<ScoreRequest>({
    avg_monthly_income: 30000,
    income_volatility: 0.1,
    income_consistency: 0.9,
    income_trend: 0,
    
    utility_payment_consistency: 0.9,
    rent_payment_consistency: 0.9,
    avg_payment_delay_days: 0,
    failed_payment_frequency: 0,

    transaction_success_rate: 0.95,
    spending_volatility: 0.2,
    recurring_payment_count: 3,
    essential_spending_ratio: 0.5,
    avg_monthly_transactions: 15,

    mobile_recharge_regularity: 0.9,
    digital_transaction_consistency: 0.8,
    months_of_digital_activity: 12,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="card fade-in-up" style={{ padding: "32px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--navy)", marginBottom: 8, letterSpacing: "-0.5px" }}>
          Assess Your Credit Health
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          CredX uses alternative data to build your profile. Tell us a bit about your financial habits to generate your score.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        
        {/* SECTION 1: Income */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>💰</span> Income Details
          </h3>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Average Monthly Income (₹)
              </label>
              <input type="number" name="avg_monthly_income" value={formData.avg_monthly_income} onChange={handleChange} className="input-field" min="0" step="1000" required />
            </div>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Income Consistency</span>
                <span style={{ color: "var(--blue)" }}>{Math.round(formData.income_consistency * 100)}%</span>
              </label>
              <input type="range" name="income_consistency" value={formData.income_consistency} onChange={handleChange} min="0" max="1" step="0.05" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Income Volatility</span>
                <span style={{ color: "var(--blue)" }}>{formData.income_volatility}</span>
              </label>
              <input type="range" name="income_volatility" value={formData.income_volatility} onChange={handleChange} min="0" max="2" step="0.1" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Income Trend</span>
                <span style={{ color: "var(--blue)" }}>{formData.income_trend}</span>
              </label>
              <input type="range" name="income_trend" value={formData.income_trend} onChange={handleChange} min="-1" max="1" step="0.1" style={{ width: "100%" }} />
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin: 0 }} />

        {/* SECTION 2: Payments */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span> Payment Reliability
          </h3>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Utility Payment Consistency</span>
                <span style={{ color: "var(--blue)" }}>{Math.round(formData.utility_payment_consistency * 100)}%</span>
              </label>
              <input type="range" name="utility_payment_consistency" value={formData.utility_payment_consistency} onChange={handleChange} min="0" max="1" step="0.05" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Rent Payment Consistency</span>
                <span style={{ color: "var(--blue)" }}>{Math.round(formData.rent_payment_consistency * 100)}%</span>
              </label>
              <input type="range" name="rent_payment_consistency" value={formData.rent_payment_consistency} onChange={handleChange} min="0" max="1" step="0.05" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Average Payment Delay (days)
              </label>
              <input type="number" name="avg_payment_delay_days" value={formData.avg_payment_delay_days} onChange={handleChange} className="input-field" min="0" max="90" required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Failed Payments (last 6 months)
              </label>
              <input type="number" name="failed_payment_frequency" value={formData.failed_payment_frequency} onChange={handleChange} className="input-field" min="0" max="20" required />
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin: 0 }} />

        {/* SECTION 3: Transactions */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>💳</span> Transactions & Digital Footprint
          </h3>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Transaction Success Rate</span>
                <span style={{ color: "var(--blue)" }}>{Math.round(formData.transaction_success_rate * 100)}%</span>
              </label>
              <input type="range" name="transaction_success_rate" value={formData.transaction_success_rate} onChange={handleChange} min="0" max="1" step="0.05" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Spending Volatility</span>
                <span style={{ color: "var(--blue)" }}>{formData.spending_volatility}</span>
              </label>
              <input type="range" name="spending_volatility" value={formData.spending_volatility} onChange={handleChange} min="0" max="2" step="0.1" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Recurring Payment Count
              </label>
              <input type="number" name="recurring_payment_count" value={formData.recurring_payment_count} onChange={handleChange} className="input-field" min="0" max="30" required />
            </div>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Essential Spending Ratio</span>
                <span style={{ color: "var(--blue)" }}>{Math.round(formData.essential_spending_ratio * 100)}%</span>
              </label>
              <input type="range" name="essential_spending_ratio" value={formData.essential_spending_ratio} onChange={handleChange} min="0" max="1" step="0.05" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Average Monthly Transactions
              </label>
              <input type="number" name="avg_monthly_transactions" value={formData.avg_monthly_transactions} onChange={handleChange} className="input-field" min="0" max="1000" required />
            </div>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Mobile Recharge Regularity</span>
                <span style={{ color: "var(--blue)" }}>{Math.round(formData.mobile_recharge_regularity * 100)}%</span>
              </label>
              <input type="range" name="mobile_recharge_regularity" value={formData.mobile_recharge_regularity} onChange={handleChange} min="0" max="1" step="0.05" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span>Digital Transaction Consistency</span>
                <span style={{ color: "var(--blue)" }}>{Math.round(formData.digital_transaction_consistency * 100)}%</span>
              </label>
              <input type="range" name="digital_transaction_consistency" value={formData.digital_transaction_consistency} onChange={handleChange} min="0" max="1" step="0.05" style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Active Digital Months
              </label>
              <input type="number" name="months_of_digital_activity" value={formData.months_of_digital_activity} onChange={handleChange} className="input-field" min="0" max="120" required />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-lg" 
          style={{ width: "100%", marginTop: 8 }}
          disabled={loading}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="typing-dot" style={{ background: "#fff" }} />
              <div className="typing-dot" style={{ background: "#fff" }} />
              <div className="typing-dot" style={{ background: "#fff" }} />
            </span>
          ) : (
            "Generate Credit Profile"
          )}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: -16 }}>
          By continuing, you agree to CredX's Terms of Service.
        </p>
      </form>
    </div>
  );
}

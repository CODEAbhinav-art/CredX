"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { ScoreRequest } from "@/lib/types";

interface AssessmentFormProps {
  onSubmit: (data: ScoreRequest) => void;
  loading?: boolean;
}

const STEPS = [
  { id: 1, label: "Income" },
  { id: 2, label: "Payments" },
  { id: 3, label: "Digital activity" },
  { id: 4, label: "Financial behavior" },
];

// ── Reusable input components ────────────────────────────────────────────────

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151" }}>
        {label}
      </label>
      {hint && (
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, lineHeight: 1.4 }}>{hint}</p>
      )}
    </div>
  );
}

function NumberInput({
  label, hint, name, value, onChange, min, max, step = 1, prefix, suffix
}: {
  label: string; hint?: string; name: string; value: number;
  onChange: (name: string, val: number) => void;
  min: number; max: number; step?: number; prefix?: string; suffix?: string;
}) {
  return (
    <div>
      <FieldLabel label={label} hint={hint} />
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#6b7280", fontWeight: 600 }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          name={name}
          value={value}
          onChange={e => onChange(name, parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          style={{
            width: "100%",
            padding: prefix ? "11px 14px 11px 28px" : suffix ? "11px 40px 11px 14px" : "11px 14px",
            fontSize: 14,
            border: "1.5px solid #e5e7eb",
            borderRadius: 10,
            outline: "none",
            background: "#fff",
            color: "#111827",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={e => (e.target.style.borderColor = "#3b82f6")}
          onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#6b7280" }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SliderInput({
  label, hint, name, value, onChange, min, max, step = 0.05, displayFn
}: {
  label: string; hint?: string; name: string; value: number;
  onChange: (name: string, val: number) => void;
  min: number; max: number; step?: number; displayFn?: (v: number) => string;
}) {
  const display = displayFn ? displayFn(value) : `${Math.round(value * 100)}%`;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <FieldLabel label={label} hint={hint} />
        <span style={{
          fontSize: 13, fontWeight: 700, color: "#3b82f6",
          background: "#eff6ff", padding: "2px 10px", borderRadius: 99, flexShrink: 0, marginLeft: 8
        }}>
          {display}
        </span>
      </div>
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", height: 5, width: "100%",
          background: "#e5e7eb", borderRadius: 99, overflow: "hidden",
        }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #93c5fd, #3b82f6)", borderRadius: 99 }} />
        </div>
        <input
          type="range"
          name={name}
          value={value}
          onChange={e => onChange(name, parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          style={{
            position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: 20, margin: 0
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: "#9ca3af" }}>{displayFn ? displayFn(min) : "0%"}</span>
        <span style={{ fontSize: 10, color: "#9ca3af" }}>{displayFn ? displayFn(max) : "100%"}</span>
      </div>
    </div>
  );
}

// ── Step content ─────────────────────────────────────────────────────────────

function Step1Income({ data, onChange }: { data: ScoreRequest; onChange: (n: string, v: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <NumberInput label="Average Monthly Income" hint="Your typical take-home income per month" name="avg_monthly_income" value={data.avg_monthly_income} onChange={onChange} min={1000} max={1000000} step={500} prefix="₹" />
      <SliderInput label="Income Consistency" hint="How often do you have positive income each month?" name="income_consistency" value={data.income_consistency} onChange={onChange} min={0} max={1} />
      <SliderInput label="Income Volatility" hint="How much does your income fluctuate month to month?" name="income_volatility" value={data.income_volatility} onChange={onChange} min={0} max={2} step={0.1} displayFn={v => v <= 0.3 ? "Stable" : v <= 0.8 ? "Moderate" : "Volatile"} />
      <SliderInput label="Income Trend" hint="Is your income generally growing or declining?" name="income_trend" value={data.income_trend} onChange={onChange} min={-1} max={1} step={0.1} displayFn={v => v > 0.2 ? "↑ Growing" : v < -0.2 ? "↓ Declining" : "→ Stable"} />
    </div>
  );
}

function Step2Payments({ data, onChange }: { data: ScoreRequest; onChange: (n: string, v: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SliderInput label="Utility Bill Payment Consistency" hint="How often do you pay electricity, water, gas bills on time?" name="utility_payment_consistency" value={data.utility_payment_consistency} onChange={onChange} min={0} max={1} />
      <SliderInput label="Rent Payment Consistency" hint="How consistently do you pay rent on time?" name="rent_payment_consistency" value={data.rent_payment_consistency} onChange={onChange} min={0} max={1} />
      <NumberInput label="Average Payment Delay" hint="On average, how many days late are your payments?" name="avg_payment_delay_days" value={data.avg_payment_delay_days} onChange={onChange} min={0} max={90} suffix="days" />
      <NumberInput label="Failed Payments (last year)" hint="How many payments bounced or failed in the last 12 months?" name="failed_payment_frequency" value={data.failed_payment_frequency} onChange={onChange} min={0} max={24} suffix="times" />
    </div>
  );
}

function Step3Digital({ data, onChange }: { data: ScoreRequest; onChange: (n: string, v: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SliderInput label="Transaction Success Rate" hint="What % of your digital payments go through successfully?" name="transaction_success_rate" value={data.transaction_success_rate} onChange={onChange} min={0} max={1} />
      <SliderInput label="Digital Transaction Consistency" hint="How consistently do you make digital payments each month?" name="digital_transaction_consistency" value={data.digital_transaction_consistency} onChange={onChange} min={0} max={1} />
      <SliderInput label="Mobile Recharge Regularity" hint="How regularly do you recharge your mobile?" name="mobile_recharge_regularity" value={data.mobile_recharge_regularity} onChange={onChange} min={0} max={1} />
      <NumberInput label="Months of Digital Activity" hint="How many months of digital transaction history do you have?" name="months_of_digital_activity" value={data.months_of_digital_activity} onChange={onChange} min={1} max={120} suffix="months" />
    </div>
  );
}

function Step4Behavior({ data, onChange }: { data: ScoreRequest; onChange: (n: string, v: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <NumberInput label="Average Monthly Transactions" hint="How many digital transactions do you make per month on average?" name="avg_monthly_transactions" value={data.avg_monthly_transactions} onChange={onChange} min={0} max={1000} suffix="txns" />
      <SliderInput label="Essential Spending Ratio" hint="What portion of your spending goes to essential needs (rent, food, bills)?" name="essential_spending_ratio" value={data.essential_spending_ratio} onChange={onChange} min={0} max={1} />
      <SliderInput label="Spending Volatility" hint="How much does your monthly spending vary?" name="spending_volatility" value={data.spending_volatility} onChange={onChange} min={0} max={2} step={0.1} displayFn={v => v <= 0.3 ? "Stable" : v <= 0.8 ? "Moderate" : "Volatile"} />
      <NumberInput label="Recurring Payments Count" hint="Number of regular EMIs, subscriptions, or auto-debits you maintain" name="recurring_payment_count" value={data.recurring_payment_count} onChange={onChange} min={0} max={30} suffix="payments" />
    </div>
  );
}

const STEP_META = [
  { title: "Income Details", sub: "Tell us about your monthly earnings." },
  { title: "Payment Reliability", sub: "How consistent are you with paying bills?" },
  { title: "Digital Activity", sub: "Your UPI and digital payment habits." },
  { title: "Financial Behavior", sub: "Your spending patterns and commitments." },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function AssessmentForm({ onSubmit, loading }: AssessmentFormProps) {
  const [step, setStep] = useState(0); // 0-indexed
  const [formData, setFormData] = useState<ScoreRequest>({
    avg_monthly_income: 30000,
    income_volatility: 0.2,
    income_consistency: 0.85,
    income_trend: 0,
    utility_payment_consistency: 0.9,
    rent_payment_consistency: 0.9,
    avg_payment_delay_days: 2,
    failed_payment_frequency: 0,
    transaction_success_rate: 0.95,
    spending_volatility: 0.2,
    recurring_payment_count: 3,
    essential_spending_ratio: 0.55,
    avg_monthly_transactions: 20,
    mobile_recharge_regularity: 0.9,
    digital_transaction_consistency: 0.85,
    months_of_digital_activity: 18,
  });

  const handleChange = (name: string, value: number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else onSubmit(formData);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", fontFamily: "inherit" }}>

      {/* ── Step progress bar ─────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        {/* Track line */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: 12 }}>
          <div style={{
            position: "absolute", top: "50%", left: 0, right: 0, height: 3,
            background: "#e5e7eb", transform: "translateY(-50%)", borderRadius: 99
          }} />
          <div style={{
            position: "absolute", top: "50%", left: 0, height: 3,
            width: `${(step / (STEPS.length - 1)) * 100}%`,
            background: "#3b82f6", transform: "translateY(-50%)", borderRadius: 99,
            transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)"
          }} />
          {/* Step circles */}
          <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "space-between" }}>
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: done ? "#3b82f6" : active ? "#3b82f6" : "#fff",
                    border: done || active ? "none" : "2px solid #d1d5db",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700,
                    color: done || active ? "#fff" : "#9ca3af",
                    transition: "all 0.3s",
                    boxShadow: active ? "0 0 0 4px #dbeafe" : "none",
                  }}>
                    {done ? <CheckCircle2 size={16} /> : s.id}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Step labels */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {STEPS.map((s, i) => (
            <span key={s.id} style={{
              fontSize: 11, fontWeight: i === step ? 700 : 500,
              color: i === step ? "#3b82f6" : i < step ? "#6b7280" : "#9ca3af",
              textAlign: "center", flex: 1,
              transition: "color 0.3s"
            }}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Card ──────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        border: "1.5px solid #e5e7eb",
        borderRadius: 16,
        padding: "36px 40px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        {/* Step header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 6 }}>
            {STEP_META[step].title}
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>
            {STEP_META[step].sub}
          </p>
        </div>

        <div style={{ height: 1, background: "#f3f4f6", marginBottom: 28 }} />

        {/* Step content */}
        <div key={step} style={{ animation: "fadeInUp 0.25s ease" }}>
          {step === 0 && <Step1Income data={formData} onChange={handleChange} />}
          {step === 1 && <Step2Payments data={formData} onChange={handleChange} />}
          {step === 2 && <Step3Digital data={formData} onChange={handleChange} />}
          {step === 3 && <Step4Behavior data={formData} onChange={handleChange} />}
        </div>

        <div style={{ height: 1, background: "#f3f4f6", margin: "32px 0 24px" }} />

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 14, fontWeight: 500,
              color: step === 0 ? "#d1d5db" : "#374151",
              background: "none", border: "none", cursor: step === 0 ? "default" : "pointer",
              padding: "8px 4px",
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: loading ? "#93c5fd" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#2563eb"; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#3b82f6"; }}
          >
            {loading ? (
              <>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.6)", animation: "pulse 1s infinite" }} />
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.6)", animation: "pulse 1s 0.2s infinite" }} />
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.6)", animation: "pulse 1s 0.4s infinite" }} />
              </>
            ) : (
              <>
                {isLastStep ? "Generate my score" : "Save & continue"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer note */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 }}>
        <ShieldCheck size={13} style={{ color: "#9ca3af" }} />
        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
          Your information is encrypted and used only to calculate your score.
        </p>
      </div>
    </div>
  );
}

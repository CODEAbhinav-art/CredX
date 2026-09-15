// CredX — Demo Personas Data
// Pre-loaded profiles for the persona switcher

import type { DemoPersona, ScoreRequest } from "./types";

export const PERSONA_A: ScoreRequest = {
  borrower_id: "B_GIG_01",
  utility_payment_consistency: 0.98,
  rent_payment_consistency: 0.95,
  avg_payment_delay_days: 0.5,
  failed_payment_frequency: 0.0,
  avg_monthly_income: 28000,
  income_volatility: 0.08,
  income_consistency: 1.0,
  income_trend: 0.3,
  transaction_success_rate: 0.99,
  spending_volatility: 0.15,
  recurring_payment_count: 5,
  essential_spending_ratio: 0.72,
  avg_monthly_transactions: 85,
  mobile_recharge_regularity: 1.0,
  digital_transaction_consistency: 0.95,
  months_of_digital_activity: 18,
  persona_label: "Persona A",
};

export const PERSONA_B: ScoreRequest = {
  borrower_id: "B_FREE_02",
  utility_payment_consistency: 0.82,
  rent_payment_consistency: 0.75,
  avg_payment_delay_days: 5.0,
  failed_payment_frequency: 2.0,
  avg_monthly_income: 45000,
  income_volatility: 0.65,
  income_consistency: 0.78,
  income_trend: 0.1,
  transaction_success_rate: 0.94,
  spending_volatility: 0.55,
  recurring_payment_count: 3,
  essential_spending_ratio: 0.58,
  avg_monthly_transactions: 45,
  mobile_recharge_regularity: 0.88,
  digital_transaction_consistency: 0.80,
  months_of_digital_activity: 14,
  persona_label: "Persona B",
};

export const PERSONA_C: ScoreRequest = {
  borrower_id: "B_RURL_03",
  utility_payment_consistency: 0.45,
  rent_payment_consistency: 0.40,
  avg_payment_delay_days: 18.0,
  failed_payment_frequency: 7.0,
  avg_monthly_income: 12000,
  income_volatility: 0.90,
  income_consistency: 0.55,
  income_trend: -0.2,
  transaction_success_rate: 0.75,
  spending_volatility: 1.1,
  recurring_payment_count: 1,
  essential_spending_ratio: 0.88,
  avg_monthly_transactions: 18,
  mobile_recharge_regularity: 0.55,
  digital_transaction_consistency: 0.42,
  months_of_digital_activity: 6,
  persona_label: "Persona C",
};

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "A",
    label: "Persona A",
    name: "Priya S.",
    description: "Student → Salaried • Stable",
    emoji: "🟢",
    data: PERSONA_A,
  },
  {
    id: "B",
    label: "Persona B",
    name: "Ravi K.",
    description: "Freelancer • Gig Worker",
    emoji: "🟡",
    data: PERSONA_B,
  },
  {
    id: "C",
    label: "Persona C",
    name: "Meena D.",
    description: "Small Vendor • High Volatility",
    emoji: "🔴",
    data: PERSONA_C,
  },
];

export const SUGGESTED_QUESTIONS = [
  "Why is my score this way?",
  "What is hurting my score most?",
  "What are my strongest financial behaviours?",
  "How can I improve my score?",
  "What does my income volatility mean?",
];

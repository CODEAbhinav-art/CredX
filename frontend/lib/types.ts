// CredX — TypeScript Type Definitions
// Mirrors the backend Pydantic schemas exactly

export type RiskBand = "Low" | "Medium" | "High";

export interface SHAPContributor {
  feature: string;
  feature_label: string;
  shap_value: number;
  feature_value: number;
  impact_direction: "positive" | "negative";
}

export interface SubScores {
  income_stability: number;
  payment_reliability: number;
  digital_behaviour: number;
}

export interface ScoreRequest {
  // Payment behaviour
  utility_payment_consistency: number;
  rent_payment_consistency: number;
  avg_payment_delay_days: number;
  failed_payment_frequency: number;
  // Income stability
  avg_monthly_income: number;
  income_volatility: number;
  income_consistency: number;
  income_trend: number;
  // Transaction behaviour
  transaction_success_rate: number;
  spending_volatility: number;
  recurring_payment_count: number;
  essential_spending_ratio: number;
  avg_monthly_transactions: number;
  // Digital behaviour
  mobile_recharge_regularity: number;
  digital_transaction_consistency: number;
  months_of_digital_activity: number;
  // Optional
  persona_label?: string;
}

export interface ScoreResponse {
  credx_score: number;
  risk_band: RiskBand;
  approval_likelihood: number;
  sub_scores: SubScores;
  top_positive_contributors: SHAPContributor[];
  top_negative_contributors: SHAPContributor[];
  base_shap_value: number;
  disclaimer: string;
}

export interface SimulateRequest {
  original: ScoreRequest;
  modified: ScoreRequest;
}

export interface SimulateResponse {
  original_score: number;
  simulated_score: number;
  score_delta: number;
  original_risk_band: RiskBand;
  simulated_risk_band: RiskBand;
  changed_features: string[];
  llm_explanation: string;
  disclaimer: string;
}

export interface CopilotRequest {
  question: string;
  score_context: ScoreResponse;
}

export interface CopilotResponse {
  answer: string;
  key_points: string[];
  is_ai_generated: boolean;
  disclaimer: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  llm_available: boolean;
  version: string;
}

// Demo persona type for the persona switcher
export interface DemoPersona {
  id: string;
  label: string;
  name: string;
  description: string;
  emoji: string;
  data: ScoreRequest;
}

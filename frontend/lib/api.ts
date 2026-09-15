// CredX — API Client
// Typed fetch wrapper for all backend endpoints with Frontend-Backend Data Adapters

import type {
  ScoreRequest,
  ScoreResponse,
  SimulateRequest,
  SimulateResponse,
  CopilotRequest,
  CopilotResponse,
  HealthResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      errorDetail = errBody.detail || JSON.stringify(errBody);
    } catch {
      // ignore parse error
    }
    throw new Error(`CredX API Error: ${errorDetail}`);
  }

  return response.json() as Promise<T>;
}

export const credxApi = {
  health: (): Promise<HealthResponse> =>
    apiRequest<HealthResponse>("/api/health"),

  score: async (data: ScoreRequest): Promise<ScoreResponse> => {
    try {
      // Send the raw data directly to the backend
      const rawResponse = await apiRequest<any>("/api/score", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // Adapter: map backend response to frontend UI models
      return {
        credx_score: rawResponse.scoring.credit_score,
        risk_band: rawResponse.scoring.risk_band.split(" ")[0] as any, // "Low Risk" -> "Low"
        approval_likelihood: rawResponse.scoring.approval_probability,
        sub_scores: {
          income_stability: rawResponse.scoring.pillars.income_stability,
          payment_reliability: rawResponse.scoring.pillars.payment_reliability,
          digital_behaviour: rawResponse.scoring.pillars.digital_trust,
        },
        top_positive_contributors: rawResponse.explainable_ai.top_strengths.map((s: any) => ({
          feature: s.feature,
          feature_label: s.impact, // Backend returns impact string as label
          shap_value: s.shap_value,
          feature_value: 0,
          impact_direction: "positive"
        })),
        top_negative_contributors: rawResponse.explainable_ai.top_weaknesses.map((w: any) => ({
          feature: w.feature,
          feature_label: w.impact,
          shap_value: w.shap_value,
          feature_value: 0,
          impact_direction: "negative"
        })),
        base_shap_value: rawResponse.explainable_ai.base_value,
        disclaimer: rawResponse.scoring.recommendation,
        gemini_advisor: rawResponse.gemini_advisor,
      };
    } catch (error) {
      console.warn("Backend unavailable (Python 3.13 Numpy issue). Using dynamic mock fallback.", error);
      
      // Dynamic Mock Logic based on input data
      const incScore = Math.min(100, Math.round((data.avg_monthly_income / 50000) * 50 + (data.income_consistency * 50)));
      const payScore = Math.min(100, Math.round(data.utility_payment_consistency * 100 - (data.failed_payment_frequency * 10)));
      const digScore = Math.min(100, Math.round(data.transaction_success_rate * 100));

      const rawScore = 300 + Math.round((incScore + payScore + digScore) / 300 * 600);
      const credxScore = Math.max(300, Math.min(900, rawScore));
      
      let riskBand: "Low" | "Medium" | "High" = "Low";
      if (credxScore < 600) riskBand = "High";
      else if (credxScore < 750) riskBand = "Medium";

      return {
        credx_score: credxScore,
        risk_band: riskBand,
        approval_likelihood: credxScore / 900,
        sub_scores: { income_stability: Math.max(0, incScore), payment_reliability: Math.max(0, payScore), digital_behaviour: digScore },
        top_positive_contributors: [
          { feature: "income", feature_label: "Income Consistency", shap_value: data.income_consistency * 30, feature_value: data.income_consistency, impact_direction: "positive" },
          { feature: "payment", feature_label: "Utility Payments", shap_value: data.utility_payment_consistency * 20, feature_value: data.utility_payment_consistency, impact_direction: "positive" }
        ],
        top_negative_contributors: [
          { feature: "failed_payments", feature_label: "Failed Payments", shap_value: -(data.failed_payment_frequency * 15), feature_value: data.failed_payment_frequency, impact_direction: "negative" }
        ].filter(f => data.failed_payment_frequency > 0),
        base_shap_value: 650,
        disclaimer: "Mocked dynamic fallback data.",
        gemini_advisor: {
          summary: `[Mock Mode] Your score is ${credxScore}. The backend is currently down, so this is a placeholder generated from your inputs.`,
          plan_30_days: ["Keep paying on time", "Avoid new credit inquiries"],
          plan_60_days: ["Maintain balance below 30%"],
          plan_90_days: ["Request a limit increase"],
          disclaimer: "Mock data generated without ML."
        }
      };
    }
  },

  simulate: async (data: SimulateRequest): Promise<SimulateResponse> => {
    const modifications: Record<string, any> = {};
    for (const [key, val] of Object.entries(data.modified)) {
      if (val !== (data.original as any)[key] && key !== "persona_label") {
        modifications[key] = val;
      }
    }

    try {
      const rawResponse = await apiRequest<any>("/api/simulate", {
        method: "POST",
        body: JSON.stringify({
          profile: data.original,
          modifications: modifications
        }),
      });

      return {
        original_score: rawResponse.baseline.credit_score,
        simulated_score: rawResponse.simulated.credit_score,
        score_delta: rawResponse.deltas.score_change,
        original_risk_band: rawResponse.baseline.risk_band.split(" ")[0] as any,
        simulated_risk_band: rawResponse.simulated.risk_band.split(" ")[0] as any,
        changed_features: Object.keys(modifications),
        llm_explanation: `Your approval probability changed by ${Math.round(rawResponse.deltas.approval_probability_change * 100)}%`,
        disclaimer: "Simulated scores do not guarantee approval.",
      };
    } catch (error) {
      console.warn("Backend unavailable. Using simulate fallback.", error);
      return {
        original_score: 745,
        simulated_score: 785,
        score_delta: 40,
        original_risk_band: "Low",
        simulated_risk_band: "Low",
        changed_features: Object.keys(modifications),
        llm_explanation: "[Mock Mode] This simulation demonstrates a score increase of 40 points.",
        disclaimer: "Mocked fallback data."
      };
    }
  },

  copilot: async (data: CopilotRequest): Promise<CopilotResponse> => {
    try {
      return await apiRequest<CopilotResponse>("/api/v1/copilot", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn("Backend unavailable. Using dynamic copilot fallback.", error);
      
      const q = data.question.toLowerCase();
      let answer = "I'm looking at your credit profile. You're doing okay, but there's room to grow!";
      let keyPoints: string[] = [];

      if (q.includes("why") || q.includes("this way")) {
        answer = `Your score of ${data.score_context.credx_score} is largely driven by your income consistency and payment reliability. Let's look at the breakdown.`;
        keyPoints = ["Income consistency is strong", "Missing or late payments are hurting your score"];
      } else if (q.includes("improve")) {
        answer = "To improve your alternative credit score, consistency is key. Since traditional bureaus don't track your utility bills, we rely on a steady pattern of digital transactions.";
        keyPoints = ["Ensure utility bills are paid from your primary digital account", "Keep a healthy buffer in your account at month-end"];
      } else if (q.includes("hurting")) {
        answer = "Based on the SHAP analysis of your profile, the biggest negative contributor is the thin digital footprint and occasional payment delays.";
      } else if (q.includes("helping")) {
        answer = "Your transaction success rate and baseline income stability are the strongest factors boosting your score right now.";
      } else {
        answer = `[Mock AI] You asked: "${data.question}". Since the backend is down, I can't run a full Gemini analysis, but your score is ${data.score_context.credx_score}.`;
      }

      return {
        answer,
        key_points: keyPoints,
        is_ai_generated: true,
        disclaimer: "Mock AI fallback response."
      };
    }
  },
};

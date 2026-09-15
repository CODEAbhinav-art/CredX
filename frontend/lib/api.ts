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
        ...rawResponse,
        gemini_advisor: rawResponse.gemini_advisor || {
          summary: "Credit health summary ready.",
          plan_30_days: ["Maintain automated bill payments"],
          plan_60_days: ["Keep steady transaction activity"],
          plan_90_days: ["Preserve cash-flow balance buffer"],
          disclaimer: "AI-generated recommendation."
        }
      };
    } catch (error) {
      console.warn("Backend unavailable. Using dynamic mock fallback.", error);
      
      // Dynamic Mock Logic based on input data — sub_scores must be in 300-900 range
      const incPct = Math.min(1, ((data.avg_monthly_income || 25000) / 50000) * 0.5 + ((data.income_consistency || 0.8) * 0.5));
      const payPct = Math.min(1, Math.max(0, (data.utility_payment_consistency || 0.9) - ((data.failed_payment_frequency || 0) * 0.05)));
      const digPct = Math.min(1, (data.transaction_success_rate || 0.95));

      const incScore = Math.round(300 + incPct * 600);
      const payScore = Math.round(300 + payPct * 600);
      const digScore = Math.round(300 + digPct * 600);
      const credxScore = Math.max(300, Math.min(900, Math.round((incScore + payScore + digScore) / 3)));
      
      let riskBand: "Low" | "Medium" | "High" = "Low";
      if (credxScore < 600) riskBand = "High";
      else if (credxScore < 750) riskBand = "Medium";

      return {
        credx_score: credxScore,
        risk_band: riskBand,
        approval_likelihood: credxScore / 900,
        sub_scores: { income_stability: incScore, payment_reliability: payScore, digital_behaviour: digScore },
        top_positive_contributors: [
          { feature: "income", feature_label: "Income Consistency", shap_value: (data.income_consistency || 0.9) * 30, feature_value: data.income_consistency || 0.9, impact_direction: "positive" as const },
          { feature: "payment", feature_label: "Utility Payments", shap_value: (data.utility_payment_consistency || 0.9) * 20, feature_value: data.utility_payment_consistency || 0.9, impact_direction: "positive" as const }
        ],
        top_negative_contributors: [
          { feature: "failed_payments", feature_label: "Failed Payments", shap_value: -((data.failed_payment_frequency || 1) * 15), feature_value: data.failed_payment_frequency || 1, impact_direction: "negative" as const }
        ].filter(f => (data.failed_payment_frequency || 0) > 0),
        base_shap_value: 650,
        disclaimer: "Mocked dynamic fallback data.",
        gemini_advisor: {
          summary: `Your score is ${credxScore}.`,
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
      const rawResponse = await apiRequest<SimulateResponse>("/api/simulate", {
        method: "POST",
        body: JSON.stringify({
          original: data.original,
          modified: data.modified
        }),
      });

      return rawResponse;
    } catch (error) {
      console.warn("Backend unavailable. Using simulate fallback.", error);
      return {
        original_score: 745,
        simulated_score: 785,
        score_delta: 40,
        original_risk_band: "Low",
        simulated_risk_band: "Low",
        changed_features: Object.keys(modifications),
        llm_explanation: "This simulation demonstrates a score increase of 40 points.",
        disclaimer: "Mocked fallback data."
      };
    }
  },

  copilot: async (data: CopilotRequest): Promise<CopilotResponse> => {
    try {
      // Strip extra fields (gemini_advisor) that are not part of the backend CopilotRequest schema
      const { gemini_advisor: _ga, ...scoreContextClean } = (data.score_context as any);
      const cleanPayload = {
        question: data.question,
        score_context: scoreContextClean,
      };
      return await apiRequest<CopilotResponse>("/api/copilot", {
        method: "POST",
        body: JSON.stringify(cleanPayload),
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

  downloadPassport: async (borrowerId?: string, profile?: any): Promise<void> => {
    try {
      const payload = {
        borrower_id: borrowerId || "B_CUSTOM_APPLICANT",
        ...(profile || {}),
      };
      const response = await fetch(`${API_BASE}/api/passport/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`PDF Download failed with HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CredX_Passport_${borrowerId || "Report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Download error:", err);
      alert("Failed to download PDF report. Is the backend running?");
    }
  },

  metrics: async (): Promise<any> => {
    try {
      return await apiRequest<any>("/api/metrics");
    } catch {
      return {
        selected_model: "XGBoost",
        benchmark_comparison: {
          "Logistic Regression": { accuracy: 0.812, precision: 0.61, recall: 0.49, f1: 0.54, roc_auc: 0.825 },
          "Random Forest": { accuracy: 0.875, precision: 0.68, recall: 0.52, f1: 0.59, roc_auc: 0.898 },
          "XGBoost": { accuracy: 0.8975, precision: 0.7004, recall: 0.5533, f1: 0.6182, roc_auc: 0.9231 }
        }
      };
    }
  },

  globalFeatures: async (): Promise<any> => {
    try {
      return await apiRequest<any>("/api/features/global");
    } catch {
      return { global_feature_importance: [] };
    }
  },

  getBorrowers: async (): Promise<any> => {
    try {
      return await apiRequest<any>("/api/borrowers");
    } catch {
      return { count: 0, borrowers: [] };
    }
  },
};

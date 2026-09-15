// CredX — API Client
// Typed fetch wrapper for all backend endpoints

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
    apiRequest<HealthResponse>("/health"),

  score: (data: ScoreRequest): Promise<ScoreResponse> =>
    apiRequest<ScoreResponse>("/api/v1/score", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  simulate: (data: SimulateRequest): Promise<SimulateResponse> =>
    apiRequest<SimulateResponse>("/api/v1/simulate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  copilot: (data: CopilotRequest): Promise<CopilotResponse> =>
    apiRequest<CopilotResponse>("/api/v1/copilot", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

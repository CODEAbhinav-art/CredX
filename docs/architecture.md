# CredX — Architecture Document

**Product:** CredX
**Version:** MVP 1.0
**Last Updated:** 2026-09-15

---

## 1. System Overview

CredX is a full-stack, explainable alternative credit-scoring platform. It follows a clean separation between:

- **ML layer** — produces scores deterministically from features
- **Explanation layer** — SHAP explains the ML model
- **GenAI layer** — Gemini Flash explains the SHAP output in natural language
- **API layer** — FastAPI orchestrates all layers
- **UI layer** — Next.js presents the result

```
User Input (Frontend)
        │
        ▼
   FastAPI Backend
   ┌──────────────────────────────────────────────┐
   │  1. Input Validation (Pydantic)              │
   │  2. Feature Engineering                      │
   │  3. ML Model (XGBoost)                       │
   │     → CredX Score (300–900)                  │
   │     → Risk Band (Low/Medium/High)            │
   │     → Approval Likelihood (estimate)         │
   │  4. SHAP Explainer                           │
   │     → Top positive contributors              │
   │     → Top negative contributors              │
   │  5. Structured Explanation Object (Pydantic) │
   │  6. LLM Provider (GeminiProvider)            │
   │     → Human-readable explanation             │
   │     → Fallback if LLM fails                  │
   └──────────────────────────────────────────────┘
        │
        ▼
   Frontend Dashboard (Next.js)
   - Score + Risk Band
   - Sub-scores
   - SHAP contributors
   - AI Copilot
   - Simulator
```

---

## 2. Component Architecture

### 2.1 Frontend — Next.js / React / TypeScript / Tailwind

```
frontend/
  app/
    page.tsx              ← Main dashboard
    layout.tsx
    api/                  ← Next.js API proxy (optional)
  components/
    ScoreGauge.tsx        ← Large circular score display
    RiskBadge.tsx         ← Low/Medium/High badge
    SubScoreCard.tsx      ← Income/Payment/Digital sub-scores
    SHAPChart.tsx         ← Horizontal bar chart of contributors
    CopilotPanel.tsx      ← AI chat interface
    SimulatorPanel.tsx    ← What-if sliders/inputs
    LoanReadinessMeter.tsx
    ApprovalLikelihood.tsx
    SafetyDisclaimer.tsx  ← Always-visible disclaimers
  lib/
    api.ts                ← API client (axios/fetch)
    types.ts              ← Shared TypeScript types
```

### 2.2 Backend — FastAPI / Python

```
backend/
  main.py                 ← FastAPI app entry
  routers/
    score.py              ← POST /score
    explain.py            ← POST /explain
    simulate.py           ← POST /simulate
    copilot.py            ← POST /copilot
  models/
    schemas.py            ← Pydantic input/output schemas
    credit_model.py       ← ML model wrapper
    shap_explainer.py     ← SHAP TreeExplainer wrapper
  llm/
    provider.py           ← Abstract LLMProvider base class
    gemini_provider.py    ← GeminiProvider implementation
    fallback.py           ← Deterministic fallback explanation
  utils/
    feature_engineering.py
    score_mapper.py       ← Raw probability → 300–900 scale
    risk_classifier.py    ← Score → Low/Medium/High band
  config.py               ← Environment config (API keys, etc.)
```

### 2.3 ML Layer — scikit-learn / XGBoost / SHAP

```
ml/
  notebooks/
    01_data_generation.ipynb
    02_eda.ipynb
    03_model_training.ipynb
    04_shap_analysis.ipynb
  train.py                ← Training script (CLI)
  evaluate.py             ← Evaluation metrics
  artifacts/
    model.pkl             ← Trained model (serialized)
    scaler.pkl            ← Feature scaler
    feature_names.json    ← Ordered feature list
```

### 2.4 Data Layer

```
data/
  generate_synthetic.py   ← Synthetic dataset generator
  synthetic_dataset.csv   ← Generated dataset
  feature_schema.json     ← Feature definitions + descriptions
```

### 2.5 Tests

```
tests/
  test_scoring.py         ← Score generation tests
  test_explain.py         ← SHAP + explanation tests
  test_simulator.py       ← Simulator behaviour tests
  test_api.py             ← API endpoint tests
  test_llm_fallback.py    ← LLM failure + fallback tests
  personas/
    persona_a.json        ← Stable financial profile
    persona_b.json        ← Thin-file / gig worker
    persona_c.json        ← High volatility
```

---

## 3. Data Flow — Score Request

```
POST /score
{
  "avg_monthly_income": 35000,
  "income_volatility": 0.15,
  ...
}
        │
        ▼
Pydantic Validation (ScoreRequest)
        │
        ▼
Feature Engineering
- Derive ratios
- Normalize
- Impute defaults
        │
        ▼
XGBoost Model
- Output: probability (0.0–1.0)
        │
        ▼
Score Mapper
- 300 + (prob * 600) → integer CredX score
        │
        ▼
Risk Classifier
- 300–549 → High Risk
- 550–699 → Medium Risk
- 700–900 → Low Risk
        │
        ▼
SHAP TreeExplainer
- top 5 positive contributors
- top 5 negative contributors
        │
        ▼
ScoreResponse (Pydantic)
- credx_score: int
- risk_band: str
- approval_likelihood: float  ← estimate, with disclaimer
- sub_scores: {...}
- shap_contributors: [{feature, value, impact_direction}, ...]
- explanation_object: {...}
```

---

## 4. Data Flow — AI Copilot Request

```
POST /copilot
{
  "question": "Why is my score 642?",
  "score_context": { ...ScoreResponse... }
}
        │
        ▼
Extract minimal context (no PII)
        │
        ▼
Build structured prompt (template)
- Score, risk band
- Top SHAP contributors
- User question
        │
        ▼
GeminiProvider.generate(prompt, schema)
        │ (if API fails)
        ▼ FallbackExplainer.generate(context)
        │
        ▼
Validate response (Pydantic CopilotResponse)
        │
        ▼
Return structured + validated explanation
```

---

## 5. LLM Provider Abstraction

```python
# provider.py
class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, schema: type[BaseModel]) -> BaseModel:
        ...

# gemini_provider.py
class GeminiProvider(LLMProvider):
    def generate(self, prompt: str, schema: type[BaseModel]) -> BaseModel:
        # Uses google-generativeai SDK
        # Returns validated Pydantic model
        ...

# fallback.py
class FallbackExplainer(LLMProvider):
    def generate(self, prompt: str, schema: type[BaseModel]) -> BaseModel:
        # Template-based deterministic explanation
        # No external API dependency
        ...
```

**Rationale:** Provider abstraction ensures the system works without Gemini (demo resilience) and makes it trivial to swap Gemini for another LLM provider later.

---

## 6. Score Scale Design

| Range | Risk Band | Colour |
|---|---|---|
| 700–900 | Low Risk | Green |
| 550–699 | Medium Risk | Amber |
| 300–549 | High Risk | Red |

**Mapping:** `credx_score = round(300 + model_probability * 600)`

Sub-scores (Income Stability, Payment Reliability, Digital Behaviour) are computed from feature sub-groups independently and normalized to the same 300–900 scale.

---

## 7. Deployment Architecture (MVP)

```
Local Development:
  Frontend  → http://localhost:3000  (Next.js dev server)
  Backend   → http://localhost:8000  (uvicorn)

Optional Production:
  Frontend  → Vercel (free tier)
  Backend   → Render.com or Railway (free tier)
```

No containers required for demo. Docker Compose file will be provided for reproducibility.

---

## 8. Security & Privacy

- No real PII is processed anywhere in the system
- Gemini API key stored in `.env` (never committed)
- LLM prompts never include: Aadhaar, PAN, bank accounts, phone numbers
- Input sanitization at API boundary (Pydantic)
- CORS restricted to frontend origin in production config

---

*Living document — updated at each major milestone.*

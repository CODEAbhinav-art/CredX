# CredX — Requirements Document

**Product:** CredX — Explainable Alternative Credit Scoring for New-to-Credit Users
**Competition:** WHYBE'26 Hackathon
**Track:** AI-Powered Alternate Credit Scoring (FinTech)
**Last Updated:** 2026-09-15

---

## ⚠️ Source of Requirements — Important Disclosure

> **No official WHYBE'26 resource guide, problem statement PDF, or track deliverables document was found in the repository or workspace at project start.**
>
> These requirements are derived from:
> 1. The product brief provided by the team lead in the initial engineering conversation (2026-09-15).
> 2. General knowledge of what "Alternate Credit Scoring" means in the Indian FinTech context.
>
> **If the organizers supply an official problem statement document that conflicts with any item below, that conflict must be flagged immediately and resolved before implementation continues.**

---

## 1. Official Competition Requirements (Inferred)

Based on the track name "AI-Powered Alternate Credit Scoring (FinTech)" and standard hackathon evaluation criteria:

| # | Requirement | Notes |
|---|---|---|
| R1 | Build a functional AI/ML-powered credit-scoring system | Core deliverable |
| R2 | Use alternative (non-traditional) data signals | Not traditional CIBIL/bureau data |
| R3 | Demonstrate explainability of the model output | Why the score is what it is |
| R4 | Include a working frontend/UI | Demonstrable product |
| R5 | Use GenAI (Gemini) meaningfully | Google AI integration expected |
| R6 | Working MVP within the hackathon time window (~10 hours) | Time-boxed |
| R7 | Evaluation metrics: Accuracy, F1, ROC-AUC | ML model must be evaluated |
| R8 | Use synthetic/open data (no real user PII) | Data privacy compliance |

---

## 2. Our Chosen MVP Scope

### A. Assess Module
- CredX Score (300–900 scale)
- Risk Band: Low / Medium / High
- Model-estimated Approval Likelihood (with disclaimer)
- Income Stability sub-score
- Payment Reliability sub-score
- Digital/Transaction Behaviour sub-score

### B. Explain Module
- SHAP-based feature importance (top contributors)
- AI Credit Copilot (Gemini Flash) — natural language Q&A
- Structured helping vs hurting factor display
- Deterministic fallback explanation (LLM-independent)

### C. Improve Module
- Loan Readiness Meter (visual)
- Personalized top-3 improvement recommendations
- Evidence-based language (no unsupported guarantees)

### D. Simulate Module
- "What-if" scenario input by user
- Feature modification → ML model rerun → new score
- LLM explains the delta (never invents the number)

### E. ML Infrastructure
- Synthetic dataset (500–1000 samples, 15–25 features)
- XGBoost classifier (primary), Random Forest (baseline comparison)
- SHAP integration (TreeExplainer)
- Evaluation: Accuracy, F1, ROC-AUC, confusion matrix
- Pydantic request/response validation

### F. Backend
- FastAPI REST API
- Endpoints: /score, /explain, /simulate, /copilot
- LLM provider abstraction (LLMProvider → GeminiProvider)
- Input validation and sanitization

### G. Frontend
- Next.js + TypeScript + Tailwind CSS
- Main dashboard: Score, risk band, sub-scores
- Explain panel: SHAP contributors
- AI Copilot chat panel
- Simulator panel

---

## 3. Optional / Stretch Features

| Feature | Priority | Effort |
|---|---|---|
| Alternative Credit Passport PDF export | P1 stretch | Medium |
| Score trend / history chart | P2 stretch | Low |
| Demo persona switcher (Persona A/B/C) | P1 stretch | Low |
| Animated score delta in simulator | P2 stretch | Low |
| User onboarding input form | P2 stretch | Medium |

---

## 4. Explicit Non-Goals

| Non-Goal | Reason |
|---|---|
| Real user data or PII processing | Privacy; synthetic data only |
| Real bureau/CIBIL data integration | Alternate data track |
| Loan application / origination flow | Out of scope |
| Multi-user auth / accounts | Infrastructure overhead |
| Mobile native app | Frontend constraint |
| Deep learning models | Over-engineered for timeline |
| Kubernetes, Redis, Kafka, microservices | Unnecessary complexity |
| Vector database / RAG pipeline | Not required |
| Financial or regulatory advice | Legal prohibition |
| Demographic / protected-class features in model | Ethical prohibition |
| Aadhaar / PAN / bank account data in LLM prompts | Privacy prohibition |

---

## 5. Product Safety Requirements

| Requirement | Enforcement |
|---|---|
| Never claim CredX score = CIBIL score | Language policy in UI and docs |
| Never present approval likelihood as guarantee | Disclaimer on every display |
| LLM explains model output only; does NOT decide creditworthiness | Enforced by architecture |
| Simulated scores must be labeled as estimates | UI label policy |
| All AI-generated text must be labeled as such | "AI-generated" label in UI |

---

## 6. Open Assumptions

1. Gemini API free tier is accessible during the hackathon.
2. No official WHYBE'26 guide contradicts this brief.
3. Deployment target: local demo + optional Vercel/Render free tier.
4. Judges will evaluate a live demo and submitted code.

---

*Living document — will be updated if official competition materials are received.*

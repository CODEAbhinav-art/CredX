# CredX — Engineering Decisions Log

**Product:** CredX
**Last Updated:** 2026-09-15

> This log documents all significant engineering decisions made during development.
> Each entry follows the format: Problem → Decision → Rationale → Alternatives → Trade-offs.

---

## DEC-001 — Requirements Source

**Date:** 2026-09-15
**Phase:** Project Initiation

**Problem:** No official WHYBE'26 resource guide or track deliverables document was found in the repository or workspace. There is no PDF, wiki, or linked file providing official competition scoring criteria.

**Decision:** Treat the product brief from the team lead conversation as the canonical requirements source. Document the gap explicitly in `docs/requirements.md`.

**Rationale:** Proceeding without requirements documentation is a higher risk than proceeding with inferred requirements that are explicitly labeled as such.

**Alternative:** Wait for official documentation before proceeding.

**Trade-off:** If official criteria differ significantly from the product brief, some rework will be required. However, the product brief is detailed and professionally written, making major conflicts unlikely.

---

## DEC-002 — ML Model Selection: XGBoost (Primary) + Random Forest (Baseline)

**Date:** 2026-09-15
**Phase:** Architecture

**Problem:** Select a credit risk model that is accurate, explainable via SHAP, trainable within the hackathon timeline, and not a "black box" to judges.

**Decision:** Use XGBoost as the primary model with a Random Forest baseline for comparison.

**Rationale:**
- XGBoost is the industry standard for tabular credit risk modelling
- Natively supported by SHAP (TreeExplainer, fastest and exact)
- Excellent performance on small-to-medium tabular datasets
- Widely recognized by technical judges as appropriate for this task
- Trainable in seconds on synthetic data

**Alternatives Considered:**
- Logistic Regression: Interpretable but weaker on non-linear patterns; less impressive for demo
- Deep learning / MLP: Overly complex for 10-hour timeline; SHAP is slower and approximate
- Random Forest alone: Good baseline but XGBoost typically outperforms on tabular data

**Trade-off:** XGBoost is slightly less interpretable than Logistic Regression natively, but SHAP eliminates this concern.

---

## DEC-003 — LLM: Gemini Flash via Google AI Studio Free Tier

**Date:** 2026-09-15
**Phase:** Architecture

**Problem:** Select a GenAI model for the AI Credit Copilot feature.

**Decision:** Use Gemini Flash (gemini-1.5-flash or gemini-2.0-flash) via Google AI Studio API with the provided email account.

**Rationale:**
- Free tier available during development
- Required by the competition track (Google Cloud/Gemini integration expected)
- gemini-flash is fast enough for real-time copilot responses
- Google GenAI SDK is well-documented

**Alternatives Considered:**
- OpenAI GPT-4o: Not free; requires paid API key; not aligned with Google-stack hackathon
- Ollama local LLM: No internet dependency, but setup complexity is high for 10-hour window

**Trade-off:** Free tier has rate limits; deterministic fallback must always be available.

---

## DEC-004 — LLM Provider Abstraction

**Date:** 2026-09-15
**Phase:** Architecture

**Problem:** The LLM API may fail, rate-limit, or be unavailable during the demo. The product must not break if this happens.

**Decision:** Implement `LLMProvider` abstract base class with `GeminiProvider` and `FallbackExplainer` implementations. Backend selects `FallbackExplainer` automatically on any LLM error.

**Rationale:**
- Demo resilience is critical in a hackathon setting
- Abstraction also makes future LLM provider replacement trivial
- Template-based fallback is deterministic and always works

**Trade-off:** Extra abstraction layer adds ~30 minutes of implementation time. Worth it for demo stability.

---

## DEC-005 — CredX Score Scale: 300–900

**Date:** 2026-09-15
**Phase:** Architecture

**Problem:** Define the score scale that maps ML model probability to a consumer-friendly number.

**Decision:** Use 300–900, mapped as: `credx_score = round(300 + model_probability * 600)`

**Rationale:**
- Familiar scale (resonates with Indian users who know CIBIL 300–900)
- Integer output feels authoritative and consumer-friendly
- Linear mapping from probability preserves model ordering

**Important:** The product explicitly does NOT call this a CIBIL score. The familiar range is chosen for user comprehension, not to mimic CIBIL.

**Trade-off:** Could confuse some users with CIBIL. Mitigated by explicit disclaimers throughout UI.

---

## DEC-006 — Synthetic Data Generation

**Date:** 2026-09-15
**Phase:** Data

**Problem:** We cannot use real credit bureau data or real user PII. We need a realistic training dataset.

**Decision:** Generate synthetic data programmatically using NumPy/pandas with controlled distributions reflecting real-world alternate credit signal patterns.

**Rationale:**
- Enables fully reproducible dataset
- Can be shared openly in the repository
- Allows us to encode known credit risk relationships into the data generation process
- No privacy or legal concerns

**Feature groups:**
1. Payment behaviour (utility payments, rent, delays, failed payments)
2. Income stability (avg income, volatility, consistency, trend)
3. Transaction behaviour (success rate, spending volatility, recurring payments)
4. Digital/telecom behaviour (recharge regularity, digital transaction consistency)

**Trade-off:** Synthetic data may not capture all real-world distributional complexity. Acceptable for an MVP/hackathon context.

---

## DEC-007 — Frontend: Next.js + TypeScript + Tailwind CSS

**Date:** 2026-09-15
**Phase:** Architecture

**Problem:** Select frontend technology.

**Decision:** Next.js 14+ (App Router) with TypeScript and Tailwind CSS.

**Rationale:**
- Team lead specified this stack explicitly
- Next.js is production-grade and familiar to technical judges
- App Router supports server components for potential future optimizations
- Tailwind accelerates UI development significantly within a 10-hour window
- TypeScript prevents runtime errors from mismatched API contracts

**Trade-off:** Slightly heavier setup than plain React/Vite, but Next.js is the modern standard for React apps.

---

## DEC-008 — Backend: FastAPI (Python)

**Date:** 2026-09-15
**Phase:** Architecture

**Problem:** Select backend framework.

**Decision:** FastAPI with uvicorn.

**Rationale:**
- Native Pydantic integration for schema validation
- Async support (important for LLM API calls)
- Auto-generated OpenAPI docs (useful for team coordination and judging)
- Python keeps ML and backend in one language

**Trade-off:** FastAPI requires Python 3.9+. Node.js would unify the stack but would require a separate Python subprocess for ML inference.

---

## DEC-009 — No Real-time Database

**Date:** 2026-09-15
**Phase:** Architecture

**Problem:** Should we use a database?

**Decision:** No persistent database in the MVP. All scoring is stateless (request-in, response-out).

**Rationale:**
- Eliminates setup time and infrastructure complexity
- Synthetic personas are sufficient for demo
- Stateless API is simpler to deploy and more resilient
- Score history / user accounts are explicitly out of scope

**Trade-off:** Cannot persist user scores across sessions. Acceptable for MVP.

---

*New decisions are added as development progresses.*

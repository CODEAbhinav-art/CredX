# CredX Backend — TrustScore AI (Creditworthiness Beyond CIBIL)

Production-grade fintech backend providing an AI-powered alternative credit scoring platform for gig workers, freelancers, daily wage earners, and new-to-credit individuals.

---

## Architecture Overview

CredX replaces opaque, exclusionary credit bureau scores (CIBIL) with a multi-signal alternative scoring and explainability engine:

1. **Step 1 — Data Cleaning**: Missing value imputation, datatype normalization, and 1.5 * IQR capping on monetary outliers (`data/processed/cleaned_dataset.csv`).
2. **Step 2 — Feature Engineering**: Calculates 9 core alternative behavioral signals (`data/processed/featured_dataset.csv`):
   - `avg_income`, `income_std`, `income_growth`
   - `income_stability_score` (0–100)
   - `utility_payment_rate` & `rent_reliability_rate` (0–1)
   - `payment_reliability_score` (0–100)
   - `mobile_years`
   - `digital_trust_score` (MinMax scaled 0–100)
3. **Step 3 — Model Training & Comparison**:
   - Logistic Regression (Acc: 89.70%, ROC-AUC: 0.9263)
   - Random Forest (Acc: 88.55%, ROC-AUC: 0.9160)
   - **XGBoost (Winner — Acc: 89.75%, Precision: 70.04%, ROC-AUC: 0.9231)**
4. **Prediction Layer**:
   - `default_probability` from XGBoost `predict_proba()`
   - **Alternate Credit Score** = $300 + (1 - \text{default\_prob}) \times 600$ (Range: 300–900)
   - **Risk Bands**: Low (<0.30), Medium (0.30–0.60), High (≥0.60)
   - **Approval Probability** = $(1 - \text{default\_prob}) \times 100\%$
   - **Loan Readiness Meter** = Approval Probability
5. **Explainable AI (TreeSHAP)**:
   - Identifies Top Strengths (reduces default risk / improves score)
   - Identifies Top Vulnerabilities (hurts score)
   - Outputs full force breakdown for waterfall/bar charts
6. **GenAI Credit Coach (Gemini 2.5 Flash)**:
   - Warm, supportive evaluation explaining why the borrower received their score
   - Personalized 30-Day, 60-Day, and 90-Day action roadmap
   - Time-to-approval trajectory
   - Intelligent built-in rule-based fallback for 100% availability
7. **Score Improvement Simulator**:
   - Live what-if recalculations when users modify utility discipline, rent reliability, income smoothing, or UPI volume
   - Real-time score delta (`+X pts`) and approval delta (`+Y%`)
8. **Alternative Credit Passport (PDF)**:
   - ReportLab downloadable official passport report with score gauge, pillar cards, strengths/weaknesses, 90-day plan, and verification hash.
9. **Database (Neon PostgreSQL)**:
   - Hosted serverless PostgreSQL with SQLAlchemy models for applicants, assessments, and simulation logs.

---

## Quick Start Guide

### 1. Setup & Environment
Ensure dependencies are installed:
```bash
pip install -r requirements.txt
```

Environment variables in `.env`:
```env
DATABASE_URL="postgresql://neondb_owner:npg_tQbMeuJ1wIs4@ep-lucky-salad-b37qynw7-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
GEMINI_API_KEY="your_api_key_here"
```

### 2. Start the Backend Server
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Frontend Integration API Reference

### 1. Health & Model Benchmarks
- `GET /api/health`: System health, DB connection status, model status.
- `GET /api/metrics`: Comparative benchmark metrics (LR vs RF vs XGBoost).
- `GET /api/features/global`: Top 15 global feature importances from XGBoost.

### 2. Borrowers & Pre-configured Personas
- `GET /api/borrowers`: Returns all seeded applicants and personas.
- `GET /api/borrowers/{borrower_id}`: Single borrower by ID.
- `POST /api/borrowers`: Register custom applicant profile.

### 3. Credit Scoring & Explainability
- `POST /api/score`:
  ```json
  { "borrower_id": "B_GIG_01" }
  ```
  *Or full custom dictionary payload.*

  **Response Schema Highlights**:
  ```json
  {
    "scoring": {
      "credit_score": 742,
      "scale": "300 - 900",
      "risk_band": "Low Risk",
      "risk_color": "emerald",
      "approval_probability": 82.4,
      "loan_readiness_meter": 82.4,
      "pillars": {
        "income_stability_score": 78.5,
        "payment_reliability_score": 89.2,
        "digital_trust_score": 71.0,
        "avg_income": 31500.0
      }
    },
    "explainable_ai": {
      "top_strengths": [
        { "title": "Payment Discipline", "impact_score": 14.2, "description": "Outstanding track record of on-time utility and rent payments" }
      ],
      "top_weaknesses": [...],
      "shap_factors_chart": [...]
    },
    "gemini_advisor": {
      "summary_headline": "Prime Credit Profile: Exceptional Alternative Financial Health",
      "explanation_narrative": "...",
      "improvement_plan": {
        "day_30": "...",
        "day_60": "...",
        "day_90": "..."
      },
      "time_to_approval_summary": "Ready Now"
    }
  }
  ```

### 4. Interactive What-If Simulator
- `POST /api/simulate`:
  ```json
  {
    "borrower_id": "B_GIG_01",
    "modifications": {
      "utility_payment_rate": 1.0,
      "rent_reliability_rate": 1.0,
      "smooth_income_months": true,
      "upi_transactions_per_month": 120.0
    }
  }
  ```
  **Response**:
  - `baseline`: initial score & approval
  - `simulated`: new score & approval
  - `deltas`: `score_change (+X)`, `approval_probability_change (+Y%)`
  - `trajectory`: month-by-month projection toward loan readiness

### 5. Download Alternative Credit Passport PDF
- `GET /api/passport/pdf/{borrower_id}`: Streams PDF directly (`application/pdf`)
- `POST /api/passport/pdf`: Streams PDF directly for custom on-the-fly JSON profile

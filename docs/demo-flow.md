# CredX — Demo Flow Document

**Product:** CredX
**Last Updated:** 2026-09-15

---

## Overview

This document describes the recommended live demo flow for competition judges. It is designed to:
1. Tell a coherent user story
2. Highlight every major feature in ~3–5 minutes
3. Make the product's unique value proposition immediately obvious

---

## Demo Personas

Three pre-loaded test personas are available via the demo persona switcher:

### 🟢 Persona A — Priya (Student turning salaried)
- Age archetype: 23, recent graduate
- Income: ₹28,000/month (new job, 6 months)
- Payment behaviour: Excellent (100% utility/rent on time)
- CredX Score: ~720 | Risk Band: Low
- Narrative: Shows how alternative data gives credit access to someone with no CIBIL history

### 🟡 Persona B — Ravi (Gig Worker)
- Age archetype: 29, freelance developer
- Income: ₹45,000/month average but high volatility (±40%)
- Payment behaviour: Good but 2-3 late payments
- CredX Score: ~620 | Risk Band: Medium
- Narrative: Shows how income volatility is captured and explained

### 🔴 Persona C — Meena (High volatility)
- Age archetype: 35, small street vendor
- Income: ₹12,000/month, highly inconsistent
- Payment behaviour: Multiple failed payments
- CredX Score: ~430 | Risk Band: High
- Narrative: Shows how the system handles high-risk profiles honestly

---

## Recommended Demo Flow (5 minutes)

### Step 1: Product Introduction (30 seconds)
> "CredX is an alternative credit-health platform for people who don't have a CIBIL score yet — students, gig workers, first-time borrowers. Instead of bureau data, we use signals like payment consistency, income stability, and digital transaction patterns."

### Step 2: Load Persona A — Priya (1 minute)
- Show the **main dashboard**
- Point out: CredX Score (720), Risk Band badge (Low), sub-scores
- "Priya has no CIBIL history, but her utility payments and digital behaviour show she's a responsible borrower."

### Step 3: Explain Panel (45 seconds)
- Scroll to the "Why is my score this way?" section
- Point out the SHAP contributor bars
- "The model explains exactly what drove this score — utility payment consistency is helping her most. Late payments on rent in months 3–4 are slightly hurting her."

### Step 4: AI Credit Copilot (1 minute)
- Switch to Copilot panel
- Ask: **"What is hurting my score most?"**
- Show the natural-language response
- "This is Gemini Flash explaining what the XGBoost model's SHAP values mean in plain English. The LLM is explaining the model — it is not making the credit decision."

### Step 5: Simulator (1 minute)
- Switch to Persona B (Ravi) for contrast
- Open the Simulator panel
- Change income from ₹45,000 → ₹60,000 and volatility from 40% → 15%
- Show the new score animating up
- "The model reruns with the new inputs. The score changes. The LLM then explains the delta. At no point does the LLM invent the number."

### Step 6: Improvement Plan (30 seconds)
- Show the "Improve" section
- Point out the top 3 recommendations with evidence-based framing
- "We never say 'do X and your score increases by 30 points.' We say 'the simulation estimates that...' because that is honest."

### Step 7: Technical Architecture (optional, for tech judges, 30 seconds)
- Show the architecture diagram or briefly explain:
  > "XGBoost → SHAP → Gemini Flash → Pydantic validation. If Gemini fails, a deterministic fallback kicks in automatically. The LLM never touches the credit decision."

---

## Key Talking Points for Judges

| Point | Message |
|---|---|
| Alternative data | "No CIBIL needed. We use payment consistency, income stability, digital activity." |
| Explainability | "SHAP provides feature-level explanations. Gemini translates them to English." |
| Responsible AI | "The LLM explains the model. It never makes the credit decision." |
| Product safety | "Every score is labeled as an estimate. We never guarantee approval." |
| Technical depth | "XGBoost + SHAP + Gemini Flash + FastAPI + Next.js — production-ready stack." |
| User-centricity | "Built for students, gig workers, first-time borrowers." |

---

## Backup Plan

If Gemini API is unavailable during demo:
- The deterministic fallback explanation activates automatically
- The demo continues without interruption
- Point out: "This is by design — the product never depends solely on an external LLM."

---

*This document will be updated with actual screenshot URLs and demo video link after UI implementation.*

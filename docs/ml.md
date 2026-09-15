# CredX — ML Methodology Document

**Product:** CredX
**Last Updated:** 2026-09-15

---

## 1. Problem Framing

CredX frames credit scoring as a **binary classification** problem:
- **Class 1** → Creditworthy (would repay)
- **Class 0** → Non-creditworthy (higher default risk)

The model output is a **probability** (0.0–1.0) that is then mapped to the CredX score scale (300–900) and a risk band.

This is a deliberate choice over regression because:
- Classification metrics (F1, ROC-AUC) are more robust to class imbalance
- SHAP explanations for classification are directionally intuitive (each feature pushes toward "creditworthy" or away)
- Industry standard for credit risk modelling

---

## 2. Feature Engineering

### 2.1 Feature Groups

All features use only alternative, consent-oriented signals. No bureau data. No demographic data.

#### Payment Behaviour (4 features)
| Feature | Description | Range |
|---|---|---|
| `utility_payment_consistency` | % of months with on-time utility payments | 0.0–1.0 |
| `rent_payment_consistency` | % of months with on-time rent/EMI payments | 0.0–1.0 |
| `avg_payment_delay_days` | Average days late on payments | 0–90 |
| `failed_payment_frequency` | Failed / bounced payments per year | 0–24 |

#### Income Stability (4 features)
| Feature | Description | Range |
|---|---|---|
| `avg_monthly_income` | Mean monthly income (INR) | 5000–500000 |
| `income_volatility` | CV of monthly income | 0.0–1.5 |
| `income_consistency` | % of months with income > 0 | 0.0–1.0 |
| `income_trend` | Direction of income change over 6 months | -1.0–+1.0 |

#### Transaction Behaviour (5 features)
| Feature | Description | Range |
|---|---|---|
| `transaction_success_rate` | % of attempted transactions that succeeded | 0.0–1.0 |
| `spending_volatility` | CV of monthly spending | 0.0–2.0 |
| `recurring_payment_count` | Count of regular subscriptions/EMIs paid | 0–20 |
| `essential_spending_ratio` | Ratio of essential to total spending | 0.0–1.0 |
| `avg_monthly_transactions` | Average number of transactions per month | 0–500 |

#### Digital / Telecom Behaviour (3 features)
| Feature | Description | Range |
|---|---|---|
| `mobile_recharge_regularity` | % of months with consistent mobile recharge | 0.0–1.0 |
| `digital_transaction_consistency` | % of months with regular digital payments | 0.0–1.0 |
| `months_of_digital_activity` | Total months of digital transaction history | 1–60 |

**Total features: 16**

### 2.2 Derived Features (computed from above)
| Feature | Formula |
|---|---|
| `income_to_spending_ratio` | avg_monthly_income / avg_monthly_spending (proxy) |
| `payment_reliability_score` | weighted avg of payment features |
| `digital_engagement_score` | weighted avg of digital features |

### 2.3 Features Explicitly Excluded

The following are explicitly not included:
- Age, gender, caste, religion, region (protected characteristics)
- Aadhaar number, PAN, phone number
- Social media activity or web browsing data
- Location tracking data
- Employer name or company size (proxy for class)

---

## 3. Model Architecture

### 3.1 Primary Model: XGBoost Classifier

```python
XGBClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=<computed from class ratio>,
    random_state=42
)
```

**Hyperparameter rationale:**
- `n_estimators=200`: Sufficient for synthetic dataset without overfitting
- `max_depth=4`: Controls model complexity; prevents overfitting on small dataset
- `scale_pos_weight`: Handles class imbalance (if creditworthy class is underrepresented)
- `random_state=42`: Reproducibility

### 3.2 Baseline: Random Forest Classifier

```python
RandomForestClassifier(
    n_estimators=100,
    max_depth=6,
    random_state=42
)
```

Used for comparison to validate XGBoost performance.

---

## 4. Evaluation Protocol

### 4.1 Data Split
- 80% training / 20% test
- Stratified split to preserve class ratio
- No data leakage (feature engineering computed on training set, applied to test set)

### 4.2 Metrics

| Metric | Rationale |
|---|---|
| Accuracy | Overall correctness |
| Precision | Correctly identified creditworthy users / all predicted creditworthy |
| Recall | Correctly identified creditworthy users / all actual creditworthy |
| F1 Score | Harmonic mean; robust to imbalance |
| ROC-AUC | Discriminative ability across all thresholds; primary metric |
| Confusion Matrix | Visual breakdown of TP/FP/TN/FN |

### 4.3 Target Performance (on synthetic data)

| Metric | Target |
|---|---|
| ROC-AUC | > 0.85 |
| F1 Score | > 0.80 |
| Accuracy | > 0.80 |

These targets are achievable on well-constructed synthetic data. If targets are not met, the data generation or feature engineering will be revisited before moving to the API layer.

---

## 5. SHAP Explainability

### 5.1 Explainer Type
`shap.TreeExplainer` — used because XGBoost is a tree-based model. TreeExplainer provides exact Shapley values (not approximate) and runs in milliseconds.

### 5.2 SHAP Output Structure

For each prediction, we extract:
```python
{
  "top_positive_contributors": [
    {"feature": "utility_payment_consistency", "shap_value": 0.42, "feature_value": 0.95},
    ...
  ],
  "top_negative_contributors": [
    {"feature": "avg_payment_delay_days", "shap_value": -0.38, "feature_value": 12},
    ...
  ],
  "base_value": 0.52  # model's prior probability
}
```

### 5.3 SHAP → Sub-score Derivation

Sub-scores (Income Stability, Payment Reliability, Digital Behaviour) are derived by:
1. Grouping features by category
2. Computing the sum of absolute SHAP values in each group as the "importance weight"
3. Scaling to 300–900 based on the net direction of those features

This ensures sub-scores are directly grounded in the model's explanation, not invented independently.

---

## 6. Score Mapping

```python
credx_score = round(300 + model_probability * 600)
# model_probability from model.predict_proba(X)[0][1]
# Clamp to [300, 900]
credx_score = max(300, min(900, credx_score))
```

---

## 7. Risk Band Classification

```python
if credx_score >= 700:
    risk_band = "Low"
elif credx_score >= 550:
    risk_band = "Medium"
else:
    risk_band = "High"
```

---

## 8. Approval Likelihood

The raw `model_probability` (0.0–1.0) is used directly as the approval likelihood estimate, rounded to 1 decimal place as a percentage.

**Important:** This is labeled in the UI as "Estimated Approval Likelihood" with a mandatory disclaimer: "This is a model estimate only and does not constitute a guaranteed loan approval decision."

---

## 9. Model Persistence

The trained model is serialized using `joblib`:
```python
joblib.dump(model, 'ml/artifacts/model.pkl')
joblib.dump(scaler, 'ml/artifacts/scaler.pkl')
```

Loaded once at FastAPI startup to minimize inference latency.

---

## 10. Test Personas

Three test personas used for validation:

### Persona A — Stable Financial Profile
- High income consistency, low volatility
- Perfect utility/rent payment record
- High digital activity
- Expected score: 750–850 (Low Risk)

### Persona B — Thin-file / Gig Worker
- Irregular income (high volatility)
- Short history (6–12 months)
- Good payment record but inconsistent income
- Expected score: 580–660 (Medium Risk)

### Persona C — High Financial Volatility
- High payment delays
- Multiple failed payments
- Low income consistency
- Expected score: 350–500 (High Risk)

---

*This document will be updated with actual training results, confusion matrix, and ROC-AUC plots after Phase 3 (model training).*

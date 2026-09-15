"""
CredX - Explainable AI Engine (SHAP)
Provides:
1. Global feature importances
2. Local applicant explanation via TreeExplainer
3. Positive factors (strengths that improve score / reduce default risk)
4. Negative factors (vulnerabilities that hurt score / increase default risk)
5. Humanized financial behavior explanations
"""

import os
import pickle
import numpy as np
import pandas as pd
import shap

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))

# Friendly labels and positive/negative descriptions for features
FEATURE_DICTIONARY = {
    "income_stability_score": {
        "title": "Income Consistency",
        "positive": "Stable, predictable earnings across months with low volatility",
        "negative": "Fluctuating month-to-month earnings increase repayment risk"
    },
    "payment_reliability_score": {
        "title": "Payment Discipline",
        "positive": "Outstanding track record of on-time utility and rent payments",
        "negative": "Missed or late bill payments in recent months"
    },
    "utility_payment_rate": {
        "title": "Utility Bill Payments",
        "positive": "Regular, full settlement of electricity and utility bills",
        "negative": "Significant portion of utility bills remaining unpaid"
    },
    "rent_reliability_rate": {
        "title": "Rent Payment Track Record",
        "positive": "Consistent on-time rental payments demonstrating residential discipline",
        "negative": "Rental delay history indicating potential liquidity pressure"
    },
    "digital_trust_score": {
        "title": "Digital Financial Footprint",
        "positive": "High digital transaction trust score across UPI and digital channels",
        "negative": "Minimal digital transaction history or inactive UPI presence"
    },
    "mobile_years": {
        "title": "Telecom Stability",
        "positive": "Long-standing mobile number ownership showing life stability",
        "negative": "Recently changed or newly acquired mobile number"
    },
    "avg_income": {
        "title": "Monthly Earning Power",
        "positive": "Healthy average monthly earnings adequate for requested loan size",
        "negative": "Average income is tight relative to debt obligations"
    },
    "income_growth": {
        "title": "Income Growth Trend",
        "positive": "Positive upward trajectory in monthly earnings over the last 6 months",
        "negative": "Downward trend in monthly earnings over the recent 6-month cycle"
    },
    "months_at_current_job": {
        "title": "Employment Tenure",
        "positive": "Consistent tenure with current employer or gig platform",
        "negative": "Brief duration in current occupation or frequent gig shifts"
    },
    "num_income_sources": {
        "title": "Income Diversity",
        "positive": "Multiple diversified streams of income buffering unexpected shocks",
        "negative": "Reliance on a single precarious income stream"
    },
    "upi_transactions_per_month": {
        "title": "UPI Velocity",
        "positive": "Frequent active digital UPI payments reflecting regular cash flow",
        "negative": "Very low monthly UPI transaction count"
    },
    "upi_months_active": {
        "title": "UPI Account Age",
        "positive": "Mature UPI digital banking relationship over many active months",
        "negative": "Newly opened or infrequently utilized UPI account"
    },
    "recharge_frequency_per_month": {
        "title": "Mobile Recharge Habits",
        "positive": "Consistent and regular mobile recharge patterns",
        "negative": "Irregular mobile recharges with extended lapse periods"
    },
    "loan_amount_requested": {
        "title": "Requested Loan Amount",
        "positive": "Conservative, well-calibrated loan request proportional to income",
        "negative": "High loan amount relative to verifiable monthly cash flow"
    },
    "loan_tenure_months": {
        "title": "Repayment Horizon",
        "positive": "Manageable repayment tenure suited to expected debt burden",
        "negative": "Extended loan tenure compounding total interest exposure"
    }
}


class CredXExplainer:
    def __init__(self, models_dir: str = MODELS_DIR):
        self.models_dir = models_dir
        self.model = None
        self.all_feature_columns = None
        self.explainer = None
        self._load_explainer()

    def _load_explainer(self):
        with open(os.path.join(self.models_dir, "xgboost_model.pkl"), "rb") as f:
            self.model = pickle.load(f)
        with open(os.path.join(self.models_dir, "feature_columns.pkl"), "rb") as f:
            self.all_feature_columns = pickle.load(f)

        bg_path = os.path.join(self.models_dir, "shap_background.pkl")
        background = None
        if os.path.exists(bg_path):
            with open(bg_path, "rb") as f:
                background = pickle.load(f)

        # Initialize TreeExplainer for XGBoost
        self.explainer = shap.TreeExplainer(self.model, data=background)

    def explain_applicant(self, feature_matrix: np.ndarray, top_k: int = 5) -> dict:
        """
        Compute SHAP values for an applicant and categorize into:
        1. Top Strengths (reduces default probability)
        2. Top Vulnerabilities (increases default probability)
        3. Force breakdown list for charting
        """
        # SHAP returns log-odds or probabilities depending on model objective
        shap_values = self.explainer.shap_values(feature_matrix)
        
        # If shape is (1, n_features) or 1D
        if isinstance(shap_values, list):
            vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        elif len(shap_values.shape) == 2:
            vals = shap_values[0]
        else:
            vals = shap_values

        base_value = float(self.explainer.expected_value) if hasattr(self.explainer.expected_value, "__float__") else float(self.explainer.expected_value[0])

        factor_impacts = []
        for col_name, shap_val in zip(self.all_feature_columns, vals):
            # Clean up one-hot encoded names e.g., 'borrower_type_gig' -> 'borrower_type'
            base_col = col_name.split("_")[0] if ("_" in col_name and not col_name.startswith("income_") and not col_name.startswith("utility_") and not col_name.startswith("rent_") and not col_name.startswith("payment_") and not col_name.startswith("digital_") and not col_name.startswith("mobile_") and not col_name.startswith("upi_") and not col_name.startswith("avg_") and not col_name.startswith("loan_")) else col_name
            meta = FEATURE_DICTIONARY.get(col_name, FEATURE_DICTIONARY.get(base_col, {
                "title": col_name.replace("_", " ").title(),
                "positive": f"Positive contribution from {col_name.replace('_', ' ')}",
                "negative": f"Unfavorable contribution from {col_name.replace('_', ' ')}"
            }))

            # Note: Negative SHAP value in default prediction REDUCES default risk = STRENGTH!
            # Positive SHAP value INCREASES default risk = HURTING SCORE!
            is_strength = shap_val < 0
            factor_impacts.append({
                "feature": col_name,
                "title": meta["title"],
                "shap_value": round(float(shap_val), 4),
                "impact_score": round(abs(float(shap_val)) * 100, 2),
                "is_strength": bool(is_strength),
                "description": meta["positive"] if is_strength else meta["negative"]
            })

        # Sort factors
        # Strengths: most negative SHAP values first (largest risk reduction)
        strengths = sorted([f for f in factor_impacts if f["is_strength"]], key=lambda x: x["shap_value"])[:top_k]
        
        # Weaknesses: most positive SHAP values first (largest risk increase)
        weaknesses = sorted([f for f in factor_impacts if not f["is_strength"]], key=lambda x: x["shap_value"], reverse=True)[:top_k]

        # Top factors for interactive waterfall / bar chart
        all_sorted = sorted(factor_impacts, key=lambda x: abs(x["shap_value"]), reverse=True)[:10]

        return {
            "base_value": round(base_value, 4),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "top_factors_chart": all_sorted
        }

    def get_global_feature_importance(self, top_n: int = 15) -> list[dict]:
        """Extract global feature importances from XGBoost model."""
        importances = self.model.feature_importances_
        sorted_indices = np.argsort(importances)[::-1][:top_n]
        
        global_factors = []
        for idx in sorted_indices:
            col = self.all_feature_columns[idx]
            meta = FEATURE_DICTIONARY.get(col, {
                "title": col.replace("_", " ").title()
            })
            global_factors.append({
                "feature": col,
                "title": meta.get("title", col),
                "importance": round(float(importances[idx]), 4),
                "importance_pct": round(float(importances[idx]) * 100.0, 2)
            })
        return global_factors


_explainer_instance = None


def get_explainer() -> CredXExplainer:
    """Singleton getter for CredXExplainer."""
    global _explainer_instance
    if _explainer_instance is None:
        _explainer_instance = CredXExplainer()
    return _explainer_instance

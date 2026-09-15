"""
CredX - Prediction & Scoring Engine
Computes:
1. default_probability (via XGBoost predict_proba)
2. Alternate Credit Score = 300 + ((1 - default_probability) * 600) [Range: 300-900]
3. Risk Band: Low (<0.30), Medium (0.30-0.60), High (>=0.60)
4. Approval Probability = (1 - default_probability) * 100
5. Loan Readiness Meter = Approval Probability
"""

import os
import pickle
import json
import pandas as pd
import numpy as np

from src.preprocessing.clean import clean_dataset
from src.feature_engineering.engineer import compute_engineered_features

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models"))


class CredXScorer:
    def __init__(self, models_dir: str = MODELS_DIR):
        self.models_dir = models_dir
        self.model = None
        self.scaler = None
        self.encoder = None
        self.all_feature_columns = None
        self.categorical_cols = None
        self.numerical_cols = None
        self.trust_bounds = None
        self._load_artifacts()

    def _load_artifacts(self):
        """Load trained model, scaler, encoder, feature definitions and digital trust bounds."""
        with open(os.path.join(self.models_dir, "xgboost_model.pkl"), "rb") as f:
            self.model = pickle.load(f)
        with open(os.path.join(self.models_dir, "scaler.pkl"), "rb") as f:
            self.scaler = pickle.load(f)
        with open(os.path.join(self.models_dir, "encoder.pkl"), "rb") as f:
            self.encoder = pickle.load(f)
        with open(os.path.join(self.models_dir, "feature_columns.pkl"), "rb") as f:
            self.all_feature_columns = pickle.load(f)

        meta_path = os.path.join(self.models_dir, "columns_metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                meta = json.load(f)
                self.categorical_cols = meta["categorical_cols"]
                self.numerical_cols = meta["numerical_cols"]

        bounds_path = os.path.join(self.models_dir, "digital_trust_bounds.json")
        if os.path.exists(bounds_path):
            with open(bounds_path, "r") as f:
                self.trust_bounds = json.load(f)

    def prepare_applicant_dataframe(self, raw_input: dict | pd.DataFrame) -> tuple[pd.DataFrame, np.ndarray]:
        """Convert single or batch dictionary input into processed feature matrix."""
        if isinstance(raw_input, dict):
            df_raw = pd.DataFrame([raw_input])
        else:
            df_raw = raw_input.copy()

        # Step 1: Clean missing values / types
        df_clean = clean_dataset(df_raw, verbose=False)

        # Step 2: Compute engineered features
        df_feat, _ = compute_engineered_features(
            df_clean, bounds=self.trust_bounds, fit_bounds=False, verbose=False
        )

        # Step 3: Transform features
        encoded_cats = self.encoder.transform(df_feat[self.categorical_cols])
        scaled_nums = self.scaler.transform(df_feat[self.numerical_cols])
        feature_matrix = np.hstack([scaled_nums, encoded_cats])

        return df_feat, feature_matrix

    def score_applicant(self, raw_input: dict | pd.DataFrame) -> dict:
        """
        Generate comprehensive credit assessment:
        Credit score, risk band, default probability, approval probability, and loan readiness.
        """
        df_feat, feature_matrix = self.prepare_applicant_dataframe(raw_input)
        proba = self.model.predict_proba(feature_matrix)[:, 1]
        default_prob = float(proba[0])

        # Alternate Credit Score Formula: 300 + ((1 - default_probability) * 600)
        credit_score = int(round(300.0 + ((1.0 - default_prob) * 600.0)))
        credit_score = max(300, min(900, credit_score))

        # Risk Band
        if default_prob < 0.30:
            risk_band = "Low Risk"
            risk_color = "emerald"
            recommendation = "Eligible for instant approval and prime interest rates."
        elif default_prob < 0.60:
            risk_band = "Medium Risk"
            risk_color = "amber"
            recommendation = "Eligible with alternative collateral or credit-building terms."
        else:
            risk_band = "High Risk"
            risk_color = "rose"
            recommendation = "Needs improvement on payment discipline and income stability."

        # Approval Probability & Loan Readiness Meter
        approval_prob = round((1.0 - default_prob) * 100.0, 1)
        loan_readiness = approval_prob

        # Extract 3 core behavioral pillar scores for radar/dashboards
        pillars = {
            "income_stability_score": round(float(df_feat["income_stability_score"].iloc[0]), 1),
            "payment_reliability_score": round(float(df_feat["payment_reliability_score"].iloc[0]), 1),
            "digital_trust_score": round(float(df_feat["digital_trust_score"].iloc[0]), 1),
            "utility_payment_rate": round(float(df_feat["utility_payment_rate"].iloc[0] * 100), 1),
            "rent_reliability_rate": round(float(df_feat["rent_reliability_rate"].iloc[0] * 100), 1),
            "avg_income": round(float(df_feat["avg_income"].iloc[0]), 2),
            "income_growth": round(float(df_feat["income_growth"].iloc[0]), 1),
            "mobile_years": round(float(df_feat["mobile_years"].iloc[0]), 1)
        }

        return {
            "default_probability": round(default_prob, 4),
            "credit_score": credit_score,
            "risk_band": risk_band,
            "risk_color": risk_color,
            "approval_probability": approval_prob,
            "loan_readiness": loan_readiness,
            "recommendation": recommendation,
            "pillars": pillars,
            "engineered_features": df_feat.iloc[0].to_dict(),
            "feature_matrix": feature_matrix
        }


_scorer_instance = None


def get_scorer() -> CredXScorer:
    """Singleton getter for CredXScorer."""
    global _scorer_instance
    if _scorer_instance is None:
        _scorer_instance = CredXScorer()
    return _scorer_instance

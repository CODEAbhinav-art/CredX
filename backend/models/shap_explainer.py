"""
CredX — SHAP Explainer Wrapper
Computes SHAP values using TreeExplainer and structures them
into typed SHAPContributor objects for the API response.
"""

from __future__ import annotations
import shap
import numpy as np
from backend.models.schemas import SHAPContributor, SubScores
from backend.utils.feature_engineering import (
    FEATURE_NAMES,
    get_feature_label,
    is_inverted,
)
from backend.utils.score_mapper import sub_score_from_shap_group

# Feature group definitions for sub-score derivation
PAYMENT_FEATURES = [
    "utility_payment_consistency",
    "rent_payment_consistency",
    "avg_payment_delay_days",
    "failed_payment_frequency",
]
INCOME_FEATURES = [
    "avg_monthly_income",
    "income_volatility",
    "income_consistency",
    "income_trend",
]
DIGITAL_FEATURES = [
    "transaction_success_rate",
    "spending_volatility",
    "recurring_payment_count",
    "essential_spending_ratio",
    "avg_monthly_transactions",
    "mobile_recharge_regularity",
    "digital_transaction_consistency",
    "months_of_digital_activity",
]


class SHAPExplainer:
    """
    Wraps shap.TreeExplainer to provide structured explanations.
    Uses exact SHAP values (not approximate) for tree models.
    """

    def __init__(self) -> None:
        self._explainer = None

    def initialize(self, model) -> None:
        """Initialize TreeExplainer with the loaded XGBoost model."""
        self._explainer = shap.TreeExplainer(model)

    def explain(
        self,
        X: np.ndarray,
        feature_values: dict[str, float],
        base_probability: float,
        top_n: int = 5,
    ) -> tuple[list[SHAPContributor], list[SHAPContributor], float, SubScores]:
        """
        Compute SHAP values and return structured contributors + sub-scores.

        Returns:
            (top_positive, top_negative, base_shap_value, sub_scores)
        """
        if self._explainer is None:
            raise RuntimeError("SHAPExplainer not initialized.")

        # Compute SHAP values — shape (1, n_features)
        shap_values = self._explainer.shap_values(X)

        # For XGBoost binary classifier, shap_values may be 2D or 3D
        if isinstance(shap_values, list):
            # list of arrays → take class 1
            sv = shap_values[1][0]
        else:
            sv = shap_values[0]

        base_val = float(self._explainer.expected_value)
        if isinstance(base_val, (list, np.ndarray)):
            base_val = float(base_val[1] if len(base_val) > 1 else base_val[0])

        # Build contributor list
        contributors: list[SHAPContributor] = []
        for i, feat in enumerate(FEATURE_NAMES):
            sv_i = float(sv[i])
            fv = feature_values.get(feat, X[0][i])
            contributors.append(
                SHAPContributor(
                    feature=feat,
                    feature_label=get_feature_label(feat),
                    shap_value=sv_i,
                    feature_value=float(fv),
                    impact_direction="positive" if sv_i >= 0 else "negative",
                )
            )

        # Sort by absolute SHAP value descending
        sorted_contributors = sorted(contributors, key=lambda c: abs(c.shap_value), reverse=True)

        positives = [c for c in sorted_contributors if c.shap_value > 0][:top_n]
        negatives = [c for c in sorted_contributors if c.shap_value < 0][:top_n]

        # Compute sub-scores from grouped SHAP values
        def group_shap(features: list[str]) -> list[float]:
            return [sv[FEATURE_NAMES.index(f)] for f in features if f in FEATURE_NAMES]

        sub_scores = SubScores(
            income_stability=sub_score_from_shap_group(group_shap(INCOME_FEATURES), base_probability),
            payment_reliability=sub_score_from_shap_group(group_shap(PAYMENT_FEATURES), base_probability),
            digital_behaviour=sub_score_from_shap_group(group_shap(DIGITAL_FEATURES), base_probability),
        )

        return positives, negatives, base_val, sub_scores


# Singleton
shap_explainer = SHAPExplainer()

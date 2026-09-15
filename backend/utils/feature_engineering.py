"""
CredX — Feature Engineering
Transforms raw ScoreRequest fields into the normalized feature vector
that the ML model was trained on.
"""

from __future__ import annotations
import numpy as np
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.models.schemas import ScoreRequest


# Ordered feature list — MUST match training order exactly.
# This list is the single source of truth for feature ordering.
FEATURE_NAMES = [
    "utility_payment_consistency",
    "rent_payment_consistency",
    "avg_payment_delay_days",
    "failed_payment_frequency",
    "avg_monthly_income",
    "income_volatility",
    "income_consistency",
    "income_trend",
    "transaction_success_rate",
    "spending_volatility",
    "recurring_payment_count",
    "essential_spending_ratio",
    "avg_monthly_transactions",
    "mobile_recharge_regularity",
    "digital_transaction_consistency",
    "months_of_digital_activity",
]

# Human-readable labels for display in the UI
FEATURE_LABELS: dict[str, str] = {
    "utility_payment_consistency": "Utility Payment Consistency",
    "rent_payment_consistency": "Rent/EMI Payment Consistency",
    "avg_payment_delay_days": "Average Payment Delay",
    "failed_payment_frequency": "Failed Payment Frequency",
    "avg_monthly_income": "Average Monthly Income",
    "income_volatility": "Income Volatility",
    "income_consistency": "Income Consistency",
    "income_trend": "Income Trend",
    "transaction_success_rate": "Transaction Success Rate",
    "spending_volatility": "Spending Volatility",
    "recurring_payment_count": "Recurring Payment Count",
    "essential_spending_ratio": "Essential Spending Ratio",
    "avg_monthly_transactions": "Monthly Transaction Volume",
    "mobile_recharge_regularity": "Mobile Recharge Regularity",
    "digital_transaction_consistency": "Digital Transaction Consistency",
    "months_of_digital_activity": "Digital Activity History",
}

# Features where a HIGHER value hurts the score (inverted)
INVERTED_FEATURES = {
    "avg_payment_delay_days",
    "failed_payment_frequency",
    "income_volatility",
    "spending_volatility",
}


def request_to_feature_vector(request: "ScoreRequest") -> np.ndarray:
    """
    Convert a ScoreRequest into an ordered numpy array matching FEATURE_NAMES.
    Returns shape (1, n_features).
    """
    row = [getattr(request, feat) for feat in FEATURE_NAMES]
    return np.array([row], dtype=np.float64)


def get_feature_label(feature_name: str) -> str:
    return FEATURE_LABELS.get(feature_name, feature_name.replace("_", " ").title())


def is_inverted(feature_name: str) -> bool:
    """Returns True if higher feature value hurts the score."""
    return feature_name in INVERTED_FEATURES

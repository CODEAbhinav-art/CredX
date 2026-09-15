"""
CredX - Step 2: Feature Engineering Pipeline
Creates alternative financial behavior features:
1. avg_income
2. income_std
3. income_growth
4. income_stability_score
5. utility_payment_rate
6. rent_reliability_rate
7. payment_reliability_score
8. mobile_years
9. digital_trust_score
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime

CURRENT_YEAR = 2026

# Digital trust feature bounds for normalization (MinMax)
DEFAULT_MINMAX_BOUNDS = {
    "upi_transactions_per_month": {"min": 0.0, "max": 150.0},
    "upi_months_active": {"min": 0.0, "max": 36.0},
    "mobile_years": {"min": 0.0, "max": 15.0},
    "mobile_wallet_used": {"min": 0.0, "max": 1.0},
    "recharge_frequency_per_month": {"min": 0.0, "max": 5.0}
}


def compute_engineered_features(
    df: pd.DataFrame,
    bounds: dict = None,
    fit_bounds: bool = False,
    verbose: bool = True
) -> tuple[pd.DataFrame, dict]:
    """
    Compute all 9 alternative credit features specified in requirements.
    """
    df_feat = df.copy()

    # 1. Average Income: average of income_month_1 through income_month_6
    income_cols = [f"income_month_{i}" for i in range(1, 7)]
    df_feat["avg_income"] = df_feat[income_cols].mean(axis=1)

    # 2. Income Standard Deviation
    df_feat["income_std"] = df_feat[income_cols].std(axis=1).fillna(0.0)

    # 3. Income Growth: ((income_month_6 - income_month_1) / income_month_1) * 100
    denom = df_feat["income_month_1"].replace(0, np.nan)
    df_feat["income_growth"] = (((df_feat["income_month_6"] - df_feat["income_month_1"]) / denom) * 100).fillna(0.0)
    # Clip extreme percentages to [-100, 300] to prevent unbounded outliers
    df_feat["income_growth"] = df_feat["income_growth"].clip(lower=-100.0, upper=300.0)

    # 4. Income Stability Score: 100 * (1 - (income_std / avg_income)), clipped between 0 and 100
    avg_inc_safe = df_feat["avg_income"].replace(0, np.nan)
    cov = (df_feat["income_std"] / avg_inc_safe).fillna(1.0)
    df_feat["income_stability_score"] = (100.0 * (1.0 - cov)).clip(lower=0.0, upper=100.0)

    # 5. Utility Payment Rate: utility_bills_paid / utility_bills_total
    util_total_safe = df_feat["utility_bills_total"].replace(0, np.nan)
    df_feat["utility_payment_rate"] = (df_feat["utility_bills_paid"] / util_total_safe).fillna(1.0).clip(lower=0.0, upper=1.0)

    # 6. Rent Reliability Rate: rent_paid_on_time_months / total_rental_months
    # If not renting (total_rental_months == 0), defaults to utility_payment_rate or 1.0
    rent_total = df_feat["total_rental_months"].fillna(0.0)
    is_renter = rent_total > 0
    df_feat["rent_reliability_rate"] = np.where(
        is_renter,
        (df_feat["rent_paid_on_time_months"] / rent_total).fillna(1.0).clip(lower=0.0, upper=1.0),
        df_feat["utility_payment_rate"]  # Non-renters inherit their utility payment discipline
    )

    # 7. Payment Reliability Score: 50% utility payment rate + 50% rent reliability rate, scaled to 0-100
    df_feat["payment_reliability_score"] = (
        (0.50 * df_feat["utility_payment_rate"] + 0.50 * df_feat["rent_reliability_rate"]) * 100.0
    ).clip(lower=0.0, upper=100.0)

    # 8. Mobile Stability: current_year - same_number_since_year
    df_feat["mobile_years"] = (CURRENT_YEAR - df_feat["same_number_since_year"]).clip(lower=0.0, upper=30.0)

    # 9. Digital Trust Score: MinMax normalization of 5 components
    # 0.30 * UPI Tx + 0.25 * UPI Months + 0.20 * Mobile Stability + 0.15 * Wallet + 0.10 * Recharge
    active_bounds = dict(DEFAULT_MINMAX_BOUNDS)
    if fit_bounds:
        for k in active_bounds.keys():
            if k in df_feat.columns:
                q99 = float(df_feat[k].quantile(0.99))
                min_v = float(df_feat[k].min())
                max_v = max(min_v + 1.0, q99)
                active_bounds[k] = {"min": min_v, "max": max_v}
    elif bounds:
        active_bounds = bounds

    def minmax_scale(series: pd.Series, key: str) -> pd.Series:
        b = active_bounds[key]
        min_v, max_v = b["min"], b["max"]
        if max_v <= min_v:
            return pd.Series(0.0, index=series.index)
        return ((series - min_v) / (max_v - min_v)).clip(lower=0.0, upper=1.0) * 100.0

    score_upi_tx = minmax_scale(df_feat["upi_transactions_per_month"], "upi_transactions_per_month")
    score_upi_months = minmax_scale(df_feat["upi_months_active"], "upi_months_active")
    score_mobile_yrs = minmax_scale(df_feat["mobile_years"], "mobile_years")
    score_wallet = minmax_scale(df_feat["mobile_wallet_used"], "mobile_wallet_used")
    score_recharge = minmax_scale(df_feat["recharge_frequency_per_month"], "recharge_frequency_per_month")

    df_feat["digital_trust_score"] = (
        0.30 * score_upi_tx +
        0.25 * score_upi_months +
        0.20 * score_mobile_yrs +
        0.15 * score_wallet +
        0.10 * score_recharge
    ).clip(lower=0.0, upper=100.0)

    if verbose:
        print("Engineered Features Summary:")
        print(df_feat[[
            "avg_income", "income_std", "income_growth",
            "income_stability_score", "utility_payment_rate",
            "rent_reliability_rate", "payment_reliability_score",
            "mobile_years", "digital_trust_score"
        ]].describe().T[["mean", "std", "min", "50%", "max"]])

    return df_feat, active_bounds


def run_pipeline(input_path: str = None, output_path: str = None) -> pd.DataFrame:
    """Execute Step 2 Feature Engineering and save featured_dataset.csv."""
    if input_path is None:
        input_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "cleaned_dataset.csv")
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "featured_dataset.csv")

    input_path = os.path.abspath(input_path)
    output_path = os.path.abspath(output_path)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    df_clean = pd.read_csv(input_path)
    print(f"Loaded cleaned dataset from: {input_path}. Shape: {df_clean.shape}")

    df_featured, bounds = compute_engineered_features(df_clean, fit_bounds=True, verbose=True)
    df_featured.to_csv(output_path, index=False)
    print(f"Saved featured dataset to: {output_path}. Shape: {df_featured.shape}")

    # Save bounds to models/digital_trust_bounds.json
    bounds_path = os.path.join(os.path.dirname(__file__), "..", "..", "models", "digital_trust_bounds.json")
    os.makedirs(os.path.dirname(bounds_path), exist_ok=True)
    with open(bounds_path, "w") as f:
        json.dump(bounds, f, indent=2)
    print(f"Saved digital trust bounds to {bounds_path}")

    return df_featured


if __name__ == "__main__":
    run_pipeline()

"""
CredX — Synthetic Dataset Generator

Generates a realistic synthetic alternate credit dataset.
Design principles:
- All features have defensible product explanations
- No demographic or protected attributes
- Controlled noise so model AUC is realistic (target 0.85–0.95)
- Reproducible via fixed random seed
"""

import numpy as np
import pandas as pd
from pathlib import Path

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

RANDOM_SEED = 42
N_SAMPLES = 1000
OUTPUT_PATH = Path(__file__).parent / "synthetic_dataset.csv"

np.random.seed(RANDOM_SEED)


def generate_dataset(n_samples: int = N_SAMPLES) -> pd.DataFrame:
    """
    Generate synthetic alternate credit dataset.

    Label (creditworthy = 1) is derived from a weighted combination
    of the features with controlled noise. This reflects real-world
    credit risk relationships without using any real data.
    """

    # ── Payment Behaviour ──────────────────────────────────────────
    utility_payment_consistency = np.clip(np.random.beta(5, 2, n_samples), 0, 1)
    rent_payment_consistency = np.clip(np.random.beta(5, 2, n_samples), 0, 1)
    avg_payment_delay_days = np.clip(np.random.exponential(5, n_samples), 0, 60)
    failed_payment_frequency = np.clip(np.random.exponential(1.5, n_samples), 0, 20)

    # ── Income Stability ───────────────────────────────────────────
    # Income distribution: mix of low-income (gig) and salaried profiles
    income_segments = np.random.choice([0, 1, 2], n_samples, p=[0.35, 0.45, 0.20])
    avg_monthly_income = np.where(
        income_segments == 0,
        np.random.lognormal(np.log(15000), 0.4, n_samples),
        np.where(
            income_segments == 1,
            np.random.lognormal(np.log(40000), 0.3, n_samples),
            np.random.lognormal(np.log(100000), 0.4, n_samples),
        )
    )
    avg_monthly_income = np.clip(avg_monthly_income, 5000, 500000)

    # Gig workers have higher volatility
    income_volatility = np.clip(
        np.where(income_segments == 0,
                 np.random.beta(2, 3, n_samples) * 1.2,
                 np.random.beta(2, 6, n_samples) * 0.5),
        0, 1.5
    )
    income_consistency = np.clip(np.random.beta(7, 2, n_samples), 0, 1)
    income_trend = np.clip(np.random.normal(0.1, 0.4, n_samples), -1, 1)

    # ── Transaction Behaviour ──────────────────────────────────────
    transaction_success_rate = np.clip(np.random.beta(9, 1.5, n_samples), 0, 1)
    spending_volatility = np.clip(np.random.beta(2, 5, n_samples) * 1.5, 0, 1.5)
    recurring_payment_count = np.clip(np.random.poisson(4, n_samples), 0, 20).astype(float)
    essential_spending_ratio = np.clip(np.random.beta(5, 3, n_samples), 0.2, 1.0)
    avg_monthly_transactions = np.clip(np.random.lognormal(3.5, 0.7, n_samples), 5, 500)

    # ── Digital/Telecom Behaviour ──────────────────────────────────
    mobile_recharge_regularity = np.clip(np.random.beta(6, 2, n_samples), 0, 1)
    digital_transaction_consistency = np.clip(np.random.beta(5, 2, n_samples), 0, 1)
    months_of_digital_activity = np.clip(
        np.random.exponential(18, n_samples), 1, 60
    ).astype(float)

    # ── Label Generation ──────────────────────────────────────────
    # Creditworthiness score (latent continuous variable before thresholding)
    # Positive signals
    latent = (
        1.5 * utility_payment_consistency
        + 1.5 * rent_payment_consistency
        + 1.2 * income_consistency
        + 1.0 * (income_trend + 1) / 2        # normalize to 0–1
        + 0.8 * transaction_success_rate
        + 0.6 * mobile_recharge_regularity
        + 0.6 * digital_transaction_consistency
        + 0.5 * essential_spending_ratio
        + 0.4 * np.log1p(avg_monthly_income) / np.log1p(500000)
        + 0.3 * np.log1p(months_of_digital_activity) / np.log1p(60)
        + 0.3 * np.log1p(recurring_payment_count) / np.log1p(20)
        + 0.2 * np.log1p(avg_monthly_transactions) / np.log1p(500)
    )

    # Negative signals (subtracted)
    latent -= (
        1.2 * (avg_payment_delay_days / 60)
        + 1.0 * (failed_payment_frequency / 20)
        + 0.8 * income_volatility
        + 0.6 * spending_volatility
    )

    # Add noise
    latent += np.random.normal(0, 0.5, n_samples)

    # Threshold: ~60% creditworthy (realistic)
    threshold = np.percentile(latent, 40)
    creditworthy = (latent > threshold).astype(int)

    # ── Assemble DataFrame ─────────────────────────────────────────
    df = pd.DataFrame({
        "utility_payment_consistency": utility_payment_consistency,
        "rent_payment_consistency": rent_payment_consistency,
        "avg_payment_delay_days": avg_payment_delay_days,
        "failed_payment_frequency": failed_payment_frequency,
        "avg_monthly_income": avg_monthly_income,
        "income_volatility": income_volatility,
        "income_consistency": income_consistency,
        "income_trend": income_trend,
        "transaction_success_rate": transaction_success_rate,
        "spending_volatility": spending_volatility,
        "recurring_payment_count": recurring_payment_count,
        "essential_spending_ratio": essential_spending_ratio,
        "avg_monthly_transactions": avg_monthly_transactions,
        "mobile_recharge_regularity": mobile_recharge_regularity,
        "digital_transaction_consistency": digital_transaction_consistency,
        "months_of_digital_activity": months_of_digital_activity,
        "creditworthy": creditworthy,
    })

    print(f"Dataset generated: {n_samples} samples")
    print(f"Class distribution: {df['creditworthy'].value_counts().to_dict()}")
    print(f"Creditworthy ratio: {df['creditworthy'].mean():.2%}")

    return df


if __name__ == "__main__":
    df = generate_dataset(N_SAMPLES)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nDataset saved to: {OUTPUT_PATH}")
    print(df.describe().round(3).to_string())

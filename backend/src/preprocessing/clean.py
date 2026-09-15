"""
CredX - Step 1: Data Cleaning Pipeline
Handles loading, summary, missing value imputation, duplicate removal,
datatype validation, and IQR-based outlier capping.
"""

import os
import pandas as pd
import numpy as np


def load_dataset(file_path: str = None) -> pd.DataFrame:
    """Load raw dataset from CSV."""
    if file_path is None:
        file_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw", "alternate_credit_dataset.csv")
    file_path = os.path.abspath(file_path)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Raw dataset not found at {file_path}")
    df = pd.read_csv(file_path)
    print(f"Loaded raw dataset from {file_path}. Shape: {df.shape}")
    return df


def dataset_summary(df: pd.DataFrame) -> dict:
    """Generate high-level dataset statistics."""
    summary = {
        "num_rows": int(df.shape[0]),
        "num_cols": int(df.shape[1]),
        "columns": df.columns.tolist(),
        "dtypes": {k: str(v) for k, v in df.dtypes.items()},
        "duplicates": int(df.duplicated().sum()),
        "duplicate_borrower_ids": int(df.duplicated(subset=["borrower_id"]).sum()),
        "missing_counts": df.isnull().sum()[df.isnull().sum() > 0].to_dict(),
        "target_distribution": df["defaulted"].value_counts(normalize=True).to_dict() if "defaulted" in df.columns else {}
    }
    return summary


def clean_dataset(df: pd.DataFrame, verbose: bool = True) -> pd.DataFrame:
    """
    Perform end-to-end data cleaning:
    1. Remove duplicates
    2. Datatype validation & conversions
    3. Missing value imputation
    4. IQR-based outlier capping on monetary/skewed metrics
    """
    df_clean = df.copy()

    # 1. Duplicate removal
    initial_len = len(df_clean)
    df_clean = df_clean.drop_duplicates()
    if "borrower_id" in df_clean.columns:
        df_clean = df_clean.drop_duplicates(subset=["borrower_id"])
    if verbose:
        print(f"Removed {initial_len - len(df_clean)} duplicate rows.")

    # 1.5. Dynamically bridge frontend summary metrics to raw columns if raw columns are not explicitly supplied
    if "utility_payment_consistency" in df_clean.columns and "utility_bills_paid" not in df_clean.columns:
        rate = float(df_clean["utility_payment_consistency"].iloc[0])
        df_clean["utility_bills_total"] = 24
        df_clean["utility_bills_paid"] = int(round(rate * 24))

    if "rent_payment_consistency" in df_clean.columns and "rent_paid_on_time_months" not in df_clean.columns:
        rate = float(df_clean["rent_payment_consistency"].iloc[0])
        df_clean["total_rental_months"] = 24
        df_clean["rent_paid_on_time_months"] = float(round(rate * 24))

    if "avg_monthly_transactions" in df_clean.columns and "upi_transactions_per_month" not in df_clean.columns:
        df_clean["upi_transactions_per_month"] = float(df_clean["avg_monthly_transactions"].iloc[0])

    if "months_of_digital_activity" in df_clean.columns and "upi_months_active" not in df_clean.columns:
        df_clean["upi_months_active"] = float(df_clean["months_of_digital_activity"].iloc[0])

    # Ensure standard raw columns exist with robust fallbacks
    default_columns = {
        "upi_transactions_per_month": 35.0,
        "upi_avg_transaction_amount": 1200.0,
        "upi_months_active": 12.0,
        "mobile_wallet_used": 1.0,
        "rent_paid_on_time_months": 16.0,
        "total_rental_months": 24.0,
        "same_number_since_year": 2020.0,
        "avg_monthly_recharge_amount": 399.0,
        "recharge_frequency_per_month": 2.0,
        "ecomm_orders_per_month": 5.0,
        "ecomm_return_rate": 0.05,
        "prepaid_orders_ratio": 0.70,
        "household_size": 2,
        "months_at_current_job": 12,
        "num_income_sources": 2,
        "utility_bills_paid": 16,
        "utility_bills_total": 24,
        "loan_amount_requested": 100000.0,
        "loan_purpose": "business",
        "loan_tenure_months": 24,
        "age": 28,
        "borrower_type": "gig",
        "employment_type": "self-employed",
        "state": "Maharashtra"
    }
    for col, default_val in default_columns.items():
        if col not in df_clean.columns:
            df_clean[col] = default_val

    # Populate income_month_1..6 if missing, reflecting income_volatility if present
    base_inc = 25000.0
    volatility = 0.1
    if "avg_monthly_income" in df_clean.columns:
        base_inc = float(df_clean["avg_monthly_income"].iloc[0])
    if "income_volatility" in df_clean.columns:
        volatility = float(df_clean["income_volatility"].iloc[0])

    for i in range(1, 7):
        if f"income_month_{i}" not in df_clean.columns:
            # Generate deterministic monthly variation based on volatility
            factor = 1.0 + (volatility * (0.3 if i % 2 == 0 else -0.3))
            df_clean[f"income_month_{i}"] = max(1000.0, base_inc * factor)

    # 2. Datatype conversions
    integer_cols = [
        "age", "household_size", "months_at_current_job", "num_income_sources",
        "utility_bills_paid", "utility_bills_total", "loan_tenure_months", "defaulted"
    ]
    for col in integer_cols:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce").fillna(0).astype(int)

    # 3. Missing Value Imputation
    # Digital transaction indicators
    df_clean["upi_transactions_per_month"] = df_clean["upi_transactions_per_month"].fillna(0.0)
    df_clean["upi_avg_transaction_amount"] = df_clean["upi_avg_transaction_amount"].fillna(0.0)
    df_clean["upi_months_active"] = df_clean["upi_months_active"].fillna(0.0)
    df_clean["mobile_wallet_used"] = df_clean["mobile_wallet_used"].fillna(0.0)

    # Rental history indicators (if NaN, individual does not rent -> 0 rental months)
    df_clean["rent_paid_on_time_months"] = df_clean["rent_paid_on_time_months"].fillna(0.0)
    df_clean["total_rental_months"] = df_clean["total_rental_months"].fillna(0.0)

    # Telecom stability
    median_year = df_clean["same_number_since_year"].median()
    if pd.isna(median_year):
        median_year = 2020.0
    df_clean["same_number_since_year"] = df_clean["same_number_since_year"].fillna(median_year)

    # E-commerce indicators (if 0 orders, return rate is 0, prepaid ratio default to median/0)
    df_clean["ecomm_return_rate"] = df_clean["ecomm_return_rate"].fillna(0.0)
    ecomm_prepaid_median = df_clean["prepaid_orders_ratio"].median()
    df_clean["prepaid_orders_ratio"] = df_clean["prepaid_orders_ratio"].fillna(ecomm_prepaid_median if not pd.isna(ecomm_prepaid_median) else 0.5)

    # Survey questions imputation with median
    for q in [f"survey_q{i}" for i in range(1, 9)]:
        if q not in df_clean.columns:
            df_clean[q] = 4.0
        else:
            median_q = df_clean[q].median()
            df_clean[q] = df_clean[q].fillna(median_q if not pd.isna(median_q) else 3.0)

    # 4. Outlier Analysis & IQR Capping
    outlier_cols = [
        "income_month_1", "income_month_2", "income_month_3",
        "income_month_4", "income_month_5", "income_month_6",
        "avg_monthly_recharge_amount", "loan_amount_requested",
        "upi_avg_transaction_amount"
    ]

    capping_bounds = {}
    for col in outlier_cols:
        if col in df_clean.columns:
            q25 = df_clean[col].quantile(0.25)
            q75 = df_clean[col].quantile(0.75)
            iqr = q75 - q25
            lower_bound = max(0.0, float(q25 - 1.5 * iqr))
            upper_bound = float(q75 + 1.5 * iqr)
            capping_bounds[col] = (lower_bound, upper_bound)
            
            num_outliers = ((df_clean[col] < lower_bound) | (df_clean[col] > upper_bound)).sum()
            if verbose and num_outliers > 0:
                print(f"Capping {col}: {num_outliers} values capped to [{lower_bound:.2f}, {upper_bound:.2f}]")
            
            df_clean[col] = df_clean[col].clip(lower=lower_bound, upper=upper_bound)

    if verbose:
        print(f"Cleaning complete. Remaining missing values: {df_clean.isnull().sum().sum()}")
    return df_clean


def run_pipeline(input_path: str = None, output_path: str = None) -> pd.DataFrame:
    """Execute Step 1 data cleaning and save cleaned_dataset.csv."""
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "cleaned_dataset.csv")
    output_path = os.path.abspath(output_path)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    df_raw = load_dataset(input_path)
    summary = dataset_summary(df_raw)
    print("Initial Dataset Summary:", {k: v for k, v in summary.items() if k in ["num_rows", "num_cols", "duplicates"]})

    df_cleaned = clean_dataset(df_raw, verbose=True)
    df_cleaned.to_csv(output_path, index=False)
    print(f"Saved cleaned dataset to: {output_path}. Shape: {df_cleaned.shape}")
    return df_cleaned


if __name__ == "__main__":
    run_pipeline()

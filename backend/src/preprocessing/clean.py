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
    df_clean = df_clean.drop_duplicates(subset=["borrower_id"])
    if verbose:
        print(f"Removed {initial_len - len(df_clean)} duplicate rows.")

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
        if q in df_clean.columns:
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

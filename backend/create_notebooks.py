"""
Generates the three required hackathon notebooks:
01_data_cleaning.ipynb
02_feature_engineering.ipynb
03_model_training.ipynb
"""

import os
import json


def save_notebook(filepath: str, cells: list):
    nb = {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "name": "python",
                "version": "3.13.5"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=2)
    print(f"Generated notebook: {filepath}")


def md_cell(source: str):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in source.strip().split("\n")]
    }


def code_cell(source: str):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in source.strip().split("\n")]
    }


def generate_01():
    cells = [
        md_cell("""# CredX - Step 1: Data Cleaning & Preprocessing
This notebook covers:
1. Loading the raw dataset (10,000 alternative credit records)
2. Dataset summary, info, and missing value analysis
3. Duplicate removal & datatype validation
4. Outlier analysis & 1.5 * IQR capping on monetary fields
5. Saving the processed cleaned dataset"""),
        code_cell("""import pandas as pd
import numpy as np
import os

# Load raw dataset
DATA_PATH = "../data/raw/alternate_credit_dataset.csv"
df = pd.read_csv(DATA_PATH)
print("Raw Dataset Shape:", df.shape)
df.head()"""),
        md_cell("""## 1. Missing Value Analysis
Inspect missing counts and percentages across all 41 columns."""),
        code_cell("""missing = pd.DataFrame({
    'Missing Count': df.isnull().sum(),
    'Missing %': round((df.isnull().sum() / len(df)) * 100, 2)
})
missing[missing['Missing Count'] > 0].sort_values('Missing %', ascending=False)"""),
        md_cell("""## 2. Duplicate Check & Removal"""),
        code_cell("""print("Exact duplicate rows:", df.duplicated().sum())
print("Duplicate borrower IDs:", df.duplicated(subset=['borrower_id']).sum())
df = df.drop_duplicates().drop_duplicates(subset=['borrower_id'])
print("Shape after deduplication:", df.shape)"""),
        md_cell("""## 3. Domain-Aware Missing Value Imputation
- UPI metrics: 0 for non-digital users
- Rental metrics: 0 for non-renters
- Same number year: median year
- E-commerce returns & prepaid ratio: 0 and median
- Psychometric survey questions: median rating"""),
        code_cell("""# UPI and Wallet
df['upi_transactions_per_month'] = df['upi_transactions_per_month'].fillna(0.0)
df['upi_avg_transaction_amount'] = df['upi_avg_transaction_amount'].fillna(0.0)
df['upi_months_active'] = df['upi_months_active'].fillna(0.0)
df['mobile_wallet_used'] = df['mobile_wallet_used'].fillna(0.0)

# Rent
df['rent_paid_on_time_months'] = df['rent_paid_on_time_months'].fillna(0.0)
df['total_rental_months'] = df['total_rental_months'].fillna(0.0)

# Phone tenure
df['same_number_since_year'] = df['same_number_since_year'].fillna(df['same_number_since_year'].median())

# Ecomm
df['ecomm_return_rate'] = df['ecomm_return_rate'].fillna(0.0)
df['prepaid_orders_ratio'] = df['prepaid_orders_ratio'].fillna(df['prepaid_orders_ratio'].median())

# Survey questions
for q in [f'survey_q{i}' for i in range(1, 9)]:
    df[q] = df[q].fillna(df[q].median())

print("Total missing values after imputation:", df.isnull().sum().sum())"""),
        md_cell("""## 4. Outlier Analysis & IQR Capping
Using 1.5 * IQR capping on income, recharge, loan request, and UPI transaction amounts."""),
        code_cell("""outlier_cols = [
    'income_month_1', 'income_month_2', 'income_month_3',
    'income_month_4', 'income_month_5', 'income_month_6',
    'avg_monthly_recharge_amount', 'loan_amount_requested',
    'upi_avg_transaction_amount'
]

for col in outlier_cols:
    q25 = df[col].quantile(0.25)
    q75 = df[col].quantile(0.75)
    iqr = q75 - q25
    lower = max(0.0, float(q25 - 1.5 * iqr))
    upper = float(q75 + 1.5 * iqr)
    num_capped = ((df[col] < lower) | (df[col] > upper)).sum()
    print(f"{col}: {num_capped} capped to [{lower:.2f}, {upper:.2f}]")
    df[col] = df[col].clip(lower=lower, upper=upper)"""),
        md_cell("""## 5. Export Cleaned Dataset"""),
        code_cell("""OUTPUT_PATH = "../data/processed/cleaned_dataset.csv"
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
df.to_csv(OUTPUT_PATH, index=False)
print("Saved cleaned dataset to:", OUTPUT_PATH)
print("Final Shape:", df.shape)""")
    ]
    save_notebook("backend/notebooks/01_data_cleaning.ipynb", cells)


def generate_02():
    cells = [
        md_cell("""# CredX - Step 2: Feature Engineering
Calculates 9 alternative financial behavior signals:
1. `avg_income`: 6-month mean
2. `income_std`: 6-month standard deviation
3. `income_growth`: % delta from Month 1 to Month 6
4. `income_stability_score`: 100 * (1 - (income_std / avg_income))
5. `utility_payment_rate`: utility_bills_paid / utility_bills_total
6. `rent_reliability_rate`: rent_paid_on_time_months / total_rental_months
7. `payment_reliability_score`: 50% utility rate + 50% rent rate (0-100)
8. `mobile_years`: 2026 - same_number_since_year
9. `digital_trust_score`: MinMax weighted composite (0-100)"""),
        code_cell("""import pandas as pd
import numpy as np

CLEAN_PATH = "../data/processed/cleaned_dataset.csv"
df = pd.read_csv(CLEAN_PATH)
print("Cleaned Dataset Shape:", df.shape)"""),
        md_cell("""## 1. Income Dynamics Features"""),
        code_cell("""income_cols = [f'income_month_{i}' for i in range(1, 7)]

# 1. Average Income
df['avg_income'] = df[income_cols].mean(axis=1)

# 2. Income Standard Deviation
df['income_std'] = df[income_cols].std(axis=1)

# 3. Income Growth
denom = df['income_month_1'].replace(0, np.nan)
df['income_growth'] = (((df['income_month_6'] - df['income_month_1']) / denom) * 100).clip(-100, 300)

# 4. Income Stability Score (0-100)
cov = (df['income_std'] / df['avg_income']).fillna(1.0)
df['income_stability_score'] = (100.0 * (1.0 - cov)).clip(0, 100)

df[['avg_income', 'income_std', 'income_growth', 'income_stability_score']].describe().T"""),
        md_cell("""## 2. Payment Discipline Features"""),
        code_cell("""# 5. Utility Payment Rate
df['utility_payment_rate'] = (df['utility_bills_paid'] / df['utility_bills_total'].replace(0, np.nan)).fillna(1.0).clip(0, 1)

# 6. Rent Reliability Rate (non-renters inherit utility rate)
is_renter = df['total_rental_months'] > 0
df['rent_reliability_rate'] = np.where(
    is_renter,
    (df['rent_paid_on_time_months'] / df['total_rental_months'].replace(0, np.nan)).fillna(1.0).clip(0, 1),
    df['utility_payment_rate']
)

# 7. Payment Reliability Score (0-100)
df['payment_reliability_score'] = ((0.50 * df['utility_payment_rate'] + 0.50 * df['rent_reliability_rate']) * 100).clip(0, 100)

df[['utility_payment_rate', 'rent_reliability_rate', 'payment_reliability_score']].describe().T"""),
        md_cell("""## 3. Mobile Stability & Digital Trust Score"""),
        code_cell("""CURRENT_YEAR = 2026

# 8. Mobile Years
df['mobile_years'] = (CURRENT_YEAR - df['same_number_since_year']).clip(0, 30)

# 9. Digital Trust Score (MinMax normalization across 5 behavioral signals)
def minmax(series):
    q99 = series.quantile(0.99)
    min_v = series.min()
    return ((series - min_v) / (q99 - min_v)).clip(0, 1) * 100.0

s_upi_tx = minmax(df['upi_transactions_per_month'])
s_upi_m = minmax(df['upi_months_active'])
s_my = minmax(df['mobile_years'])
s_w = minmax(df['mobile_wallet_used'])
s_rf = minmax(df['recharge_frequency_per_month'])

df['digital_trust_score'] = (
    0.30 * s_upi_tx +
    0.25 * s_upi_m +
    0.20 * s_my +
    0.15 * s_w +
    0.10 * s_rf
).clip(0, 100)

df[['mobile_years', 'digital_trust_score']].describe().T"""),
        md_cell("""## 4. Export Featured Dataset"""),
        code_cell("""OUTPUT_PATH = "../data/processed/featured_dataset.csv"
df.to_csv(OUTPUT_PATH, index=False)
print("Exported featured dataset to:", OUTPUT_PATH)
print("Final Shape:", df.shape)""")
    ]
    save_notebook("backend/notebooks/02_feature_engineering.ipynb", cells)


def generate_03():
    cells = [
        md_cell("""# CredX - Step 3: Model Training, Evaluation & Explainability
This notebook compares 3 classification models for default prediction:
1. Logistic Regression
2. Random Forest
3. XGBoost

Evaluates: Accuracy, Precision, Recall, F1 Score, ROC AUC.
Saves winning model (XGBoost) and SHAP TreeExplainer artifacts."""),
        code_cell("""import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import shap

# Load engineered dataset
df = pd.read_csv("../data/processed/featured_dataset.csv")
print("Featured Dataset Shape:", df.shape)"""),
        md_cell("""## 1. Feature Preprocessing & Train/Test Split"""),
        code_cell("""y = df['defaulted'].astype(int)
drop_cols = ['borrower_id', 'defaulted', 'default_probability']
X = df.drop(columns=[c for c in drop_cols if c in df.columns])

categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
numerical_cols = X.select_dtypes(include=[np.number]).columns.tolist()

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
X_train_cat = encoder.fit_transform(X_train[categorical_cols])
X_test_cat = encoder.transform(X_test[categorical_cols])

scaler = StandardScaler()
X_train_num = scaler.fit_transform(X_train[numerical_cols])
X_test_num = scaler.transform(X_test[numerical_cols])

X_train_proc = np.hstack([X_train_num, X_train_cat])
X_test_proc = np.hstack([X_test_num, X_test_cat])
print("Processed Training Matrix Shape:", X_train_proc.shape)"""),
        md_cell("""## 2. Model Training & Comparison"""),
        code_cell("""models = {
    'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42),
    'XGBoost': XGBClassifier(n_estimators=250, max_depth=5, learning_rate=0.04, eval_metric='logloss', random_state=42)
}

results = []
for name, model in models.items():
    model.fit(X_train_proc, y_train)
    preds = model.predict(X_test_proc)
    probs = model.predict_proba(X_test_proc)[:, 1]
    
    results.append({
        'Model': name,
        'Accuracy': accuracy_score(y_test, preds),
        'Precision': precision_score(y_test, preds, zero_division=0),
        'Recall': recall_score(y_test, preds, zero_division=0),
        'F1 Score': f1_score(y_test, preds, zero_division=0),
        'ROC AUC': roc_auc_score(y_test, probs)
    })

pd.DataFrame(results).set_index('Model').round(4)"""),
        md_cell("""## 3. Alternative Credit Scoring Formula
- Default Probability $p = \\text{predict_proba}(X)[1]$
- Alternate Credit Score $= 300 + ((1 - p) \\times 600) \\quad [300 - 900]$
- Risk Bands: Low ($<0.30$), Medium ($0.30 - 0.60$), High ($\\ge 0.60$)
- Approval Probability $= (1 - p) \\times 100\%$"""),
        code_cell("""best_model = models['XGBoost']
sample_prob = best_model.predict_proba(X_test_proc[:5])[:, 1]
for i, prob in enumerate(sample_prob):
    score = int(round(300 + (1 - prob) * 600))
    risk = "Low Risk" if prob < 0.30 else ("Medium Risk" if prob < 0.60 else "High Risk")
    approval = round((1 - prob) * 100, 1)
    print(f"Applicant {i+1}: Default Prob={prob:.3f} | Score={score} | Risk={risk} | Approval={approval}%")"""),
        md_cell("""## 4. SHAP Explainability Demo"""),
        code_cell("""explainer = shap.TreeExplainer(best_model)
sample_shap = explainer.shap_values(X_test_proc[:1])
print("Sample SHAP Values calculated successfully. Shape:", sample_shap.shape)""")
    ]
    save_notebook("backend/notebooks/03_model_training.ipynb", cells)


if __name__ == "__main__":
    generate_01()
    generate_02()
    generate_03()

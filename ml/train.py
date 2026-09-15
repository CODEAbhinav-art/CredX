"""
CredX — ML Model Training Script
Trains XGBoost + Random Forest baseline, evaluates both,
saves artifacts, and prints a complete evaluation report.

Usage:
    python ml/train.py
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report,
    precision_score, recall_score,
)

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("WARNING: XGBoost not available. Falling back to Random Forest only.")

# ──────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "synthetic_dataset.csv"
ARTIFACTS_DIR = PROJECT_ROOT / "ml" / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

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

TARGET = "creditworthy"
RANDOM_SEED = 42


def load_data() -> tuple[pd.DataFrame, pd.Series]:
    if not DATA_PATH.exists():
        print(f"Dataset not found at {DATA_PATH}. Generating now...")
        sys.path.insert(0, str(PROJECT_ROOT))
        from data.generate_synthetic import generate_dataset
        df = generate_dataset()
        df.to_csv(DATA_PATH, index=False)
    else:
        df = pd.read_csv(DATA_PATH)

    print(f"Loaded {len(df)} samples | Features: {len(FEATURE_NAMES)} | Target: {TARGET}")
    X = df[FEATURE_NAMES]
    y = df[TARGET]
    return X, y


def evaluate_model(model, X_test, y_test, name: str) -> dict:
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    metrics = {
        "name": name,
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1": round(f1_score(y_test, y_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
    }

    print(f"\n{'='*50}")
    print(f"Model: {name}")
    print(f"{'='*50}")
    for k, v in metrics.items():
        if k != "name":
            print(f"  {k:20s}: {v}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Non-creditworthy", "Creditworthy"]))

    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"  TN={cm[0][0]}  FP={cm[0][1]}")
    print(f"  FN={cm[1][0]}  TP={cm[1][1]}")

    return metrics


def train():
    print("\n" + "="*60)
    print("CredX — ML Model Training")
    print("="*60)

    # 1. Load data
    X, y = load_data()
    print(f"\nClass distribution:\n{y.value_counts()}")

    # 2. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )
    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")

    # 3. Feature scaling (for Random Forest this doesn't matter, but good practice)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Class weight for imbalance
    pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
    print(f"\nClass imbalance weight: {pos_weight:.3f}")

    results = []

    # 5. Primary model: XGBoost
    if XGBOOST_AVAILABLE:
        print("\n[Training XGBoost...]")
        xgb = XGBClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=pos_weight,
            random_state=RANDOM_SEED,
            eval_metric="logloss",
            verbosity=0,
        )
        xgb.fit(X_train_scaled, y_train)

        # Cross-validation
        cv_scores = cross_val_score(xgb, X_train_scaled, y_train, cv=5, scoring="roc_auc")
        print(f"XGBoost 5-fold CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

        xgb_metrics = evaluate_model(xgb, X_test_scaled, y_test, "XGBoost")
        results.append(xgb_metrics)

    # 6. Baseline: Random Forest
    print("\n[Training Random Forest baseline...]")
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        class_weight="balanced",
        random_state=RANDOM_SEED,
    )
    rf.fit(X_train_scaled, y_train)
    rf_metrics = evaluate_model(rf, X_test_scaled, y_test, "Random Forest")
    results.append(rf_metrics)

    # 7. Select best model
    best_result = max(results, key=lambda r: r["roc_auc"])
    print(f"\n{'='*50}")
    print(f"BEST MODEL: {best_result['name']} (ROC-AUC: {best_result['roc_auc']})")
    print(f"{'='*50}")

    # Verify target performance
    if best_result["roc_auc"] < 0.80:
        print("\n⚠️  WARNING: ROC-AUC below target (0.80). Review data generation and features.")
    else:
        print(f"✓ ROC-AUC target met: {best_result['roc_auc']} >= 0.80")

    # 8. Save artifacts
    best_model = xgb if (XGBOOST_AVAILABLE and best_result["name"] == "XGBoost") else rf
    joblib.dump(best_model, ARTIFACTS_DIR / "model.pkl")
    joblib.dump(scaler, ARTIFACTS_DIR / "scaler.pkl")

    # Save feature names for validation
    with open(ARTIFACTS_DIR / "feature_names.json", "w") as f:
        json.dump(FEATURE_NAMES, f, indent=2)

    # Save evaluation results
    with open(ARTIFACTS_DIR / "eval_results.json", "w") as f:
        json.dump({"results": results, "best_model": best_result["name"]}, f, indent=2)

    print(f"\n✓ Artifacts saved to: {ARTIFACTS_DIR}")
    print("  - model.pkl")
    print("  - scaler.pkl")
    print("  - feature_names.json")
    print("  - eval_results.json")
    print("\nTraining complete. You can now start the backend server.")


if __name__ == "__main__":
    train()

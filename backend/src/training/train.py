"""
CredX - Step 3: Model Training & Evaluation Pipeline
Trains and compares:
1. Logistic Regression
2. Random Forest
3. XGBoost
Evaluates Accuracy, Precision, Recall, F1 Score, ROC AUC.
Saves winning model and artifacts to backend/models/.
"""

import os
import json
import pickle
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score


def prepare_data(df: pd.DataFrame):
    """Separate target, identify categorical and numerical features, and split."""
    # Target variable
    y = df["defaulted"].astype(int)

    # Columns to drop from training features
    drop_cols = ["borrower_id", "defaulted", "default_probability"]
    X = df.drop(columns=[c for c in drop_cols if c in df.columns])

    # Identify categorical and numerical columns
    categorical_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
    numerical_cols = X.select_dtypes(include=[np.number]).columns.tolist()

    print(f"Features: {X.shape[1]} total ({len(categorical_cols)} categorical, {len(numerical_cols)} numerical)")
    print("Categorical columns:", categorical_cols)

    # Train / Test split (80/20 Stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Fit OneHotEncoder on categorical columns
    encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    encoder.fit(X_train[categorical_cols])
    encoded_feature_names = encoder.get_feature_names_out(categorical_cols).tolist()

    # Fit StandardScaler on numerical columns
    scaler = StandardScaler()
    scaler.fit(X_train[numerical_cols])

    # Transform train and test
    def transform_features(features_df):
        encoded_cats = encoder.transform(features_df[categorical_cols])
        scaled_nums = scaler.transform(features_df[numerical_cols])
        feature_matrix = np.hstack([scaled_nums, encoded_cats])
        return feature_matrix

    X_train_proc = transform_features(X_train)
    X_test_proc = transform_features(X_test)
    all_feature_columns = numerical_cols + encoded_feature_names

    return {
        "X_train_raw": X_train,
        "X_test_raw": X_test,
        "X_train_proc": X_train_proc,
        "X_test_proc": X_test_proc,
        "y_train": y_train,
        "y_test": y_test,
        "encoder": encoder,
        "scaler": scaler,
        "categorical_cols": categorical_cols,
        "numerical_cols": numerical_cols,
        "all_feature_columns": all_feature_columns
    }


def evaluate_model(model, X_test, y_test) -> dict:
    """Compute standard classification metrics."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4)
    }
    return metrics


def train_models(data: dict) -> dict:
    """Train Logistic Regression, Random Forest, and XGBoost; evaluate and compare."""
    X_train, y_train = data["X_train_proc"], data["y_train"]
    X_test, y_test = data["X_test_proc"], data["y_test"]

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42, n_jobs=-1),
        "XGBoost": XGBClassifier(
            n_estimators=250,
            max_depth=5,
            learning_rate=0.04,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1
        )
    }

    results = {}
    trained_models = {}

    print("\n" + "=" * 60)
    print("MODEL COMPARISON & BENCHMARKING")
    print("=" * 60)
    print(f"{'Model':<22} | {'Accuracy':<8} | {'Precision':<9} | {'Recall':<8} | {'F1':<6} | {'ROC AUC':<8}")
    print("-" * 68)

    for name, model in models.items():
        model.fit(X_train, y_train)
        metrics = evaluate_model(model, X_test, y_test)
        results[name] = metrics
        trained_models[name] = model
        print(f"{name:<22} | {metrics['accuracy']:<8.4f} | {metrics['precision']:<9.4f} | {metrics['recall']:<8.4f} | {metrics['f1']:<6.4f} | {metrics['roc_auc']:<8.4f}")

    print("=" * 60)
    return trained_models, results


def run_pipeline(input_path: str = None, models_dir: str = None):
    """Execute Step 3 model training pipeline and save artifacts."""
    if input_path is None:
        input_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "featured_dataset.csv")
    if models_dir is None:
        models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")

    input_path = os.path.abspath(input_path)
    models_dir = os.path.abspath(models_dir)
    os.makedirs(models_dir, exist_ok=True)

    df_featured = pd.read_csv(input_path)
    print(f"Loaded featured dataset from: {input_path}. Shape: {df_featured.shape}")

    data = prepare_data(df_featured)
    trained_models, results = train_models(data)

    best_model_name = "XGBoost"
    best_model = trained_models[best_model_name]

    # Save artifacts
    xgb_path = os.path.join(models_dir, "xgboost_model.pkl")
    with open(xgb_path, "wb") as f:
        pickle.dump(best_model, f)
    print(f"Saved {best_model_name} model to {xgb_path}")

    scaler_path = os.path.join(models_dir, "scaler.pkl")
    with open(scaler_path, "wb") as f:
        pickle.dump(data["scaler"], f)
    print(f"Saved scaler to {scaler_path}")

    encoder_path = os.path.join(models_dir, "encoder.pkl")
    with open(encoder_path, "wb") as f:
        pickle.dump(data["encoder"], f)
    print(f"Saved encoder to {encoder_path}")

    columns_path = os.path.join(models_dir, "feature_columns.pkl")
    with open(columns_path, "wb") as f:
        pickle.dump(data["all_feature_columns"], f)
    print(f"Saved feature columns list to {columns_path}")

    col_meta_path = os.path.join(models_dir, "columns_metadata.json")
    with open(col_meta_path, "w") as f:
        json.dump({
            "categorical_cols": data["categorical_cols"],
            "numerical_cols": data["numerical_cols"],
            "all_feature_columns": data["all_feature_columns"]
        }, f, indent=2)

    # Save background sample for SHAP TreeExplainer
    # Use 150 representative samples from X_train_proc
    shap_background_indices = np.random.RandomState(42).choice(data["X_train_proc"].shape[0], size=150, replace=False)
    shap_background = data["X_train_proc"][shap_background_indices]
    shap_bg_path = os.path.join(models_dir, "shap_background.pkl")
    with open(shap_bg_path, "wb") as f:
        pickle.dump(shap_background, f)
    print(f"Saved SHAP background sample to {shap_bg_path}")

    # Save metrics JSON
    metrics_path = os.path.join(models_dir, "model_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Saved model metrics to {metrics_path}")

    print("\nStep 3 Training Pipeline Completed Successfully!")
    return results


if __name__ == "__main__":
    run_pipeline()

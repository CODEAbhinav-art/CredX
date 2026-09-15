"""
CredX - Health & Model Benchmark Routes
"""

import os
import json
from fastapi import APIRouter
from src.prediction.scorer import get_scorer
from src.explainability.explainer import get_explainer
from src.database.db import engine
from sqlalchemy import text

router = APIRouter(prefix="/api", tags=["System Health & Benchmarks"])


@router.get("/health")
def health_check():
    """System health, DB status, and Model status."""
    db_status = "disconnected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_status = "connected (Neon PostgreSQL)"
    except Exception as e:
        db_status = f"error: {str(e)}"

    scorer = get_scorer()
    model_loaded = scorer.model is not None

    return {
        "status": "healthy",
        "service": "CredX Alternative Credit Scoring Engine",
        "database": db_status,
        "model_loaded": model_loaded,
        "version": "1.0.0"
    }


@router.get("/metrics")
def get_model_benchmarks():
    """Returns comparative evaluation metrics for Logistic Regression, Random Forest, and XGBoost."""
    metrics_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "model_metrics.json"))
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)
        return {
            "selected_model": "XGBoost",
            "benchmark_comparison": metrics
        }
    return {"error": "Model metrics not found"}


@router.get("/features/global")
def get_global_features():
    """Returns top global feature importances from the trained XGBoost model."""
    explainer = get_explainer()
    global_factors = explainer.get_global_feature_importance(top_n=15)
    return {
        "global_feature_importance": global_factors
    }

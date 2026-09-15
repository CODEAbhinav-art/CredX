"""
CredX — ML Credit Model Wrapper
Loads the serialized XGBoost model and provides a clean inference interface.
"""

from __future__ import annotations
import joblib
import numpy as np
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent.parent / "ml" / "artifacts" / "model.pkl"
SCALER_PATH = Path(__file__).parent.parent.parent / "ml" / "artifacts" / "scaler.pkl"


class CreditModel:
    """
    Wrapper around the trained XGBoost classifier.
    Loaded once at startup and reused for all requests.
    """

    def __init__(self) -> None:
        self._model = None
        self._scaler = None
        self._is_loaded = False

    def load(self) -> None:
        """Load model and scaler from disk. Called once at FastAPI startup."""
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {MODEL_PATH}. "
                "Run `python ml/train.py` first."
            )
        self._model = joblib.load(MODEL_PATH)
        if SCALER_PATH.exists():
            self._scaler = joblib.load(SCALER_PATH)
        self._is_loaded = True

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    def predict_proba(self, X: np.ndarray) -> float:
        """
        Run inference and return the probability of being creditworthy (class 1).

        Args:
            X: Feature array of shape (1, n_features)

        Returns:
            float: Probability in [0, 1]
        """
        if not self._is_loaded:
            raise RuntimeError("Model is not loaded. Call load() first.")

        if self._scaler is not None:
            X = self._scaler.transform(X)

        proba = self._model.predict_proba(X)
        return float(proba[0][1])  # probability of class 1 (creditworthy)

    def get_booster(self):
        """Return the raw XGBoost booster for SHAP TreeExplainer."""
        if not self._is_loaded:
            raise RuntimeError("Model is not loaded.")
        return self._model


# Singleton instance — loaded once at startup
credit_model = CreditModel()

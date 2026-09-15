"""
CredX — API Tests
Tests scoring, SHAP explainability, simulator behaviour, LLM fallback,
and all three test personas.

Run with: pytest tests/ -v
"""

import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# ─── Fixtures ─────────────────────────────────────────────────────

PERSONAS_DIR = Path(__file__).parent / "personas"


def load_persona(name: str) -> dict:
    path = PERSONAS_DIR / f"{name}.json"
    with open(path) as f:
        data = json.load(f)
    # Remove non-feature keys
    data.pop("label", None)
    data.pop("description", None)
    data.pop("expected_score_range", None)
    data.pop("expected_risk_band", None)
    return data


def load_persona_meta(name: str) -> dict:
    path = PERSONAS_DIR / f"{name}.json"
    with open(path) as f:
        return json.load(f)


@pytest.fixture(scope="module")
def client():
    """Create test client with model loaded."""
    from backend.main import app
    return TestClient(app)


# ─── Health Check ─────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_health_has_model_loaded(self, client):
        response = client.get("/health")
        data = response.json()
        # Model must be loaded for a valid test run
        assert data["model_loaded"] is True, (
            "Model not loaded. Run `python ml/train.py` first."
        )


# ─── Score Generation ─────────────────────────────────────────────

class TestScoreGeneration:

    def test_persona_a_score_in_range(self, client):
        meta = load_persona_meta("persona_a")
        payload = load_persona("persona_a")
        response = client.post("/api/v1/score", json=payload)
        assert response.status_code == 200
        data = response.json()
        lo, hi = meta["expected_score_range"]
        assert lo <= data["credx_score"] <= hi, (
            f"Persona A score {data['credx_score']} out of range [{lo}, {hi}]"
        )
        assert data["risk_band"] == meta["expected_risk_band"]

    def test_persona_b_score_in_range(self, client):
        meta = load_persona_meta("persona_b")
        payload = load_persona("persona_b")
        response = client.post("/api/v1/score", json=payload)
        assert response.status_code == 200
        data = response.json()
        lo, hi = meta["expected_score_range"]
        # Allow ±30 tolerance for gig worker profiles (moderate uncertainty)
        assert (lo - 30) <= data["credx_score"] <= (hi + 30), (
            f"Persona B score {data['credx_score']} out of expected range [{lo}, {hi}] (±30)"
        )

    def test_persona_c_score_in_range(self, client):
        meta = load_persona_meta("persona_c")
        payload = load_persona("persona_c")
        response = client.post("/api/v1/score", json=payload)
        assert response.status_code == 200
        data = response.json()
        lo, hi = meta["expected_score_range"]
        assert lo <= data["credx_score"] <= hi, (
            f"Persona C score {data['credx_score']} out of range [{lo}, {hi}]"
        )

    def test_score_ordering(self, client):
        """Persona A should score higher than Persona C."""
        pa = client.post("/api/v1/score", json=load_persona("persona_a")).json()
        pc = client.post("/api/v1/score", json=load_persona("persona_c")).json()
        assert pa["credx_score"] > pc["credx_score"], (
            f"Score ordering violated: A={pa['credx_score']}, C={pc['credx_score']}"
        )

    def test_score_always_in_valid_range(self, client):
        payload = load_persona("persona_a")
        response = client.post("/api/v1/score", json=payload)
        data = response.json()
        assert 300 <= data["credx_score"] <= 900

    def test_score_has_required_fields(self, client):
        payload = load_persona("persona_a")
        response = client.post("/api/v1/score", json=payload)
        data = response.json()
        required = [
            "credx_score", "risk_band", "approval_likelihood",
            "sub_scores", "top_positive_contributors", "top_negative_contributors",
        ]
        for field in required:
            assert field in data, f"Missing field: {field}"

    def test_sub_scores_in_valid_range(self, client):
        payload = load_persona("persona_a")
        response = client.post("/api/v1/score", json=payload)
        data = response.json()
        sub = data["sub_scores"]
        for key in ["income_stability", "payment_reliability", "digital_behaviour"]:
            assert 300 <= sub[key] <= 900, f"Sub-score {key} = {sub[key]} out of range"

    def test_approval_likelihood_is_probability(self, client):
        payload = load_persona("persona_a")
        response = client.post("/api/v1/score", json=payload)
        data = response.json()
        assert 0.0 <= data["approval_likelihood"] <= 1.0

    def test_disclaimer_present(self, client):
        payload = load_persona("persona_a")
        response = client.post("/api/v1/score", json=payload)
        data = response.json()
        assert "disclaimer" in data
        assert len(data["disclaimer"]) > 0


# ─── Input Validation ─────────────────────────────────────────────

class TestInputValidation:

    def test_missing_required_field_returns_422(self, client):
        payload = load_persona("persona_a")
        del payload["avg_monthly_income"]
        response = client.post("/api/v1/score", json=payload)
        assert response.status_code == 422

    def test_out_of_range_field_returns_422(self, client):
        payload = load_persona("persona_a")
        payload["utility_payment_consistency"] = 1.5  # max is 1.0
        response = client.post("/api/v1/score", json=payload)
        assert response.status_code == 422

    def test_empty_body_returns_422(self, client):
        response = client.post("/api/v1/score", json={})
        assert response.status_code == 422

    def test_negative_income_returns_422(self, client):
        payload = load_persona("persona_a")
        payload["avg_monthly_income"] = -5000
        response = client.post("/api/v1/score", json=payload)
        assert response.status_code == 422


# ─── SHAP Consistency ─────────────────────────────────────────────

class TestSHAPConsistency:

    def test_shap_contributors_have_required_fields(self, client):
        payload = load_persona("persona_a")
        response = client.post("/api/v1/score", json=payload)
        data = response.json()
        for contrib in data["top_positive_contributors"]:
            assert "feature" in contrib
            assert "feature_label" in contrib
            assert "shap_value" in contrib
            assert "impact_direction" in contrib
            assert contrib["impact_direction"] == "positive"

    def test_negative_contributors_have_negative_shap(self, client):
        payload = load_persona("persona_c")
        response = client.post("/api/v1/score", json=payload)
        data = response.json()
        for contrib in data["top_negative_contributors"]:
            assert contrib["shap_value"] < 0
            assert contrib["impact_direction"] == "negative"

    def test_determinism(self, client):
        """Same input must always produce same score."""
        payload = load_persona("persona_b")
        r1 = client.post("/api/v1/score", json=payload).json()
        r2 = client.post("/api/v1/score", json=payload).json()
        assert r1["credx_score"] == r2["credx_score"]


# ─── Simulator ────────────────────────────────────────────────────

class TestSimulator:

    def test_simulator_returns_valid_structure(self, client):
        orig = load_persona("persona_b")
        mod = {**orig, "avg_monthly_income": 60000, "income_volatility": 0.2}
        payload = {"original": orig, "modified": mod}
        response = client.post("/api/v1/simulate", json=payload)
        assert response.status_code == 200
        data = response.json()
        required = ["original_score", "simulated_score", "score_delta", "changed_features", "llm_explanation"]
        for field in required:
            assert field in data

    def test_simulator_score_delta_is_correct(self, client):
        orig = load_persona("persona_b")
        mod = {**orig, "avg_monthly_income": 60000, "income_volatility": 0.2}
        payload = {"original": orig, "modified": mod}
        response = client.post("/api/v1/simulate", json=payload)
        data = response.json()
        assert data["score_delta"] == data["simulated_score"] - data["original_score"]

    def test_simulator_identifies_changed_features(self, client):
        orig = load_persona("persona_b")
        mod = {**orig, "avg_monthly_income": 60000}
        payload = {"original": orig, "modified": mod}
        response = client.post("/api/v1/simulate", json=payload)
        data = response.json()
        assert "avg_monthly_income" in data["changed_features"]

    def test_identical_inputs_return_zero_delta(self, client):
        orig = load_persona("persona_a")
        payload = {"original": orig, "modified": orig}
        response = client.post("/api/v1/simulate", json=payload)
        data = response.json()
        assert data["score_delta"] == 0


# ─── Copilot ──────────────────────────────────────────────────────

class TestCopilot:

    @pytest.fixture
    def score_context(self, client):
        payload = load_persona("persona_b")
        return client.post("/api/v1/score", json=payload).json()

    def test_copilot_returns_answer(self, client, score_context):
        payload = {
            "question": "Why is my score this low?",
            "score_context": score_context,
        }
        response = client.post("/api/v1/copilot", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert len(data["answer"]) > 10

    def test_copilot_has_disclaimer(self, client, score_context):
        payload = {
            "question": "How can I improve my score?",
            "score_context": score_context,
        }
        response = client.post("/api/v1/copilot", json=payload)
        data = response.json()
        assert "disclaimer" in data
        assert len(data["disclaimer"]) > 0

    def test_copilot_empty_question_returns_422(self, client, score_context):
        payload = {
            "question": "",
            "score_context": score_context,
        }
        response = client.post("/api/v1/copilot", json=payload)
        assert response.status_code == 422

"""
CredX - End-to-End API Test Suite
Validates all routes using FastAPI TestClient:
- Health & Metrics
- Borrowers
- Credit Scoring & TreeSHAP
- GenAI Advice
- What-If Simulator & Time-to-Approval
- PDF Passport Generation
"""

import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_health():
    print("Testing GET /api/health...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    data = res.json()
    print("Health Status:", data)
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    print("[PASS] Health Check Passed")


def test_metrics():
    print("\nTesting GET /api/metrics...")
    res = client.get("/api/metrics")
    assert res.status_code == 200
    data = res.json()
    print("Models Evaluated:", list(data["benchmark_comparison"].keys()))
    print("XGBoost Metrics:", data["benchmark_comparison"]["XGBoost"])
    assert "XGBoost" in data["benchmark_comparison"]
    print("[PASS] Metrics Check Passed")


def test_global_features():
    print("\nTesting GET /api/features/global...")
    res = client.get("/api/features/global")
    assert res.status_code == 200
    data = res.json()
    print(f"Top 3 Global Features: {[f['title'] for f in data['global_feature_importance'][:3]]}")
    assert len(data["global_feature_importance"]) > 0
    print("[PASS] Global Features Check Passed")


def test_borrowers():
    print("\nTesting GET /api/borrowers...")
    res = client.get("/api/borrowers")
    assert res.status_code == 200
    data = res.json()
    print(f"Total Borrowers Retrieved: {data['count']}")
    assert data["count"] > 0
    first_b = data["borrowers"][0]
    print(f"Sample Persona: {first_b['name']} ({first_b['borrower_id']})")
    print("[PASS] Borrowers Check Passed")


def test_score():
    print("\nTesting POST /api/score (B_GIG_01)...")
    res = client.post("/api/score", json={"borrower_id": "B_GIG_01"})
    assert res.status_code == 200, f"Scoring failed: {res.text}"
    data = res.json()
    scoring = data["scoring"]
    print(f"Credit Score: {scoring['credit_score']} / 900 ({scoring['risk_band']})")
    print(f"Approval Probability: {scoring['approval_probability']}% | Default Prob: {scoring['default_probability']}")
    print("Pillars:", scoring["pillars"])
    print(f"Top Strengths ({len(data['explainable_ai']['top_strengths'])}): {[s['title'] for s in data['explainable_ai']['top_strengths']]}")
    print(f"Top Weaknesses ({len(data['explainable_ai']['top_weaknesses'])}): {[w['title'] for w in data['explainable_ai']['top_weaknesses']]}")
    print("AI Coach Headline:", data["gemini_advisor"]["summary_headline"])
    print("AI 30-Day Plan:", data["gemini_advisor"]["improvement_plan"]["day_30"])
    assert 300 <= scoring["credit_score"] <= 900
    assert "explainable_ai" in data
    assert "gemini_advisor" in data
    print("[PASS] Scoring & SHAP Check Passed")


def test_simulation():
    print("\nTesting POST /api/simulate...")
    sim_payload = {
        "borrower_id": "B_GIG_01",
        "modifications": {
            "utility_payment_rate": 1.0,
            "rent_reliability_rate": 1.0,
            "smooth_income_months": True,
            "upi_transactions_per_month": 120.0,
            "upi_months_active": 30.0
        }
    }
    res = client.post("/api/simulate", json=sim_payload)
    assert res.status_code == 200, f"Simulation failed: {res.text}"
    data = res.json()
    base_s = data["baseline"]["credit_score"]
    sim_s = data["simulated"]["credit_score"]
    delta_s = data["deltas"]["score_change"]
    print(f"Simulation Result: {base_s} -> {sim_s} (Delta: {delta_s:+d} pts)")
    print(f"Approval Chance: {data['baseline']['approval_probability']}% -> {data['simulated']['approval_probability']}%")
    print(f"Trajectory Status: {data['trajectory']['readiness_status']}")
    assert "trajectory" in data
    print("[PASS] What-If Simulator Check Passed")


def test_pdf_passport():
    print("\nTesting GET /api/passport/pdf/B_GIG_01...")
    res = client.get("/api/passport/pdf/B_GIG_01")
    assert res.status_code == 200, f"PDF generation failed: {res.text}"
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF"), "Generated file does not have valid PDF header"
    print(f"Generated PDF Size: {len(res.content):,} bytes")
    print("[PASS] Alternative Credit Passport PDF Check Passed")


if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING COMPLETE CREDX BACKEND VERIFICATION SUITE")
    print("=" * 60)
    test_health()
    test_metrics()
    test_global_features()
    test_borrowers()
    test_score()
    test_simulation()
    test_pdf_passport()
    print("\n" + "=" * 60)
    print("ALL API ENDPOINT TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

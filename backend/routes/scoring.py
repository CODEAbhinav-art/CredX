"""
CredX - Credit Scoring & Explainability Routes
Calculates:
- Alternate Credit Score (300-900)
- Risk Band & Approval Probability
- TreeSHAP factor forces (Strengths & Hurting Factors)
- Gemini 2.5 Flash supportive AI coach explanation and 30/60/90-day plan
Persists assessment history into Neon PostgreSQL.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from src.database.db import get_db
from src.database.models import Borrower, CreditAssessment
from src.prediction.scorer import get_scorer
from src.explainability.explainer import get_explainer
from src.genai.gemini_advisor import get_advisor

router = APIRouter(prefix="/api/score", tags=["Credit Scoring & Explainability"])


@router.post("")
def assess_credit(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Generate complete credit assessment.
    Can accept either:
    1. {"borrower_id": "B_GIG_01"} to look up existing profile in DB, OR
    2. Full borrower dictionary payload.
    """
    borrower_profile = {}
    b_id = payload.get("borrower_id")

    if b_id and len(payload) == 1:
        # Fetch from database
        borrower_record = db.query(Borrower).filter(Borrower.borrower_id == b_id).first()
        if not borrower_record:
            raise HTTPException(status_code=404, detail=f"Borrower {b_id} not found in database")
        borrower_profile = borrower_record.to_dict()
    else:
        borrower_profile = payload.copy()
        if "borrower_id" not in borrower_profile:
            borrower_profile["borrower_id"] = "B_TEMP_APPLICANT"

    # Step 1: Run Prediction & Scoring
    scorer = get_scorer()
    score_result = scorer.score_applicant(borrower_profile)

    # Step 2: Compute TreeSHAP Explainability
    explainer = get_explainer()
    explain_result = explainer.explain_applicant(score_result["feature_matrix"], top_k=5)

    # Step 3: Call Gemini 2.5 Flash AI Advisor
    advisor = get_advisor()
    advice_result = advisor.generate_advice(
        credit_score=score_result["credit_score"],
        risk_band=score_result["risk_band"],
        approval_probability=score_result["approval_probability"],
        strengths=explain_result["strengths"],
        weaknesses=explain_result["weaknesses"],
        borrower_profile=borrower_profile,
        pillars=score_result["pillars"]
    )

    # Step 4: Persist Assessment in DB (if borrower exists in DB)
    if b_id:
        existing_borrower = db.query(Borrower).filter(Borrower.borrower_id == b_id).first()
        if existing_borrower:
            assessment = CreditAssessment(
                borrower_id=b_id,
                credit_score=score_result["credit_score"],
                risk_band=score_result["risk_band"],
                default_probability=score_result["default_probability"],
                approval_probability=score_result["approval_probability"],
                loan_readiness=score_result["loan_readiness"],
                pillars=score_result["pillars"],
                strengths=explain_result["strengths"],
                weaknesses=explain_result["weaknesses"],
                ai_advice=advice_result
            )
            db.add(assessment)
            db.commit()

    return {
        "borrower_id": borrower_profile.get("borrower_id"),
        "scoring": {
            "credit_score": score_result["credit_score"],
            "scale": "300 - 900",
            "risk_band": score_result["risk_band"],
            "risk_color": score_result["risk_color"],
            "default_probability": score_result["default_probability"],
            "approval_probability": score_result["approval_probability"],
            "loan_readiness_meter": score_result["loan_readiness"],
            "recommendation": score_result["recommendation"],
            "pillars": score_result["pillars"]
        },
        "explainable_ai": {
            "top_strengths": explain_result["strengths"],
            "top_weaknesses": explain_result["weaknesses"],
            "shap_factors_chart": explain_result["top_factors_chart"],
            "base_value": explain_result["base_value"]
        },
        "gemini_advisor": advice_result
    }

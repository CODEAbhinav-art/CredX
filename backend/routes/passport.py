"""
CredX - Alternative Credit Passport PDF Download Route
Generates downloadable, print-ready PDF reports via ReportLab.
"""

from fastapi import APIRouter, Depends, HTTPException, Body, Response
from sqlalchemy.orm import Session
from typing import Dict, Any

from src.database.db import get_db
from src.database.models import Borrower
from src.prediction.scorer import get_scorer
from src.explainability.explainer import get_explainer
from src.genai.gemini_advisor import get_advisor
from src.reports.pdf_generator import generate_credit_passport_pdf

router = APIRouter(prefix="/api/passport", tags=["Alternative Credit Passport PDF"])


@router.get("/pdf/{borrower_id}")
def download_passport_by_id(borrower_id: str, db: Session = Depends(get_db)):
    """Generate and stream PDF report for an existing borrower."""
    borrower_record = db.query(Borrower).filter(Borrower.borrower_id == borrower_id).first()
    if not borrower_record:
        raise HTTPException(status_code=404, detail=f"Borrower {borrower_id} not found")

    profile = borrower_record.to_dict()
    scorer = get_scorer()
    score_data = scorer.score_applicant(profile)

    explainer = get_explainer()
    explain_data = explainer.explain_applicant(score_data["feature_matrix"], top_k=5)

    advisor = get_advisor()
    advice_data = advisor.generate_advice(
        credit_score=score_data["credit_score"],
        risk_band=score_data["risk_band"],
        approval_probability=score_data["approval_probability"],
        strengths=explain_data["strengths"],
        weaknesses=explain_data["weaknesses"],
        borrower_profile=profile,
        pillars=score_data["pillars"]
    )

    pdf_bytes = generate_credit_passport_pdf(
        borrower_profile=profile,
        score_data=score_data,
        explain_data=explain_data,
        advice_data=advice_data
    )

    filename = f"CredX_Passport_{borrower_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.post("/pdf")
def generate_custom_passport(payload: Dict[str, Any] = Body(...)):
    """Generate and stream PDF report for custom input profile on the fly."""
    profile = payload.copy()
    if "borrower_id" not in profile:
        profile["borrower_id"] = "B_CUSTOM_APPLICANT"

    scorer = get_scorer()
    score_data = scorer.score_applicant(profile)

    explainer = get_explainer()
    explain_data = explainer.explain_applicant(score_data["feature_matrix"], top_k=5)

    advisor = get_advisor()
    advice_data = advisor.generate_advice(
        credit_score=score_data["credit_score"],
        risk_band=score_data["risk_band"],
        approval_probability=score_data["approval_probability"],
        strengths=explain_data["strengths"],
        weaknesses=explain_data["weaknesses"],
        borrower_profile=profile,
        pillars=score_data["pillars"]
    )

    pdf_bytes = generate_credit_passport_pdf(
        borrower_profile=profile,
        score_data=score_data,
        explain_data=explain_data,
        advice_data=advice_data
    )

    filename = f"CredX_Passport_{profile['borrower_id']}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

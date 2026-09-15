"""
CredX - Borrower Management Routes
Lists pre-configured personas and enables creating new applicants.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List

from src.database.db import get_db
from src.database.models import Borrower

router = APIRouter(prefix="/api/borrowers", tags=["Borrowers & Personas"])


class BorrowerCreateSchema(BaseModel):
    borrower_id: str = Field(..., example="B_CUSTOM_01")
    name: Optional[str] = Field("New Applicant", example="Anita Sharma")
    age: int = Field(28, example=28)
    borrower_type: str = Field("gig", example="gig")
    state: str = Field("Maharashtra", example="Maharashtra")
    household_size: int = Field(2, example=3)
    employment_type: str = Field("salaried-gig", example="self-employed")
    months_at_current_job: int = Field(12, example=18)
    num_income_sources: int = Field(2, example=2)
    income_month_1: float = Field(..., example=25000.0)
    income_month_2: float = Field(..., example=26000.0)
    income_month_3: float = Field(..., example=27000.0)
    income_month_4: float = Field(..., example=25500.0)
    income_month_5: float = Field(..., example=28000.0)
    income_month_6: float = Field(..., example=29000.0)
    upi_transactions_per_month: float = Field(50.0, example=65.0)
    upi_avg_transaction_amount: float = Field(1500.0, example=1800.0)
    upi_months_active: float = Field(18.0, example=24.0)
    mobile_wallet_used: float = Field(1.0, example=1.0)
    utility_bills_paid: int = Field(20, example=22)
    utility_bills_total: int = Field(24, example=24)
    rent_paid_on_time_months: float = Field(20.0, example=22.0)
    total_rental_months: float = Field(24.0, example=24.0)
    same_number_since_year: float = Field(2018.0, example=2018.0)
    avg_monthly_recharge_amount: float = Field(499.0, example=599.0)
    recharge_frequency_per_month: float = Field(2.0, example=2.2)
    ecomm_orders_per_month: float = Field(8.0, example=10.0)
    ecomm_return_rate: float = Field(0.05, example=0.08)
    prepaid_orders_ratio: float = Field(0.80, example=0.85)
    survey_q1: float = Field(4.0, example=4.0)
    survey_q2: float = Field(4.0, example=4.0)
    survey_q3: float = Field(4.0, example=4.0)
    survey_q4: float = Field(4.0, example=4.0)
    survey_q5: float = Field(4.0, example=4.0)
    survey_q6: float = Field(4.0, example=4.0)
    survey_q7: float = Field(3.0, example=3.0)
    survey_q8: float = Field(4.0, example=4.0)
    loan_amount_requested: float = Field(100000.0, example=80000.0)
    loan_purpose: str = Field("business", example="business")
    loan_tenure_months: int = Field(24, example=24)


@router.get("")
def list_borrowers(limit: int = 50, db: Session = Depends(get_db)):
    """List available borrower personas and sample profiles."""
    borrowers = db.query(Borrower).order_by(Borrower.id.asc()).limit(limit).all()
    return {
        "count": len(borrowers),
        "borrowers": [b.to_dict() for b in borrowers]
    }


@router.get("/{borrower_id}")
def get_borrower(borrower_id: str, db: Session = Depends(get_db)):
    """Retrieve profile by borrower_id."""
    borrower = db.query(Borrower).filter(Borrower.borrower_id == borrower_id).first()
    if not borrower:
        raise HTTPException(status_code=404, detail=f"Borrower {borrower_id} not found")
    return borrower.to_dict()


@router.post("")
def create_borrower(payload: BorrowerCreateSchema, db: Session = Depends(get_db)):
    """Register a new applicant in the database."""
    existing = db.query(Borrower).filter(Borrower.borrower_id == payload.borrower_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Borrower ID {payload.borrower_id} already exists")

    borrower_data = payload.model_dump()
    borrower = Borrower(**borrower_data)
    db.add(borrower)
    db.commit()
    db.refresh(borrower)

    return {
        "message": "Borrower registered successfully",
        "borrower": borrower.to_dict()
    }

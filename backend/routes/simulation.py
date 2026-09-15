"""
CredX - Score Improvement Simulator & Time-to-Approval Routes
Enables interactive what-if modeling and month-by-month trajectory tracking.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any

from src.database.db import get_db
from src.database.models import Borrower, SimulationLog
from src.utils.simulator import get_simulator

router = APIRouter(prefix="/api/simulate", tags=["Score Improvement Simulator"])


@router.post("")
def run_simulation(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Simulate what-if behavioral adjustments:
    Payload format:
    {
      "borrower_id": "B_GIG_01" (or "profile": {...}),
      "modifications": {
         "utility_payment_rate": 0.95,
         "rent_reliability_rate": 0.98,
         "smooth_income_months": true,
         "upi_transactions_per_month": 90.0,
         "upi_months_active": 24.0
      }
    }
    """
    simulator = get_simulator()
    
    b_id = payload.get("borrower_id")
    base_profile = payload.get("profile")

    if b_id:
        record = db.query(Borrower).filter(Borrower.borrower_id == b_id).first()
        if not record:
            raise HTTPException(status_code=404, detail=f"Borrower {b_id} not found")
        base_profile = record.to_dict()
    elif not base_profile:
        raise HTTPException(status_code=400, detail="Must provide either 'borrower_id' or 'profile'")

    modifications = payload.get("modifications", {})
    simulation_result = simulator.simulate_improvements(base_profile, modifications)

    # Persist simulation log if borrower ID exists
    if b_id:
        existing_borrower = db.query(Borrower).filter(Borrower.borrower_id == b_id).first()
        if existing_borrower:
            sim_log = SimulationLog(
                borrower_id=b_id,
                baseline_score=simulation_result["baseline"]["credit_score"],
                simulated_score=simulation_result["simulated"]["credit_score"],
                score_delta=simulation_result["deltas"]["score_change"],
                baseline_approval=simulation_result["baseline"]["approval_probability"],
                simulated_approval=simulation_result["simulated"]["approval_probability"],
                approval_delta=simulation_result["deltas"]["approval_probability_change"],
                modifications=modifications,
                trajectory=simulation_result["trajectory"]
            )
            db.add(sim_log)
            db.commit()

    return simulation_result

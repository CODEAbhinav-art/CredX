"""
CredX - What-If Score Improvement Simulator & Time-to-Approval Estimator
Allows borrowers to simulate behavioral changes:
1. Improving utility bill payment discipline
2. Improving rent reliability
3. Smoothing income volatility
4. Increasing UPI digital transaction frequency
5. Computes month-by-month trajectory toward loan readiness
"""

import copy
import numpy as np
from src.prediction.scorer import get_scorer


class CredXSimulator:
    def __init__(self):
        self.scorer = get_scorer()

    def simulate_improvements(self, base_profile: dict, modifications: dict) -> dict:
        """
        Re-evaluate an applicant under hypothetical improved behaviors.
        Modifications can include:
        - utility_payment_rate (0.0 to 1.0)
        - rent_reliability_rate (0.0 to 1.0)
        - income_stability_factor (multiplier or smoothed std)
        - upi_transactions_per_month
        - upi_months_active
        """
        # Baseline score
        baseline_result = self.scorer.score_applicant(base_profile)
        base_score = baseline_result["credit_score"]
        base_approval = baseline_result["approval_probability"]
        base_prob = baseline_result["default_probability"]

        # Create modified profile
        sim_profile = copy.deepcopy(base_profile)

        # 1. Modify utility payments
        if "utility_payment_rate" in modifications:
            new_rate = float(modifications["utility_payment_rate"])
            tot = float(sim_profile.get("utility_bills_total", 24) or 24)
            sim_profile["utility_bills_paid"] = int(round(new_rate * tot))

        # 2. Modify rent payments
        if "rent_reliability_rate" in modifications:
            new_rent_rate = float(modifications["rent_reliability_rate"])
            rent_tot = float(sim_profile.get("total_rental_months", 12) or 12)
            sim_profile["rent_paid_on_time_months"] = int(round(new_rent_rate * rent_tot))

        # 3. Modify income stability (smooth income months towards mean)
        if "smooth_income_months" in modifications and modifications["smooth_income_months"]:
            inc_cols = [f"income_month_{i}" for i in range(1, 7)]
            current_vals = [float(sim_profile.get(c, 20000)) for c in inc_cols]
            avg = sum(current_vals) / 6.0
            # Blend 70% towards average to simulate steadier earnings
            for i, c in enumerate(inc_cols):
                sim_profile[c] = round(0.30 * current_vals[i] + 0.70 * avg, 2)

        # 4. Modify UPI activity
        if "upi_transactions_per_month" in modifications:
            sim_profile["upi_transactions_per_month"] = float(modifications["upi_transactions_per_month"])

        if "upi_months_active" in modifications:
            sim_profile["upi_months_active"] = float(modifications["upi_months_active"])

        # Re-score with simulated profile
        sim_result = self.scorer.score_applicant(sim_profile)
        sim_score = sim_result["credit_score"]
        sim_approval = sim_result["approval_probability"]
        sim_prob = sim_result["default_probability"]

        score_delta = sim_score - base_score
        approval_delta = round(sim_approval - base_approval, 1)

        # Generate Time-to-Approval trajectory
        trajectory = self.estimate_time_to_approval(
            current_approval=base_approval,
            target_approval=sim_approval,
            current_score=base_score,
            target_score=sim_score
        )

        return {
            "baseline": {
                "credit_score": base_score,
                "approval_probability": base_approval,
                "default_probability": base_prob,
                "risk_band": baseline_result["risk_band"],
                "pillars": baseline_result["pillars"]
            },
            "simulated": {
                "credit_score": sim_score,
                "approval_probability": sim_approval,
                "default_probability": sim_prob,
                "risk_band": sim_result["risk_band"],
                "pillars": sim_result["pillars"]
            },
            "deltas": {
                "score_change": score_delta,
                "approval_probability_change": approval_delta,
                "improved": score_delta > 0
            },
            "trajectory": trajectory
        }

    def estimate_time_to_approval(
        self,
        current_approval: float,
        target_approval: float,
        current_score: int,
        target_score: int
    ) -> dict:
        """
        Estimate month-by-month trajectory toward loan readiness (target 80%+ prime).
        """
        readiness_threshold = 80.0
        
        # If already ready
        if current_approval >= readiness_threshold:
            return {
                "is_loan_ready": True,
                "months_required": 0,
                "readiness_status": "Loan Ready Now",
                "monthly_projections": [
                    {"month": 0, "approval_prob": current_approval, "score": current_score, "status": "Prime Eligible"}
                ]
            }

        # Calculate monthly gradual gains
        # Milestone gap between current and projected/ideal
        target_cap = max(target_approval, 82.0)
        gap = target_cap - current_approval

        # Month 1: 35% of improvement
        m1_approval = round(min(100.0, current_approval + gap * 0.38), 1)
        m1_score = int(round(current_score + (target_score - current_score) * 0.38))

        # Month 2: 70% of improvement
        m2_approval = round(min(100.0, current_approval + gap * 0.72), 1)
        m2_score = int(round(current_score + (target_score - current_score) * 0.72))

        # Month 3: 100% of improvement
        m3_approval = round(min(100.0, current_approval + gap * 1.0), 1)
        m3_score = int(round(current_score + (target_score - current_score) * 1.0))

        # Determine when threshold is crossed
        if m1_approval >= readiness_threshold:
            months_needed = 1
        elif m2_approval >= readiness_threshold:
            months_needed = 2
        else:
            months_needed = 3

        projections = [
            {"month": 0, "approval_prob": current_approval, "score": current_score, "status": "Current Assessment"},
            {"month": 1, "approval_prob": m1_approval, "score": m1_score, "status": "Early Gains (30 Days)"},
            {"month": 2, "approval_prob": m2_approval, "score": m2_score, "status": "Substantial Progress (60 Days)"},
            {"month": 3, "approval_prob": m3_approval, "score": m3_score, "status": "Target Loan Readiness (90 Days)"}
        ]

        return {
            "is_loan_ready": False,
            "current_approval": current_approval,
            "projected_approval": m3_approval,
            "months_required": months_needed,
            "readiness_status": f"Expected Readiness: {months_needed} month{'s' if months_needed > 1 else ''}",
            "monthly_projections": projections
        }


_simulator_instance = None


def get_simulator() -> CredXSimulator:
    """Singleton getter for CredXSimulator."""
    global _simulator_instance
    if _simulator_instance is None:
        _simulator_instance = CredXSimulator()
    return _simulator_instance

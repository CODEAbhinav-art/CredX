"""
CredX Backend — Pydantic Schemas
All request/response models for the API.
"""

from __future__ import annotations
from pydantic import BaseModel, Field, model_validator
from typing import Optional
from enum import Enum


# ────────────────────────────────────────────────
# Enums
# ────────────────────────────────────────────────

class RiskBand(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


# ────────────────────────────────────────────────
# Shared: SHAP contributor item
# ────────────────────────────────────────────────

class SHAPContributor(BaseModel):
    feature: str
    feature_label: str          # Human-readable label
    shap_value: float           # Signed SHAP value
    feature_value: float        # Actual input value
    impact_direction: str       # "positive" | "negative"


# ────────────────────────────────────────────────
# Sub-scores
# ────────────────────────────────────────────────

class SubScores(BaseModel):
    income_stability: int = Field(ge=0, description="Income stability sub-score")
    payment_reliability: int = Field(ge=0, description="Payment reliability sub-score")
    digital_behaviour: int = Field(ge=0, description="Digital behaviour sub-score")


# ────────────────────────────────────────────────
# Score Request — what the user provides
# ────────────────────────────────────────────────

class ScoreRequest(BaseModel):
    # Payment behaviour
    utility_payment_consistency: float = Field(ge=0.0, le=1.0, description="% months with on-time utility payments")
    rent_payment_consistency: float = Field(ge=0.0, le=1.0, description="% months with on-time rent payments")
    avg_payment_delay_days: float = Field(ge=0.0, le=90.0, description="Average payment delay in days")
    failed_payment_frequency: float = Field(ge=0.0, le=24.0, description="Failed/bounced payments per year")

    # Income stability
    avg_monthly_income: float = Field(ge=1000.0, le=1000000.0, description="Average monthly income in INR")
    income_volatility: float = Field(ge=0.0, le=2.0, description="Coefficient of variation of monthly income")
    income_consistency: float = Field(ge=0.0, le=1.0, description="% months with positive income")
    income_trend: float = Field(ge=-1.0, le=1.0, description="Income trend direction (-1 declining, +1 growing)")

    # Transaction behaviour
    transaction_success_rate: float = Field(ge=0.0, le=1.0, description="% transactions that succeeded")
    spending_volatility: float = Field(ge=0.0, le=2.0, description="CV of monthly spending")
    recurring_payment_count: float = Field(ge=0.0, le=30.0, description="Count of regular subscriptions/EMIs paid")
    essential_spending_ratio: float = Field(ge=0.0, le=1.0, description="Ratio of essential to total spending")
    avg_monthly_transactions: float = Field(ge=0.0, le=1000.0, description="Avg transactions per month")

    # Digital/telecom behaviour
    mobile_recharge_regularity: float = Field(ge=0.0, le=1.0, description="% months with consistent mobile recharge")
    digital_transaction_consistency: float = Field(ge=0.0, le=1.0, description="% months with regular digital payments")
    months_of_digital_activity: float = Field(ge=1.0, le=120.0, description="Total months of digital history")

    # Optional persona label for demo
    persona_label: Optional[str] = Field(default=None, description="Optional label e.g. 'Persona A'")


# ────────────────────────────────────────────────
# Score Response
# ────────────────────────────────────────────────

class ScoreResponse(BaseModel):
    credx_score: int = Field(ge=300, le=900, description="CredX Score (300–900). Not a CIBIL score.")
    risk_band: RiskBand
    approval_likelihood: float = Field(ge=0.0, le=1.0, description="Model-estimated likelihood. Not a guarantee.")
    sub_scores: SubScores
    top_positive_contributors: list[SHAPContributor]
    top_negative_contributors: list[SHAPContributor]
    base_shap_value: float
    gemini_advisor: Optional[dict] = None
    disclaimer: str = "CredX Score is an alternative credit health indicator. It is not a CIBIL score and does not represent a formal credit assessment. Approval likelihood is a model estimate only."

    model_config = {"use_enum_values": True}


# ────────────────────────────────────────────────
# Simulate Request / Response
# ────────────────────────────────────────────────

class SimulateRequest(BaseModel):
    original: ScoreRequest
    modified: ScoreRequest


class SimulateResponse(BaseModel):
    original_score: int
    simulated_score: int
    score_delta: int
    original_risk_band: RiskBand
    simulated_risk_band: RiskBand
    changed_features: list[str]
    llm_explanation: str
    disclaimer: str = "Simulated score is an estimate only. Actual credit decisions are made by lenders using their own criteria."

    model_config = {"use_enum_values": True}


# ────────────────────────────────────────────────
# Copilot Request / Response
# ────────────────────────────────────────────────

class CopilotRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500, description="User's question about their score")
    score_context: ScoreResponse


class CopilotResponse(BaseModel):
    answer: str
    key_points: list[str]
    is_ai_generated: bool = True
    disclaimer: str = "This explanation is generated by an AI language model to help you understand the scoring model's output. It is not financial or legal advice."


# ────────────────────────────────────────────────
# Health check
# ────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    llm_available: bool
    version: str = "1.0.0"

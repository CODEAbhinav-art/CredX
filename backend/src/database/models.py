"""
CredX - SQLAlchemy Database Models
Defines tables for:
1. Borrower profiles
2. Credit Assessments (Scores, SHAP, AI advice)
3. What-if Simulation Logs
"""

import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .db import Base


class Borrower(Base):
    __tablename__ = "borrowers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    borrower_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    age = Column(Integer, nullable=False)
    borrower_type = Column(String(50), nullable=False)      # gig, migrant, rural
    state = Column(String(50), nullable=False)
    household_size = Column(Integer, default=2)
    employment_type = Column(String(50), nullable=False)    # daily-wage, self-employed, etc.
    months_at_current_job = Column(Integer, default=12)
    num_income_sources = Column(Integer, default=1)
    
    # Financial fields
    income_month_1 = Column(Float, default=0.0)
    income_month_2 = Column(Float, default=0.0)
    income_month_3 = Column(Float, default=0.0)
    income_month_4 = Column(Float, default=0.0)
    income_month_5 = Column(Float, default=0.0)
    income_month_6 = Column(Float, default=0.0)
    
    # Digital & utility behavior
    upi_transactions_per_month = Column(Float, default=0.0)
    upi_avg_transaction_amount = Column(Float, default=0.0)
    upi_months_active = Column(Float, default=0.0)
    mobile_wallet_used = Column(Float, default=0.0)
    utility_bills_paid = Column(Integer, default=0)
    utility_bills_total = Column(Integer, default=0)
    rent_paid_on_time_months = Column(Float, default=0.0)
    total_rental_months = Column(Float, default=0.0)
    same_number_since_year = Column(Float, default=2020.0)
    avg_monthly_recharge_amount = Column(Float, default=0.0)
    recharge_frequency_per_month = Column(Float, default=0.0)
    ecomm_orders_per_month = Column(Float, default=0.0)
    ecomm_return_rate = Column(Float, default=0.0)
    prepaid_orders_ratio = Column(Float, default=0.0)
    
    # Survey psychometrics
    survey_q1 = Column(Float, default=3.0)
    survey_q2 = Column(Float, default=3.0)
    survey_q3 = Column(Float, default=3.0)
    survey_q4 = Column(Float, default=3.0)
    survey_q5 = Column(Float, default=3.0)
    survey_q6 = Column(Float, default=3.0)
    survey_q7 = Column(Float, default=3.0)
    survey_q8 = Column(Float, default=3.0)
    
    # Loan specifics
    loan_amount_requested = Column(Float, default=50000.0)
    loan_purpose = Column(String(50), default="business")
    loan_tenure_months = Column(Integer, default=24)

    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    assessments = relationship("CreditAssessment", back_populates="borrower", cascade="all, delete-orphan")
    simulations = relationship("SimulationLog", back_populates="borrower", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class CreditAssessment(Base):
    __tablename__ = "credit_assessments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    borrower_id = Column(String(50), ForeignKey("borrowers.borrower_id"), index=True, nullable=False)
    
    credit_score = Column(Integer, nullable=False)
    risk_band = Column(String(50), nullable=False)
    default_probability = Column(Float, nullable=False)
    approval_probability = Column(Float, nullable=False)
    loan_readiness = Column(Float, nullable=False)
    
    # JSON payloads
    pillars = Column(JSON, nullable=True)
    strengths = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    ai_advice = Column(JSON, nullable=True)
    
    assessed_at = Column(DateTime, default=datetime.utcnow)

    borrower = relationship("Borrower", back_populates="assessments")


class SimulationLog(Base):
    __tablename__ = "simulation_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    borrower_id = Column(String(50), ForeignKey("borrowers.borrower_id"), index=True, nullable=False)
    
    baseline_score = Column(Integer, nullable=False)
    simulated_score = Column(Integer, nullable=False)
    score_delta = Column(Integer, nullable=False)
    
    baseline_approval = Column(Float, nullable=False)
    simulated_approval = Column(Float, nullable=False)
    approval_delta = Column(Float, nullable=False)
    
    modifications = Column(JSON, nullable=True)
    trajectory = Column(JSON, nullable=True)
    
    simulated_at = Column(DateTime, default=datetime.utcnow)

    borrower = relationship("Borrower", back_populates="simulations")

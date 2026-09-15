"""
CredX - Database Initializer & Sample Seeder
Creates tables in Neon PostgreSQL and seeds representative personas.
"""

import os
import pandas as pd
from .db import engine, SessionLocal, Base
from .models import Borrower, CreditAssessment, SimulationLog

PERSONAS = [
    {
        "borrower_id": "B_GIG_01",
        "name": "Ramesh Kumar (Zomato Delivery Partner)",
        "age": 27,
        "borrower_type": "gig",
        "state": "Maharashtra",
        "household_size": 3,
        "employment_type": "salaried-gig",
        "months_at_current_job": 18,
        "num_income_sources": 2,
        "income_month_1": 28500.0,
        "income_month_2": 31200.0,
        "income_month_3": 33000.0,
        "income_month_4": 29800.0,
        "income_month_5": 32500.0,
        "income_month_6": 34100.0,
        "upi_transactions_per_month": 92.0,
        "upi_avg_transaction_amount": 1850.0,
        "upi_months_active": 24.0,
        "mobile_wallet_used": 1.0,
        "utility_bills_paid": 22,
        "utility_bills_total": 24,
        "rent_paid_on_time_months": 21.0,
        "total_rental_months": 24.0,
        "same_number_since_year": 2018.0,
        "avg_monthly_recharge_amount": 599.0,
        "recharge_frequency_per_month": 2.2,
        "ecomm_orders_per_month": 12.0,
        "ecomm_return_rate": 0.08,
        "prepaid_orders_ratio": 0.85,
        "survey_q1": 4.0, "survey_q2": 4.0, "survey_q3": 5.0, "survey_q4": 4.0,
        "survey_q5": 4.0, "survey_q6": 4.0, "survey_q7": 3.0, "survey_q8": 4.0,
        "loan_amount_requested": 85000.0,
        "loan_purpose": "business",
        "loan_tenure_months": 24
    },
    {
        "borrower_id": "B_FREE_02",
        "name": "Priya Sharma (Freelance Graphic Designer)",
        "age": 25,
        "borrower_type": "gig",
        "state": "Karnataka",
        "household_size": 1,
        "employment_type": "self-employed",
        "months_at_current_job": 24,
        "num_income_sources": 3,
        "income_month_1": 42000.0,
        "income_month_2": 46500.0,
        "income_month_3": 39000.0,
        "income_month_4": 48000.0,
        "income_month_5": 51000.0,
        "income_month_6": 47500.0,
        "upi_transactions_per_month": 115.0,
        "upi_avg_transaction_amount": 2600.0,
        "upi_months_active": 30.0,
        "mobile_wallet_used": 1.0,
        "utility_bills_paid": 24,
        "utility_bills_total": 24,
        "rent_paid_on_time_months": 23.0,
        "total_rental_months": 24.0,
        "same_number_since_year": 2016.0,
        "avg_monthly_recharge_amount": 699.0,
        "recharge_frequency_per_month": 2.5,
        "ecomm_orders_per_month": 16.0,
        "ecomm_return_rate": 0.12,
        "prepaid_orders_ratio": 0.90,
        "survey_q1": 5.0, "survey_q2": 4.0, "survey_q3": 4.0, "survey_q4": 5.0,
        "survey_q5": 4.0, "survey_q6": 5.0, "survey_q7": 2.0, "survey_q8": 4.0,
        "loan_amount_requested": 150000.0,
        "loan_purpose": "education",
        "loan_tenure_months": 36
    },
    {
        "borrower_id": "B_RURL_03",
        "name": "Sunita Devi (Rural Dairy Entrepreneur)",
        "age": 38,
        "borrower_type": "rural",
        "state": "Madhya Pradesh",
        "household_size": 5,
        "employment_type": "self-employed",
        "months_at_current_job": 36,
        "num_income_sources": 2,
        "income_month_1": 19500.0,
        "income_month_2": 21000.0,
        "income_month_3": 18500.0,
        "income_month_4": 22000.0,
        "income_month_5": 20500.0,
        "income_month_6": 23000.0,
        "upi_transactions_per_month": 35.0,
        "upi_avg_transaction_amount": 950.0,
        "upi_months_active": 14.0,
        "mobile_wallet_used": 0.0,
        "utility_bills_paid": 20,
        "utility_bills_total": 24,
        "rent_paid_on_time_months": 0.0,
        "total_rental_months": 0.0,
        "same_number_since_year": 2017.0,
        "avg_monthly_recharge_amount": 349.0,
        "recharge_frequency_per_month": 1.5,
        "ecomm_orders_per_month": 3.0,
        "ecomm_return_rate": 0.0,
        "prepaid_orders_ratio": 0.60,
        "survey_q1": 3.0, "survey_q2": 4.0, "survey_q3": 3.0, "survey_q4": 4.0,
        "survey_q5": 4.0, "survey_q6": 3.0, "survey_q7": 3.0, "survey_q8": 4.0,
        "loan_amount_requested": 60000.0,
        "loan_purpose": "agriculture",
        "loan_tenure_months": 18
    },
    {
        "borrower_id": "B_KIRN_04",
        "name": "Vikram Patel (Kirana Store Owner)",
        "age": 42,
        "borrower_type": "gig",
        "state": "Gujarat",
        "household_size": 4,
        "employment_type": "self-employed",
        "months_at_current_job": 48,
        "num_income_sources": 2,
        "income_month_1": 36000.0,
        "income_month_2": 38500.0,
        "income_month_3": 41000.0,
        "income_month_4": 35000.0,
        "income_month_5": 39500.0,
        "income_month_6": 42000.0,
        "upi_transactions_per_month": 140.0,
        "upi_avg_transaction_amount": 3100.0,
        "upi_months_active": 32.0,
        "mobile_wallet_used": 1.0,
        "utility_bills_paid": 23,
        "utility_bills_total": 24,
        "rent_paid_on_time_months": 22.0,
        "total_rental_months": 24.0,
        "same_number_since_year": 2014.0,
        "avg_monthly_recharge_amount": 799.0,
        "recharge_frequency_per_month": 2.8,
        "ecomm_orders_per_month": 8.0,
        "ecomm_return_rate": 0.05,
        "prepaid_orders_ratio": 0.95,
        "survey_q1": 4.0, "survey_q2": 4.0, "survey_q3": 4.0, "survey_q4": 4.0,
        "survey_q5": 4.0, "survey_q6": 4.0, "survey_q7": 2.0, "survey_q8": 3.0,
        "loan_amount_requested": 200000.0,
        "loan_purpose": "business",
        "loan_tenure_months": 36
    }
]


def init_and_seed_db():
    """Create all tables and seed default personas."""
    print("Creating tables in database...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    db = SessionLocal()
    try:
        # Check if personas already exist
        for p in PERSONAS:
            existing = db.query(Borrower).filter(Borrower.borrower_id == p["borrower_id"]).first()
            if not existing:
                borrower = Borrower(**p)
                db.add(borrower)
                print(f"Seeded persona: {p['name']} ({p['borrower_id']})")
        db.commit()

        # Seed additional records from cleaned_dataset.csv if database has < 20 records
        total_count = db.query(Borrower).count()
        if total_count < 20:
            csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed", "cleaned_dataset.csv"))
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path).head(30)
                for _, row in df.iterrows():
                    b_id = str(row["borrower_id"])
                    if not db.query(Borrower).filter(Borrower.borrower_id == b_id).first():
                        r_dict = row.to_dict()
                        # Clean columns not in Borrower table
                        r_dict.pop("default_probability", None)
                        r_dict.pop("defaulted", None)
                        r_dict["name"] = f"Applicant {b_id}"
                        db.add(Borrower(**r_dict))
                db.commit()
                print(f"Seeded additional dataset records. Total borrowers: {db.query(Borrower).count()}")
    except Exception as e:
        print(f"Seeding error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_and_seed_db()

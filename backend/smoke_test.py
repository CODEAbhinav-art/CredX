import json
import sys

# Ensure backend directory is in path
sys.path.append('d:/WHYBE/backend')

from src.prediction.scorer import get_scorer
from src.explainability.explainer import get_explainer

print("Initializing Scorer...")
scorer = get_scorer()
print("Initializing Explainer...")
explainer = get_explainer()

synthetic_applicant = {
    "avg_monthly_income": 45000,
    "income_volatility": 0.05,
    "income_consistency": 0.95,
    "income_trend": 1000,
    "utility_payment_consistency": 1.0,
    "rent_payment_consistency": 1.0,
    "avg_payment_delay_days": 0,
    "failed_payment_frequency": 0,
    "transaction_success_rate": 0.99,
    "spending_volatility": 0.1,
    "recurring_payment_count": 4,
    "essential_spending_ratio": 0.4,
    "avg_monthly_transactions": 25,
    "mobile_recharge_regularity": 1.0,
    "digital_transaction_consistency": 0.9,
    "months_of_digital_activity": 24
}

print("\n--- Testing Scorer ---")
score_result = scorer.score_applicant(synthetic_applicant)
print(json.dumps(score_result, indent=2, default=str))

print("\n--- Testing Explainer ---")
shap_result = explainer.explain(synthetic_applicant)
print(json.dumps(shap_result, indent=2, default=str))

print("\nSMOKE TEST PASSED")

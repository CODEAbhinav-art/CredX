"""
CredX - Generative AI Advisor (Gemini 2.5 Flash)
Produces:
1. Supportive, transparent credit explanation
2. Strength recognition narrative ("What you are doing well")
3. Vulnerability breakdown ("What is hurting your score")
4. Personalized 30 / 60 / 90-day action roadmap
5. High-resilience fallback generation for 100% uptime
"""

import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")))


class CredXAdvisor:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Warning: Could not initialize Gemini client: {e}")

    def generate_advice(
        self,
        credit_score: int,
        risk_band: str,
        approval_probability: float,
        strengths: list[dict],
        weaknesses: list[dict],
        borrower_profile: dict,
        pillars: dict
    ) -> dict:
        """
        Generate empathetic, actionable credit analysis using Gemini 2.5 Flash,
        with seamless automated fallback if API limits or errors occur.
        """
        prompt = self._build_prompt(
            credit_score=credit_score,
            risk_band=risk_band,
            approval_prob=approval_probability,
            strengths=strengths,
            weaknesses=weaknesses,
            profile=borrower_profile,
            pillars=pillars
        )

        # Attempt call to Gemini
        if self.client:
            models_to_try = ["gemini-2.5-flash"]
            for model_name in models_to_try:
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config={
                            "response_mime_type": "application/json"
                        }
                    )
                    if response and response.text:
                        parsed = json.loads(response.text)
                        parsed["source"] = f"Gemini ({model_name})"
                        return parsed
                except Exception as e:
                    print(f"Gemini API ({model_name}) notice: {e}")
                    break  # Fail fast to intelligent fallback if key/network is unavailable

        # If API failed or was unavailable, use intelligent heuristic generation
        return self._generate_fallback_advice(
            credit_score=credit_score,
            risk_band=risk_band,
            approval_prob=approval_probability,
            strengths=strengths,
            weaknesses=weaknesses,
            profile=borrower_profile,
            pillars=pillars
        )

    def _build_prompt(
        self,
        credit_score: int,
        risk_band: str,
        approval_prob: float,
        strengths: list[dict],
        weaknesses: list[dict],
        profile: dict,
        pillars: dict
    ) -> str:
        strengths_txt = "\n".join([f"- {s['title']}: {s['description']}" for s in strengths])
        weaknesses_txt = "\n".join([f"- {w['title']}: {w['description']}" for w in weaknesses])

        return f"""
You are the supportive, encouraging AI Credit Coach for CredX (TrustScore AI) — a platform helping gig workers, freelancers, and underserved borrowers access fair credit beyond traditional CIBIL scores.

Review the applicant's profile and behavioral data:
- Borrower Type: {profile.get('borrower_type', 'Gig Worker')}
- Employment Type: {profile.get('employment_type', 'Self-employed')}
- Monthly Avg Income: ₹{pillars.get('avg_income', 25000):,.2f}
- Loan Requested: ₹{profile.get('loan_amount_requested', 100000):,.2f} for {profile.get('loan_purpose', 'business')}
- Credit Score: {credit_score} / 900
- Risk Category: {risk_band}
- Approval Probability: {approval_prob}%
- Income Stability Score: {pillars.get('income_stability_score', 70)} / 100
- Payment Reliability Score: {pillars.get('payment_reliability_score', 65)} / 100
- Digital Trust Score: {pillars.get('digital_trust_score', 50)} / 100

Key Strengths (SHAP Positive Factors):
{strengths_txt}

Key Areas for Improvement (SHAP Negative Factors):
{weaknesses_txt}

Generate a supportive, transparent, and non-judgmental response in strict JSON with the following schema:
{{
  "summary_headline": "Short 1-sentence encouraging assessment title",
  "explanation_narrative": "A warm, transparent 2-3 paragraph explanation of why they received this score, acknowledging their hard work in the informal economy, highlighting what is working well and clearly detailing what held their score back.",
  "strengths_summary": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
  "weaknesses_summary": ["Clear actionable area 1", "Clear actionable area 2"],
  "improvement_plan": {{
    "day_30": "Specific action to take within the first 30 days (e.g. utility bill automation, clearing small dues)",
    "day_60": "Specific action for days 31-60 (e.g. boosting UPI transaction consistency, maintaining rent cadence)",
    "day_90": "Specific milestone for days 61-90 (e.g. smoothing income volatility, building reserve buffer)"
  }},
  "time_to_approval_summary": "Estimated months required to reach prime 80%+ loan readiness, with progressive milestone estimates"
}}
"""

    def _generate_fallback_advice(
        self,
        credit_score: int,
        risk_band: str,
        approval_prob: float,
        strengths: list[dict],
        weaknesses: list[dict],
        profile: dict,
        pillars: dict
    ) -> dict:
        """Rule-based intelligent fallback generator matching hackathon requirements."""
        b_type = str(profile.get("borrower_type", "worker")).capitalize()

        if credit_score >= 700:
            headline = f"Prime Credit Profile: Exceptional Alternative Financial Health"
            tone_opening = f"Your alternative credit assessment is very strong. As a {b_type}, you have demonstrated commendable payment discipline and resilient financial behavior that traditional CIBIL scores frequently overlook."
            time_estimate = "Ready Now — Eligible for instant loan approval at competitive interest rates."
            plan_30 = "Automate electricity and recurring utility bill payments to sustain a 100% on-time track record."
            plan_60 = "Direct all primary client or platform earnings into your registered UPI account to maintain maximum digital velocity."
            plan_90 = "Maintain average monthly deposits above your historical median to unlock higher borrowing limits."
        elif credit_score >= 550:
            headline = f"Emerging Credit Profile: Strong Potential with Clear Path to Prime"
            tone_opening = f"You have established solid alternative financial foundations. While traditional banks might hesitate due to lack of bureau history, your digital payments and active income demonstrate real repayment capacity with a few manageable adjustments."
            time_estimate = "1 to 2 Months — You can cross the 80% prime approval threshold with steady utility bill discipline."
            plan_30 = "Clear any overdue utility bills and pay the next cycle at least 3 days ahead of due dates."
            plan_60 = "Conduct at least 15-20 routine transactions via UPI to demonstrate consistent cash-flow velocity."
            plan_90 = "Preserve rental payment timestamps and maintain predictable monthly savings to buffer income variance."
        else:
            headline = f"Credit Building Journey: Actionable Steps to Loan Readiness"
            tone_opening = f"We believe every worker deserves access to credit. Your score reflects short-term cash flow volatility and recent payment gaps rather than lack of effort. Following a disciplined 90-day cycle will significantly strengthen your loan eligibility."
            time_estimate = "2 to 3 Months — Systematic payment regularity will boost your approval probability from {approval_prob}% to over 80%."
            plan_30 = "Settle all pending utility notices immediately and request receipts for rent payments."
            plan_60 = "Diversify earnings across regular weekly milestones to stabilize monthly income fluctuations."
            plan_90 = "Build a 60-day unbroken streak of on-time digital payments to qualify for partner microlending."

        strengths_list = [s["description"] for s in strengths[:3]] if strengths else [
            "Demonstrated active monthly earning capability",
            "Continuous presence on digital platforms"
        ]
        weaknesses_list = [w["description"] for w in weaknesses[:3]] if weaknesses else [
            "Moderate income volatility between seasonal cycles",
            "Opportunities to improve on-time bill settlement frequency"
        ]

        narrative = (
            f"{tone_opening} "
            f"Your current TrustScore is {credit_score} out of 900, placing you in the {risk_band} band with an approval probability of {approval_prob}%. "
            f"Your main advantages lie in your {strengths[0]['title'].lower() if strengths else 'earnings consistency'}, which provides a dependable buffer. "
            f"By focusing on {weaknesses[0]['title'].lower() if weaknesses else 'bill payment timing'}, your eligibility can rise rapidly."
        )

        return {
            "summary_headline": headline,
            "explanation_narrative": narrative,
            "strengths_summary": strengths_list,
            "weaknesses_summary": weaknesses_list,
            "improvement_plan": {
                "day_30": plan_30,
                "day_60": plan_60,
                "day_90": plan_90
            },
            "time_to_approval_summary": time_estimate,
            "source": "CredX Intelligent Behavioral Engine"
        }


_advisor_instance = None


def get_advisor() -> CredXAdvisor:
    """Singleton getter for CredXAdvisor."""
    global _advisor_instance
    if _advisor_instance is None:
        _advisor_instance = CredXAdvisor()
    return _advisor_instance

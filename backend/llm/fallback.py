"""
CredX — Deterministic Fallback LLM Provider
Template-based explanation that works without any external API.
This is always available and activates automatically when Gemini fails.
"""

from __future__ import annotations
from backend.llm.provider import LLMProvider
from backend.models.schemas import CopilotResponse


class FallbackProvider(LLMProvider):
    """
    Deterministic template-based explanation provider.
    No external API dependency. Always succeeds.
    """

    @property
    def is_available(self) -> bool:
        return True

    def generate_copilot_response(
        self,
        question: str,
        context: dict,
    ) -> CopilotResponse:
        score = context.get("credx_score", "N/A")
        risk_band = context.get("risk_band", "N/A")
        positives = context.get("top_positive_contributors", [])
        negatives = context.get("top_negative_contributors", [])

        pos_labels = [p.get("feature_label", p.get("feature", "")) for p in positives[:3]]
        neg_labels = [n.get("feature_label", n.get("feature", "")) for n in negatives[:3]]

        q_lower = question.lower()

        if any(kw in q_lower for kw in ["why", "reason", "cause", "explain"]):
            answer = (
                f"Your CredX Score of {score} ({risk_band} Risk) is driven by multiple alternative "
                f"data signals. Your strongest positive factors are: {', '.join(pos_labels) or 'consistent payment patterns'}. "
                f"Factors that are pulling the score down include: {', '.join(neg_labels) or 'income variability'}. "
                f"The model weighs these signals together to estimate your credit health."
            )
            key_points = [
                f"Score: {score} | Risk Band: {risk_band}",
                f"Helping: {', '.join(pos_labels) or 'N/A'}",
                f"Hurting: {', '.join(neg_labels) or 'N/A'}",
            ]

        elif any(kw in q_lower for kw in ["hurt", "negative", "drag", "lower", "worst"]):
            answer = (
                f"The factors most negatively affecting your CredX Score of {score} are: "
                f"{', '.join(neg_labels) or 'payment delays and income inconsistency'}. "
                f"Each of these pushes the model's estimate lower. Improving consistency "
                f"in these areas is likely to have the most positive impact over time."
            )
            key_points = [f"Top negative factors: {', '.join(neg_labels) or 'N/A'}"]

        elif any(kw in q_lower for kw in ["help", "positive", "strength", "good", "best"]):
            answer = (
                f"Your strongest financial behaviours contributing to your CredX Score of {score} are: "
                f"{', '.join(pos_labels) or 'consistent digital payment patterns'}. "
                f"These signals demonstrate reliability and help the model estimate a stronger credit profile."
            )
            key_points = [f"Top positive factors: {', '.join(pos_labels) or 'N/A'}"]

        elif any(kw in q_lower for kw in ["improve", "increase", "better", "raise", "boost"]):
            answer = (
                f"To improve your CredX Score of {score}, focus on: "
                f"(1) reducing payment delays — aim for 0 days late, "
                f"(2) stabilising your monthly income — lower volatility signals reliability, "
                f"(3) maintaining consistent digital transaction patterns. "
                f"Note: The simulator can estimate the impact of specific changes. "
                f"These are model-derived estimates, not guaranteed outcomes."
            )
            key_points = [
                "Reduce payment delays",
                "Stabilise monthly income",
                "Maintain digital consistency",
            ]

        elif any(kw in q_lower for kw in ["income", "salary", "earning"]):
            answer = (
                f"Income signals are a significant component of your CredX Score. "
                f"The model considers average monthly income, income volatility, and consistency over time. "
                f"Higher and more stable income generally improves the score, while irregular income "
                f"(high volatility) can reduce it even if the average is high. "
                f"Your current score is {score} ({risk_band} Risk)."
            )
            key_points = [
                "Income average, volatility, and consistency all matter",
                "Stability matters as much as magnitude",
            ]

        else:
            answer = (
                f"Your CredX Score is {score}, placing you in the {risk_band} Risk category. "
                f"This score is calculated from alternative financial signals including payment consistency, "
                f"income stability, and digital transaction behaviour. "
                f"Ask me about specific factors, how to improve, or run a simulation to see how changes affect your score."
            )
            key_points = [
                f"CredX Score: {score}",
                f"Risk Band: {risk_band}",
                "Ask about specific factors or improvements",
            ]

        return CopilotResponse(
            answer=answer,
            key_points=key_points,
            is_ai_generated=False,
            disclaimer=(
                "This explanation is generated from a deterministic template (AI service unavailable). "
                "It is based on your model output and is not financial or legal advice."
            ),
        )

    def generate_simulation_explanation(
        self,
        original_score: int,
        simulated_score: int,
        changed_features: list[str],
        original_contributors: list[dict],
        simulated_contributors: list[dict],
    ) -> str:
        delta = simulated_score - original_score
        direction = "increased" if delta > 0 else "decreased"
        feature_labels = ", ".join(
            f.replace("_", " ").title() for f in changed_features[:3]
        )
        return (
            f"Based on the simulated changes to {feature_labels}, the model estimates your "
            f"CredX Score would {direction} by {abs(delta)} points — from {original_score} to {simulated_score}. "
            f"This is a model estimate only. Actual credit decisions depend on lender-specific criteria."
        )

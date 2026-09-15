"""
CredX — Gemini LLM Provider
Implements LLMProvider using Google's Gemini Flash model.
Falls back gracefully on any error.
"""

from __future__ import annotations
import json
import logging
from backend.llm.provider import LLMProvider
from backend.llm.fallback import FallbackProvider
from backend.models.schemas import CopilotResponse

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are the CredX AI Credit Copilot — a helpful, honest assistant that explains 
alternative credit scores to users. Your role is ONLY to explain the model's output in plain English.

CRITICAL RULES:
1. You do NOT make credit decisions. The XGBoost model makes the score. You explain it.
2. Never invent numerical scores or percentages. Only use the numbers provided to you.
3. Never claim the CredX score is a CIBIL score.
4. Never guarantee loan approval or rejection.
5. Always frame recommendations as "the model estimates" or "based on the data".
6. Be empathetic, clear, and consumer-friendly. Avoid jargon.
7. Keep answers concise (3–5 sentences for the main answer).

Output format: Return a JSON object with keys "answer" (string) and "key_points" (list of 2-3 strings).
"""


class GeminiProvider(LLMProvider):
    """
    LLM provider backed by Google Gemini Flash.
    Automatically falls back to FallbackProvider on any error.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash") -> None:
        self._api_key = api_key
        self._model_name = model_name
        self._client = None
        self._fallback = FallbackProvider()
        self._available = False
        self._initialize()

    def _initialize(self) -> None:
        if not self._api_key:
            logger.warning("GeminiProvider: No API key configured. Fallback will be used.")
            return
        try:
            import google.generativeai as genai
            genai.configure(api_key=self._api_key)
            self._client = genai.GenerativeModel(
                model_name=self._model_name,
                system_instruction=SYSTEM_INSTRUCTION,
            )
            self._available = True
            logger.info(f"GeminiProvider initialized with model: {self._model_name}")
        except Exception as e:
            logger.error(f"GeminiProvider initialization failed: {e}")
            self._available = False

    @property
    def is_available(self) -> bool:
        return self._available

    def _build_copilot_prompt(self, question: str, context: dict) -> str:
        score = context.get("credx_score", "N/A")
        risk_band = context.get("risk_band", "N/A")
        approval_pct = round(context.get("approval_likelihood", 0) * 100, 1)

        positives = context.get("top_positive_contributors", [])[:3]
        negatives = context.get("top_negative_contributors", [])[:3]

        pos_str = "\n".join(
            f"  - {p.get('feature_label', p.get('feature', ''))}: SHAP = {p.get('shap_value', 0):.3f}"
            for p in positives
        )
        neg_str = "\n".join(
            f"  - {n.get('feature_label', n.get('feature', ''))}: SHAP = {n.get('shap_value', 0):.3f}"
            for n in negatives
        )

        sub = context.get("sub_scores", {})

        return f"""CredX Score Context:
- CredX Score: {score} / 900
- Risk Band: {risk_band}
- Estimated Approval Likelihood: {approval_pct}% (model estimate only)
- Income Stability Sub-score: {sub.get('income_stability', 'N/A')}
- Payment Reliability Sub-score: {sub.get('payment_reliability', 'N/A')}
- Digital Behaviour Sub-score: {sub.get('digital_behaviour', 'N/A')}

Top factors HELPING the score (positive SHAP values):
{pos_str or '  - None identified'}

Top factors HURTING the score (negative SHAP values):
{neg_str or '  - None identified'}

User's question: "{question}"

Respond with a JSON object: {{"answer": "...", "key_points": ["...", "...", "..."]}}"""

    def generate_copilot_response(
        self,
        question: str,
        context: dict,
    ) -> CopilotResponse:
        if not self._available:
            return self._fallback.generate_copilot_response(question, context)

        try:
            prompt = self._build_copilot_prompt(question, context)
            response = self._client.generate_content(prompt)
            text = response.text.strip()

            # Parse JSON response
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            parsed = json.loads(text)
            return CopilotResponse(
                answer=parsed.get("answer", "Unable to generate explanation."),
                key_points=parsed.get("key_points", []),
                is_ai_generated=True,
            )
        except json.JSONDecodeError as e:
            logger.warning(f"GeminiProvider: JSON parse error: {e}. Using fallback.")
            return self._fallback.generate_copilot_response(question, context)
        except Exception as e:
            logger.error(f"GeminiProvider: API error: {e}. Using fallback.")
            return self._fallback.generate_copilot_response(question, context)

    def generate_simulation_explanation(
        self,
        original_score: int,
        simulated_score: int,
        changed_features: list[str],
        original_contributors: list[dict],
        simulated_contributors: list[dict],
    ) -> str:
        if not self._available:
            return self._fallback.generate_simulation_explanation(
                original_score, simulated_score, changed_features,
                original_contributors, simulated_contributors,
            )

        delta = simulated_score - original_score
        direction = "increase" if delta > 0 else "decrease"
        feature_list = ", ".join(f.replace("_", " ").title() for f in changed_features[:3])

        prompt = f"""A CredX user ran a score simulation.
Original CredX Score: {original_score}
Simulated CredX Score: {simulated_score} (a {direction} of {abs(delta)} points)
Features changed: {feature_list}

In 2-3 sentences, explain why the score changed in plain English.
Rules: Do not invent numbers. Frame it as a model estimate. Do not guarantee any outcome.
Return only the explanation text, no JSON."""

        try:
            response = self._client.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"GeminiProvider simulation explanation error: {e}")
            return self._fallback.generate_simulation_explanation(
                original_score, simulated_score, changed_features,
                original_contributors, simulated_contributors,
            )

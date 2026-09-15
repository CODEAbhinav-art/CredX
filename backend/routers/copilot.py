"""
CredX — Copilot Router
POST /copilot: AI Credit Copilot Q&A powered by Gemini Flash.
"""

from fastapi import APIRouter
from backend.models.schemas import CopilotRequest, CopilotResponse

router = APIRouter()


@router.post("/copilot", response_model=CopilotResponse, tags=["AI Copilot"])
async def ask_copilot(request: CopilotRequest) -> CopilotResponse:
    """
    AI Credit Copilot — answers user questions about their CredX score.

    Architecture enforced:
    - The LLM receives only: score, risk band, top SHAP contributors, and user question.
    - The LLM does NOT receive PII, raw transaction data, or sensitive personal details.
    - The LLM explains the model output — it does NOT make credit decisions.
    - If Gemini fails, the deterministic fallback activates automatically.
    """
    from backend.main import llm_provider  # injected singleton

    # Build minimal context (no PII)
    context = request.score_context.model_dump(exclude={"disclaimer"})

    response = llm_provider.generate_copilot_response(
        question=request.question.strip(),
        context=context,
    )
    return response

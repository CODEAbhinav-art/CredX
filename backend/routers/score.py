"""
CredX — Score Router
POST /score: Given alternative credit features, return CredX score + SHAP explanation.
"""

from fastapi import APIRouter, HTTPException
from backend.models.schemas import ScoreRequest, ScoreResponse
from backend.models.credit_model import credit_model
from backend.models.shap_explainer import shap_explainer
from backend.utils.feature_engineering import request_to_feature_vector, FEATURE_NAMES
from backend.utils.score_mapper import probability_to_credx_score, credx_score_to_risk_band

router = APIRouter()


@router.post("/score", response_model=ScoreResponse, tags=["Core"])
async def compute_score(request: ScoreRequest) -> ScoreResponse:
    """
    Compute the CredX score from alternative credit features.

    The ML model produces the score. SHAP explains it.
    The LLM is not involved in this endpoint.
    """
    if not credit_model.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="ML model is not yet loaded. Please try again shortly.",
        )

    # Step 1: Convert request to feature vector
    X = request_to_feature_vector(request)
    feature_values = {feat: getattr(request, feat) for feat in FEATURE_NAMES}

    # Step 2: Run ML model
    probability = credit_model.predict_proba(X)

    # Step 3: Map to CredX score and risk band
    credx_score = probability_to_credx_score(probability)
    risk_band = credx_score_to_risk_band(credx_score)

    # Step 4: SHAP explanation
    pos_contributors, neg_contributors, base_shap, sub_scores = shap_explainer.explain(
        X=X,
        feature_values=feature_values,
        base_probability=probability,
        top_n=5,
    )

    return ScoreResponse(
        credx_score=credx_score,
        risk_band=risk_band,
        approval_likelihood=round(probability, 4),
        sub_scores=sub_scores,
        top_positive_contributors=pos_contributors,
        top_negative_contributors=neg_contributors,
        base_shap_value=round(base_shap, 4),
    )

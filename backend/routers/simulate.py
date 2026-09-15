"""
CredX — Simulate Router
POST /simulate: Re-run the ML model with modified feature inputs and explain the delta.
"""

from fastapi import APIRouter, HTTPException
from backend.models.schemas import SimulateRequest, SimulateResponse
from backend.models.credit_model import credit_model
from backend.models.shap_explainer import shap_explainer
from backend.utils.feature_engineering import request_to_feature_vector, FEATURE_NAMES
from backend.utils.score_mapper import probability_to_credx_score, credx_score_to_risk_band

router = APIRouter()

# LLM provider is injected at startup via app state
# Accessed via request.app.state.llm_provider


@router.post("/simulate", response_model=SimulateResponse, tags=["Simulator"])
async def simulate_score(request: SimulateRequest) -> SimulateResponse:
    """
    What-if simulation: re-run the ML model with modified inputs.

    Architecture enforced:
    - The ML model produces both the original and simulated scores.
    - The LLM explains the delta in natural language.
    - The LLM does NOT invent numerical results.
    """
    if not credit_model.is_loaded:
        raise HTTPException(status_code=503, detail="ML model not loaded.")

    # Step 1: Score original
    X_orig = request_to_feature_vector(request.original)
    prob_orig = credit_model.predict_proba(X_orig)
    score_orig = probability_to_credx_score(prob_orig)
    band_orig = credx_score_to_risk_band(score_orig)

    # Step 2: Score modified
    X_mod = request_to_feature_vector(request.modified)
    prob_mod = credit_model.predict_proba(X_mod)
    score_mod = probability_to_credx_score(prob_mod)
    band_mod = credx_score_to_risk_band(score_mod)

    # Step 3: Identify changed features
    orig_vals = {f: getattr(request.original, f) for f in FEATURE_NAMES}
    mod_vals = {f: getattr(request.modified, f) for f in FEATURE_NAMES}
    changed = [f for f in FEATURE_NAMES if orig_vals[f] != mod_vals[f]]

    # Step 4: SHAP for both (for LLM context)
    fv_orig = {feat: getattr(request.original, feat) for feat in FEATURE_NAMES}
    fv_mod = {feat: getattr(request.modified, feat) for feat in FEATURE_NAMES}

    pos_orig, neg_orig, _, _ = shap_explainer.explain(X_orig, fv_orig, prob_orig, top_n=3)
    pos_mod, neg_mod, _, _ = shap_explainer.explain(X_mod, fv_mod, prob_mod, top_n=3)

    # Step 5: LLM explains the delta (note: imported lazily to access app state)
    # This is called from main.py context — llm_provider available as global
    from backend.main import llm_provider  # noqa: F401 — injected singleton

    orig_contrib_dicts = [c.model_dump() for c in pos_orig + neg_orig]
    mod_contrib_dicts = [c.model_dump() for c in pos_mod + neg_mod]

    explanation = llm_provider.generate_simulation_explanation(
        original_score=score_orig,
        simulated_score=score_mod,
        changed_features=changed,
        original_contributors=orig_contrib_dicts,
        simulated_contributors=mod_contrib_dicts,
    )

    return SimulateResponse(
        original_score=score_orig,
        simulated_score=score_mod,
        score_delta=score_mod - score_orig,
        original_risk_band=band_orig,
        simulated_risk_band=band_mod,
        changed_features=changed,
        llm_explanation=explanation,
    )

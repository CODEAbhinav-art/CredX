"""
CredX — Score Mapper & Risk Classifier
Maps raw model probability to CredX score (300–900) and risk band.
"""

from backend.models.schemas import RiskBand


def probability_to_credx_score(probability: float) -> int:
    """
    Linear mapping from model probability [0, 1] → CredX score [300, 900].
    Clamped to valid range.
    """
    score = round(300 + probability * 600)
    return max(300, min(900, score))


def credx_score_to_risk_band(score: int) -> RiskBand:
    """
    Classify CredX score into risk band.
    - 700–900 → Low
    - 550–699 → Medium
    - 300–549 → High
    """
    if score >= 700:
        return RiskBand.LOW
    elif score >= 550:
        return RiskBand.MEDIUM
    else:
        return RiskBand.HIGH


def sub_score_from_shap_group(
    shap_values: list[float],
    base_prob: float,
) -> int:
    """
    Derive a sub-score from the net SHAP contribution of a feature group.

    The net SHAP contribution shifts the base probability, which is then
    mapped to the 300–900 scale. This ensures sub-scores are grounded in
    the actual model explanation.
    """
    net_shap = sum(shap_values)
    adjusted_prob = max(0.0, min(1.0, base_prob + net_shap))
    return probability_to_credx_score(adjusted_prob)

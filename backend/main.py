"""
CredX — FastAPI Main Application
Entry point for the CredX backend API.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.models.credit_model import credit_model
from backend.models.shap_explainer import shap_explainer
from backend.models.schemas import HealthResponse
from backend.llm.gemini_provider import GeminiProvider
from backend.llm.fallback import FallbackProvider
from backend.llm.provider import LLMProvider

from backend.routers import score, simulate, copilot, passport

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

settings = get_settings()

# ────────────────────────────────────────────────
# LLM Provider — selected at startup
# ────────────────────────────────────────────────
# Decision: Use GeminiProvider if key is configured and not forced to fallback.
# Otherwise use FallbackProvider. This is the single point of LLM selection.

def _build_llm_provider() -> LLMProvider:
    if settings.llm_force_fallback or not settings.gemini_api_key:
        logger.info("LLM: Using deterministic FallbackProvider.")
        return FallbackProvider()
    provider = GeminiProvider(
        api_key=settings.gemini_api_key,
        model_name=settings.gemini_model,
    )
    if provider.is_available:
        logger.info(f"LLM: Using GeminiProvider ({settings.gemini_model}).")
    else:
        logger.warning("LLM: GeminiProvider failed to initialize. Using FallbackProvider.")
        return FallbackProvider()
    return provider


# Module-level singleton — imported by routers
llm_provider: LLMProvider = _build_llm_provider()


# ────────────────────────────────────────────────
# Startup / Shutdown lifecycle
# ────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML model and SHAP explainer at startup."""
    logger.info("CredX Backend starting up...")
    try:
        credit_model.load()
        logger.info("✓ ML model loaded successfully.")
        shap_explainer.initialize(credit_model.get_booster())
        logger.info("✓ SHAP explainer initialized.")
    except FileNotFoundError as e:
        logger.error(f"✗ {e}")
        logger.error("  → Run `python ml/train.py` to generate model artifacts, then restart.")
    except Exception as e:
        logger.error(f"✗ Unexpected error during startup: {e}")

    yield

    logger.info("CredX Backend shutting down.")


# ────────────────────────────────────────────────
# FastAPI App
# ────────────────────────────────────────────────

app = FastAPI(
    title="CredX API",
    description=(
        "Explainable Alternative Credit Scoring API for New-to-Credit Users. "
        "CredX Score is not a CIBIL score. All outputs are model estimates."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.backend_cors_origin, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(score.router, prefix="/api")
app.include_router(simulate.router, prefix="/api")
app.include_router(copilot.router, prefix="/api")
app.include_router(passport.router, prefix="/api")


# ────────────────────────────────────────────────
# Health check
# ────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=credit_model.is_loaded,
        llm_available=llm_provider.is_available,
    )


@app.get("/", tags=["System"])
async def root():
    return {
        "product": "CredX",
        "description": "Explainable Alternative Credit Scoring API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }

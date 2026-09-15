"""
CredX - Production FastAPI Application
TrustScore AI: Creditworthiness Beyond CIBIL
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from src.database.db import engine, Base
from src.database.seed import init_and_seed_db
from src.prediction.scorer import get_scorer
from src.explainability.explainer import get_explainer

# Import API Routers
from routes.health import router as health_router
from routes.borrowers import router as borrowers_router
from routes.scoring import router as scoring_router
from routes.simulation import router as simulation_router
from routes.passport import router as passport_router

app = FastAPI(
    title="CredX — Alternative Credit Scoring API",
    description="""
    ## CredX: Creditworthiness Beyond CIBIL
    An AI-powered alternative credit scoring platform that uses alternative financial behavior signals 
    (income stability, payment reliability, digital trust, and mobile tenure) to estimate creditworthiness, 
    explain decisions transparently with TreeSHAP, provide supportive GenAI advice via Gemini 2.5 Flash, 
    run what-if score simulations, and generate downloadable Alternative Credit Passport PDFs.
    
    ### Key Endpoints:
    * **/api/health**: System, Database (Neon PostgreSQL), and Model Status
    * **/api/metrics**: Model comparison benchmarks (Logistic Regression vs Random Forest vs XGBoost)
    * **/api/borrowers**: Pre-loaded personas and custom applicant registration
    * **/api/score**: Full scoring, SHAP explainability, and Gemini AI coaching
    * **/api/simulate**: Interactive What-If score simulator & time-to-approval trajectory
    * **/api/passport/pdf/{borrower_id}**: Downloadable ReportLab Alternative Credit Passport PDF
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for frictionless frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(borrowers_router)
app.include_router(scoring_router)
app.include_router(simulation_router)
app.include_router(passport_router)


@app.on_event("startup")
def on_startup():
    """Warm up database tables, seed sample personas, and preload ML models into memory."""
    print("=" * 60)
    print("CredX Backend Initializing...")
    try:
        init_and_seed_db()
        print("Database tables & sample personas ready.")
    except Exception as e:
        print(f"Startup DB warning: {e}")

    try:
        scorer = get_scorer()
        print("Scoring Engine warmed up. Model:", type(scorer.model).__name__)
        explainer = get_explainer()
        print("TreeSHAP Explainer warmed up. Base Value:", round(float(explainer.explainer.expected_value), 4))
    except Exception as e:
        print(f"Startup Model warning: {e}")

    print("CredX Backend is Ready!")
    print("Interactive Documentation: http://localhost:8000/docs")
    print("=" * 60)


@app.get("/", include_in_schema=False)
def root():
    """Redirect root to OpenAPI Swagger documentation."""
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

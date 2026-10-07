from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.connectors.simulator import ScenarioSimulator
from app.routers import analytics, decisions, anomalies, policies, outcomes, simulator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ascend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Checking baseline simulation seed state...")
    async with AsyncSessionLocal() as session:
        await ScenarioSimulator.seed_initial_state(session)
    logger.info("ASCEND Decision Engine online and ready.")
    yield
    logger.info("Shutting down ASCEND Decision Engine...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS setup for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(decisions.router, prefix=settings.API_V1_STR)
app.include_router(anomalies.router, prefix=settings.API_V1_STR)
app.include_router(policies.router, prefix=settings.API_V1_STR)
app.include_router(outcomes.router, prefix=settings.API_V1_STR)
app.include_router(simulator.router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ASCEND Autonomous Decision Engine",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to ASCEND — Autonomous Cross-Channel Intelligence & Decision Engine",
        "documentation": "/docs"
    }

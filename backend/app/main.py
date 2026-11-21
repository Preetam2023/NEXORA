"""FastAPI application entry point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import litellm
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# Claude on SAP AI Core rejects temperature param — drop silently instead of erroring
litellm.drop_params = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting NEXORA backend (env=%s)", settings.app_env)

    # Create all tables
    from app.core.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database tables ready")
    yield
    logger.info("Shutting down NEXORA backend")
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="NEXORA API",
        description="Agentic Project Intelligence Platform",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.app_env == "local" else "/docs",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    from app.api.routes import (
        projects, meetings, decisions, conflicts, tasks, copilot, dashboard, risks
    )
    app.include_router(projects.router)
    app.include_router(meetings.router)
    app.include_router(decisions.router)
    app.include_router(conflicts.router)
    app.include_router(tasks.router)
    app.include_router(copilot.router)
    app.include_router(dashboard.router)
    app.include_router(risks.router)

    @app.get("/health", tags=["health"])
    async def health():
        ai_status = "disabled"
        if settings.ai_enabled and settings.aicore_client_id:
            ai_status = "connected"
        return {"status": "ok", "ai_core": ai_status}

    return app


app = create_app()

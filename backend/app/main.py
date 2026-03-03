# FastAPI application factory for MintKey
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.logging import LoggingMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("mintkey")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("MintKey API starting up")
    yield
    logger.info("MintKey API shutting down")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="MintKey API",
        description="AI-powered career targeting platform — backend API",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom middleware
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)

    # Import and include routers
    from app.routers import users, scores, analysis, roadmap, trends
    app.include_router(users.router)
    app.include_router(scores.router)
    app.include_router(analysis.router)
    app.include_router(roadmap.router)
    app.include_router(trends.router)

    # Health check
    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok", "service": "mintkey-api", "version": "0.1.0"}

    return app


app = create_app()

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

    # Custom middleware (added first = innermost in Starlette stack)
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)

    # CORS — added LAST so it's the OUTERMOST middleware
    # This ensures CORS headers are always present, even on error responses
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Import and include routers
    from app.routers import users, scores, analysis, roadmap, trends, auth, sync, companies, dashboard, dsa, practice
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(scores.router)
    app.include_router(analysis.router)
    app.include_router(roadmap.router)
    app.include_router(trends.router)
    app.include_router(sync.router)
    app.include_router(companies.router)
    app.include_router(dashboard.router)
    app.include_router(dsa.router)
    app.include_router(practice.router)

    # Health check
    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok", "service": "mintkey-api", "version": "0.1.0"}

    return app


app = create_app()

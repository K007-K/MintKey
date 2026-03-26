# Roadmap endpoints — CRUD for user-generated preparation roadmaps
import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.core.database import async_session_factory
from app.middleware.auth import get_current_user
from app.models.db import User
from app.models.schemas import APIResponse
from app.repositories.roadmaps import RoadmapRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/roadmap", tags=["roadmap"])


class UpdateProgressRequest(BaseModel):
    current_week: int = 1
    progress_pct: float = 0.0


@router.get("/", response_model=APIResponse)
async def list_roadmaps(current_user: User = Depends(get_current_user)):
    """List all roadmaps for the current user."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            roadmaps = await repo.list_for_user(current_user.id)
            result = []
            for rm in roadmaps:
                result.append({
                    "id": str(rm.id),
                    "company_slug": rm.company_slug,
                    "total_weeks": rm.total_weeks,
                    "hours_per_day": rm.hours_per_day,
                    "current_week": rm.current_week,
                    "progress_pct": rm.progress_pct,
                    "weeks_data": rm.weeks_data,
                    "generated_at": rm.generated_at.isoformat() if rm.generated_at else None,
                    "updated_at": rm.updated_at.isoformat() if rm.updated_at else None,
                })
            return APIResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"Failed to list roadmaps: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.get("/{company_slug}", response_model=APIResponse)
async def get_roadmap(
    company_slug: str,
    current_user: User = Depends(get_current_user),
):
    """Get the roadmap for a specific company."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.get_by_company(current_user.id, company_slug)
            if not rm:
                return APIResponse(success=True, data=None)
            return APIResponse(success=True, data={
                "id": str(rm.id),
                "company_slug": rm.company_slug,
                "total_weeks": rm.total_weeks,
                "hours_per_day": rm.hours_per_day,
                "current_week": rm.current_week,
                "progress_pct": rm.progress_pct,
                "weeks_data": rm.weeks_data,
                "generated_at": rm.generated_at.isoformat() if rm.generated_at else None,
                "updated_at": rm.updated_at.isoformat() if rm.updated_at else None,
            })
    except Exception as e:
        logger.error(f"Failed to get roadmap: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.patch("/{company_slug}/progress", response_model=APIResponse)
async def update_progress(
    company_slug: str,
    payload: UpdateProgressRequest,
    current_user: User = Depends(get_current_user),
):
    """Update roadmap progress (current week + percentage)."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.update_progress(
                current_user.id,
                company_slug,
                payload.current_week,
                payload.progress_pct,
            )
            if not rm:
                return APIResponse(success=False, data=None, error="Roadmap not found")
            await session.commit()
            return APIResponse(success=True, data={
                "company_slug": rm.company_slug,
                "current_week": rm.current_week,
                "progress_pct": rm.progress_pct,
            })
    except Exception as e:
        logger.error(f"Failed to update progress: {e}")
        return APIResponse(success=False, data=None, error=str(e))

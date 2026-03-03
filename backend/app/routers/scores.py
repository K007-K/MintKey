# Match score endpoints
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.db import User
from app.models.schemas import APIResponse, MatchScoreResponse
from app.repositories.scores import ScoreRepository

router = APIRouter(prefix="/api/v1/scores", tags=["scores"])


@router.get("/", response_model=APIResponse)
async def get_match_scores(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all match scores for the current user's target companies."""
    repo = ScoreRepository(db)
    scores = await repo.get_match_scores(current_user.id)
    return APIResponse(
        success=True,
        data=[MatchScoreResponse.model_validate(s).model_dump() for s in scores],
    )


@router.get("/history/{company_slug}", response_model=APIResponse)
async def get_score_history(
    company_slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get match score trend data for a specific company (last 8 data points)."""
    repo = ScoreRepository(db)
    history = await repo.get_match_score_history(current_user.id, company_slug)
    return APIResponse(
        success=True,
        data=[MatchScoreResponse.model_validate(s).model_dump() for s in history],
    )

# Match score endpoints — compute, retrieve, and track score history
import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.db import User, UserSkillGap
from app.models.schemas import APIResponse, MatchScoreResponse
from app.repositories.scores import ScoreRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/scores", tags=["scores"])


class ComputeScoresRequest(BaseModel):
    """Request to compute match scores for target companies."""
    target_companies: list[str]


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


@router.post("/compute", response_model=APIResponse)
async def compute_match_scores(
    payload: ComputeScoresRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Compute match scores for target companies using latest analysis data.
    Stores results in DB and returns score breakdown.
    """
    from app.services.scoring import ScoringEngine
    from app.models.db import AnalysisResult
    from sqlalchemy import select, desc

    # Fetch latest analysis
    result = await db.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == current_user.id)
        .order_by(desc(AnalysisResult.created_at))
        .limit(1)
    )
    latest = result.scalar_one_or_none()

    if not latest or not latest.result_data:
        return APIResponse(
            success=False,
            data=None,
            error="No analysis found. Run /api/v1/analysis/trigger first."
        )

    # Build agent models from stored data
    from agents.core.models import GitHubAnalysis, DSAAnalysis, ResumeData, CompanyBlueprintModel

    analysis_data = latest.result_data
    github = GitHubAnalysis(**analysis_data.get("github_analysis", {})) if analysis_data.get("github_analysis") else None
    dsa = DSAAnalysis(**analysis_data.get("dsa_analysis", {})) if analysis_data.get("dsa_analysis") else None
    resume = ResumeData(**analysis_data.get("resume_data", {})) if analysis_data.get("resume_data") else None

    blueprints = {}
    for slug, bp_data in analysis_data.get("company_blueprints", {}).items():
        blueprints[slug] = CompanyBlueprintModel(**bp_data)

    # Compute scores
    engine = ScoringEngine()
    scores = engine.compute_all_scores(
        target_companies=payload.target_companies,
        github=github,
        dsa=dsa,
        resume=resume,
        blueprints=blueprints,
    )

    # Save scores to DB
    repo = ScoreRepository(db)
    for company_slug, score_data in scores.items():
        await repo.upsert_match_score(
            user_id=current_user.id,
            company_slug=company_slug,
            overall_score=score_data["overall_score"],
            component_scores=score_data["component_scores"],
            weights=score_data["weights"],
            grade=score_data["grade"],
        )

    await db.commit()

    return APIResponse(
        success=True,
        data=scores,
    )


@router.get("/gaps/{company_slug}", response_model=APIResponse)
async def get_skill_gaps(
    company_slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get identified skill gaps for a specific company."""
    try:
        result = await db.execute(
            select(UserSkillGap)
            .where(
                UserSkillGap.user_id == current_user.id,
                UserSkillGap.company_slug == company_slug,
            )
            .order_by(UserSkillGap.priority)
        )
        gaps = result.scalars().all()

        return APIResponse(
            success=True,
            data=[
                {
                    "skill_name": g.skill_name,
                    "priority": g.priority.value if g.priority else "nice_to_have",
                    "current_level": g.current_level,
                    "required_level": g.required_level,
                    "dependency_chain": g.dependency_chain,
                }
                for g in gaps
            ],
        )
    except Exception as e:
        logger.error(f"Failed to get skill gaps for {company_slug}: {e}")
        return APIResponse(success=False, data=[], error="Failed to fetch skill gaps")

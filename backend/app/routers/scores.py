# Match score endpoints — compute, retrieve, and track score history
import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.db import User, UserSkillGap, PlatformScore
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
        .where(
            AnalysisResult.user_id == current_user.id,
            AnalysisResult.status == "completed",
        )
        .order_by(desc(AnalysisResult.completed_at))
        .limit(1)
    )
    latest = result.scalar_one_or_none()

    if not latest or not latest.merged_analysis:
        return APIResponse(
            success=False,
            data=None,
            error="No analysis found. Run /api/v1/analysis/trigger first."
        )

    # Build agent models from stored data
    from agents.core.models import GitHubAnalysis, DSAAnalysis, ResumeData, CompanyBlueprintModel

    analysis_data = latest.merged_analysis
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


@router.get("/platform-stats", response_model=APIResponse)
async def get_platform_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's platform breakdown stats (LeetCode solved counts, GitHub data)."""
    try:
        result = await db.execute(
            select(PlatformScore)
            .where(PlatformScore.user_id == current_user.id)
            .order_by(PlatformScore.synced_at.desc())
        )
        rows = result.scalars().all()

        # Deduplicate by platform (keep latest)
        seen = {}
        for row in rows:
            if row.platform not in seen:
                seen[row.platform] = row

        leetcode = seen.get("leetcode")
        github = seen.get("github")

        lc_breakdown = leetcode.breakdown if leetcode else {}
        gh_breakdown = github.breakdown if github else {}

        # Fetch real per-topic solved counts from LeetCode scraper (cached)
        topic_solved_counts: dict = {}
        if current_user.leetcode_username:
            try:
                from scrapers.leetcode_scraper import LeetCodeScraper
                scraper = LeetCodeScraper()
                topics = await scraper.fetch_topic_stats(current_user.leetcode_username)
                if topics:
                    topic_solved_counts = {t["tag"]: t["solved"] for t in topics}
            except Exception as topic_err:
                logger.warning(f"Failed to fetch topic stats: {topic_err}")

        data = {
            "leetcode": {
                "total_solved": lc_breakdown.get("total_solved", 0),
                "difficulty_distribution": lc_breakdown.get("difficulty_distribution", {}),
                "topic_weakness_map": lc_breakdown.get("topic_weakness_map", {}),
                "topic_solved_counts": topic_solved_counts,
                "dsa_depth_score": lc_breakdown.get("dsa_depth_score", 0),
                "easy_reliance_flag": lc_breakdown.get("easy_reliance_flag", False),
            },
            "github": {
                "project_depth_score": gh_breakdown.get("project_depth_score", 0),
                "engineering_maturity_index": gh_breakdown.get("engineering_maturity_index", 0),
                "language_distribution": gh_breakdown.get("language_distribution", {}),
                "technology_stack": gh_breakdown.get("technology_stack", []),
            },
        }

        return APIResponse(success=True, data=data)
    except Exception as e:
        logger.error(f"Failed to get platform stats: {e}")
        return APIResponse(
            success=False,
            data={"leetcode": {}, "github": {}},
            error="Failed to fetch platform stats",
        )


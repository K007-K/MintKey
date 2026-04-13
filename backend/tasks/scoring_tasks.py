# Score recomputation background tasks
import logging
import asyncio
from uuid import UUID
from datetime import datetime, timezone

from tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Helper to run async code in Celery's sync context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="recompute_match_scores")
def recompute_match_scores(user_id: str) -> dict:
    """
    Recompute match scores for a user against all their target companies.
    Called after any platform sync completes.
    """
    try:
        return _run_async(_recompute(user_id))
    except Exception as e:
        logger.error(f"Score recomputation failed for {user_id}: {e}")
        return {"success": False, "error": str(e)}


async def _recompute(user_id: str) -> dict:
    """Load latest analysis + platform data, recompute scores for all target companies."""
    from sqlalchemy import select, desc, delete
    from app.core.database import async_session_factory
    from app.models.db import (
        AnalysisResult, CompanyMatchScore, UserTargetCompany,
    )
    from app.services.scoring import ScoringEngine
    from agents.core.models import (
        GitHubAnalysis, DSAAnalysis, ResumeData, CompanyBlueprintModel,
    )

    uid = UUID(user_id)
    logger.info(f"Score recomputation starting for user {user_id}")

    async with async_session_factory() as session:
        # 1. Get latest completed analysis
        result = await session.execute(
            select(AnalysisResult)
            .where(
                AnalysisResult.user_id == uid,
                AnalysisResult.status == "completed",
            )
            .order_by(desc(AnalysisResult.completed_at))
            .limit(1)
        )
        latest = result.scalar_one_or_none()

        if not latest or not latest.merged_analysis:
            logger.warning(f"No completed analysis for {user_id} — skipping recompute")
            return {"success": False, "error": "No analysis data available"}

        # 2. Get target companies
        tc_result = await session.execute(
            select(UserTargetCompany).where(UserTargetCompany.user_id == uid)
        )
        target_companies = [tc.company_slug for tc in tc_result.scalars().all()]
        if not target_companies:
            logger.warning(f"No target companies for {user_id} — skipping recompute")
            return {"success": False, "error": "No target companies set"}

        # 3. Build typed Pydantic models from stored analysis
        data = latest.merged_analysis
        github = None
        dsa = None
        resume = None

        try:
            if data.get("github_analysis"):
                github = GitHubAnalysis(**data["github_analysis"])
        except Exception as e:
            logger.warning(f"Failed to parse GitHubAnalysis: {e}")

        try:
            if data.get("dsa_analysis"):
                dsa = DSAAnalysis(**data["dsa_analysis"])
        except Exception as e:
            logger.warning(f"Failed to parse DSAAnalysis: {e}")

        try:
            if data.get("resume_data"):
                resume = ResumeData(**data["resume_data"])
        except Exception as e:
            logger.warning(f"Failed to parse ResumeData: {e}")

        blueprints = {}
        for slug, bp_data in data.get("company_blueprints", {}).items():
            try:
                blueprints[slug] = CompanyBlueprintModel(**bp_data)
            except Exception:
                pass

        # 4. Compute and persist scores
        engine = ScoringEngine()
        recomputed = {}

        for company_slug in target_companies:
            blueprint = blueprints.get(company_slug)
            score_result = engine.compute_match_score(
                company_slug=company_slug,
                github=github,
                dsa=dsa,
                resume=resume,
                blueprint=blueprint,
            )

            overall = score_result["overall_score"]
            breakdown = score_result["component_scores"]

            # Delete old scores for this company
            await session.execute(
                delete(CompanyMatchScore).where(
                    CompanyMatchScore.user_id == uid,
                    CompanyMatchScore.company_slug == company_slug,
                )
            )

            if overall >= 85:
                status_label = "Ready"
            elif overall >= 65:
                status_label = "Almost Ready"
            elif overall >= 40:
                status_label = "Preparing"
            else:
                status_label = "Getting Started"

            session.add(CompanyMatchScore(
                user_id=uid,
                company_slug=company_slug,
                overall_score=overall,
                breakdown=breakdown,
                status_label=status_label,
                weeks_away=max(1, round((100 - overall) / 5)),
            ))

            recomputed[company_slug] = overall

        await session.commit()

    logger.info(f"Score recomputation complete for {user_id}: {recomputed}")
    return {"success": True, "scores": recomputed}

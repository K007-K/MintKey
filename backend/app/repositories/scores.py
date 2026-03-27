# Repository pattern — all score database operations
from uuid import UUID
from typing import Optional  # noqa: F401 — used in type hints below
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.db import CompanyMatchScore, PlatformScore


class ScoreRepository:
    """Encapsulates all score DB operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_match_scores(self, user_id: UUID) -> list[CompanyMatchScore]:
        """Get latest match scores for all target companies (one per company, most recent)."""
        from sqlalchemy import text

        # Use DISTINCT ON to get only the latest score per company
        result = await self.db.execute(
            text("""
                SELECT DISTINCT ON (company_slug) *
                FROM company_match_scores
                WHERE user_id = :uid
                ORDER BY company_slug, computed_at DESC
            """),
            {"uid": str(user_id)},
        )
        rows = result.fetchall()

        # Map raw rows back to ORM objects
        scores = []
        for row in rows:
            score = CompanyMatchScore(
                id=row.id,
                user_id=row.user_id,
                company_slug=row.company_slug,
                overall_score=row.overall_score,
                breakdown=row.breakdown,
                status_label=row.status_label,
                weeks_away=row.weeks_away,
                computed_at=row.computed_at,
            )
            scores.append(score)

        return scores

    async def get_match_score_history(self, user_id: UUID, company_slug: str, limit: int = 8) -> list[CompanyMatchScore]:
        """Get match score time-series for trend charts."""
        result = await self.db.execute(
            select(CompanyMatchScore)
            .where(CompanyMatchScore.user_id == user_id, CompanyMatchScore.company_slug == company_slug)
            .order_by(desc(CompanyMatchScore.computed_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def save_match_score(self, user_id: UUID, company_slug: str, overall_score: float, breakdown: dict) -> CompanyMatchScore:
        """Insert a new match score record (time-series append)."""
        score = CompanyMatchScore(
            user_id=user_id,
            company_slug=company_slug,
            overall_score=overall_score,
            breakdown=breakdown,
            status_label=self._compute_status_label(overall_score),
            weeks_away=self._estimate_weeks_away(overall_score),
        )
        self.db.add(score)
        await self.db.flush()
        return score

    async def upsert_match_score(
        self,
        user_id: UUID,
        company_slug: str,
        overall_score: float,
        component_scores: dict,
        weights: dict,
        grade: str,
    ) -> CompanyMatchScore:
        """Insert a new match score snapshot (always appends for time-series)."""
        breakdown = {
            "component_scores": component_scores,
            "weights": weights,
            "grade": grade,
        }
        return await self.save_match_score(user_id, company_slug, overall_score, breakdown)

    async def get_platform_scores(self, user_id: UUID) -> list[PlatformScore]:
        result = await self.db.execute(
            select(PlatformScore).where(PlatformScore.user_id == user_id)
        )
        return list(result.scalars().all())

    @staticmethod
    def _compute_status_label(score: float) -> str:
        if score >= 80:
            return "Ready"
        if score >= 60:
            return "Almost Ready"
        if score >= 40:
            return "Preparing"
        return "Getting Started"

    @staticmethod
    def _estimate_weeks_away(score: float) -> int:
        gap = max(0, 85 - score)
        return max(0, int(gap / 3))

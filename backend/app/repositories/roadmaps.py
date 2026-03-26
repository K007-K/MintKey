# Repository for user_roadmaps DB operations
import logging
from uuid import UUID
from typing import Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import UserRoadmap

logger = logging.getLogger(__name__)


class RoadmapRepository:
    """CRUD for the user_roadmaps table."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert(
        self,
        user_id: UUID,
        company_slug: str,
        total_weeks: int,
        hours_per_day: int,
        weeks_data: list[dict],
    ) -> UserRoadmap:
        """Insert or replace the roadmap for a user + company pair."""
        # Delete existing roadmap for this company
        await self.session.execute(
            delete(UserRoadmap).where(
                UserRoadmap.user_id == user_id,
                UserRoadmap.company_slug == company_slug,
            )
        )
        roadmap = UserRoadmap(
            user_id=user_id,
            company_slug=company_slug,
            total_weeks=total_weeks,
            hours_per_day=hours_per_day,
            weeks_data=weeks_data,
        )
        self.session.add(roadmap)
        await self.session.flush()
        logger.info(f"Upserted roadmap for user={user_id} company={company_slug}")
        return roadmap

    async def get_by_company(
        self, user_id: UUID, company_slug: str
    ) -> Optional[UserRoadmap]:
        """Get the roadmap for a specific company."""
        result = await self.session.execute(
            select(UserRoadmap)
            .where(
                UserRoadmap.user_id == user_id,
                UserRoadmap.company_slug == company_slug,
            )
            .order_by(UserRoadmap.generated_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: UUID) -> list[UserRoadmap]:
        """List all roadmaps for a user."""
        result = await self.session.execute(
            select(UserRoadmap)
            .where(UserRoadmap.user_id == user_id)
            .order_by(UserRoadmap.generated_at.desc())
        )
        return list(result.scalars().all())

    async def update_progress(
        self,
        user_id: UUID,
        company_slug: str,
        current_week: int,
        progress_pct: float,
    ) -> Optional[UserRoadmap]:
        """Update roadmap progress."""
        roadmap = await self.get_by_company(user_id, company_slug)
        if roadmap:
            roadmap.current_week = current_week
            roadmap.progress_pct = progress_pct
            await self.session.flush()
        return roadmap

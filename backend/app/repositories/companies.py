# Repository pattern — all company blueprint database operations
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.db import CompanyBlueprint


class CompanyRepository:
    """Encapsulates all company blueprint DB operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[CompanyBlueprint]:
        """Fetch all company blueprints ordered by name."""
        result = await self.db.execute(
            select(CompanyBlueprint).order_by(CompanyBlueprint.name)
        )
        return list(result.scalars().all())

    async def get_by_slug(self, slug: str) -> Optional[CompanyBlueprint]:
        """Fetch a single company blueprint by slug."""
        result = await self.db.execute(
            select(CompanyBlueprint).where(CompanyBlueprint.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_scoring_weights(self, slug: str) -> Optional[dict]:
        """Fetch only the scoring_weights JSONB for a company."""
        company = await self.get_by_slug(slug)
        if company and company.scoring_weights:
            return company.scoring_weights
        return None

    async def get_multiple_by_slugs(self, slugs: list[str]) -> list[CompanyBlueprint]:
        """Fetch multiple company blueprints by their slugs."""
        result = await self.db.execute(
            select(CompanyBlueprint).where(CompanyBlueprint.slug.in_(slugs))
        )
        return list(result.scalars().all())

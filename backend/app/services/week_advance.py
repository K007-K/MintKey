# Week auto-advance service — computes current_week based on elapsed time since generation
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import UserRoadmap

logger = logging.getLogger(__name__)


async def auto_advance_week(session: AsyncSession, roadmap: UserRoadmap) -> dict:
    """
    Compute and update current_week based on elapsed real time since roadmap creation.

    Logic:
    - 1 roadmap week = 7 real calendar days
    - current_week = floor((days_elapsed / 7) + 1), clamped to [1, total_weeks]
    - Only advances forward, never goes backward

    Returns stats about what changed.
    """
    if not roadmap.generated_at:
        return {"advanced": False, "reason": "No generated_at timestamp"}

    generated_at = roadmap.generated_at
    if generated_at.tzinfo is None:
        generated_at = generated_at.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    days_elapsed = (now - generated_at).days
    computed_week = min(max((days_elapsed // 7) + 1, 1), roadmap.total_weeks)

    old_week = roadmap.current_week or 1

    if computed_week > old_week:
        roadmap.current_week = computed_week
        roadmap.updated_at = datetime.utcnow()
        logger.info(f"Week auto-advanced: {old_week} → {computed_week} for roadmap {roadmap.id}")
        return {"advanced": True, "old_week": old_week, "new_week": computed_week}

    return {"advanced": False, "current_week": old_week}

# Repository pattern — all DSA progress database operations
from uuid import UUID
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.db import UserDSAProgress


class DSAProgressRepository:
    """Encapsulates all DSA progress DB operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_progress(self, user_id: UUID, sheet: Optional[str] = None) -> list[UserDSAProgress]:
        """Get all solved problems for a user, optionally filtered by sheet."""
        query = select(UserDSAProgress).where(
            UserDSAProgress.user_id == user_id,
            UserDSAProgress.solved == True,  # noqa: E712
        )
        if sheet:
            query = query.where(UserDSAProgress.sheet == sheet)
        query = query.order_by(UserDSAProgress.solved_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_stats(self, user_id: UUID, sheet: Optional[str] = None) -> dict:
        """Get aggregated stats: total, by difficulty, by topic."""
        base_filter = [
            UserDSAProgress.user_id == user_id,
            UserDSAProgress.solved == True,  # noqa: E712
        ]
        if sheet:
            base_filter.append(UserDSAProgress.sheet == sheet)

        # Total by difficulty
        result = await self.db.execute(
            select(
                UserDSAProgress.difficulty,
                func.count().label("count"),
            )
            .where(*base_filter)
            .group_by(UserDSAProgress.difficulty)
        )
        diff_counts = {row.difficulty: row.count for row in result}

        # By topic
        result = await self.db.execute(
            select(
                UserDSAProgress.topic,
                func.count().label("count"),
            )
            .where(*base_filter)
            .group_by(UserDSAProgress.topic)
        )
        topic_counts = {row.topic: row.count for row in result}

        # Last solved
        result = await self.db.execute(
            select(UserDSAProgress.solved_at)
            .where(*base_filter)
            .order_by(UserDSAProgress.solved_at.desc())
            .limit(1)
        )
        last_solved = result.scalar_one_or_none()

        total = sum(diff_counts.values())
        return {
            "total_solved": total,
            "easy": diff_counts.get("Easy", 0),
            "medium": diff_counts.get("Medium", 0),
            "hard": diff_counts.get("Hard", 0),
            "by_topic": topic_counts,
            "last_solved_at": last_solved.isoformat() if last_solved else None,
        }

    async def upsert_progress(
        self,
        user_id: UUID,
        lc_number: Optional[int],
        title: str,
        difficulty: str,
        topic: str,
        sheet: str,
        solved: bool,
    ) -> UserDSAProgress:
        """Mark a problem solved or unsolved. Upserts by (user_id, title, sheet)."""
        result = await self.db.execute(
            select(UserDSAProgress).where(
                UserDSAProgress.user_id == user_id,
                UserDSAProgress.title == title,
                UserDSAProgress.sheet == sheet,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.solved = solved
            existing.solved_at = datetime.utcnow() if solved else existing.solved_at
            await self.db.flush()
            return existing
        else:
            progress = UserDSAProgress(
                user_id=user_id,
                lc_number=lc_number,
                title=title,
                difficulty=difficulty,
                topic=topic,
                sheet=sheet,
                solved=solved,
            )
            self.db.add(progress)
            await self.db.flush()
            return progress

    async def bulk_sync(
        self,
        user_id: UUID,
        sheet: str,
        solved_problems: list[dict],
    ) -> int:
        """Sync a batch of solved problems (from localStorage bulk upload)."""
        synced = 0
        for p in solved_problems:
            await self.upsert_progress(
                user_id=user_id,
                lc_number=p.get("lc_number"),
                title=p["title"],
                difficulty=p.get("difficulty", "Medium"),
                topic=p.get("topic", "General"),
                sheet=sheet,
                solved=True,
            )
            synced += 1
        return synced

    async def get_company_overlap(
        self, user_id: UUID, company_problem_titles: list[str]
    ) -> dict:
        """Calculate overlap between user's solved problems and company requirements."""
        if not company_problem_titles:
            return {"total_required": 0, "solved": 0, "overlap_pct": 0, "solved_titles": []}

        result = await self.db.execute(
            select(UserDSAProgress.title).where(
                UserDSAProgress.user_id == user_id,
                UserDSAProgress.solved == True,  # noqa: E712
                UserDSAProgress.title.in_(company_problem_titles),
            )
        )
        solved_titles = [row[0] for row in result]

        return {
            "total_required": len(company_problem_titles),
            "solved": len(solved_titles),
            "overlap_pct": round(len(solved_titles) / len(company_problem_titles) * 100, 1),
            "solved_titles": solved_titles,
        }

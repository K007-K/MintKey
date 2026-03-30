# Repository for external_problems + user_problem_progress operations
from datetime import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.db import ExternalProblem, UserProblemProgress


class ProblemsRepository:
    """All database operations for the problem bank and user progress."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_problems(
        self,
        source: Optional[str] = None,
        difficulty: Optional[str] = None,
        study_plan: Optional[str] = None,
        pattern: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ExternalProblem]:
        """Fetch problems with optional filters."""
        query = select(ExternalProblem)

        if source:
            query = query.where(ExternalProblem.source == source)
        if difficulty:
            query = query.where(ExternalProblem.difficulty == difficulty)
        if study_plan:
            query = query.where(ExternalProblem.study_plans.any(study_plan))
        if pattern:
            query = query.where(ExternalProblem.pattern == pattern)
        if category:
            query = query.where(ExternalProblem.category == category)
        if search:
            query = query.where(ExternalProblem.title.ilike(f"%{search}%"))

        query = query.order_by(ExternalProblem.title).limit(limit).offset(offset)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_problem_by_id(self, problem_id: UUID) -> Optional[ExternalProblem]:
        """Get a single problem by UUID."""
        result = await self.db.execute(
            select(ExternalProblem).where(ExternalProblem.id == problem_id)
        )
        return result.scalar_one_or_none()

    async def count_problems(
        self,
        source: Optional[str] = None,
        difficulty: Optional[str] = None,
        study_plan: Optional[str] = None,
    ) -> int:
        """Count problems matching filters."""
        query = select(func.count(ExternalProblem.id))
        if source:
            query = query.where(ExternalProblem.source == source)
        if difficulty:
            query = query.where(ExternalProblem.difficulty == difficulty)
        if study_plan:
            query = query.where(ExternalProblem.study_plans.any(study_plan))
        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_study_plan_stats(self) -> list[dict]:
        """Get problem counts per study plan."""
        plans = ["neetcode_150", "neetcode_all", "blind_75", "striver_a2z", "cses"]
        stats = []
        for plan in plans:
            count = await self.count_problems(study_plan=plan)
            if count > 0:
                stats.append({"plan": plan, "total": count})
        return stats

    async def get_user_progress(
        self,
        user_id: UUID,
        problem_ids: Optional[list[UUID]] = None,
    ) -> list[UserProblemProgress]:
        """Get user progress records, optionally filtered by problem IDs."""
        query = select(UserProblemProgress).where(
            UserProblemProgress.user_id == user_id
        )
        if problem_ids:
            query = query.where(UserProblemProgress.problem_id.in_(problem_ids))
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update_progress(
        self,
        user_id: UUID,
        problem_id: UUID,
        status: str = "solved",
        time_spent_sec: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> UserProblemProgress:
        """Mark a problem as solved/attempted/unsolved."""
        query = select(UserProblemProgress).where(
            and_(
                UserProblemProgress.user_id == user_id,
                UserProblemProgress.problem_id == problem_id,
            )
        )
        result = await self.db.execute(query)
        progress = result.scalar_one_or_none()

        if progress:
            progress.status = status
            if status == "solved" and not progress.solved_at:
                progress.solved_at = datetime.utcnow()
            if time_spent_sec is not None:
                progress.time_spent_sec = time_spent_sec
            if notes is not None:
                progress.notes = notes
            progress.attempts_count = (progress.attempts_count or 0) + 1
        else:
            progress = UserProblemProgress(
                user_id=user_id,
                problem_id=problem_id,
                status=status,
                solved_at=datetime.utcnow() if status == "solved" else None,
                time_spent_sec=time_spent_sec,
                attempts_count=1,
                notes=notes,
            )
            self.db.add(progress)

        return progress

    async def get_user_stats(self, user_id: UUID, plan: Optional[str] = None) -> dict:
        """Get aggregated problem-solving stats, optionally scoped to a study plan."""
        base_filter = [UserProblemProgress.user_id == user_id]

        # When plan is set, only count problems that belong to that plan
        if plan:
            solved_q = (
                select(func.count(UserProblemProgress.id))
                .join(ExternalProblem, UserProblemProgress.problem_id == ExternalProblem.id)
                .where(
                    and_(
                        *base_filter,
                        UserProblemProgress.status == "solved",
                        ExternalProblem.study_plans.any(plan),
                    )
                )
            )
            attempted_q = (
                select(func.count(UserProblemProgress.id))
                .join(ExternalProblem, UserProblemProgress.problem_id == ExternalProblem.id)
                .where(
                    and_(
                        *base_filter,
                        UserProblemProgress.status == "attempted",
                        ExternalProblem.study_plans.any(plan),
                    )
                )
            )
            total_in_plan = await self.count_problems(study_plan=plan)
        else:
            solved_q = select(func.count(UserProblemProgress.id)).where(
                and_(*base_filter, UserProblemProgress.status == "solved")
            )
            attempted_q = select(func.count(UserProblemProgress.id)).where(
                and_(*base_filter, UserProblemProgress.status == "attempted")
            )
            total_in_plan = None

        solved_count = (await self.db.execute(solved_q)).scalar() or 0
        attempted_count = (await self.db.execute(attempted_q)).scalar() or 0

        # By difficulty (always global for the difficulty breakdown)
        by_difficulty = {}
        for diff in ["Easy", "Medium", "Hard"]:
            diff_filters = [
                *base_filter,
                UserProblemProgress.status == "solved",
                ExternalProblem.difficulty == diff,
            ]
            if plan:
                diff_filters.append(ExternalProblem.study_plans.any(plan))
            diff_q = (
                select(func.count(UserProblemProgress.id))
                .join(ExternalProblem, UserProblemProgress.problem_id == ExternalProblem.id)
                .where(and_(*diff_filters))
            )
            by_difficulty[diff.lower()] = (await self.db.execute(diff_q)).scalar() or 0

        result = {
            "total_solved": solved_count,
            "total_attempted": attempted_count,
            "by_difficulty": by_difficulty,
        }
        if total_in_plan is not None:
            result["total_in_plan"] = total_in_plan
        return result

    async def get_plan_solved_counts(self, user_id: UUID) -> dict:
        """Get solved counts for each study plan — used by the sidebar."""
        plans = ["neetcode_150", "neetcode_all", "blind_75", "striver_a2z", "cses"]
        counts = {}
        for plan in plans:
            q = (
                select(func.count(UserProblemProgress.id))
                .join(ExternalProblem, UserProblemProgress.problem_id == ExternalProblem.id)
                .where(
                    and_(
                        UserProblemProgress.user_id == user_id,
                        UserProblemProgress.status == "solved",
                        ExternalProblem.study_plans.any(plan),
                    )
                )
            )
            counts[plan] = (await self.db.execute(q)).scalar() or 0
        return counts

    async def get_user_streak(self, user_id: UUID) -> dict:
        """Get consecutive-day solve streak for a user."""
        from sqlalchemy import cast, Date, distinct
        q = (
            select(distinct(cast(UserProblemProgress.solved_at, Date)))
            .where(
                and_(
                    UserProblemProgress.user_id == user_id,
                    UserProblemProgress.status == "solved",
                    UserProblemProgress.solved_at.isnot(None),
                )
            )
            .order_by(cast(UserProblemProgress.solved_at, Date).desc())
        )
        result = await self.db.execute(q)
        dates = [row[0] for row in result.fetchall()]

        if not dates:
            return {"current_streak": 0, "active_today": False, "total_solve_days": 0}

        from datetime import date as dt_date, timedelta
        today = dt_date.today()
        active_today = dates[0] == today
        streak = 0
        check_date = today if active_today else today - timedelta(days=1)

        for d in dates:
            if d == check_date:
                streak += 1
                check_date -= timedelta(days=1)
            elif d < check_date:
                break

        return {
            "current_streak": streak,
            "active_today": active_today,
            "total_solve_days": len(dates),
        }

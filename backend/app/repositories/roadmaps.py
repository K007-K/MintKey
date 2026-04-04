# Repository for user_roadmaps DB operations — versioned + progress-preserving
import logging
import hashlib
import json
from uuid import UUID
from typing import Optional
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import (
    UserRoadmap, RoadmapPhase, RoadmapTask,
    ScoreSnapshot, SkillProgress, RoadmapProblemMap,
)

logger = logging.getLogger(__name__)


class RoadmapRepository:
    """CRUD for user_roadmaps — versioned architecture.

    Core principle: "Plans can change. Progress should not."
    Old roadmaps are archived (is_active=false), never deleted.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert(
        self,
        user_id: UUID,
        company_slug: str,
        total_weeks: int,
        hours_per_day: int,
        weeks_data: list[dict],
        target_level: str = None,
    ) -> tuple[UserRoadmap, dict]:
        """Create a new roadmap version, archiving any existing active one.

        Returns:
            (new_roadmap, old_context) where old_context contains:
            - original_generated_at: datetime of the first ever roadmap
            - last_score: last recorded score for carry-forward
            - previous_version: version number of the old roadmap
        """
        old_context = {
            "original_generated_at": None,
            "last_score": 0.0,
            "previous_version": 0,
        }

        # 1. Find the currently active roadmap (if any)
        old_result = await self.session.execute(
            select(UserRoadmap).where(
                UserRoadmap.user_id == user_id,
                UserRoadmap.company_slug == company_slug,
                UserRoadmap.is_active == True,  # noqa: E712
            )
        )
        old_roadmap = old_result.scalar_one_or_none()

        if old_roadmap:
            # Capture context before archiving
            old_context["original_generated_at"] = old_roadmap.generated_at
            old_context["previous_version"] = old_roadmap.version or 1

            # Fetch last score snapshot for carry-forward
            last_snap = await self.session.execute(
                select(ScoreSnapshot.score)
                .where(ScoreSnapshot.roadmap_id == old_roadmap.id)
                .order_by(ScoreSnapshot.recorded_at.desc())
                .limit(1)
            )
            last_score = last_snap.scalar_one_or_none()
            if last_score is not None:
                old_context["last_score"] = last_score

            # Archive the old roadmap — do NOT delete
            old_roadmap.is_active = False
            logger.info(
                f"Archived roadmap v{old_roadmap.version} for "
                f"user={user_id} company={company_slug}"
            )

        # 2. Compute next version
        max_version_result = await self.session.execute(
            select(func.coalesce(func.max(UserRoadmap.version), 0))
            .where(
                UserRoadmap.user_id == user_id,
                UserRoadmap.company_slug == company_slug,
            )
        )
        next_version = (max_version_result.scalar() or 0) + 1

        # 3. Compute generation hash
        hash_input = json.dumps({
            "company": company_slug,
            "weeks": total_weeks,
            "hours": hours_per_day,
            "version": next_version,
        }, sort_keys=True)
        gen_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]

        # 4. Create new active roadmap
        roadmap = UserRoadmap(
            user_id=user_id,
            company_slug=company_slug,
            version=next_version,
            is_active=True,
            total_weeks=total_weeks,
            hours_per_day=hours_per_day,
            weeks_data=weeks_data,
            target_level=target_level,
            generation_hash=gen_hash,
            last_synced_at=datetime.utcnow(),
        )
        self.session.add(roadmap)
        await self.session.flush()

        logger.info(
            f"Created roadmap v{next_version} for "
            f"user={user_id} company={company_slug} "
            f"(archived v{old_context['previous_version']})"
        )
        return roadmap, old_context

    async def persist_roadmap_details(
        self,
        roadmap: UserRoadmap,
        phases_data: list[dict],
        kanban_tasks_data: list[dict],
        weeks_data: list[dict],
        original_assigned_at: datetime | None = None,
    ) -> None:
        """Persist phases, kanban tasks, skill progress, and problem map.

        Args:
            original_assigned_at: If regenerating, use the original roadmap's
                generated_at so anti-cheat doesn't reject previously-solved problems.
        """
        roadmap_id = roadmap.id
        assigned_at = original_assigned_at or datetime.utcnow()

        # 1. Insert phases
        for p in phases_data:
            phase = RoadmapPhase(
                roadmap_id=roadmap_id,
                phase_number=p.get("phase_number", 1),
                title=p.get("title", "Phase"),
                week_start=p.get("week_start", 1),
                week_end=p.get("week_end", 6),
                status=p.get("status", "locked"),
                unlock_condition=p.get("unlock_condition", {}),
            )
            self.session.add(phase)

        # 2. Insert kanban tasks
        for t in kanban_tasks_data:
            task = RoadmapTask(
                roadmap_id=roadmap_id,
                type=t.get("type", "dsa"),
                title=t.get("title", "Task"),
                difficulty=t.get("difficulty", "medium"),
                estimated_weeks=t.get("estimated_weeks", 4),
                score_impact=t.get("score_impact", 5),
                status="todo",
                lc_tag=t.get("lc_tag"),
                lc_count_required=t.get("lc_count_required"),
                lc_count_done=0,
            )
            self.session.add(task)

        # 3. Build and insert skill_progress from weeks' dsa_task data
        topic_map: dict[str, dict] = {}  # lc_tag -> {topic, required}
        for w in weeks_data:
            dsa = w.get("dsa_task")
            if dsa and isinstance(dsa, dict):
                lc_tag = dsa.get("lc_tag", "")
                if lc_tag and lc_tag not in topic_map:
                    topic_map[lc_tag] = {
                        "topic": w.get("focus_topic", lc_tag),
                        "required": dsa.get("count", 5),
                    }
                elif lc_tag in topic_map:
                    topic_map[lc_tag]["required"] += dsa.get("count", 5)

        for lc_tag, info in topic_map.items():
            sp = SkillProgress(
                roadmap_id=roadmap_id,
                topic=info["topic"],
                lc_tag=lc_tag,
                solved=0,
                required=info["required"],
                progress=0.0,
            )
            self.session.add(sp)

        # 4. Insert initial score snapshot (user-centric)
        snapshot = ScoreSnapshot(
            roadmap_id=roadmap_id,
            user_id=roadmap.user_id,
            company_slug=roadmap.company_slug,
            week_number=1,
            score=0.0,
            projected_score=0.0,
            recorded_at=datetime.utcnow(),
        )
        self.session.add(snapshot)

        await self.session.flush()
        logger.info(
            f"Persisted details for roadmap {roadmap_id}: "
            f"{len(phases_data)} phases, {len(kanban_tasks_data)} tasks, "
            f"{len(topic_map)} skill topics, 1 initial snapshot"
        )

        # 5. Insert problem map from weeks' dsa_task.problems
        problem_count = 0
        for w in weeks_data:
            wk_num = w.get("week_number", 1)
            dsa = w.get("dsa_task")
            if dsa and isinstance(dsa, dict):
                for order_idx, slug in enumerate(dsa.get("problems") or []):
                    rpm = RoadmapProblemMap(
                        roadmap_id=roadmap_id,
                        week_number=wk_num,
                        problem_order=order_idx,
                        problem_slug=slug,
                        topic=w.get("focus_topic", dsa.get("lc_tag", "")),
                        difficulty=dsa.get("difficulty", "medium"),
                        status="pending",
                        source="roadmap",
                        assigned_at=assigned_at,  # Uses original date for regen
                    )
                    self.session.add(rpm)
                    problem_count += 1

        if problem_count > 0:
            await self.session.flush()
            logger.info(f"Persisted {problem_count} problem assignments in roadmap_problem_map")

    async def get_by_company(
        self, user_id: UUID, company_slug: str
    ) -> Optional[UserRoadmap]:
        """Get the ACTIVE roadmap for a specific company."""
        result = await self.session.execute(
            select(UserRoadmap)
            .where(
                UserRoadmap.user_id == user_id,
                UserRoadmap.company_slug == company_slug,
                UserRoadmap.is_active == True,  # noqa: E712
            )
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_for_user(self, user_id: UUID) -> list[UserRoadmap]:
        """List all ACTIVE roadmaps for a user."""
        result = await self.session.execute(
            select(UserRoadmap)
            .where(
                UserRoadmap.user_id == user_id,
                UserRoadmap.is_active == True,  # noqa: E712
            )
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

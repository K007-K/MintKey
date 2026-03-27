# Repository for user_roadmaps DB operations — enriched with phase/task/skill persistence
import logging
import hashlib
import json
from uuid import UUID
from typing import Optional
from datetime import datetime
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import (
    UserRoadmap, RoadmapPhase, RoadmapTask,
    ScoreSnapshot, SkillProgress,
)

logger = logging.getLogger(__name__)


class RoadmapRepository:
    """CRUD for the user_roadmaps and related tables."""

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
    ) -> UserRoadmap:
        """Insert or replace the roadmap for a user + company pair."""
        # Delete existing roadmap (cascade will remove phases/tasks/skills/snapshots)
        await self.session.execute(
            delete(UserRoadmap).where(
                UserRoadmap.user_id == user_id,
                UserRoadmap.company_slug == company_slug,
            )
        )

        # Compute generation hash from inputs
        hash_input = json.dumps({
            "company": company_slug,
            "weeks": total_weeks,
            "hours": hours_per_day,
        }, sort_keys=True)
        gen_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]

        roadmap = UserRoadmap(
            user_id=user_id,
            company_slug=company_slug,
            total_weeks=total_weeks,
            hours_per_day=hours_per_day,
            weeks_data=weeks_data,
            target_level=target_level,
            generation_hash=gen_hash,
            last_synced_at=datetime.utcnow(),
        )
        self.session.add(roadmap)
        await self.session.flush()
        logger.info(f"Upserted roadmap for user={user_id} company={company_slug}")
        return roadmap

    async def persist_roadmap_details(
        self,
        roadmap: UserRoadmap,
        phases_data: list[dict],
        kanban_tasks_data: list[dict],
        weeks_data: list[dict],
    ) -> None:
        """Persist phases, kanban tasks, skill progress, and initial score snapshot."""
        roadmap_id = roadmap.id

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
                    # Accumulate required count across weeks with the same tag
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

        # 4. Insert initial score snapshot
        snapshot = ScoreSnapshot(
            roadmap_id=roadmap_id,
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

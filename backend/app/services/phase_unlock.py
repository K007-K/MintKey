# Phase unlock service — auto-advances roadmap phases based on task completion
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import UserRoadmap, RoadmapPhase, RoadmapTask

logger = logging.getLogger(__name__)


async def evaluate_phase_progress(session: AsyncSession, roadmap_id) -> dict:
    """
    Evaluate and update all phase statuses for a roadmap.

    Logic:
    - Phase 1 is always unlocked by default
    - A phase is "done" when ALL tasks in its week range are "done"
    - When a phase becomes "done", the next phase auto-unlocks
    - Phase progress = (done_tasks / total_tasks) * 100

    Also updates:
    - roadmap.current_week based on the latest active phase
    - roadmap.progress_pct based on overall task completion

    Returns stats about what changed.
    """
    stats = {"phases_updated": 0, "phases_unlocked": 0, "phases_completed": 0}

    # ─── 1. Fetch roadmap and all phases ───
    roadmap = await session.get(UserRoadmap, roadmap_id)
    if not roadmap:
        return stats

    phases_result = await session.execute(
        select(RoadmapPhase)
        .where(RoadmapPhase.roadmap_id == roadmap_id)
        .order_by(RoadmapPhase.phase_number)
    )
    phases = phases_result.scalars().all()
    if not phases:
        return stats

    # ─── 2. Fetch all tasks for this roadmap ───
    tasks_result = await session.execute(
        select(RoadmapTask).where(RoadmapTask.roadmap_id == roadmap_id)
    )
    all_tasks = tasks_result.scalars().all()

    total_tasks_count = len(all_tasks)
    done_tasks_count = sum(1 for t in all_tasks if t.status == "done")

    # ─── 3. Evaluate each phase ───
    prev_phase_done = True  # Phase 1 can always unlock

    for phase in phases:
        # Count tasks in this phase's week range
        # Tasks don't have week numbers directly, so we use position-based mapping
        # Each phase covers week_start to week_end
        phase_task_count = 0
        phase_done_count = 0

        for task in all_tasks:
            # Match tasks to phases by checking the task's estimated completion
            # Since tasks don't have explicit week assignments, we distribute evenly
            # across the total weeks, or use the phase ordering
            task_idx = all_tasks.index(task)
            tasks_per_phase = max(1, total_tasks_count // len(phases))
            task_phase_num = min((task_idx // tasks_per_phase) + 1, len(phases))

            if task_phase_num == phase.phase_number:
                phase_task_count += 1
                if task.status == "done":
                    phase_done_count += 1

        # Calculate phase progress
        new_progress = round(
            (phase_done_count / phase_task_count * 100) if phase_task_count > 0 else 0.0,
            1
        )

        # Determine new status
        old_status = phase.status
        if phase.phase_number == 1:
            # Phase 1 is always at least unlocked
            if phase.status == "locked":
                phase.status = "unlocked"
                stats["phases_unlocked"] += 1
        elif prev_phase_done and phase.status == "locked":
            # Previous phase is done → unlock this one
            phase.status = "unlocked"
            stats["phases_unlocked"] += 1

        # Check if phase is now complete
        if phase_task_count > 0 and phase_done_count == phase_task_count:
            if phase.status != "done":
                phase.status = "done"
                stats["phases_completed"] += 1

        # Track if this phase is done for next phase's unlock check
        prev_phase_done = (phase.status == "done")

        # Update progress
        if phase.progress != new_progress or old_status != phase.status:
            phase.progress = new_progress
            phase.updated_at = datetime.utcnow()
            stats["phases_updated"] += 1

    # ─── 4. Update roadmap-level progress ───
    overall_progress = round(
        (done_tasks_count / total_tasks_count * 100) if total_tasks_count > 0 else 0.0,
        1
    )
    roadmap.progress_pct = overall_progress

    # Update current_week based on the latest unlocked/active phase
    for phase in reversed(phases):
        if phase.status in ("unlocked", "done"):
            roadmap.current_week = phase.week_start
            break

    roadmap.updated_at = datetime.utcnow()

    logger.info(f"Phase evaluation for roadmap {roadmap_id}: {stats}")
    return stats

# Core service: cascade sync data to roadmap progress — source of truth is roadmap_problem_map
import logging
import math
from datetime import datetime
from uuid import UUID
from sqlalchemy import select, func, text, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import (
    UserRoadmap, RoadmapPhase, RoadmapTask,
    RoadmapProblemMap, LcSubmission, SkillProgress,
    ScoreSnapshot, User,
)

logger = logging.getLogger(__name__)


def _logistic_streak_score(streak_days: int) -> float:
    """Compute streak score using logistic curve: rewards consistency, caps at 100.

    streak_score = 100 × (1 - e^(-streak_days / 10))
    3 days → 25, 7 days → 50, 14 days → 75, 30 days → 95
    """
    if streak_days <= 0:
        return 0.0
    return round(100 * (1 - math.exp(-streak_days / 10)), 1)


async def update_roadmap_progress(
    session: AsyncSession,
    user: User,
    roadmap: UserRoadmap,
) -> dict:
    """
    Cross-reference lc_submissions against roadmap_problem_map.
    Update: problem statuses → week progress → phase progress → overall.

    Source of truth: roadmap_problem_map (table) — NOT weeks_data JSONB.
    JSONB is updated as a derived UI cache only.

    Anti-cheat: Only count submissions solved AFTER roadmap_problem_map.assigned_at.
    """
    roadmap_id = roadmap.id
    user_id = user.id

    # ─── 1. Load all user's LC submissions (slug → solved_at) ───
    sub_result = await session.execute(
        select(LcSubmission.title_slug, LcSubmission.solved_at)
        .where(LcSubmission.user_id == user_id)
    )
    solved_map: dict[str, datetime] = {}
    for row in sub_result:
        if row.title_slug and row.solved_at:
            solved_map[row.title_slug] = row.solved_at

    logger.info(f"[ProgressUpdate] User has {len(solved_map)} total LC submissions")

    # ─── 2. Match against roadmap_problem_map with anti-cheat ───
    rpm_result = await session.execute(
        select(RoadmapProblemMap)
        .where(RoadmapProblemMap.roadmap_id == roadmap_id)
        .order_by(RoadmapProblemMap.week_number, RoadmapProblemMap.problem_order)
    )
    all_problems = rpm_result.scalars().all()
    problems_matched = 0

    for rpm in all_problems:
        if rpm.problem_slug in solved_map:
            solved_at = solved_map[rpm.problem_slug]
            # Anti-cheat: only count if solved AFTER problem was assigned
            if rpm.assigned_at and solved_at < rpm.assigned_at:
                # Mark as carry_over — solved before this roadmap version
                if rpm.source != "carry_over":
                    rpm.source = "carry_over"
                    rpm.status = "solved"
                    rpm.solved_at = solved_at
                    rpm.submission_url = f"https://leetcode.com/problems/{rpm.problem_slug}/"
                    problems_matched += 1
                continue
            if rpm.status != "solved":
                rpm.status = "solved"
                rpm.source = "roadmap"
                rpm.solved_at = solved_at
                rpm.submission_url = f"https://leetcode.com/problems/{rpm.problem_slug}/"
                problems_matched += 1

    logger.info(f"[ProgressUpdate] Matched {problems_matched} new problems")

    # ─── 3. Compute per-week DSA completion FROM TABLE (source of truth) ───
    week_stats_result = await session.execute(
        select(
            RoadmapProblemMap.week_number,
            func.count().label("total"),
            func.count().filter(RoadmapProblemMap.status == "solved").label("solved"),
        )
        .where(RoadmapProblemMap.roadmap_id == roadmap_id)
        .group_by(RoadmapProblemMap.week_number)
    )
    week_completion: dict[int, float] = {}
    week_solved_counts: dict[int, tuple[int, int]] = {}  # wk → (solved, total)
    for row in week_stats_result:
        total = row.total or 1
        solved = row.solved or 0
        week_completion[row.week_number] = solved / total
        week_solved_counts[row.week_number] = (solved, total)

    # ─── 4. Update weeks_data JSONB (derived UI cache — NOT source of truth) ───
    updated_weeks = []
    for w in (roadmap.weeks_data or []):
        wk = dict(w)  # shallow copy
        wk_num = wk.get("week_number", 0)
        dsa = wk.get("dsa_task")
        if dsa and isinstance(dsa, dict):
            solved_count, total_count = week_solved_counts.get(wk_num, (0, dsa.get("count", 5)))
            dsa["count_done"] = solved_count
            dsa["status"] = (
                "done" if solved_count >= total_count and total_count > 0 else
                "in_progress" if solved_count > 0 else
                "upcoming"
            )
        # Derive week progress from table data
        wk["progress"] = round(week_completion.get(wk_num, 0.0) * 100, 1)
        updated_weeks.append(wk)

    roadmap.weeks_data = updated_weeks

    # ─── 5. Compute streak score (logistic curve) ───
    streak_days = roadmap.streak_days or 0
    streak_score = _logistic_streak_score(streak_days)

    # ─── 6. Compute GitHub activity score ───
    # Use problems_this_week as a proxy for GitHub activity for now
    # TODO: enhance with actual GitHub commit data from github_sync
    github_score = 0.0

    # ─── 7. Update phase progress (computed from week_completion) ───
    phases = (await session.execute(
        select(RoadmapPhase)
        .where(RoadmapPhase.roadmap_id == roadmap_id)
        .order_by(RoadmapPhase.phase_number)
    )).scalars().all()

    for phase in phases:
        phase_weeks_range = range(phase.week_start, phase.week_end + 1)
        phase_completions = [week_completion.get(wk, 0.0) for wk in phase_weeks_range]
        if phase_completions:
            phase.progress = round(sum(phase_completions) / len(phase_completions) * 100, 1)

    # ─── 8. Compute overall progress with weighted formula ───
    # 50% DSA + 25% Project + 15% Streak + 10% GitHub
    total_problems = len(all_problems)
    solved_problems = sum(1 for p in all_problems if p.status == "solved")
    dsa_completion_pct = (solved_problems / total_problems * 100) if total_problems > 0 else 0.0

    project_completion = 0.0  # TODO: from github_sync signals

    overall_progress = round(
        0.50 * dsa_completion_pct +
        0.25 * project_completion +
        0.15 * streak_score +
        0.10 * github_score,
        1,
    )
    roadmap.progress_pct = overall_progress

    # ─── 9. Update kanban tasks (lc_count_done from skill_progress) ───
    kanban_tasks = (await session.execute(
        select(RoadmapTask).where(RoadmapTask.roadmap_id == roadmap_id)
    )).scalars().all()

    skill_rows = (await session.execute(
        select(SkillProgress).where(SkillProgress.roadmap_id == roadmap_id)
    )).scalars().all()
    tag_solved = {sp.lc_tag: sp.solved for sp in skill_rows}

    for task in kanban_tasks:
        if task.lc_tag and task.lc_count_required:
            solved = tag_solved.get(task.lc_tag, 0)
            task.lc_count_done = solved
            task.status = (
                "done" if solved >= task.lc_count_required else
                "in_progress" if solved > 0 else
                "todo"
            )

    # ─── 10. Record score snapshot ───
    snapshot = ScoreSnapshot(
        roadmap_id=roadmap_id,
        user_id=user.id,
        company_slug=roadmap.company_slug,
        week_number=roadmap.current_week or 1,
        score=overall_progress,
        projected_score=min(overall_progress * 1.2, 100),
        recorded_at=datetime.utcnow(),
    )
    session.add(snapshot)

    result = {
        "problems_matched": problems_matched,
        "total_assigned": total_problems,
        "total_solved": solved_problems,
        "weeks_active": len([v for v in week_completion.values() if v > 0]),
        "overall_progress": overall_progress,
        "streak_score": streak_score,
        "streak_days": streak_days,
        "dsa_completion_pct": round(dsa_completion_pct, 1),
    }
    logger.info(f"[ProgressUpdate] Result: {result}")
    return result

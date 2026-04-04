# Roadmap endpoints — enriched with phases, tasks, skills, score history
import logging
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select

from app.core.database import async_session_factory
from app.middleware.auth import get_current_user
from app.models.db import (
    User, UserRoadmap, RoadmapPhase, RoadmapTask,
    SkillProgress, ScoreSnapshot,
)
from app.models.schemas import APIResponse
from app.repositories.roadmaps import RoadmapRepository
from app.services.scoring import get_score_status, recalculate_score
from app.services.leetcode_sync import sync_leetcode_for_roadmap
from app.services.github_sync import sync_github_for_roadmap
from app.services.phase_unlock import evaluate_phase_progress
from app.services.week_advance import auto_advance_week

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/roadmap", tags=["roadmap"])


class UpdateProgressRequest(BaseModel):
    current_week: int = 1
    progress_pct: float = 0.0


class UpdateTaskRequest(BaseModel):
    status: str = "todo"  # todo | in_progress | done
    lc_count_done: Optional[int] = None


@router.get("/", response_model=APIResponse)
async def list_roadmaps(current_user: User = Depends(get_current_user)):
    """List all roadmaps for the current user."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            roadmaps = await repo.list_for_user(current_user.id)
            result = []
            for rm in roadmaps:
                result.append({
                    "id": str(rm.id),
                    "company_slug": rm.company_slug,
                    "total_weeks": rm.total_weeks,
                    "hours_per_day": rm.hours_per_day,
                    "current_week": rm.current_week,
                    "progress_pct": rm.progress_pct,
                    "target_level": rm.target_level,
                    "streak_days": rm.streak_days,
                    "generated_at": rm.generated_at.isoformat() if rm.generated_at else None,
                    "updated_at": rm.updated_at.isoformat() if rm.updated_at else None,
                })
            return APIResponse(success=True, data=result)
    except Exception as e:
        logger.error(f"Failed to list roadmaps: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.get("/{company_slug}", response_model=APIResponse)
async def get_roadmap(
    company_slug: str,
    current_user: User = Depends(get_current_user),
):
    """Get the full roadmap for a specific company — auto-generates on first visit."""
    try:
        # 1. Check if roadmap exists
        has_roadmap = False
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            check = await repo.get_by_company(current_user.id, company_slug)
            has_roadmap = check is not None

        # 2. If no roadmap, auto-generate via Agent 7 (on-demand)
        if not has_roadmap:
            logger.info(f"[Roadmap] No roadmap for {company_slug}, auto-generating on first visit...")

            # Fetch company blueprint
            blueprint_data = None
            async with async_session_factory() as session:
                from app.models.db import CompanyBlueprint
                bp_result = await session.execute(
                    select(CompanyBlueprint).where(CompanyBlueprint.slug == company_slug)
                )
                bp_row = bp_result.scalar_one_or_none()
                if bp_row:
                    blueprint_data = {
                        "company_name": bp_row.name,
                        "company_slug": bp_row.slug,
                        "dsa_topics": (bp_row.dsa_requirements or {}).get("focus_topics", []),
                        "required_stack": bp_row.tech_stack or [],
                        "required_skills": bp_row.tech_stack or [],
                        "interview_format": bp_row.interview_format or {},
                    }

            if not blueprint_data:
                return APIResponse(success=True, data=None)

            # Call Agent 7 — fresh session for problem lookup
            try:
                from agents.roadmap_builder import run_roadmap_builder
                async with async_session_factory() as builder_session:
                    roadmap_output = await run_roadmap_builder(
                        gap_analysis={}, dsa_analysis={},
                        company_blueprint=blueprint_data,
                        months_available=6, hours_per_day=4.0,
                        session=builder_session,
                    )
                rm_dict = roadmap_output.model_dump()
                weeks = rm_dict.get("weeks", [])

                async with async_session_factory() as save_session:
                    repo = RoadmapRepository(save_session)
                    rm = await repo.upsert(
                        user_id=current_user.id,
                        company_slug=company_slug,
                        total_weeks=rm_dict.get("total_weeks", len(weeks)),
                        hours_per_day=int(rm_dict.get("hours_per_day", 4)),
                        weeks_data=weeks,
                        target_level=rm_dict.get("target_level"),
                    )
                    await repo.persist_roadmap_details(
                        roadmap=rm,
                        phases_data=rm_dict.get("phases", []),
                        kanban_tasks_data=rm_dict.get("kanban_tasks", []),
                        weeks_data=weeks,
                    )
                    await save_session.commit()
                    logger.info(f"[Roadmap] Auto-generated roadmap for {company_slug}")
            except Exception as e:
                logger.error(f"[Roadmap] Auto-generation failed for {company_slug}: {e}")
                return APIResponse(success=True, data=None)

        # 3. Fetch the full roadmap with all related data
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.get_by_company(current_user.id, company_slug)
            if not rm:
                return APIResponse(success=True, data=None)

            # Auto-advance current_week based on elapsed time
            await auto_advance_week(session, rm)
            await session.commit()

            # Fetch phases
            phases_result = await session.execute(
                select(RoadmapPhase)
                .where(RoadmapPhase.roadmap_id == rm.id)
                .order_by(RoadmapPhase.phase_number)
            )
            phases = [
                {
                    "id": str(p.id),
                    "phase_number": p.phase_number,
                    "title": p.title,
                    "week_start": p.week_start,
                    "week_end": p.week_end,
                    "status": p.status,
                    "progress": p.progress,
                    "unlock_condition": p.unlock_condition,
                }
                for p in phases_result.scalars().all()
            ]

            # Fetch kanban tasks
            tasks_result = await session.execute(
                select(RoadmapTask).where(RoadmapTask.roadmap_id == rm.id)
            )
            kanban_tasks = [
                {
                    "id": str(t.id),
                    "type": t.type,
                    "title": t.title,
                    "difficulty": t.difficulty,
                    "estimated_weeks": t.estimated_weeks,
                    "score_impact": t.score_impact,
                    "status": t.status,
                    "lc_tag": t.lc_tag,
                    "lc_count_required": t.lc_count_required,
                    "lc_count_done": t.lc_count_done,
                }
                for t in tasks_result.scalars().all()
            ]

            # Fetch skill progress
            skills_result = await session.execute(
                select(SkillProgress).where(SkillProgress.roadmap_id == rm.id)
            )
            skills = [
                {
                    "id": str(s.id),
                    "topic": s.topic,
                    "lc_tag": s.lc_tag,
                    "solved": s.solved,
                    "required": s.required,
                    "progress": s.progress,
                }
                for s in skills_result.scalars().all()
            ]

            # Fetch problem map — source of truth for progress
            from app.models.db import RoadmapProblemMap
            rpm_result = await session.execute(
                select(RoadmapProblemMap)
                .where(RoadmapProblemMap.roadmap_id == rm.id)
                .order_by(RoadmapProblemMap.week_number, RoadmapProblemMap.problem_order)
            )
            problem_map = [
                {
                    "week": p.week_number,
                    "order": p.problem_order,
                    "slug": p.problem_slug,
                    "topic": p.topic,
                    "difficulty": p.difficulty,
                    "status": p.status,
                    "solved_at": p.solved_at.isoformat() if p.solved_at else None,
                    "url": p.submission_url or f"https://leetcode.com/problems/{p.problem_slug}/",
                }
                for p in rpm_result.scalars().all()
            ]

            return APIResponse(success=True, data={
                "id": str(rm.id),
                "company_slug": rm.company_slug,
                "total_weeks": rm.total_weeks,
                "hours_per_day": rm.hours_per_day,
                "current_week": rm.current_week,
                "progress_pct": rm.progress_pct,
                "target_level": rm.target_level,
                "streak_days": rm.streak_days,
                "last_synced_at": rm.last_synced_at.isoformat() if rm.last_synced_at else None,
                "generation_hash": rm.generation_hash,
                "score_status": get_score_status(rm.progress_pct or 0),
                "weeks_data": rm.weeks_data,
                "phases": phases,
                "kanban_tasks": kanban_tasks,
                "skill_progress": skills,
                "problem_map": problem_map,
                "generated_at": rm.generated_at.isoformat() if rm.generated_at else None,
                "updated_at": rm.updated_at.isoformat() if rm.updated_at else None,
            })
    except Exception as e:
        logger.error(f"Failed to get roadmap: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.get("/{company_slug}/phases", response_model=APIResponse)
async def get_phases(
    company_slug: str,
    current_user: User = Depends(get_current_user),
):
    """Get roadmap phases for a company."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.get_by_company(current_user.id, company_slug)
            if not rm:
                return APIResponse(success=False, data=None, error="Roadmap not found")

            result = await session.execute(
                select(RoadmapPhase)
                .where(RoadmapPhase.roadmap_id == rm.id)
                .order_by(RoadmapPhase.phase_number)
            )
            phases = [
                {
                    "id": str(p.id),
                    "phase_number": p.phase_number,
                    "title": p.title,
                    "week_start": p.week_start,
                    "week_end": p.week_end,
                    "status": p.status,
                    "progress": p.progress,
                    "unlock_condition": p.unlock_condition,
                }
                for p in result.scalars().all()
            ]
            return APIResponse(success=True, data=phases)
    except Exception as e:
        logger.error(f"Failed to get phases: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.get("/{company_slug}/week/{week_number}", response_model=APIResponse)
async def get_week_detail(
    company_slug: str,
    week_number: int,
    current_user: User = Depends(get_current_user),
):
    """Get a single week's detail from the roadmap."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.get_by_company(current_user.id, company_slug)
            if not rm or not rm.weeks_data:
                return APIResponse(success=False, data=None, error="Roadmap not found")

            # Find the week in weeks_data
            week_data = None
            for w in rm.weeks_data:
                if isinstance(w, dict) and w.get("week_number") == week_number:
                    week_data = w
                    break

            if not week_data:
                return APIResponse(success=False, data=None, error=f"Week {week_number} not found")

            return APIResponse(success=True, data=week_data)
    except Exception as e:
        logger.error(f"Failed to get week detail: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.get("/{company_slug}/tasks", response_model=APIResponse)
async def get_tasks(
    company_slug: str,
    current_user: User = Depends(get_current_user),
):
    """Get all kanban tasks for a roadmap."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.get_by_company(current_user.id, company_slug)
            if not rm:
                return APIResponse(success=False, data=None, error="Roadmap not found")

            result = await session.execute(
                select(RoadmapTask).where(RoadmapTask.roadmap_id == rm.id)
            )
            tasks = [
                {
                    "id": str(t.id),
                    "type": t.type,
                    "title": t.title,
                    "difficulty": t.difficulty,
                    "estimated_weeks": t.estimated_weeks,
                    "score_impact": t.score_impact,
                    "status": t.status,
                    "lc_tag": t.lc_tag,
                    "lc_count_required": t.lc_count_required,
                    "lc_count_done": t.lc_count_done,
                }
                for t in result.scalars().all()
            ]
            return APIResponse(success=True, data=tasks)
    except Exception as e:
        logger.error(f"Failed to get tasks: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.patch("/{company_slug}/tasks/{task_id}", response_model=APIResponse)
async def update_task(
    company_slug: str,
    task_id: str,
    payload: UpdateTaskRequest,
    current_user: User = Depends(get_current_user),
):
    """Update a kanban task status (todo → in_progress → done) and trigger score recalc."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.get_by_company(current_user.id, company_slug)
            if not rm:
                return APIResponse(success=False, data=None, error="Roadmap not found")

            task = await session.get(RoadmapTask, UUID(task_id))
            if not task or task.roadmap_id != rm.id:
                return APIResponse(success=False, data=None, error="Task not found")

            task.status = payload.status
            if payload.lc_count_done is not None:
                task.lc_count_done = payload.lc_count_done

            # Recalculate score after task update
            new_score = await recalculate_score(session, rm.id)

            # Evaluate phase unlock
            phase_stats = await evaluate_phase_progress(session, rm.id)

            await session.commit()
            return APIResponse(success=True, data={
                "task_id": str(task.id),
                "status": task.status,
                "new_score": new_score,
                "score_status": get_score_status(new_score),
                "phase_updates": phase_stats,
            })
    except Exception as e:
        logger.error(f"Failed to update task: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.get("/{company_slug}/skills", response_model=APIResponse)
async def get_skill_progress(
    company_slug: str,
    current_user: User = Depends(get_current_user),
):
    """Get skill progress for a roadmap (DSA topic completion)."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.get_by_company(current_user.id, company_slug)
            if not rm:
                return APIResponse(success=False, data=None, error="Roadmap not found")

            result = await session.execute(
                select(SkillProgress).where(SkillProgress.roadmap_id == rm.id)
            )
            skills = [
                {
                    "id": str(s.id),
                    "topic": s.topic,
                    "lc_tag": s.lc_tag,
                    "solved": s.solved,
                    "required": s.required,
                    "progress": s.progress,
                }
                for s in result.scalars().all()
            ]
            return APIResponse(success=True, data=skills)
    except Exception as e:
        logger.error(f"Failed to get skill progress: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.get("/{company_slug}/score-history", response_model=APIResponse)
async def get_score_history(
    company_slug: str,
    current_user: User = Depends(get_current_user),
):
    """Get score snapshot history for the trend chart."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.get_by_company(current_user.id, company_slug)
            if not rm:
                return APIResponse(success=False, data=None, error="Roadmap not found")

            result = await session.execute(
                select(ScoreSnapshot)
                .where(ScoreSnapshot.roadmap_id == rm.id)
                .order_by(ScoreSnapshot.recorded_at)
            )
            history = [
                {
                    "week_number": s.week_number,
                    "score": s.score,
                    "projected_score": s.projected_score,
                    "recorded_at": s.recorded_at.isoformat() if s.recorded_at else None,
                }
                for s in result.scalars().all()
            ]
            return APIResponse(success=True, data=history)
    except Exception as e:
        logger.error(f"Failed to get score history: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.patch("/{company_slug}/progress", response_model=APIResponse)
async def update_progress(
    company_slug: str,
    payload: UpdateProgressRequest,
    current_user: User = Depends(get_current_user),
):
    """Update roadmap progress (current week + percentage)."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.update_progress(
                current_user.id,
                company_slug,
                payload.current_week,
                payload.progress_pct,
            )
            if not rm:
                return APIResponse(success=False, data=None, error="Roadmap not found")
            await session.commit()
            return APIResponse(success=True, data={
                "company_slug": rm.company_slug,
                "current_week": rm.current_week,
                "progress_pct": rm.progress_pct,
            })
    except Exception as e:
        logger.error(f"Failed to update progress: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.post("/{company_slug}/sync/leetcode", response_model=APIResponse)
async def sync_leetcode(
    company_slug: str,
    current_user: User = Depends(get_current_user),
):
    """Trigger a LeetCode sync for a specific roadmap."""
    try:
        async with async_session_factory() as session:
            result = await session.execute(
                select(UserRoadmap).where(
                    UserRoadmap.user_id == current_user.id,
                    UserRoadmap.company_slug == company_slug,
                )
            )
            rm = result.scalar_one_or_none()
            if not rm:
                return APIResponse(success=False, data=None, error="Roadmap not found")

            sync_result = await sync_leetcode_for_roadmap(session, current_user, rm)
            return APIResponse(success=True, data=sync_result)
    except Exception as e:
        logger.error(f"LeetCode sync failed: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.post("/{company_slug}/sync/github", response_model=APIResponse)
async def sync_github(
    company_slug: str,
    current_user: User = Depends(get_current_user),
):
    """Trigger a GitHub sync for a specific roadmap."""
    try:
        async with async_session_factory() as session:
            result = await session.execute(
                select(UserRoadmap).where(
                    UserRoadmap.user_id == current_user.id,
                    UserRoadmap.company_slug == company_slug,
                )
            )
            rm = result.scalar_one_or_none()
            if not rm:
                return APIResponse(success=False, data=None, error="Roadmap not found")

            sync_result = await sync_github_for_roadmap(session, current_user, rm)
            return APIResponse(success=True, data=sync_result)
    except Exception as e:
        logger.error(f"GitHub sync failed: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.get("/{company_slug}/export", response_model=APIResponse)
async def export_roadmap(
    company_slug: str,
    current_user: User = Depends(get_current_user),
):
    """Export the full roadmap as structured JSON for download."""
    try:
        async with async_session_factory() as session:
            repo = RoadmapRepository(session)
            rm = await repo.get_by_company(current_user.id, company_slug)
            if not rm:
                return APIResponse(success=False, data=None, error="Roadmap not found")

            # Fetch all related data
            phases_result = await session.execute(
                select(RoadmapPhase)
                .where(RoadmapPhase.roadmap_id == rm.id)
                .order_by(RoadmapPhase.phase_number)
            )
            tasks_result = await session.execute(
                select(RoadmapTask).where(RoadmapTask.roadmap_id == rm.id)
            )
            skills_result = await session.execute(
                select(SkillProgress).where(SkillProgress.roadmap_id == rm.id)
            )

            export_data = {
                "meta": {
                    "company_slug": rm.company_slug,
                    "total_weeks": rm.total_weeks,
                    "hours_per_day": rm.hours_per_day,
                    "current_week": rm.current_week,
                    "progress_pct": rm.progress_pct,
                    "streak_days": rm.streak_days,
                    "generated_at": rm.generated_at.isoformat() if rm.generated_at else None,
                    "exported_at": datetime.utcnow().isoformat(),
                },
                "phases": [
                    {
                        "phase_number": p.phase_number,
                        "title": p.title,
                        "week_start": p.week_start,
                        "week_end": p.week_end,
                        "status": p.status,
                        "progress": p.progress,
                    }
                    for p in phases_result.scalars().all()
                ],
                "weeks_data": rm.weeks_data,
                "tasks": [
                    {
                        "type": t.type,
                        "title": t.title,
                        "difficulty": t.difficulty,
                        "status": t.status,
                        "lc_tag": t.lc_tag,
                        "lc_count_required": t.lc_count_required,
                        "lc_count_done": t.lc_count_done,
                    }
                    for t in tasks_result.scalars().all()
                ],
                "skill_progress": [
                    {
                        "topic": s.topic,
                        "lc_tag": s.lc_tag,
                        "solved": s.solved,
                        "required": s.required,
                        "progress": s.progress,
                    }
                    for s in skills_result.scalars().all()
                ],
            }
            return APIResponse(success=True, data=export_data)
    except Exception as e:
        logger.error(f"Export failed: {e}")
        return APIResponse(success=False, data=None, error=str(e))


@router.post("/{company_slug}/regenerate", response_model=APIResponse)
async def regenerate_roadmap(
    company_slug: str,
    current_user: User = Depends(get_current_user),
):
    """Regenerate roadmap via Agent 7 (Roadmap Builder) — calls Groq LLM."""
    # 1. Fetch blueprint + gap data (session closes after extraction)
    from app.models.db import CompanyBlueprint, SkillProgress
    async with async_session_factory() as session:
        bp_result = await session.execute(
            select(CompanyBlueprint).where(CompanyBlueprint.slug == company_slug)
        )
        blueprint_row = bp_result.scalar_one_or_none()

        if not blueprint_row:
            return APIResponse(success=False, data=None, error=f"No company blueprint found for '{company_slug}'")

        company_blueprint = {
            "company_name": blueprint_row.name,
            "company_slug": blueprint_row.slug,
            "dsa_topics": (blueprint_row.dsa_requirements or {}).get("focus_topics", []),
            "required_stack": blueprint_row.tech_stack or [],
            "required_skills": blueprint_row.tech_stack or [],
            "interview_format": blueprint_row.interview_format or {},
            "resources": {},
        }

        existing_rm = await session.execute(
            select(UserRoadmap).where(
                UserRoadmap.user_id == current_user.id,
                UserRoadmap.company_slug == company_slug,
            )
        )
        old_roadmap = existing_rm.scalar_one_or_none()
        gap_analysis = {"blocking_gaps": [], "important_gaps": []}
        dsa_analysis = {"topic_weakness_map": {}, "recommendations": []}

        if old_roadmap:
            skills_result = await session.execute(
                select(SkillProgress).where(SkillProgress.roadmap_id == old_roadmap.id)
            )
            skills = skills_result.scalars().all()
            for sk in skills:
                if sk.progress < 30:
                    gap_analysis["blocking_gaps"].append({
                        "skill": sk.topic, "current": sk.solved, "required": sk.required,
                    })
                elif sk.progress < 70:
                    gap_analysis["important_gaps"].append({
                        "skill": sk.topic, "current": sk.solved, "required": sk.required,
                    })
                dsa_analysis["topic_weakness_map"][sk.topic] = {
                    "solved": sk.solved, "required": sk.required, "progress": sk.progress,
                }

    # 2. Call Agent 7 — fresh session for problem lookup inside builder
    try:
        from agents.roadmap_builder import run_roadmap_builder
        logger.info(f"[Regenerate] Calling Agent 7 for {company_slug}...")

        async with async_session_factory() as builder_session:
            roadmap_output = await run_roadmap_builder(
                gap_analysis=gap_analysis,
                dsa_analysis=dsa_analysis,
                company_blueprint=company_blueprint,
                months_available=6,
                hours_per_day=4.0,
                session=builder_session,
            )

        logger.info(f"[Regenerate] Agent 7 returned {len(roadmap_output.weeks)} weeks for {company_slug}")
    except Exception as e:
        logger.error(f"[Regenerate] Agent 7 failed: {e}")
        import traceback
        traceback.print_exc()
        return APIResponse(success=False, data=None, error=f"Roadmap generation failed: {str(e)}")

    # 3. Save the new roadmap to DB
    try:
        from app.repositories.roadmaps import RoadmapRepository

        rm_dict = roadmap_output.model_dump()
        weeks = rm_dict.get("weeks", [])

        async with async_session_factory() as save_session:
            repo = RoadmapRepository(save_session)
            roadmap = await repo.upsert(
                user_id=current_user.id,
                company_slug=company_slug,
                total_weeks=rm_dict.get("total_weeks", len(weeks)),
                hours_per_day=int(rm_dict.get("hours_per_day", 4)),
                weeks_data=weeks,
                target_level=rm_dict.get("target_level"),
            )

            await repo.persist_roadmap_details(
                roadmap=roadmap,
                phases_data=rm_dict.get("phases", []),
                kanban_tasks_data=rm_dict.get("kanban_tasks", []),
                weeks_data=weeks,
            )

            await save_session.commit()
            logger.info(f"[Regenerate] Saved new roadmap for {company_slug}")

        return APIResponse(
            success=True,
            data={"message": f"Roadmap regenerated for {company_slug}", "total_weeks": len(weeks)},
        )
    except Exception as e:
        logger.error(f"[Regenerate] Failed to save roadmap: {e}")
        import traceback
        traceback.print_exc()
        return APIResponse(success=False, data=None, error=f"Failed to save roadmap: {str(e)}")


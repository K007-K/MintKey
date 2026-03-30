# Practice API — problem listing, filtering, progress tracking
import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import APIResponse
from app.models.db import User
from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.repositories.problems import ProblemsRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/practice", tags=["practice"])


# ── Public endpoints ─────────────────────────────────────


@router.get("/problems", response_model=APIResponse)
async def list_problems(
    source: Optional[str] = Query(None, description="Filter by source: neetcode, blind75, striver, cses"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty: Easy, Medium, Hard"),
    study_plan: Optional[str] = Query(None, description="Filter by study plan: neetcode_150, blind_75, etc."),
    pattern: Optional[str] = Query(None, description="Filter by pattern: sliding_window, two_pointers, etc."),
    category: Optional[str] = Query(None, description="Filter by category: dsa, competitive"),
    search: Optional[str] = Query(None, description="Search by title"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List problems with filters and pagination."""
    try:
        repo = ProblemsRepository(db)
        offset = (page - 1) * per_page
        problems = await repo.get_problems(
            source=source,
            difficulty=difficulty,
            study_plan=study_plan,
            pattern=pattern,
            category=category,
            search=search,
            limit=per_page,
            offset=offset,
        )
        total = await repo.count_problems(source=source, difficulty=difficulty, study_plan=study_plan)

        return APIResponse(
            success=True,
            data={
                "problems": [
                    {
                        "id": str(p.id),
                        "source": p.source,
                        "title": p.title,
                        "slug": p.slug,
                        "difficulty": p.difficulty,
                        "tags": p.tags or [],
                        "url": p.url,
                        "category": p.category,
                        "study_plans": p.study_plans or [],
                        "pattern": p.pattern,
                        "lc_number": p.lc_number,
                    }
                    for p in problems
                ],
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page,
            },
        )
    except Exception as e:
        logger.error(f"Failed to list problems: {e}")
        return APIResponse(success=False, data=None, error="Failed to fetch problems")


@router.get("/problems/{problem_id}", response_model=APIResponse)
async def get_problem(
    problem_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single problem by ID."""
    try:
        repo = ProblemsRepository(db)
        problem = await repo.get_problem_by_id(UUID(problem_id))
        if not problem:
            return APIResponse(success=False, data=None, error="Problem not found")

        return APIResponse(
            success=True,
            data={
                "id": str(problem.id),
                "source": problem.source,
                "title": problem.title,
                "slug": problem.slug,
                "difficulty": problem.difficulty,
                "tags": problem.tags or [],
                "description": problem.description,
                "url": problem.url,
                "category": problem.category,
                "study_plans": problem.study_plans or [],
                "company_tags": problem.company_tags or [],
                "hints": problem.hints or [],
                "solution_approach": problem.solution_approach,
                "solution_code": problem.solution_code,
                "complexity_analysis": problem.complexity_analysis,
                "pattern": problem.pattern,
                "lc_number": problem.lc_number,
            },
        )
    except Exception as e:
        logger.error(f"Failed to get problem: {e}")
        return APIResponse(success=False, data=None, error="Failed to fetch problem")


@router.get("/plans", response_model=APIResponse)
async def get_study_plans(db: AsyncSession = Depends(get_db)):
    """List available study plans with problem counts."""
    try:
        repo = ProblemsRepository(db)
        stats = await repo.get_study_plan_stats()
        return APIResponse(success=True, data=stats)
    except Exception as e:
        logger.error(f"Failed to get study plans: {e}")
        return APIResponse(success=False, data=None, error="Failed to fetch study plans")


# ── Auth-protected endpoints ─────────────────────────────


@router.get("/progress", response_model=APIResponse)
async def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all problem progress for the current user."""
    try:
        repo = ProblemsRepository(db)
        progress = await repo.get_user_progress(current_user.id)
        return APIResponse(
            success=True,
            data=[
                {
                    "problem_id": str(p.problem_id),
                    "status": p.status,
                    "solved_at": p.solved_at.isoformat() if p.solved_at else None,
                    "time_spent_sec": p.time_spent_sec,
                    "attempts_count": p.attempts_count,
                }
                for p in progress
            ],
        )
    except Exception as e:
        logger.error(f"Failed to get user progress: {e}")
        return APIResponse(success=False, data=[], error="Failed to fetch progress")


@router.patch("/progress/{problem_id}", response_model=APIResponse)
async def update_problem_progress(
    problem_id: str,
    status: str = Query("solved", description="Status: unsolved, attempted, solved"),
    time_spent_sec: Optional[int] = None,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a problem as solved/attempted/unsolved."""
    try:
        repo = ProblemsRepository(db)
        progress = await repo.update_progress(
            user_id=current_user.id,
            problem_id=UUID(problem_id),
            status=status,
            time_spent_sec=time_spent_sec,
            notes=notes,
        )
        await db.commit()
        return APIResponse(
            success=True,
            data={
                "problem_id": str(progress.problem_id),
                "status": progress.status,
                "solved_at": progress.solved_at.isoformat() if progress.solved_at else None,
                "attempts_count": progress.attempts_count,
            },
        )
    except Exception as e:
        logger.error(f"Failed to update progress: {e}")
        await db.rollback()
        return APIResponse(success=False, data=None, error="Failed to update progress")


@router.get("/stats", response_model=APIResponse)
async def get_practice_stats(
    plan: Optional[str] = Query(None, description="Scope stats to a study plan: neetcode_150, blind_75, etc."),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated problem-solving stats, optionally scoped to a study plan."""
    try:
        repo = ProblemsRepository(db)
        stats = await repo.get_user_stats(current_user.id, plan=plan)
        return APIResponse(success=True, data=stats)
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        return APIResponse(success=False, data=None, error="Failed to fetch stats")


@router.get("/plan-stats", response_model=APIResponse)
async def get_plan_solved_counts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get solved counts for each study plan — used by sidebar progress bars."""
    try:
        repo = ProblemsRepository(db)
        counts = await repo.get_plan_solved_counts(current_user.id)
        return APIResponse(success=True, data=counts)
    except Exception as e:
        logger.error(f"Failed to get plan stats: {e}")
        return APIResponse(success=False, data=None, error="Failed to fetch plan stats")


@router.get("/streak", response_model=APIResponse)
async def get_user_streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's consecutive-day solve streak."""
    try:
        repo = ProblemsRepository(db)
        streak = await repo.get_user_streak(current_user.id)
        return APIResponse(success=True, data=streak)
    except Exception as e:
        logger.error(f"Failed to get streak: {e}")
        return APIResponse(success=False, data=None, error="Failed to fetch streak")


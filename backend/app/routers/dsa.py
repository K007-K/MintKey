# DSA problems API — serves seed data + tracks user progress
import json
import logging
from pathlib import Path
from functools import lru_cache
from typing import Optional
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import APIResponse, DSAProgressToggle, DSAProgressBulkSync
from app.models.db import User
from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.repositories.dsa_progress import DSAProgressRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dsa", tags=["dsa"])

SEED_DIR = Path(__file__).resolve().parent.parent.parent.parent / "mintkey_seed_data"

SHEET_FILES = {
    "neetcode_150": "neetcode_150.json",
    "blind_75": "blind_75.json",
    "striver_a2z": "striver_a2z_full.json",
}


@lru_cache(maxsize=4)
def _load_sheet(sheet_key: str) -> dict:
    """Load and cache a DSA sheet JSON file.

    Handles 3 formats:
      - NeetCode: { topics: { "Arrays": [{lc_number, title, ...}] } }
      - Blind 75: { problems: [{title, topic, difficulty}] }  (flat list)
      - Striver:  { topics: { "Arrays": { subtopics:[], problems:[], ... } } }
    """
    filename = SHEET_FILES.get(sheet_key)
    if not filename:
        return {"source": sheet_key, "total": 0, "topics": {}}
    filepath = SEED_DIR / filename
    if not filepath.exists():
        logger.warning(f"Seed file not found: {filepath}")
        return {"source": sheet_key, "total": 0, "topics": {}}
    with open(filepath) as f:
        data = json.load(f)

    normalised: dict[str, list] = {}

    # Format 1: flat "problems" list (Blind 75) — group by topic field
    if "problems" in data and isinstance(data["problems"], list):
        for p in data["problems"]:
            topic = p.get("topic", "General")
            normalised.setdefault(topic, []).append(p)

    # Format 2+3: "topics" key
    elif "topics" in data and isinstance(data["topics"], dict):
        for topic_name, value in data["topics"].items():
            if isinstance(value, list):
                # Format 2 — NeetCode: value is already a list of problems
                normalised[topic_name] = value
            elif isinstance(value, dict):
                # Format 3 — Striver: value is { subtopics:[], problems:[], ... }
                problems = value.get("problems", [])
                if isinstance(problems, list):
                    normalised[topic_name] = problems

    total = sum(len(v) for v in normalised.values())
    return {
        "source": data.get("source", sheet_key),
        "total": total,
        "topics": normalised,
    }


@lru_cache(maxsize=1)
def _load_company_problems() -> dict:
    """Load company-wise problem mapping."""
    filepath = SEED_DIR / "company_wise_problems.json"
    if not filepath.exists():
        return {}
    with open(filepath) as f:
        return json.load(f)


# ── Public endpoints (no auth) ──────────────────────────


@router.get("/problems", response_model=APIResponse)
async def get_dsa_problems(
    sheet: str = Query("neetcode_150", description="Sheet: neetcode_150 | blind_75 | striver_a2z"),
):
    """Get all DSA problems for a given study sheet."""
    data = _load_sheet(sheet)
    return APIResponse(success=True, data=data)


@router.get("/sheets", response_model=APIResponse)
async def get_available_sheets():
    """List available DSA sheets with problem counts."""
    sheets = []
    for key in SHEET_FILES:
        data = _load_sheet(key)
        sheets.append({
            "key": key,
            "name": data["source"],
            "total": data["total"],
        })
    return APIResponse(success=True, data=sheets)


@router.get("/company/{slug}", response_model=APIResponse)
async def get_company_problems(slug: str):
    """Get problems tagged to a specific company."""
    data = _load_company_problems()
    company_data = data.get(slug, [])
    return APIResponse(success=True, data=company_data)


# ── Auth-protected endpoints (user progress) ────────────


@router.get("/progress", response_model=APIResponse)
async def get_user_progress(
    sheet: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all solved problems for the current user."""
    try:
        repo = DSAProgressRepository(db)
        progress = await repo.get_user_progress(current_user.id, sheet)
        return APIResponse(
            success=True,
            data=[
                {
                    "lc_number": p.lc_number,
                    "title": p.title,
                    "difficulty": p.difficulty,
                    "topic": p.topic,
                    "sheet": p.sheet,
                    "solved": p.solved,
                    "solved_at": p.solved_at.isoformat() if p.solved_at else None,
                }
                for p in progress
            ],
        )
    except Exception as e:
        logger.error(f"Failed to get DSA progress: {e}")
        return APIResponse(success=False, data=[], error="Failed to fetch progress")


@router.post("/progress", response_model=APIResponse)
async def toggle_problem_solved(
    payload: DSAProgressToggle,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a problem as solved or unsolved."""
    try:
        repo = DSAProgressRepository(db)
        result = await repo.upsert_progress(
            user_id=current_user.id,
            lc_number=payload.lc_number,
            title=payload.title,
            difficulty=payload.difficulty,
            topic=payload.topic,
            sheet=payload.sheet,
            solved=payload.solved,
        )
        await db.commit()
        return APIResponse(
            success=True,
            data={
                "title": result.title,
                "solved": result.solved,
                "solved_at": result.solved_at.isoformat() if result.solved_at else None,
            },
        )
    except Exception as e:
        logger.error(f"Failed to toggle DSA progress: {e}")
        await db.rollback()
        return APIResponse(success=False, data=None, error="Failed to save progress")


@router.get("/progress/stats", response_model=APIResponse)
async def get_progress_stats(
    sheet: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated DSA stats for the current user."""
    try:
        repo = DSAProgressRepository(db)
        stats = await repo.get_stats(current_user.id, sheet)
        return APIResponse(success=True, data=stats)
    except Exception as e:
        logger.error(f"Failed to get DSA stats: {e}")
        return APIResponse(success=False, data=None, error="Failed to fetch stats")


@router.post("/progress/sync", response_model=APIResponse)
async def bulk_sync_progress(
    payload: DSAProgressBulkSync,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk sync solved problems from localStorage to database."""
    try:
        repo = DSAProgressRepository(db)
        synced = await repo.bulk_sync(
            user_id=current_user.id,
            sheet=payload.sheet,
            solved_problems=payload.problems,
        )
        await db.commit()
        return APIResponse(success=True, data={"synced": synced})
    except Exception as e:
        logger.error(f"Failed to bulk sync DSA progress: {e}")
        await db.rollback()
        return APIResponse(success=False, data=None, error="Failed to sync progress")


@router.get("/progress/company/{slug}", response_model=APIResponse)
async def get_company_overlap(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get overlap between user's solved problems and company requirements."""
    try:
        # Load company problems
        company_data = _load_company_problems()
        companies = company_data.get("companies", {})
        company = companies.get(slug.capitalize(), companies.get(slug, {}))
        company_problems = company.get("problems", [])

        # Extract titles
        if isinstance(company_problems, list) and len(company_problems) > 0:
            if isinstance(company_problems[0], dict):
                titles = [p.get("title", "") for p in company_problems]
            else:
                titles = company_problems
        else:
            titles = []

        repo = DSAProgressRepository(db)
        overlap = await repo.get_company_overlap(current_user.id, titles)
        return APIResponse(success=True, data=overlap)
    except Exception as e:
        logger.error(f"Failed to get company overlap: {e}")
        return APIResponse(success=False, data=None, error="Failed to calculate overlap")

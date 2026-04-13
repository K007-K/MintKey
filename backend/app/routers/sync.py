# Sync trigger endpoints — kick off platform data sync
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.db import User, PlatformScore
from app.models.schemas import APIResponse

logger = logging.getLogger(__name__)


async def _upsert_platform_score(
    db: AsyncSession, user_id, platform: str, raw_data: dict
) -> None:
    """Insert or update the platform_scores row for a given platform."""
    result = await db.execute(
        select(PlatformScore).where(
            PlatformScore.user_id == user_id,
            PlatformScore.platform == platform,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.raw_data = raw_data
        existing.synced_at = datetime.utcnow()
    else:
        db.add(PlatformScore(
            user_id=user_id,
            platform=platform,
            raw_data=raw_data,
            synced_at=datetime.utcnow(),
        ))
    await db.commit()
    logger.info(f"[Sync] Saved {platform} data for user {user_id}")

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])


class SyncRequest(BaseModel):
    """Trigger platform sync for a user."""
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    codechef_username: Optional[str] = None
    hackerrank_username: Optional[str] = None


@router.post("/trigger", response_model=APIResponse)
async def trigger_sync(
    payload: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger background sync for GitHub and/or LeetCode.
    Dispatches Celery tasks and returns immediately.
    """
    if not payload.github_username and not payload.leetcode_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one of github_username or leetcode_username",
        )

    dispatched = {}

    if payload.github_username:
        try:
            from tasks.sync_tasks import sync_user_github
            sync_user_github.delay(str(current_user.id), payload.github_username)
            dispatched["github"] = "queued"
        except Exception as e:
            logger.error(f"Failed to dispatch GitHub sync: {e}")
            dispatched["github"] = f"error: {str(e)}"

    if payload.leetcode_username:
        try:
            from tasks.sync_tasks import sync_user_leetcode
            sync_user_leetcode.delay(str(current_user.id), payload.leetcode_username)
            dispatched["leetcode"] = "queued"
        except Exception as e:
            logger.error(f"Failed to dispatch LeetCode sync: {e}")
            dispatched["leetcode"] = f"error: {str(e)}"

    return APIResponse(success=True, data=dispatched)


@router.post("/github/direct", response_model=APIResponse)
async def sync_github_direct(
    payload: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Synchronous GitHub sync — clears cache first, then runs scraper, saves to DB."""
    if not payload.github_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="github_username is required",
        )

    # Clear Redis caches for this user so we get fresh data
    from app.core.redis import redis_client
    username = payload.github_username
    cache_keys = [
        f"github:profile:{username}",
        f"github:repos:{username}",
        f"github:contributions:{username}",
        f"github:calendar:{username}:current",
        f"github:calendar:{username}:{__import__('datetime').datetime.now().year}",
        f"github:events:v3:{username}",
    ]
    for key in cache_keys:
        try:
            await redis_client.delete(key)
        except Exception:
            pass

    from scrapers.github_scraper import GitHubScraper
    scraper = GitHubScraper()
    data = await scraper.fetch_full_profile(username)

    if "error" in data:
        return APIResponse(success=False, data=None, error=data["error"])

    # Persist to platform_scores
    await _upsert_platform_score(db, current_user.id, "github", data)

    return APIResponse(success=True, data=data)


@router.post("/leetcode/direct", response_model=APIResponse)
async def sync_leetcode_direct(
    payload: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Synchronous LeetCode sync — clears cache first, then runs scraper, saves to DB."""
    if not payload.leetcode_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="leetcode_username is required",
        )

    # Clear Redis caches for this user so we get fresh data
    from app.core.redis import redis_client
    username = payload.leetcode_username
    cache_keys = [
        f"leetcode:profile:{username}",
        f"leetcode:stats:{username}",
        f"leetcode:topics:{username}",
        f"leetcode:calendar:{username}",
        f"leetcode:calendar:{username}:{__import__('datetime').datetime.now().year}",
        f"leetcode:contests:{username}",
        f"leetcode:recent:{username}",
    ]
    for key in cache_keys:
        try:
            await redis_client.delete(key)
        except Exception:
            pass

    from scrapers.leetcode_scraper import LeetCodeScraper
    scraper = LeetCodeScraper()
    data = await scraper.fetch_full_stats(username)

    if "error" in data:
        return APIResponse(success=False, data=None, error=data["error"])

    # Persist to platform_scores
    await _upsert_platform_score(db, current_user.id, "leetcode", data)

    return APIResponse(success=True, data=data)


@router.post("/codechef/direct", response_model=APIResponse)
async def sync_codechef_direct(
    payload: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Synchronous CodeChef sync — clears cache first, then runs scraper, saves to DB."""
    if not payload.codechef_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="codechef_username is required",
        )

    # Clear Redis caches for this user so we get fresh data
    from app.core.redis import redis_client
    username = payload.codechef_username
    cache_keys = [
        f"codechef:profile:{username}",
        f"codechef:activity:{username}",
    ]
    for key in cache_keys:
        try:
            await redis_client.delete(key)
        except Exception:
            pass

    from scrapers.codechef_scraper import CodeChefScraper
    scraper = CodeChefScraper()
    data = await scraper.fetch_full_profile(username)

    if "error" in data:
        return APIResponse(success=False, data=None, error=data["error"])

    # Persist to platform_scores
    await _upsert_platform_score(db, current_user.id, "codechef", data)

    return APIResponse(success=True, data=data)


@router.post("/hackerrank/direct", response_model=APIResponse)
async def sync_hackerrank_direct(
    payload: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Synchronous HackerRank sync — runs scraper directly, saves to DB."""
    if not payload.hackerrank_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="hackerrank_username is required",
        )

    from scrapers.hackerrank_scraper import HackerRankScraper
    scraper = HackerRankScraper()
    data = await scraper.fetch_full_profile(payload.hackerrank_username)

    if "error" in data:
        return APIResponse(success=False, data=None, error=data["error"])

    # Persist to platform_scores
    await _upsert_platform_score(db, current_user.id, "hackerrank", data)

    return APIResponse(success=True, data=data)


@router.post("/resume/upload", response_model=APIResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload and parse a resume PDF.
    Saves parsed data to user record and returns extracted info.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted",
        )

    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be under 5MB",
        )

    try:
        pdf_bytes = await file.read()

        from nlp.resume_parser import ResumeParser
        from nlp.skill_extractor import SkillExtractor

        parser = ResumeParser()
        extractor = SkillExtractor()

        parsed = await parser.parse_pdf_bytes(pdf_bytes)
        if parsed.get("error"):
            return APIResponse(success=False, data=None, error=parsed["error"])

        # Extract skills from resume text
        skills = extractor.extract_from_text(parsed.get("raw_text", ""))

        result_data = {
            "filename": file.filename,
            "sections": list(parsed.get("sections", {}).keys()),
            "education": parsed.get("education", []),
            "experience": parsed.get("experience", []),
            "projects": parsed.get("projects", []),
            "certifications": parsed.get("certifications", []),
            "contact": parsed.get("contact", {}),
            "skills_extracted": skills[:30],
            "total_skills": len(skills),
            "file_size_kb": round(len(pdf_bytes) / 1024),
            "uploaded_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        }

        # Persist to user record
        from app.repositories.users import UserRepository
        repo = UserRepository(db)
        await repo.update(
            current_user.id,
            resume_url=file.filename,
            resume_parsed_data=result_data,
        )

        return APIResponse(success=True, data=result_data)
    except Exception as e:
        logger.error(f"Resume upload error: {e}")
        return APIResponse(success=False, data=None, error=str(e))

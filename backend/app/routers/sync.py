# Sync trigger endpoints — kick off platform data sync
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.db import User
from app.models.schemas import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])


class SyncRequest(BaseModel):
    """Trigger platform sync for a user."""
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None


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
):
    """
    Synchronous GitHub sync (for development/testing).
    Runs the scraper directly without Celery.
    """
    if not payload.github_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="github_username is required",
        )

    from scrapers.github_scraper import GitHubScraper
    scraper = GitHubScraper()
    data = await scraper.fetch_full_profile(payload.github_username)

    if "error" in data:
        return APIResponse(success=False, data=None, error=data["error"])

    return APIResponse(success=True, data=data)


@router.post("/leetcode/direct", response_model=APIResponse)
async def sync_leetcode_direct(
    payload: SyncRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Synchronous LeetCode sync (for development/testing).
    """
    if not payload.leetcode_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="leetcode_username is required",
        )

    from scrapers.leetcode_scraper import LeetCodeScraper
    scraper = LeetCodeScraper()
    data = await scraper.fetch_full_stats(payload.leetcode_username)

    if "error" in data:
        return APIResponse(success=False, data=None, error=data["error"])

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

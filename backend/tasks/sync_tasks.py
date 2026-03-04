# Platform sync background tasks — GitHub + LeetCode fetch → DB save → cache invalidate
import logging
import asyncio
from uuid import UUID

from tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Helper to run async code in Celery's sync context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, name="sync_user_github", max_retries=2)
def sync_user_github(self, user_id: str, github_username: str) -> dict:
    """
    Sync a user's GitHub data:
    1. Fetch full profile via GitHubScraper
    2. Extract skills via SkillExtractor
    3. Save platform_scores to DB
    4. Invalidate Redis cache
    """
    try:
        return _run_async(_sync_github(user_id, github_username))
    except Exception as exc:
        logger.error(f"GitHub sync failed for {github_username}: {exc}")
        raise self.retry(exc=exc, countdown=30)


async def _sync_github(user_id: str, github_username: str) -> dict:
    from scrapers.github_scraper import GitHubScraper
    from nlp.skill_extractor import SkillExtractor
    from app.core.database import async_session_factory
    from app.core.redis import redis_client
    from app.models.db import PlatformScore

    scraper = GitHubScraper()
    extractor = SkillExtractor()

    # Fetch GitHub data
    github_data = await scraper.fetch_full_profile(github_username)
    if "error" in github_data:
        return {"success": False, "error": github_data["error"]}

    # Extract skills from language distribution
    lang_skills = extractor.extract_from_languages(github_data.get("language_distribution", {}))

    # Extract skills from repo descriptions and topics
    all_text = " ".join([
        r.get("description", "") or "" for r in github_data.get("top_repos", [])
    ] + [
        " ".join(r.get("topics", [])) for r in github_data.get("top_repos", [])
    ])
    text_skills = extractor.extract_from_text(all_text)

    # Save to database
    async with async_session_factory() as session:
        score = PlatformScore(
            user_id=UUID(user_id),
            platform="github",
            raw_data=github_data,
            extracted_skills=[s["name"] for s in (lang_skills + text_skills)],
        )
        session.add(score)
        await session.commit()

    # Invalidate cached scores
    try:
        await redis_client.delete(f"scores:{user_id}")
    except Exception:
        pass

    return {
        "success": True,
        "repos_analyzed": github_data.get("total_repos", 0),
        "skills_found": len(lang_skills) + len(text_skills),
        "languages": list(github_data.get("language_distribution", {}).keys()),
    }


@celery_app.task(bind=True, name="sync_user_leetcode", max_retries=2)
def sync_user_leetcode(self, user_id: str, leetcode_username: str) -> dict:
    """
    Sync a user's LeetCode data:
    1. Fetch full stats via LeetCodeScraper
    2. Save platform_scores to DB
    3. Invalidate Redis cache
    """
    try:
        return _run_async(_sync_leetcode(user_id, leetcode_username))
    except Exception as exc:
        logger.error(f"LeetCode sync failed for {leetcode_username}: {exc}")
        raise self.retry(exc=exc, countdown=30)


async def _sync_leetcode(user_id: str, leetcode_username: str) -> dict:
    from scrapers.leetcode_scraper import LeetCodeScraper
    from app.core.database import async_session_factory
    from app.core.redis import redis_client
    from app.models.db import PlatformScore

    scraper = LeetCodeScraper()

    # Fetch LeetCode data
    lc_data = await scraper.fetch_full_stats(leetcode_username)
    if "error" in lc_data:
        return {"success": False, "error": lc_data["error"]}

    # Save to database
    async with async_session_factory() as session:
        score = PlatformScore(
            user_id=UUID(user_id),
            platform="leetcode",
            raw_data=lc_data,
            extracted_skills=[
                t["tag"] for t in lc_data.get("topic_breakdown", [])[:15]
            ],
        )
        session.add(score)
        await session.commit()

    # Invalidate cached scores
    try:
        await redis_client.delete(f"scores:{user_id}")
    except Exception:
        pass

    return {
        "success": True,
        "total_solved": lc_data.get("summary", {}).get("total_solved", 0),
        "contest_rating": (lc_data.get("contest", {}).get("ranking") or {}).get("rating"),
    }


@celery_app.task(name="sync_user_platforms")
def sync_user_platforms(user_id: str, github_username: str = None, leetcode_username: str = None) -> dict:
    """
    Sync all platforms for a user. Dispatches individual sync tasks.
    """
    results = {}

    if github_username:
        sync_user_github.delay(user_id, github_username)
        results["github"] = "dispatched"

    if leetcode_username:
        sync_user_leetcode.delay(user_id, leetcode_username)
        results["leetcode"] = "dispatched"

    return results

# GitHub sync service — pulls repo data and updates skill_progress + activity tracking
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import User, UserRoadmap, SkillProgress
from scrapers.github_scraper import GitHubScraper

logger = logging.getLogger(__name__)

# Maps language names (from GitHub) to our skill_progress lc_tag slugs
LANGUAGE_TO_TAG: dict[str, str] = {
    "Python": "dynamic-programming",  # Python users tend to do DP
    "JavaScript": "array",
    "TypeScript": "array",
    "Java": "tree",
    "C++": "sorting",
    "C": "bit-manipulation",
    "Go": "graph",
    "Rust": "stack",
    "Ruby": "string",
    "Swift": "linked-list",
    "Kotlin": "tree",
    "Dart": "queue",
    "Shell": "string",
    "HTML": "string",
    "CSS": "string",
    "SQL": "hash-table",
    "R": "math",
    "Scala": "dynamic-programming",
}

# Maps GitHub topics to skill_progress lc_tags for more accurate matching
TOPIC_TO_TAG: dict[str, str] = {
    "machine-learning": "dynamic-programming",
    "data-structures": "array",
    "algorithms": "sorting",
    "web-development": "array",
    "react": "array",
    "nextjs": "array",
    "fastapi": "hash-table",
    "django": "hash-table",
    "database": "hash-table",
    "graph-algorithms": "graph",
    "trees": "tree",
    "sorting": "sorting",
}


async def sync_github_for_roadmap(
    session: AsyncSession,
    user: User,
    roadmap: UserRoadmap,
) -> dict:
    """
    GitHub sync pipeline:
    1. Fetch repos + language distribution
    2. Update skill_progress for language-aligned topics
    3. Fetch contribution calendar for activity tracking
    4. Update roadmap last_synced_at
    """
    gh_username = user.github_username
    if not gh_username:
        return {"synced": False, "reason": "No GitHub username configured"}

    scraper = GitHubScraper()
    stats: dict = {"repos_analyzed": 0, "skills_updated": 0, "total_contributions": 0}

    # ─── 1. Fetch repos and language distribution ───
    try:
        repos = await scraper.fetch_repos(gh_username)
    except Exception as e:
        logger.error(f"GitHub fetch failed for {gh_username}: {e}")
        return {"synced": False, "reason": str(e)}

    stats["repos_analyzed"] = len(repos)

    # Compute language distribution
    language_totals: dict[str, int] = {}
    for repo in repos[:30]:  # Top 30 repos
        if repo.get("fork"):
            continue
        lang = repo.get("language")
        if lang:
            language_totals[lang] = language_totals.get(lang, 0) + 1

    # ─── 2. Update skill_progress based on language proficiency ───
    skill_rows = (await session.execute(
        select(SkillProgress).where(SkillProgress.roadmap_id == roadmap.id)
    )).scalars().all()

    # Build tag → repo count, matching languages to our tags
    tag_repo_count: dict[str, int] = {}
    for lang, count in language_totals.items():
        tag = LANGUAGE_TO_TAG.get(lang)
        if tag:
            tag_repo_count[tag] = tag_repo_count.get(tag, 0) + count

    # Also check repo topics
    for repo in repos[:30]:
        for topic in (repo.get("topics") or []):
            tag = TOPIC_TO_TAG.get(topic)
            if tag:
                tag_repo_count[tag] = tag_repo_count.get(tag, 0) + 1

    # Boost skill_progress for topics with GitHub presence
    # Each repo with matching language adds a small solved increment
    for sp in skill_rows:
        matching_count = tag_repo_count.get(sp.lc_tag, 0)
        if matching_count > 0:
            # GitHub projects contribute up to 20% of required (capped)
            gh_bonus = min(matching_count * 2, int(sp.required * 0.2))
            new_solved = max(sp.solved, sp.solved + gh_bonus) if gh_bonus > 0 else sp.solved
            if new_solved != sp.solved:
                sp.solved = new_solved
                sp.progress = round(min(new_solved / sp.required * 100, 100), 1) if sp.required > 0 else 0.0
                sp.updated_at = datetime.utcnow()
                stats["skills_updated"] += 1

    # ─── 3. Fetch contribution calendar ───
    try:
        calendar = await scraper.fetch_contribution_calendar(gh_username)
    except Exception as e:
        logger.warning(f"GitHub calendar fetch failed: {e}")
        calendar = {}

    total_contributions = sum(calendar.values()) if calendar else 0
    stats["total_contributions"] = total_contributions

    # Count commits this week
    gh_commits_this_week = 0
    if calendar:
        today = datetime.now(timezone.utc).date()
        monday = today - timedelta(days=today.weekday())
        for date_str, count in calendar.items():
            try:
                d = datetime.strptime(date_str, "%Y-%m-%d").date()
                if d >= monday:
                    gh_commits_this_week += count
            except ValueError:
                continue

    stats["commits_this_week"] = gh_commits_this_week

    # ─── 4. Update roadmap tracking ───
    roadmap.last_synced_at = datetime.utcnow()

    await session.commit()

    logger.info(f"GitHub sync complete for {gh_username}: {stats}")
    return {"synced": True, **stats}

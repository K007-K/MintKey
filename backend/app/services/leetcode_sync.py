# LeetCode sync service — pulls recent submissions and updates skill_progress + streak
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import User, UserRoadmap, SkillProgress, LcSubmission
from scrapers.leetcode_scraper import LeetCodeScraper

logger = logging.getLogger(__name__)

# Maps our roadmap topic lc_tags to LeetCode GraphQL tagSlugs
TAG_SLUG_MAP: dict[str, list[str]] = {
    "array":           ["array"],
    "string":          ["string"],
    "hash-table":      ["hash-table"],
    "linked-list":     ["linked-list"],
    "two-pointers":    ["two-pointers"],
    "binary-search":   ["binary-search"],
    "stack":           ["stack", "monotonic-stack"],
    "queue":           ["queue", "monotonic-queue"],
    "tree":            ["tree", "binary-tree", "binary-search-tree"],
    "graph":           ["graph"],
    "dynamic-programming": ["dynamic-programming"],
    "backtracking":    ["backtracking"],
    "greedy":          ["greedy"],
    "sorting":         ["sorting"],
    "heap":            ["heap-priority-queue"],
    "sliding-window":  ["sliding-window"],
    "recursion":       ["recursion"],
    "bit-manipulation":["bit-manipulation"],
    "math":            ["math"],
    "divide-and-conquer": ["divide-and-conquer"],
    "trie":            ["trie"],
    "segment-tree":    ["segment-tree"],
    "union-find":      ["union-find"],
    "bfs":             ["breadth-first-search"],
    "dfs":             ["depth-first-search"],
    "topological-sort":["topological-sort"],
}


async def sync_leetcode_for_roadmap(
    session: AsyncSession,
    user: User,
    roadmap: UserRoadmap,
) -> dict:
    """
    Full LeetCode sync pipeline:
    1. Fetch recent submissions from LeetCode API
    2. Upsert into lc_submissions table
    3. Count per-tag solved and update skill_progress
    4. Compute streak from submission calendar
    5. Update roadmap streak_days, last_solved_at, problems_this_week, last_synced_at
    """
    lc_username = user.leetcode_username
    if not lc_username:
        return {"synced": False, "reason": "No LeetCode username configured"}

    scraper = LeetCodeScraper()
    stats: dict = {"submissions_synced": 0, "skills_updated": 0, "streak": 0}

    # ─── 1. Fetch recent submissions ───
    try:
        recent = await scraper.fetch_recent_submissions(lc_username, limit=50)
    except Exception as e:
        logger.error(f"LeetCode fetch failed for {lc_username}: {e}")
        return {"synced": False, "reason": str(e)}

    # ─── 2. Upsert submissions into lc_submissions ───
    if recent:
        for sub in recent:
            if not sub.get("slug") or not sub.get("date"):
                continue
            solved_dt = datetime.strptime(sub["date"], "%Y-%m-%d").replace(tzinfo=timezone.utc)
            stmt = pg_insert(LcSubmission).values(
                user_id=user.id,
                lc_problem_id=sub["slug"],  # use slug as ID
                title_slug=sub["slug"],
                title=sub.get("title", sub["slug"]),
                difficulty="Medium",  # Recent submissions API doesn't return difficulty
                tags=[],
                solved_at=solved_dt,
            ).on_conflict_do_nothing(constraint="uq_user_lc_problem")
            await session.execute(stmt)
            stats["submissions_synced"] += 1

    # ─── 3. Fetch topic stats and update skill_progress ───
    try:
        topics = await scraper.fetch_topic_stats(lc_username)
    except Exception as e:
        logger.warning(f"Topic stats fetch failed: {e}")
        topics = None

    if topics:
        # Build slug → solved count lookup  
        slug_solved: dict[str, int] = {}
        for t in topics:
            slug_solved[t["slug"]] = t["solved"]

        # Update each skill_progress row
        skill_rows = (await session.execute(
            select(SkillProgress).where(SkillProgress.roadmap_id == roadmap.id)
        )).scalars().all()

        for sp in skill_rows:
            # Match our lc_tag to LeetCode slugs
            matching_slugs = TAG_SLUG_MAP.get(sp.lc_tag, [sp.lc_tag])
            total_solved = sum(slug_solved.get(s, 0) for s in matching_slugs)

            if total_solved != sp.solved:
                sp.solved = total_solved
                sp.progress = round(min(total_solved / sp.required * 100, 100), 1) if sp.required > 0 else 0.0
                sp.updated_at = datetime.utcnow()
                stats["skills_updated"] += 1

    # ─── 4. Fetch submission calendar for streak ───
    try:
        calendar = await scraper.fetch_submission_calendar(lc_username)
    except Exception as e:
        logger.warning(f"Calendar fetch failed: {e}")
        calendar = None

    streak = 0
    last_solved: Optional[datetime] = None
    problems_this_week = 0

    if calendar:
        streak = calendar.get("streak", 0)
        cal_data: dict[str, int] = calendar.get("calendar", {})

        # Find last solved date
        if cal_data:
            sorted_dates = sorted(cal_data.keys(), reverse=True)
            if sorted_dates:
                last_solved = datetime.strptime(sorted_dates[0], "%Y-%m-%d").replace(tzinfo=timezone.utc)

            # Count problems this week (Monday-based)
            today = datetime.now(timezone.utc).date()
            monday = today - timedelta(days=today.weekday())
            for date_str, count in cal_data.items():
                try:
                    d = datetime.strptime(date_str, "%Y-%m-%d").date()
                    if d >= monday:
                        problems_this_week += count
                except ValueError:
                    continue

    stats["streak"] = streak

    # ─── 5. Update roadmap tracking columns ───
    roadmap.streak_days = streak
    roadmap.last_solved_at = last_solved
    roadmap.problems_this_week = problems_this_week
    roadmap.last_synced_at = datetime.utcnow()

    # ─── 6. Cascade progress to roadmap data structures ───
    try:
        from app.services.update_roadmap_progress import update_roadmap_progress
        progress_result = await update_roadmap_progress(session, user, roadmap)
        stats.update(progress_result)
        logger.info(f"[LCSync] Progress cascade complete: {progress_result.get('problems_matched', 0)} problems matched")
    except Exception as e:
        logger.error(f"[LCSync] Progress cascade failed (sync still saved): {e}")

    await session.commit()

    logger.info(f"LeetCode sync complete for {lc_username}: {stats}")
    return {"synced": True, **stats}

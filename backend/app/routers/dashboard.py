# Dashboard summary endpoint — aggregates real platform data for dashboard cards
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.db import User, AnalysisResult, CompanyMatchScore
from app.models.schemas import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


def _compute_github_grade(profile_data: dict) -> tuple[str, str]:
    """Compute a letter grade and badge for GitHub depth."""
    if not profile_data or "error" in profile_data:
        return "—", "Sync needed"

    total_repos = profile_data.get("original_repos", 0)
    top_repos = profile_data.get("top_repos", [])
    languages = profile_data.get("language_distribution", {})

    # Score components
    repo_score = min(total_repos / 15, 1.0) * 30          # Up to 30 pts for 15+ repos
    lang_score = min(len(languages) / 5, 1.0) * 20         # Up to 20 pts for 5+ languages
    star_score = min(sum(r.get("stars", 0) for r in top_repos) / 20, 1.0) * 25  # Stars
    topic_score = min(
        sum(1 for r in top_repos if r.get("topics")) / 5, 1.0
    ) * 15  # Topics/tags
    desc_score = min(
        sum(1 for r in top_repos if r.get("description")) / 5, 1.0
    ) * 10  # Descriptions

    total = repo_score + lang_score + star_score + topic_score + desc_score

    if total >= 85:
        return "A+", "Top 5%"
    elif total >= 70:
        return "A", "Top 15%"
    elif total >= 55:
        return "B+", "Above Average"
    elif total >= 40:
        return "B", "Average"
    elif total >= 25:
        return "C+", "Building"
    else:
        return "C", "Getting Started"


def _compute_coding_streak(lc_data: dict, gh_data: dict) -> tuple[str, str]:
    """Estimate coding streak from platform activity."""
    # Use LeetCode submission streak if available
    lc_profile = lc_data.get("profile", {}) if lc_data and "error" not in lc_data else {}
    streak = lc_profile.get("streak", 0) or lc_profile.get("submitStats", {}).get("streak", 0)

    if streak and streak > 0:
        badge = "Personal Best" if streak >= 30 else f"+{min(streak, 7)} this week"
        return f"{streak} Days", badge

    # Fallback: count repos updated recently
    top_repos = gh_data.get("top_repos", []) if gh_data and "error" not in gh_data else []
    if top_repos:
        from datetime import datetime, timezone
        recent = 0
        for r in top_repos:
            updated = r.get("updated_at", "")
            if updated:
                try:
                    dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
                    days_ago = (datetime.now(timezone.utc) - dt).days
                    if days_ago <= 7:
                        recent += 1
                except Exception:
                    pass
        if recent > 0:
            return f"{recent} Active", f"{recent} repos this week"

    return "—", "Start building"


@router.get("/summary", response_model=APIResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a full dashboard summary with real data from scrapers and analysis.
    Returns stat cards, recent activity, gaps, and priority actions.
    """
    import asyncio

    github_data = {}
    leetcode_data = {}

    # Scrape platforms in parallel (cached — 24hr TTL)
    tasks = []

    if current_user.github_username:
        from scrapers.github_scraper import GitHubScraper

        async def fetch_github():
            scraper = GitHubScraper()
            return await scraper.fetch_full_profile(current_user.github_username)
        tasks.append(("github", fetch_github()))
    
    if current_user.leetcode_username:
        from scrapers.leetcode_scraper import LeetCodeScraper

        async def fetch_leetcode():
            scraper = LeetCodeScraper()
            return await scraper.fetch_full_stats(current_user.leetcode_username)
        tasks.append(("leetcode", fetch_leetcode()))

    # Run scrapers in parallel
    if tasks:
        results = await asyncio.gather(
            *[t[1] for t in tasks],
            return_exceptions=True,
        )
        for i, (name, _) in enumerate(tasks):
            result = results[i]
            if isinstance(result, Exception):
                logger.error(f"Scraper {name} failed: {result}")
            elif name == "github":
                github_data = result or {}
            elif name == "leetcode":
                leetcode_data = result or {}

    # --- Stat Cards ---
    # LeetCode Solved
    lc_summary = leetcode_data.get("summary", {}) if leetcode_data and "error" not in leetcode_data else {}
    lc_total = lc_summary.get("total_solved", 0)
    lc_easy = lc_summary.get("easy", 0)
    lc_medium = lc_summary.get("medium", 0)
    lc_hard = lc_summary.get("hard", 0)

    # GitHub Depth Grade
    gh_grade, gh_badge = _compute_github_grade(github_data)

    # Coding Streak
    streak_val, streak_badge = _compute_coding_streak(leetcode_data, github_data)

    # Readiness Grade — from latest match scores
    score_result = await db.execute(
        select(CompanyMatchScore)
        .where(CompanyMatchScore.user_id == current_user.id)
        .order_by(desc(CompanyMatchScore.computed_at))
        .limit(5)
    )
    match_scores = score_result.scalars().all()
    readiness = None
    readiness_badge = "Run analysis"
    if match_scores:
        readiness = round(
            sum(s.overall_score for s in match_scores) / len(match_scores)
        )
        readiness_badge = (
            "+4%" if readiness >= 80 else
            "Growing" if readiness >= 60 else
            "Building"
        )

    # --- Recent Activity ---
    recent_activity = []

    # GitHub recent commits
    if github_data and "error" not in github_data:
        for repo in (github_data.get("top_repos") or [])[:3]:
            if repo.get("recent_commit_count", 0) > 0:
                recent_activity.append({
                    "activity": f"Commit to '{repo['name']}'",
                    "platform": "GitHub",
                    "result": "Merged",
                    "resultStyle": "text-gray-700 bg-gray-100",
                    "date": repo.get("updated_at", "")[:10] if repo.get("updated_at") else "Recently",
                    "iconType": "git",
                })

    # LeetCode solved breakdown
    if lc_total > 0:
        recent_activity.insert(0, {
            "activity": f"{lc_hard} Hard, {lc_medium} Medium, {lc_easy} Easy solved",
            "platform": f"LeetCode (@{leetcode_data.get('username', '')})",
            "result": f"{lc_total} Total",
            "resultStyle": "text-green-700 bg-green-100",
            "date": "Lifetime",
            "iconType": "code",
        })

    # Pad with placeholder if empty
    if not recent_activity:
        recent_activity.append({
            "activity": "No activity yet",
            "platform": "Connect platforms to see activity",
            "result": "—",
            "resultStyle": "text-gray-500 bg-gray-100",
            "date": "—",
            "iconType": "code",
        })

    # --- Critical Gaps + Priority Actions from latest analysis ---
    critical_gaps = []
    priority_actions = []

    analysis_result = await db.execute(
        select(AnalysisResult)
        .where(AnalysisResult.user_id == current_user.id)
        .order_by(desc(AnalysisResult.started_at))
        .limit(1)
    )
    latest_analysis = analysis_result.scalar_one_or_none()

    if latest_analysis and latest_analysis.merged_analysis:
        data = latest_analysis.merged_analysis

        # Extract gaps from gap analysis
        gap_analysis = data.get("gap_analysis", {})
        if isinstance(gap_analysis, dict):
            for gap in gap_analysis.get("blocking", [])[:2]:
                critical_gaps.append({
                    "title": gap.get("skill", gap) if isinstance(gap, dict) else str(gap),
                    "desc": gap.get("reason", "Critical skill gap") if isinstance(gap, dict) else "Blocking gap identified by analysis",
                    "severity": "high",
                })
            for gap in gap_analysis.get("important", [])[:2]:
                critical_gaps.append({
                    "title": gap.get("skill", gap) if isinstance(gap, dict) else str(gap),
                    "desc": gap.get("reason", "Important skill gap") if isinstance(gap, dict) else "Important gap to address",
                    "severity": "medium",
                })

        # Extract actions from roadmap
        roadmap = data.get("roadmap", {})
        if isinstance(roadmap, dict):
            weeks = roadmap.get("weeks", [])
            if isinstance(weeks, list):
                for week in weeks[:2]:
                    tasks_list = week.get("tasks", []) if isinstance(week, dict) else []
                    for task in tasks_list[:2]:
                        title = task.get("title", task) if isinstance(task, dict) else str(task)
                        priority_actions.append({
                            "title": title,
                            "desc": f"Week {week.get('week', '?')}: {week.get('theme', '')}",
                            "time": task.get("time", "~30m") if isinstance(task, dict) else "~30m",
                            "link": None,
                        })

        # Extract from career coach message
        coach = data.get("career_coach", {})
        if isinstance(coach, dict) and coach.get("top_actions"):
            for action in coach["top_actions"][:3]:
                if len(priority_actions) < 3:
                    priority_actions.append({
                        "title": str(action),
                        "desc": "Recommended by AI Career Coach",
                        "time": "~30m",
                        "link": None,
                    })

    # Fallback defaults
    if not critical_gaps:
        if lc_total > 0 and lc_hard < lc_medium * 0.3:
            critical_gaps.append({
                "title": "Hard Problem Ratio",
                "desc": f"Only {lc_hard} Hard vs {lc_medium} Medium problems. Aim for 30%+ Hard ratio for top companies.",
                "severity": "high",
            })
        if github_data and gh_grade in ("C", "C+"):
            critical_gaps.append({
                "title": "GitHub Project Depth",
                "desc": "Add more READMEs, topics, and multi-language projects to improve your engineering profile.",
                "severity": "medium",
            })
        if not critical_gaps:
            critical_gaps = [
                {"title": "Run Full Analysis", "desc": "Trigger the 8-agent analysis to identify your real gaps.", "severity": "medium"}
            ]

    if not priority_actions:
        actions = []
        if lc_total == 0 and current_user.leetcode_username:
            actions.append({"title": "Solve your first LeetCode problem", "desc": "Start with an Easy — Two Sum is a great beginner problem", "time": "~20m", "link": "/dsa"})
        if lc_total > 0 and lc_hard < 10:
            actions.append({"title": "Attempt a Hard DP or Graph problem", "desc": f"You have {lc_hard} Hard solved — companies test Hard in interviews", "time": "~60m", "link": "/dsa"})
        if github_data and "error" not in github_data and github_data.get("original_repos", 0) < 5:
            actions.append({"title": "Build a new project on GitHub", "desc": "Original projects matter more than forks for hiring", "time": "~2h", "link": None})
        if not actions:
            actions = [
                {"title": "Connect your coding platforms", "desc": "Link GitHub and LeetCode to unlock your dashboard", "time": "~5m", "link": "/settings"},
                {"title": "Run full analysis", "desc": "Trigger the 8-agent AI analysis of your profile", "time": "~2m", "link": "/companies"},
            ]
        priority_actions = actions[:3]

    # --- Readiness Trend ---
    trend_data = []
    if match_scores:
        for i, s in enumerate(reversed(match_scores[:8])):
            trend_data.append({
                "week": f"Week {i + 1}",
                "score": round(s.overall_score),
            })

    return APIResponse(
        success=True,
        data={
            "stat_cards": {
                "leetcode": {
                    "total_solved": lc_total,
                    "easy": lc_easy,
                    "medium": lc_medium,
                    "hard": lc_hard,
                    "badge": f"+{lc_hard} hard" if lc_hard > 0 else ("Connected" if current_user.leetcode_username else "Not connected"),
                },
                "github": {
                    "grade": gh_grade,
                    "badge": gh_badge,
                    "total_repos": github_data.get("original_repos", 0) if github_data and "error" not in github_data else 0,
                    "languages": len(github_data.get("language_distribution", {})) if github_data and "error" not in github_data else 0,
                },
                "streak": {
                    "value": streak_val,
                    "badge": streak_badge,
                },
                "readiness": {
                    "value": readiness,
                    "badge": readiness_badge,
                },
            },
            "recent_activity": recent_activity[:5],
            "critical_gaps": critical_gaps[:3],
            "priority_actions": priority_actions[:3],
            "trend_data": trend_data if trend_data else None,
            "company_scores": [
                {
                    "company_slug": s.company_slug,
                    "overall_score": round(s.overall_score),
                }
                for s in match_scores
            ] if match_scores else [],
        },
    )

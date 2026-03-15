# pyre-ignore-all-errors
# Dashboard summary endpoint — aggregates real platform data for dashboard cards
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.db import User, AnalysisResult, CompanyMatchScore, UserTargetCompany
from app.models.schemas import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


async def _build_company_scores(match_scores: list, current_user, db) -> list[dict]:
    """
    Build company scores for the dashboard response.
    State B: real match scores from analysis.
    State A: target companies with null scores (pre-analysis placeholders).
    """
    if match_scores:
        return [
            {
                "company_slug": s.company_slug,
                "overall_score": round(s.overall_score),
            }
            for s in match_scores
        ]

    # State A — query target companies explicitly (avoid lazy-load in async)
    try:
        result = await db.execute(
            select(UserTargetCompany)
            .where(UserTargetCompany.user_id == current_user.id)
            .limit(5)
        )
        targets = result.scalars().all()
        if targets:
            return [
                {
                    "company_slug": tc.company_slug,
                    "overall_score": None,
                }
                for tc in targets
            ]
    except Exception as e:
        logging.getLogger(__name__).warning(f"Target companies query failed: {e}")

    return []

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


def _compute_profile_readiness(
    lc_data: dict, gh_data: dict, resume_data: dict | None
) -> tuple[int, str]:
    """
    Compute overall profile readiness (0-100) from all available data.
    Weights: LeetCode 40%, GitHub 35%, Resume 25%.
    Returns (score, badge).
    """
    lc_score = 0.0
    gh_score = 0.0
    res_score = 0.0
    components = 0

    # ── LeetCode component (40%) ──
    if lc_data and "error" not in lc_data:
        summary = lc_data.get("summary", {})
        total = summary.get("total_solved", 0)
        hard = summary.get("hard", 0)
        medium = summary.get("medium", 0)
        # Volume: up to 40pts for 150+ problems
        vol = min(total / 150, 1.0) * 40
        # Difficulty: up to 35pts for hard ratio
        diff = min(hard / max(total, 1) / 0.2, 1.0) * 35 if total > 0 else 0
        # Breadth: up to 25pts for medium + hard
        breadth = min((medium + hard) / max(total, 1), 1.0) * 25 if total > 0 else 0
        lc_score = vol + diff + breadth
        components += 40

    # ── GitHub component (35%) ──
    if gh_data and "error" not in gh_data:
        repos = gh_data.get("original_repos", 0)
        langs = len(gh_data.get("language_distribution", {}))
        top_repos = gh_data.get("top_repos", [])
        # Repos: up to 30pts for 10+ repos
        r = min(repos / 10, 1.0) * 30
        # Languages: up to 25pts for 5+ languages
        lang_pts = min(langs / 5, 1.0) * 25
        # Quality: up to 25pts for stars + descriptions
        stars = sum(rr.get("stars", 0) for rr in top_repos)
        q = min(stars / 10, 1.0) * 15 + min(
            sum(1 for rr in top_repos if rr.get("description")) / 5, 1.0
        ) * 10
        # Recency: up to 20pts
        from datetime import datetime, timezone
        recent = 0
        for rr in top_repos[:10]:
            updated = rr.get("updated_at", "")
            if updated:
                try:
                    dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
                    if (datetime.now(timezone.utc) - dt).days <= 30:
                        recent += 1
                except Exception:
                    pass
        rec = min(recent / 3, 1.0) * 20
        gh_score = r + lang_pts + q + rec
        components += 35

    # ── Resume component (25%) ──
    if resume_data and resume_data.get("total_skills"):
        skills = resume_data.get("total_skills", 0)
        projects = len(resume_data.get("projects", []))
        education = len(resume_data.get("education", []))
        experience = len(resume_data.get("experience", []))
        # Skills: up to 30pts for 15+ skills
        s = min(skills / 15, 1.0) * 30
        # Projects: up to 30pts for 4+ projects
        p = min(projects / 4, 1.0) * 30
        # Education: 15pts if present
        e = 15 if education > 0 else 0
        # Experience: 25pts based on count
        ex = min(experience / 2, 1.0) * 25
        res_score = s + p + e + ex
        components += 25

    if components == 0:
        return 0, "Connect platforms"

    # Normalize to 100
    weighted = (
        (lc_score * 40 + gh_score * 35 + res_score * 25) / components
    )
    score = round(min(weighted, 100))

    if score >= 85:
        badge = "Excellent"
    elif score >= 70:
        badge = "Strong"
    elif score >= 55:
        badge = "Good"
    elif score >= 40:
        badge = "Building"
    else:
        badge = "Getting started"

    return score, badge


def _extract_username(url_or_username: str) -> str:
    """Extract just the username from a full profile URL or return as-is."""
    if not url_or_username:
        return url_or_username
    val = url_or_username.strip().rstrip("/")
    # CodeChef: https://www.codechef.com/users/k_007 -> k_007
    # HackerRank: https://www.hackerrank.com/profile/kuramsasukarthi1 -> kuramsasukarthi1
    # LeetCode: https://leetcode.com/u/OG7 -> OG7
    if "/" in val and ("codechef.com" in val or "hackerrank.com" in val or "leetcode.com" in val or "github.com" in val):
        return val.split("/")[-1]
    return val


def _compute_cross_platform_streak(
    lc_data: dict, gh_data: dict, cc_data: dict, hr_data: dict
) -> dict:
    """
    Compute a real cross-platform coding streak from all platform activity.
    Returns {current_streak, longest_streak, week_activity, badge, yearly_heatmap, total_active_days}.
    yearly_heatmap: { "YYYY-MM-DD": { "count": N, "platforms": ["GitHub", ...] } }
    """
    from datetime import datetime, timezone, timedelta
    from collections import defaultdict

    # Track per-platform dates: date_str -> set of platform names
    date_platforms: dict[str, set[str]] = defaultdict(set)

    # 1. LeetCode submission calendar (best data source — daily counts)
    if lc_data and "error" not in lc_data:
        calendar = lc_data.get("submission_calendar", {})
        cal_dict = calendar.get("calendar", {}) if isinstance(calendar, dict) else {}
        for date_str, count in cal_dict.items():
            if count and int(count) > 0:
                date_platforms[date_str].add("LeetCode")
        # Also add recent submission dates
        for sub in (lc_data.get("recent_submissions") or []):
            if sub.get("date"):
                date_platforms[sub["date"]].add("LeetCode")

    # 2. GitHub — contribution calendar (full year) + recent events (supplement)
    if gh_data and "error" not in gh_data:
        # Primary source: per-day contribution calendar (365 days)
        contribution_cal = gh_data.get("contribution_calendar") or {}
        for date_str in contribution_cal:
            date_platforms[date_str].add("GitHub")
        # Supplement: recent events (for recent precision)
        for event in (gh_data.get("recent_events") or []):
            date_str = event.get("date", "")[:10]
            if date_str:
                date_platforms[date_str].add("GitHub")

    # 3. CodeChef contest dates
    if cc_data and "error" not in cc_data:
        for contest in (cc_data.get("recent_activity") or []):
            if contest.get("date"):
                date_platforms[contest["date"][:10]].add("CodeChef")

    # 4. HackerRank challenge dates
    if hr_data and "error" not in hr_data:
        for challenge in (hr_data.get("recent_activity") or []):
            if challenge.get("date"):
                date_platforms[challenge["date"][:10]].add("HackerRank")

    active_dates = set(date_platforms.keys())

    if not active_dates:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "week_activity": [False] * 7,
            "badge": "Start building",
            "yearly_heatmap": {},
            "total_active_days": 0,
        }

    today = datetime.now(timezone.utc).date()

    # Build 7-day heatmap (today = index 6, 6 days ago = index 0)
    week_activity = []
    for i in range(6, -1, -1):
        d = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        week_activity.append(d in active_dates)

    # Compute current streak: walk backwards from today
    current_streak = 0
    d = today
    while d.strftime("%Y-%m-%d") in active_dates:
        current_streak += 1
        d -= timedelta(days=1)

    # If today has no activity yet, check if yesterday was active (streak ongoing)
    if current_streak == 0:
        d = today - timedelta(days=1)
        while d.strftime("%Y-%m-%d") in active_dates:
            current_streak += 1
            d -= timedelta(days=1)

    # Compute longest streak from sorted dates
    sorted_dates = sorted(active_dates)
    longest = 1
    run = 1
    for i in range(1, len(sorted_dates)):
        try:
            prev = datetime.strptime(sorted_dates[i - 1], "%Y-%m-%d").date()
            curr = datetime.strptime(sorted_dates[i], "%Y-%m-%d").date()
            if (curr - prev).days == 1:
                run += 1
                longest = max(longest, run)
            else:
                run = 1
        except ValueError:
            run = 1

    # Build yearly heatmap — current calendar year only (Jan 1 → today)
    yearly_heatmap = {}
    year_start = today.replace(month=1, day=1)
    d = year_start
    while d <= today:
        d_str = d.strftime("%Y-%m-%d")
        if d_str in date_platforms:
            platforms = sorted(date_platforms[d_str])
            yearly_heatmap[d_str] = {
                "count": len(platforms),
                "platforms": platforms,
            }
        d += timedelta(days=1)

    # Badge logic
    if current_streak >= 30:
        badge = "🔥 On Fire!"
    elif current_streak >= 14:
        badge = "Unstoppable"
    elif current_streak >= 7:
        badge = "Hot Streak"
    elif current_streak >= 3:
        badge = "Active"
    elif current_streak >= 1:
        badge = "Active"
    else:
        badge = "Resume streak"

    return {
        "current_streak": current_streak,
        "longest_streak": longest if len(sorted_dates) > 1 else current_streak,
        "week_activity": week_activity,
        "badge": badge,
        "yearly_heatmap": yearly_heatmap,
        "total_active_days": len(active_dates),
    }


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

    github_data: dict = {}
    leetcode_data: dict = {}
    codechef_data: dict = {}
    hackerrank_data: dict = {}

    # Scrape ALL platforms in parallel (cached — 1hr/24hr TTL)
    tasks = []

    if current_user.github_username:
        from scrapers.github_scraper import GitHubScraper

        async def fetch_github():
            scraper = GitHubScraper()
            return await scraper.fetch_full_profile(_extract_username(current_user.github_username))
        tasks.append(("github", fetch_github()))

    if current_user.leetcode_username:
        from scrapers.leetcode_scraper import LeetCodeScraper

        async def fetch_leetcode():
            scraper = LeetCodeScraper()
            return await scraper.fetch_full_stats(_extract_username(current_user.leetcode_username))
        tasks.append(("leetcode", fetch_leetcode()))

    if current_user.codechef_username:
        from scrapers.codechef_scraper import CodeChefScraper

        async def fetch_codechef():
            scraper = CodeChefScraper()
            return await scraper.fetch_full_profile(_extract_username(current_user.codechef_username))
        tasks.append(("codechef", fetch_codechef()))

    if current_user.hackerrank_username:
        from scrapers.hackerrank_scraper import HackerRankScraper

        async def fetch_hackerrank():
            scraper = HackerRankScraper()
            return await scraper.fetch_full_profile(_extract_username(current_user.hackerrank_username))
        tasks.append(("hackerrank", fetch_hackerrank()))

    # Run all scrapers in parallel
    if tasks:
        results = await asyncio.gather(
            *[t[1] for t in tasks],
            return_exceptions=True,
        )
        for i, (name, _) in enumerate(tasks):
            result = results[i]
            if isinstance(result, BaseException):
                logger.error(f"Scraper {name} failed: {result}")
            else:
                res_dict = result or {}
                if name == "github":
                    github_data = res_dict
                elif name == "leetcode":
                    leetcode_data = res_dict
                elif name == "codechef":
                    codechef_data = res_dict
                elif name == "hackerrank":
                    hackerrank_data = res_dict

    # --- Build & Store Multi-Year Activity Calendar ---
    await _build_and_store_activity_calendar(
        current_user, github_data, leetcode_data, codechef_data, hackerrank_data, db
    )

    # --- Stat Cards ---
    # LeetCode Solved
    lc_summary = leetcode_data.get("summary", {}) if leetcode_data and "error" not in leetcode_data else {}
    lc_total = lc_summary.get("total_solved", 0)
    lc_easy = lc_summary.get("easy", 0)
    lc_medium = lc_summary.get("medium", 0)
    lc_hard = lc_summary.get("hard", 0)

    # GitHub Depth Grade
    gh_grade, gh_badge = _compute_github_grade(github_data)

    # Coding Streak — cross-platform
    streak_info = _compute_cross_platform_streak(leetcode_data, github_data, codechef_data, hackerrank_data)
    current_streak = streak_info["current_streak"]
    streak_val = f"{current_streak} Day{'s' if current_streak != 1 else ''}" if current_streak > 0 else "—"
    streak_badge = streak_info["badge"]

    # Readiness Grade — from analysis match scores only (State A/B model)
    resume_data = current_user.resume_parsed_data or {}

    # Fetch match scores for readiness + company bars
    score_result = await db.execute(
        select(CompanyMatchScore)
        .where(CompanyMatchScore.user_id == current_user.id)
        .order_by(desc(CompanyMatchScore.computed_at))
        .limit(5)
    )
    match_scores = score_result.scalars().all()

    # State A: no analysis → "—", State B: real score
    readiness = None
    readiness_badge = "Run analysis"
    has_analysis = False
    if match_scores:
        has_analysis = True
        readiness = round(
            sum(s.overall_score for s in match_scores) / len(match_scores)
        )
        if readiness >= 80:
            readiness_badge = "Excellent"
        elif readiness >= 60:
            readiness_badge = "Growing"
        else:
            readiness_badge = "Building"

    # --- Recent Activity (real events from all platforms) ---
    recent_activity = []

    # GitHub recent events (from Events API)
    if github_data and "error" not in github_data:
        for event in (github_data.get("recent_events") or [])[:8]:
            etype = event.get("type", "push")
            icon = "git"
            if etype == "pr":
                result_text = "PR"
                result_style = "text-purple-700 bg-purple-100"
            elif etype == "create":
                result_text = "New"
                result_style = "text-blue-700 bg-blue-100"
            elif etype == "issue":
                result_text = "Issue"
                result_style = "text-orange-700 bg-orange-100"
            else:
                result_text = "Pushed"
                result_style = "text-gray-700 bg-gray-100"

            date_str = event.get("date", "")[:10] if event.get("date") else ""
            recent_activity.append({
                "activity": f"{event.get('detail', '')} — {event.get('repo', '')}",
                "platform": "GitHub",
                "result": result_text,
                "resultStyle": result_style,
                "date": date_str,
                "iconType": icon,
                "link": event.get("url", ""),
            })

    # LeetCode recent submissions
    if leetcode_data and "error" not in leetcode_data:
        for sub in (leetcode_data.get("recent_submissions") or [])[:8]:
            slug = sub.get("slug", "")
            recent_activity.append({
                "activity": f"Solved '{sub.get('title', '')}'",
                "platform": f"LeetCode ({sub.get('lang', '')})",
                "result": "Accepted ✓",
                "resultStyle": "text-green-700 bg-green-100",
                "date": sub.get("date", ""),
                "iconType": "code",
                "link": f"https://leetcode.com/problems/{slug}/submissions/" if slug else "",
            })

    # CodeChef recent contests
    cc_username = _extract_username(current_user.codechef_username) if current_user.codechef_username else ""
    if codechef_data and "error" not in codechef_data:
        for contest in (codechef_data.get("recent_activity") or [])[:5]:
            rank_text = f"Rank #{contest.get('rank', '?')}" if contest.get("rank") else "Participated"
            recent_activity.append({
                "activity": f"Contest: {contest.get('title', 'CodeChef Contest')}",
                "platform": "CodeChef",
                "result": rank_text,
                "resultStyle": "text-amber-700 bg-amber-100",
                "date": contest.get("date", ""),
                "iconType": "code",
                "link": f"https://www.codechef.com/users/{cc_username}" if cc_username else "",
            })

    # HackerRank recent challenges
    hr_username = _extract_username(current_user.hackerrank_username) if current_user.hackerrank_username else ""
    if hackerrank_data and "error" not in hackerrank_data:
        for challenge in (hackerrank_data.get("recent_activity") or [])[:5]:
            recent_activity.append({
                "activity": f"Solved '{challenge.get('title', '')}'" if challenge.get("title") else "Challenge completed",
                "platform": "HackerRank",
                "result": "Completed ✓",
                "resultStyle": "text-emerald-700 bg-emerald-100",
                "date": challenge.get("date", ""),
                "iconType": "code",
                "link": f"https://www.hackerrank.com/profile/{hr_username}" if hr_username else "",
            })

    # Resume upload event
    if resume_data and resume_data.get("total_skills"):
        uploaded_at = resume_data.get("uploaded_at", "")[:10] if resume_data.get("uploaded_at") else ""
        recent_activity.append({
            "activity": f"Resume parsed — {resume_data.get('total_skills', 0)} skills extracted",
            "platform": "Resume AI",
            "result": "Parsed ✓",
            "resultStyle": "text-teal-700 bg-teal-100",
            "date": uploaded_at,
            "iconType": "code",
            "link": "",
        })

    # Sort all activity by date descending
    recent_activity.sort(key=lambda x: x.get("date", ""), reverse=True)

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
    critical_gaps: list = []
    priority_actions: list = []

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
        if not resume_data or not resume_data.get("total_skills"):
            critical_gaps.append({
                "title": "No Resume Uploaded",
                "desc": "Upload your resume for AI-powered skill extraction and gap analysis.",
                "severity": "medium",
            })
        elif resume_data:
            projects = len(resume_data.get("projects", []))
            experience = len(resume_data.get("experience", []))
            if projects < 3:
                critical_gaps.append({
                    "title": "Low Project Count",
                    "desc": f"Only {projects} project{'s' if projects != 1 else ''} on resume. Top candidates showcase 4-6 projects.",
                    "severity": "medium",
                })
            if experience == 0:
                critical_gaps.append({
                    "title": "No Work Experience",
                    "desc": "Consider internships, freelance work, or open-source contributions to strengthen your resume.",
                    "severity": "medium",
                })
        if not critical_gaps:
            critical_gaps = [
                {"title": "Add Target Companies", "desc": "Select companies you're targeting to get personalized gap analysis.", "severity": "medium"}
            ]

    if not priority_actions:
        actions = []
        # State A: always show 3 onboarding-oriented actions
        if not has_analysis:
            actions.append({"title": "Run your first AI analysis", "desc": "Get personalized recommendations from 8 AI agents analyzing your profile", "time": "~2m", "link": "/companies"})
        if not resume_data or not resume_data.get("total_skills"):
            actions.append({"title": "Upload your resume", "desc": "Get AI-powered skill extraction and personalized insights", "time": "~2m", "link": "/profile"})
        if not match_scores:
            actions.append({"title": "Browse and add target companies", "desc": "Select companies to get match scores and personalized roadmaps", "time": "~3m", "link": "/companies"})
        if lc_total > 0 and lc_hard < 10:
            actions.append({"title": "Attempt a Hard DP or Graph problem", "desc": f"You have {lc_hard} Hard solved — companies test Hard in interviews", "time": "~60m", "link": "/dsa"})
        if lc_total == 0 and current_user.leetcode_username:
            actions.append({"title": "Solve your first LeetCode problem", "desc": "Start with an Easy — Two Sum is a great beginner problem", "time": "~20m", "link": "/dsa"})
        if github_data and "error" not in github_data and github_data.get("original_repos", 0) < 5:
            actions.append({"title": "Build a new project on GitHub", "desc": "Original projects matter more than forks for hiring", "time": "~2h", "link": None})
        if not actions:
            actions = [
                {"title": "Connect your coding platforms", "desc": "Link GitHub and LeetCode to unlock your dashboard", "time": "~5m", "link": "/settings"},
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

    # State A: no trend data at all (frontend shows empty state)
    # State B: real trend from match scores above
    trend_label = "Readiness Trend"

    # --- Resume Summary ---
    resume_summary = None
    if resume_data and resume_data.get("total_skills"):
        resume_summary = {
            "skills": resume_data.get("total_skills", 0),
            "projects": len(resume_data.get("projects", [])),
            "education": len(resume_data.get("education", [])),
            "experience": len(resume_data.get("experience", [])),
            "uploaded": True,
        }

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
                    "total_contributions": github_data.get("total_contributions", 0) if github_data and "error" not in github_data else 0,
                },
                "streak": {
                    "value": streak_val,
                    "badge": streak_badge,
                    "current_streak": current_streak,
                    "week_activity": streak_info["week_activity"],
                    "longest_streak": streak_info["longest_streak"],
                    "yearly_heatmap": streak_info["yearly_heatmap"],
                    "total_active_days": streak_info["total_active_days"],
                    "available_years": _get_available_years(current_user),
                },
                "readiness": {
                    "value": readiness,
                    "badge": readiness_badge,
                },
            },
            "recent_activity": recent_activity[:10],
            "critical_gaps": critical_gaps[:3],
            "priority_actions": priority_actions[:3],
            "trend_data": trend_data if trend_data else None,
            "trend_label": trend_label,
            "resume_summary": resume_summary,
            "company_scores": await _build_company_scores(match_scores, current_user, db),
        },
    )


def _get_available_years(user) -> list[int]:
    """Extract available years from stored activity_calendar."""
    from datetime import datetime
    cal = user.activity_calendar or {}
    years = []
    for key in cal:
        if key.startswith("_"):
            continue
        try:
            years.append(int(key))
        except ValueError:
            continue
    return sorted(years) if years else [datetime.now().year]


async def _build_and_store_activity_calendar(
    user, gh_data: dict, lc_data: dict, cc_data: dict, hr_data: dict, db: AsyncSession
) -> None:
    """
    Build multi-year activity calendar from all platforms and persist to DB.
    First sync: fetch full history from account creation.
    Subsequent syncs: only refresh current year.
    """
    from datetime import datetime


    existing_cal = user.activity_calendar or {}
    meta = existing_cal.get("_meta", {})
    is_first_sync = not meta.get("last_full_sync")
    current_year = datetime.now().year

    merged: dict[str, dict[str, dict]] = {}

    # Copy existing data (except _meta)
    for yr_key, yr_data in existing_cal.items():
        if yr_key.startswith("_"):
            continue
        merged[yr_key] = yr_data if isinstance(yr_data, dict) else {}

    try:
        if is_first_sync:
            # --- FULL HISTORY FETCH ---
            logger.info(f"First sync for user {user.id} — fetching full activity history")

            # GitHub full history
            if user.github_username and gh_data and "error" not in gh_data:
                from scrapers.github_scraper import GitHubScraper
                gh_scraper = GitHubScraper()
                gh_username = _extract_username(user.github_username)
                gh_history = await gh_scraper.fetch_full_history_calendar(gh_username)
                for yr_str, yr_cal in gh_history.items():
                    if yr_str not in merged:
                        merged[yr_str] = {}
                    for date_str, level in yr_cal.items():
                        if date_str not in merged[yr_str]:
                            merged[yr_str][date_str] = {"count": 0, "platforms": []}
                        elif isinstance(merged[yr_str][date_str], (int, float)):
                            merged[yr_str][date_str] = {"count": int(merged[yr_str][date_str]), "platforms": []}
                        merged[yr_str][date_str]["count"] = merged[yr_str][date_str].get("count", 0) + level
                        if "GitHub" not in merged[yr_str][date_str].get("platforms", []):
                            merged[yr_str][date_str].setdefault("platforms", []).append("GitHub")

            # LeetCode full history
            if user.leetcode_username and lc_data and "error" not in lc_data:
                from scrapers.leetcode_scraper import LeetCodeScraper
                lc_scraper = LeetCodeScraper()
                lc_username = _extract_username(user.leetcode_username)
                lc_history = await lc_scraper.fetch_full_history_calendar(lc_username)
                for yr_str, yr_cal in lc_history.items():
                    if yr_str not in merged:
                        merged[yr_str] = {}
                    for date_str, count in yr_cal.items():
                        if date_str not in merged[yr_str]:
                            merged[yr_str][date_str] = {"count": 0, "platforms": []}
                        elif isinstance(merged[yr_str][date_str], (int, float)):
                            merged[yr_str][date_str] = {"count": int(merged[yr_str][date_str]), "platforms": []}
                        merged[yr_str][date_str]["count"] = merged[yr_str][date_str].get("count", 0) + count
                        if "LeetCode" not in merged[yr_str][date_str].get("platforms", []):
                            merged[yr_str][date_str].setdefault("platforms", []).append("LeetCode")

            meta["last_full_sync"] = datetime.now().isoformat()
        else:
            # --- INCREMENTAL SYNC (current year only) ---
            logger.info(f"Incremental sync for user {user.id} — refreshing year {current_year}")
            yr_str = str(current_year)
            merged[yr_str] = {}  # Reset current year data

            # GitHub current year
            if user.github_username and gh_data and "error" not in gh_data:
                from scrapers.github_scraper import GitHubScraper
                gh_scraper = GitHubScraper()
                gh_username = _extract_username(user.github_username)
                gh_cal = await gh_scraper.fetch_contribution_calendar(gh_username, year=current_year)
                for date_str, level in gh_cal.items():
                    if date_str not in merged[yr_str]:
                        merged[yr_str][date_str] = {"count": 0, "platforms": []}
                    merged[yr_str][date_str]["count"] += level
                    if "GitHub" not in merged[yr_str][date_str].get("platforms", []):
                        merged[yr_str][date_str].setdefault("platforms", []).append("GitHub")

            # LeetCode current year
            if user.leetcode_username and lc_data and "error" not in lc_data:
                from scrapers.leetcode_scraper import LeetCodeScraper
                lc_scraper = LeetCodeScraper()
                lc_username = _extract_username(user.leetcode_username)
                lc_cal_data = await lc_scraper.fetch_submission_calendar(lc_username, year=current_year)
                for date_str, count in lc_cal_data.get("calendar", {}).items():
                    if date_str not in merged[yr_str]:
                        merged[yr_str][date_str] = {"count": 0, "platforms": []}
                    merged[yr_str][date_str]["count"] += count
                    if "LeetCode" not in merged[yr_str][date_str].get("platforms", []):
                        merged[yr_str][date_str].setdefault("platforms", []).append("LeetCode")

        # Add CodeChef contest dates (from ratingData — sparse)
        if cc_data and "error" not in cc_data:
            for contest in cc_data.get("rating_data", []):
                end_date = contest.get("end_date") or contest.get("getdtime", "")
                if end_date and len(end_date) >= 10:
                    date_str = end_date[:10]
                    yr_str = date_str[:4]
                    if yr_str not in merged:
                        merged[yr_str] = {}
                    if date_str not in merged[yr_str]:
                        merged[yr_str][date_str] = {"count": 0, "platforms": []}
                    elif isinstance(merged[yr_str][date_str], (int, float)):
                        merged[yr_str][date_str] = {"count": int(merged[yr_str][date_str]), "platforms": []}
                    merged[yr_str][date_str]["count"] = merged[yr_str][date_str].get("count", 0) + 1
                    if "CodeChef" not in merged[yr_str][date_str].get("platforms", []):
                        merged[yr_str][date_str].setdefault("platforms", []).append("CodeChef")

        # Add HackerRank recent challenge dates
        if hr_data and "error" not in hr_data:
            for challenge in hr_data.get("recent_activity", []):
                created = challenge.get("created_at", "")
                if created and len(created) >= 10:
                    date_str = created[:10]
                    yr_str = date_str[:4]
                    if yr_str not in merged:
                        merged[yr_str] = {}
                    if date_str not in merged[yr_str]:
                        merged[yr_str][date_str] = {"count": 0, "platforms": []}
                    elif isinstance(merged[yr_str][date_str], (int, float)):
                        merged[yr_str][date_str] = {"count": int(merged[yr_str][date_str]), "platforms": []}
                    merged[yr_str][date_str]["count"] = merged[yr_str][date_str].get("count", 0) + 1
                    if "HackerRank" not in merged[yr_str][date_str].get("platforms", []):
                        merged[yr_str][date_str].setdefault("platforms", []).append("HackerRank")

        meta["last_sync"] = datetime.now().isoformat()
        meta["oldest_year"] = min(int(k) for k in merged if not k.startswith("_")) if merged else current_year
        merged["_meta"] = meta

        # Persist to DB
        from sqlalchemy import update
        stmt = update(User).where(User.id == user.id).values(activity_calendar=merged)
        await db.execute(stmt)
        await db.commit()

        total_days = sum(len(v) for k, v in merged.items() if not k.startswith("_"))
        logger.info(f"Activity calendar saved for user {user.id}: {len(merged) - 1} years, {total_days} active days")

    except Exception as e:
        logger.error(f"Failed to build activity calendar for user {user.id}: {e}")


# --- Heatmap Endpoint ---
@router.get("/heatmap")
async def get_heatmap(
    year: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get heatmap data for a specific year from stored activity_calendar."""
    from datetime import datetime

    cal = current_user.activity_calendar or {}
    target_year = year or datetime.now().year
    yr_str = str(target_year)

    year_data = cal.get(yr_str, {})
    meta = cal.get("_meta", {})

    # Build available years with summary stats
    year_summaries = []
    available_years = []
    for key in sorted(cal.keys()):
        if key.startswith("_"):
            continue
        try:
            yr = int(key)
            available_years.append(yr)
            yr_entries = cal[key]
            active_days = len(yr_entries) if isinstance(yr_entries, dict) else 0
            year_summaries.append({"year": yr, "active_days": active_days})
        except ValueError:
            continue

    if not available_years:
        available_years = [target_year]
        year_summaries = [{"year": target_year, "active_days": 0}]

    return APIResponse(
        success=True,
        data={
            "year": target_year,
            "heatmap": year_data,
            "available_years": available_years,
            "year_summaries": year_summaries,
            "meta": {
                "oldest_year": meta.get("oldest_year", target_year),
                "last_sync": meta.get("last_sync"),
                "last_full_sync": meta.get("last_full_sync"),
            },
        },
    )

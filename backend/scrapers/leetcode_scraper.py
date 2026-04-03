# LeetCode GraphQL scraper — unofficial public endpoint
import logging
from typing import Optional
from datetime import datetime, timezone
import httpx
from app.core.redis import redis_client
from scrapers.github_scraper import (
    _is_redis_available, _mark_redis_up, _mark_redis_down,
    _mem_cache_get, _mem_cache_set,
)
import json

logger = logging.getLogger(__name__)

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"
CACHE_TTL_LEETCODE = 86400  # 24 hours


class LeetCodeScraper:
    """Async LeetCode scraper using the public GraphQL endpoint."""

    def __init__(self) -> None:
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "MintKey-Scraper",
            "Referer": "https://leetcode.com",
        }

    async def _query(self, query: str, variables: dict) -> Optional[dict]:
        """Execute a GraphQL query against LeetCode."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(
                    LEETCODE_GRAPHQL_URL,
                    json={"query": query, "variables": variables},
                    headers=self.headers,
                )
                if response.status_code == 200:
                    data = response.json()
                    if "errors" in data:
                        logger.warning(f"LeetCode GraphQL errors: {data['errors']}")
                        return None
                    return data.get("data")
                else:
                    logger.error(f"LeetCode API error {response.status_code}")
                    return None
        except httpx.TimeoutException:
            logger.error("LeetCode API timeout")
            return None
        except Exception as e:
            logger.error(f"LeetCode API error: {e}")
            return None

    async def fetch_user_profile(self, username: str) -> Optional[dict]:
        """Fetch basic LeetCode profile info."""
        cache_key = f"leetcode:profile:{username}"
        if _is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    _mark_redis_up()
                    _mem_cache_set(cache_key, cached)
                    return json.loads(cached)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            return json.loads(mem_cached)

        query = """
        query getUserProfile($username: String!) {
            matchedUser(username: $username) {
                username
                profile {
                    realName
                    ranking
                    reputation
                    solutionCount
                    starRating
                }
                submitStats: submitStatsGlobal {
                    acSubmissionNum {
                        difficulty
                        count
                        submissions
                    }
                }
            }
        }
        """
        data = await self._query(query, {"username": username})
        if data and data.get("matchedUser"):
            result = data["matchedUser"]
            json_result = json.dumps(result)
            _mem_cache_set(cache_key, json_result)
            if _is_redis_available():
                try:
                    await redis_client.set(cache_key, json_result, ex=CACHE_TTL_LEETCODE)
                    _mark_redis_up()
                except Exception:
                    _mark_redis_down()
            return result
        return None

    async def fetch_problem_stats(self, username: str) -> Optional[dict]:
        """Fetch solved problem counts by difficulty."""
        cache_key = f"leetcode:stats:{username}"
        if _is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    _mark_redis_up()
                    _mem_cache_set(cache_key, cached)
                    return json.loads(cached)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            return json.loads(mem_cached)

        query = """
        query userProblemsSolved($username: String!) {
            allQuestionsCount {
                difficulty
                count
            }
            matchedUser(username: $username) {
                submitStats: submitStatsGlobal {
                    acSubmissionNum {
                        difficulty
                        count
                        submissions
                    }
                }
                problemsSolvedBeatsStats {
                    difficulty
                    percentage
                }
            }
        }
        """
        data = await self._query(query, {"username": username})
        if not data:
            return None

        all_questions = {q["difficulty"]: q["count"] for q in (data.get("allQuestionsCount") or [])}
        matched = data.get("matchedUser", {})
        ac_stats = matched.get("submitStats", {}).get("acSubmissionNum", [])
        beats = {b["difficulty"]: b["percentage"] for b in (matched.get("problemsSolvedBeatsStats") or [])}

        result = {
            "total_questions": all_questions,
            "solved": {},
            "beats": beats,
        }

        for stat in ac_stats:
            diff = stat["difficulty"]
            result["solved"][diff] = {
                "count": stat["count"],
                "submissions": stat["submissions"],
            }

        json_result = json.dumps(result)
        _mem_cache_set(cache_key, json_result)
        if _is_redis_available():
            try:
                await redis_client.set(cache_key, json_result, ex=CACHE_TTL_LEETCODE)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()

        return result

    async def fetch_topic_stats(self, username: str) -> Optional[list]:
        """Fetch problem counts by topic/tag."""
        cache_key = f"leetcode:topics:{username}"
        if _is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    _mark_redis_up()
                    _mem_cache_set(cache_key, cached)
                    return json.loads(cached)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            return json.loads(mem_cached)

        query = """
        query skillStats($username: String!) {
            matchedUser(username: $username) {
                tagProblemCounts {
                    advanced {
                        tagName
                        tagSlug
                        problemsSolved
                    }
                    intermediate {
                        tagName
                        tagSlug
                        problemsSolved
                    }
                    fundamental {
                        tagName
                        tagSlug
                        problemsSolved
                    }
                }
            }
        }
        """
        data = await self._query(query, {"username": username})
        if not data or not data.get("matchedUser"):
            return None

        tag_counts = data["matchedUser"].get("tagProblemCounts", {})

        # Merge all levels into a single sorted list
        all_topics = []
        for level in ["fundamental", "intermediate", "advanced"]:
            for topic in (tag_counts.get(level) or []):
                all_topics.append({
                    "tag": topic["tagName"],
                    "slug": topic["tagSlug"],
                    "solved": topic["problemsSolved"],
                    "level": level,
                })

        # Sort by solved count descending
        all_topics.sort(key=lambda x: -x["solved"])

        json_topics = json.dumps(all_topics)
        _mem_cache_set(cache_key, json_topics)
        if _is_redis_available():
            try:
                await redis_client.set(cache_key, json_topics, ex=CACHE_TTL_LEETCODE)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()

        return all_topics

    async def fetch_submission_calendar(self, username: str, year: int | None = None) -> dict:
        """Fetch the submission calendar (daily activity counts) for a specific year."""
        target_year = year or datetime.now().year
        cache_key = f"leetcode:calendar:{username}:{target_year}"
        if _is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    _mark_redis_up()
                    _mem_cache_set(cache_key, cached)
                    return json.loads(cached)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            return json.loads(mem_cached)

        query = """
        query userProfileCalendar($username: String!, $year: Int) {
            matchedUser(username: $username) {
                userCalendar(year: $year) {
                    activeYears
                    streak
                    totalActiveDays
                    submissionCalendar
                }
            }
        }
        """
        data = await self._query(query, {"username": username, "year": target_year})

        result = {
            "streak": 0,
            "total_active_days": 0,
            "calendar": {},  # {date_string: count}
            "active_years": [],
        }

        if data and data.get("matchedUser"):
            cal_data = data["matchedUser"].get("userCalendar", {})
            result["streak"] = cal_data.get("streak", 0) or 0
            result["total_active_days"] = cal_data.get("totalActiveDays", 0) or 0
            result["active_years"] = cal_data.get("activeYears", []) or []

            # submissionCalendar is a JSON string: {"unix_timestamp": count, ...}
            calendar_str = cal_data.get("submissionCalendar", "{}")
            try:
                raw_cal = json.loads(calendar_str) if isinstance(calendar_str, str) else (calendar_str or {})
                # Convert unix timestamps to date strings
                for ts_str, count in raw_cal.items():
                    ts = int(ts_str)
                    date_str = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
                    result["calendar"][date_str] = count
            except (json.JSONDecodeError, ValueError):
                pass

        # Old years get longer cache, current year gets short cache
        json_result = json.dumps(result)
        _mem_cache_set(cache_key, json_result)
        ttl = 3600 if target_year == datetime.now().year else 86400 * 30
        if _is_redis_available():
            try:
                await redis_client.set(cache_key, json_result, ex=ttl)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()

        return result

    async def fetch_full_history_calendar(self, username: str) -> dict[str, dict[str, int]]:
        """
        Fetch ALL historical LeetCode submission data using activeYears.
        Returns { "2023": { "2023-01-15": 5, ... }, "2024": { ... }, ... }
        """
        import asyncio

        # First fetch current year to get activeYears list
        current_data = await self.fetch_submission_calendar(username)
        active_years = current_data.get("active_years", [])

        if not active_years:
            # No active years — return what we have
            current_year = datetime.now().year
            return {str(current_year): current_data.get("calendar", {})} if current_data.get("calendar") else {}

        result: dict[str, dict[str, int]] = {}
        current_year = datetime.now().year

        # Current year is already fetched
        if current_data.get("calendar"):
            result[str(current_year)] = current_data["calendar"]

        # Fetch remaining active years
        for yr in active_years:
            if yr == current_year:
                continue  # Already fetched
            cal_data = await self.fetch_submission_calendar(username, year=yr)
            if cal_data.get("calendar"):
                result[str(yr)] = cal_data["calendar"]
            await asyncio.sleep(0.3)  # Rate limit safety

        logger.info(f"LeetCode full history for {username}: {len(result)} years, "
                     f"{sum(len(v) for v in result.values())} active days")
        return result

    async def fetch_contest_history(self, username: str) -> Optional[dict]:
        """Fetch contest participation and rating."""
        cache_key = f"leetcode:contests:{username}"
        if _is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    _mark_redis_up()
                    _mem_cache_set(cache_key, cached)
                    return json.loads(cached)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            return json.loads(mem_cached)

        query = """
        query userContestInfo($username: String!) {
            userContestRanking(username: $username) {
                attendedContestsCount
                rating
                globalRanking
                topPercentage
            }
            userContestRankingHistory(username: $username) {
                contest {
                    title
                    startTime
                }
                rating
                ranking
                problemsSolved
            }
        }
        """
        data = await self._query(query, {"username": username})
        if not data:
            return None

        result = {
            "ranking": data.get("userContestRanking"),
            "history": (data.get("userContestRankingHistory") or [])[-10:],  # Last 10 contests
        }

        json_result = json.dumps(result)
        _mem_cache_set(cache_key, json_result)
        if _is_redis_available():
            try:
                await redis_client.set(cache_key, json_result, ex=CACHE_TTL_LEETCODE)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()

        return result

    async def fetch_recent_submissions(self, username: str, limit: int = 15) -> list[dict]:
        """Fetch recent accepted submissions using the public GraphQL endpoint."""
        cache_key = f"leetcode:recent:{username}"
        if _is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    _mark_redis_up()
                    _mem_cache_set(cache_key, cached)
                    return json.loads(cached)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            return json.loads(mem_cached)

        query = """
        query recentAcSubmissions($username: String!, $limit: Int!) {
            recentAcSubmissionList(username: $username, limit: $limit) {
                title
                titleSlug
                timestamp
                lang
            }
        }
        """
        data = await self._query(query, {"username": username, "limit": limit})
        if not data:
            return []

        submissions = data.get("recentAcSubmissionList") or []
        result = []
        for sub in submissions:
            ts = int(sub.get("timestamp", "0"))
            from datetime import datetime, timezone
            date_str = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d") if ts else ""
            result.append({
                "title": sub.get("title", ""),
                "slug": sub.get("titleSlug", ""),
                "lang": sub.get("lang", ""),
                "date": date_str,
            })

        json_result = json.dumps(result)
        _mem_cache_set(cache_key, json_result)
        if _is_redis_available():
            try:
                await redis_client.set(cache_key, json_result, ex=3600)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()

        return result

    async def fetch_full_stats(self, username: str) -> dict:
        """
        Fetch complete LeetCode data for analysis.
        Aggregates profile, problem stats, topic breakdown, contest history, and recent submissions.
        """
        profile = await self.fetch_user_profile(username)
        if not profile:
            return {"error": f"LeetCode user '{username}' not found", "username": username}

        stats = await self.fetch_problem_stats(username)
        topics = await self.fetch_topic_stats(username)
        contests = await self.fetch_contest_history(username)
        recent = await self.fetch_recent_submissions(username)
        calendar = await self.fetch_submission_calendar(username)

        # Compute summary metrics
        solved = stats.get("solved", {}) if stats else {}
        easy = solved.get("Easy", {}).get("count", 0)
        medium = solved.get("Medium", {}).get("count", 0)
        hard = solved.get("Hard", {}).get("count", 0)
        total_solved = easy + medium + hard

        return {
            "username": username,
            "profile": profile.get("profile", {}),
            "summary": {
                "total_solved": total_solved,
                "easy": easy,
                "medium": medium,
                "hard": hard,
                "easy_pct": round(easy / total_solved * 100, 1) if total_solved else 0,
                "medium_pct": round(medium / total_solved * 100, 1) if total_solved else 0,
                "hard_pct": round(hard / total_solved * 100, 1) if total_solved else 0,
            },
            "beats": stats.get("beats", {}) if stats else {},
            "topic_breakdown": topics[:20] if topics else [],
            "contest": contests or {},
            "recent_submissions": recent,
            "submission_calendar": calendar,
        }

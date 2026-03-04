# LeetCode GraphQL scraper — unofficial public endpoint
import logging
from typing import Optional
import httpx
from app.core.redis import redis_client
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
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

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
            try:
                await redis_client.set(cache_key, json.dumps(result), ex=CACHE_TTL_LEETCODE)
            except Exception:
                pass
            return result
        return None

    async def fetch_problem_stats(self, username: str) -> Optional[dict]:
        """Fetch solved problem counts by difficulty."""
        cache_key = f"leetcode:stats:{username}"
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

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

        try:
            await redis_client.set(cache_key, json.dumps(result), ex=CACHE_TTL_LEETCODE)
        except Exception:
            pass

        return result

    async def fetch_topic_stats(self, username: str) -> Optional[list]:
        """Fetch problem counts by topic/tag."""
        cache_key = f"leetcode:topics:{username}"
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

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

        try:
            await redis_client.set(cache_key, json.dumps(all_topics), ex=CACHE_TTL_LEETCODE)
        except Exception:
            pass

        return all_topics

    async def fetch_contest_history(self, username: str) -> Optional[dict]:
        """Fetch contest participation and rating."""
        cache_key = f"leetcode:contests:{username}"
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

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

        try:
            await redis_client.set(cache_key, json.dumps(result), ex=CACHE_TTL_LEETCODE)
        except Exception:
            pass

        return result

    async def fetch_full_stats(self, username: str) -> dict:
        """
        Fetch complete LeetCode data for analysis.
        Aggregates profile, problem stats, topic breakdown, and contest history.
        """
        profile = await self.fetch_user_profile(username)
        if not profile:
            return {"error": f"LeetCode user '{username}' not found", "username": username}

        stats = await self.fetch_problem_stats(username)
        topics = await self.fetch_topic_stats(username)
        contests = await self.fetch_contest_history(username)

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
        }

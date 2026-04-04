# HackerRank scraper — REST API for profile and recent submissions
import logging
from typing import Optional
import httpx
from app.core.redis import redis_client, is_redis_available, mark_redis_down, mark_redis_up
import json

logger = logging.getLogger(__name__)

HACKERRANK_API_BASE = "https://www.hackerrank.com/rest"
CACHE_TTL_HACKERRANK = 3600  # 1 hour


class HackerRankScraper:
    """Async HackerRank scraper using the public REST API."""

    def __init__(self) -> None:
        self.headers = {
            "User-Agent": "MintKey-Scraper",
            "Accept": "application/json",
        }

    async def _get(self, url: str) -> Optional[dict | list]:
        """Make a GET request to HackerRank API."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.get(url, headers=self.headers)
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    logger.warning(f"HackerRank 404: {url}")
                    return None
                else:
                    logger.error(f"HackerRank API error {response.status_code}: {url}")
                    return None
        except httpx.TimeoutException:
            logger.error(f"HackerRank API timeout: {url}")
            return None
        except Exception as e:
            logger.error(f"HackerRank API error: {e}")
            return None

    async def fetch_profile(self, username: str) -> Optional[dict]:
        """Fetch HackerRank profile badges and scores."""
        cache_key = f"hackerrank:profile:{username}"
        if is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    mark_redis_up()
                    return json.loads(cached)
                mark_redis_up()
            except Exception:
                mark_redis_down()

        # Fetch badges/scores
        data = await self._get(f"{HACKERRANK_API_BASE}/hackers/{username}/scores")
        if not data:
            return None

        # Extract relevant track scores
        scores = {}
        if isinstance(data, list):
            for entry in data:
                track = entry.get("name", "")
                score = entry.get("practice", {}).get("score", 0)
                if track and score > 0:
                    scores[track] = score

        result = {
            "username": username,
            "scores": scores,
        }

        # Also try to fetch badges
        badges_data = await self._get(f"{HACKERRANK_API_BASE}/hackers/{username}/badges")
        if isinstance(badges_data, dict):
            badges = badges_data.get("models", [])
            result["badges"] = [
                {
                    "name": b.get("badge_name", ""),
                    "stars": b.get("stars", 0),
                    "level": b.get("current_points", 0),
                }
                for b in badges[:10]
            ]
        else:
            result["badges"] = []

        if is_redis_available():
            try:
                await redis_client.set(cache_key, json.dumps(result), ex=CACHE_TTL_HACKERRANK)
                mark_redis_up()
            except Exception:
                mark_redis_down()

        return result

    async def fetch_recent_activity(self, username: str) -> list[dict]:
        """Fetch recent challenge submissions from HackerRank."""
        cache_key = f"hackerrank:activity:{username}"
        if is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    mark_redis_up()
                    return json.loads(cached)
                mark_redis_up()
            except Exception:
                mark_redis_down()

        data = await self._get(
            f"{HACKERRANK_API_BASE}/hackers/{username}/recent_challenges?limit=10&cursor=&response_version=v1"
        )

        activities = []
        if isinstance(data, dict):
            models = data.get("models", [])
            for challenge in models:
                name = challenge.get("name", challenge.get("slug", ""))
                slug = challenge.get("slug", "")
                created = challenge.get("created_at", "")
                # Format date if present
                date_str = ""
                if created:
                    try:
                        from datetime import datetime
                        # HackerRank returns ISO format dates
                        dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                        date_str = dt.strftime("%Y-%m-%d")
                    except Exception:
                        date_str = created[:10] if len(created) >= 10 else created

                activities.append({
                    "type": "challenge",
                    "title": name,
                    "slug": slug,
                    "date": date_str,
                })
        elif isinstance(data, list):
            for item in data[:10]:
                activities.append({
                    "type": "challenge",
                    "title": item.get("name", item.get("slug", "")),
                    "slug": item.get("slug", ""),
                    "date": "",
                })

        if is_redis_available():
            try:
                await redis_client.set(cache_key, json.dumps(activities), ex=CACHE_TTL_HACKERRANK)
                mark_redis_up()
            except Exception:
                mark_redis_down()

        return activities

    async def fetch_full_profile(self, username: str) -> dict:
        """Fetch complete HackerRank data including profile and recent activity."""
        profile = await self.fetch_profile(username)
        activity = await self.fetch_recent_activity(username)

        if not profile and not activity:
            return {"error": f"HackerRank user '{username}' not found", "username": username}

        result = profile or {"username": username, "scores": {}, "badges": []}
        result["recent_activity"] = activity
        return result

# CodeChef scraper — unofficial public API for profile and contest data
import logging
from typing import Optional
import httpx
from app.core.redis import redis_client
import json

logger = logging.getLogger(__name__)

CODECHEF_API_BASE = "https://codechef-api.vercel.app/handle"
CACHE_TTL_CODECHEF = 3600  # 1 hour


class CodeChefScraper:
    """Async CodeChef scraper using the public unofficial API."""

    def __init__(self) -> None:
        self.headers = {
            "User-Agent": "MintKey-Scraper",
            "Accept": "application/json",
        }

    async def fetch_profile(self, username: str) -> Optional[dict]:
        """Fetch CodeChef profile data including ratings and stars."""
        cache_key = f"codechef:profile:{username}"
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.get(
                    f"{CODECHEF_API_BASE}/{username}",
                    headers=self.headers,
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") is False:
                        logger.warning(f"CodeChef user not found: {username}")
                        return None

                    result = {
                        "username": username,
                        "name": data.get("name", ""),
                        "currentRating": data.get("currentRating", 0),
                        "highestRating": data.get("highestRating", 0),
                        "stars": data.get("stars", ""),
                        "countryRank": data.get("countryRank", 0),
                        "globalRank": data.get("globalRank", 0),
                    }

                    try:
                        await redis_client.set(cache_key, json.dumps(result), ex=CACHE_TTL_CODECHEF)
                    except Exception:
                        pass

                    return result
                else:
                    logger.error(f"CodeChef API error {response.status_code}")
                    return None
        except httpx.TimeoutException:
            logger.error("CodeChef API timeout")
            return None
        except Exception as e:
            logger.error(f"CodeChef API error: {e}")
            return None

    async def fetch_recent_activity(self, username: str) -> list[dict]:
        """Fetch recent contest participation from CodeChef."""
        cache_key = f"codechef:activity:{username}"
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.get(
                    f"{CODECHEF_API_BASE}/{username}",
                    headers=self.headers,
                )
                if response.status_code != 200:
                    return []

                data = response.json()
                if data.get("success") is False:
                    return []

                activities = []

                # Extract recent contest ratings
                rating_data = data.get("ratingData", [])
                for contest in rating_data[-10:]:  # Last 10 contests
                    activities.append({
                        "type": "contest",
                        "title": contest.get("name", contest.get("code", "Contest")),
                        "rating": contest.get("rating", ""),
                        "rank": contest.get("rank", ""),
                        "date": contest.get("end_date", contest.get("getyear", "")),
                    })

                # Reverse so most recent is first
                activities.reverse()

                try:
                    await redis_client.set(cache_key, json.dumps(activities), ex=CACHE_TTL_CODECHEF)
                except Exception:
                    pass

                return activities

        except Exception as e:
            logger.error(f"CodeChef activity fetch error: {e}")
            return []

    async def fetch_full_profile(self, username: str) -> dict:
        """Fetch complete CodeChef data including profile and activity."""
        profile = await self.fetch_profile(username)
        if not profile:
            return {"error": f"CodeChef user '{username}' not found", "username": username}

        activity = await self.fetch_recent_activity(username)

        return {
            **profile,
            "recent_activity": activity,
        }

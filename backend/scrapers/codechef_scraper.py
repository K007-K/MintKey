# CodeChef scraper — direct website scraping (no third-party API)
import logging
import json
import re
from typing import Optional
import httpx
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

CACHE_TTL_CODECHEF = 3600  # 1 hour


class CodeChefScraper:
    """Async CodeChef scraper — scrapes codechef.com profile pages directly."""

    def __init__(self) -> None:
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

    async def fetch_profile(self, username: str) -> Optional[dict]:
        """Fetch CodeChef profile data by scraping the user profile page."""
        cache_key = f"codechef:profile:{username}"
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

        try:
            async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
                response = await client.get(
                    f"https://www.codechef.com/users/{username}",
                    headers=self.headers,
                )
                if response.status_code != 200:
                    logger.error(f"CodeChef profile page returned {response.status_code} for {username}")
                    return None

                html = response.text

                # Check if user exists — CodeChef shows a specific message for invalid users
                if "user does not exist" in html.lower() or "page not found" in html.lower():
                    logger.warning(f"CodeChef user not found: {username}")
                    return None

                # Extract current rating from <div class="rating-number">1589</div>
                rating_match = re.search(r'class="rating-number"[^>]*>(\d+)', html)
                current_rating = int(rating_match.group(1)) if rating_match else 0

                # Extract total problems solved from "Total Problems Solved: N"
                problems_match = re.search(r'Total\s+Problems?\s+Solved\s*:\s*(\d+)', html, re.IGNORECASE)
                total_problems = int(problems_match.group(1)) if problems_match else 0

                # Extract stars from rating-star span (e.g., "★★★" or star count)
                stars_match = re.search(r'class="rating-star[^"]*"[^>]*>([^<]*)', html)
                star_text = stars_match.group(1).strip() if stars_match else ""
                # Count actual star characters
                star_count = star_text.count("★") if star_text else 0
                stars = f"{star_count}★" if star_count > 0 else ""

                # Extract global rank and country rank from rating links
                global_rank_match = re.search(
                    r'<a[^>]*href="/ratings/all"[^>]*>(\d[\d,]*)</a>\s*\n?\s*Global\s+Rank',
                    html, re.IGNORECASE | re.DOTALL,
                )
                global_rank = int(global_rank_match.group(1).replace(",", "")) if global_rank_match else 0

                # Simpler fallback: look for the rank numbers from the content
                if not global_rank:
                    ranks = re.findall(r'>(\d[\d,]*)</a>\s*\n?\s*(Global|Country)\s+Rank', html, re.IGNORECASE)
                    for rank_val, rank_type in ranks:
                        if rank_type.lower() == "global":
                            global_rank = int(rank_val.replace(",", ""))

                country_rank_match = re.search(
                    r'>(\d[\d,]*)</a>\s*\n?\s*Country\s+Rank',
                    html, re.IGNORECASE | re.DOTALL,
                )
                country_rank = int(country_rank_match.group(1).replace(",", "")) if country_rank_match else 0

                # Extract highest rating from Drupal.settings JSON
                highest_rating = current_rating
                drupal_match = re.search(r'jQuery\.extend\(Drupal\.settings,\s*(\{.*?\})\);', html, re.DOTALL)
                contest_history: list[dict] = []
                if drupal_match:
                    try:
                        settings = json.loads(drupal_match.group(1))
                        rating_data = settings.get("date_versus_rating", {}).get("all", [])
                        for contest in rating_data:
                            r = int(contest.get("rating", 0))
                            if r > highest_rating:
                                highest_rating = r
                            contest_history.append({
                                "code": contest.get("code", ""),
                                "name": contest.get("name", ""),
                                "rating": r,
                                "rank": contest.get("rank", ""),
                                "date": contest.get("end_date", "")[:10] if contest.get("end_date") else "",
                            })
                    except (json.JSONDecodeError, KeyError, TypeError) as e:
                        logger.warning(f"Failed to parse Drupal.settings JSON: {e}")

                result = {
                    "username": username,
                    "currentRating": current_rating,
                    "highestRating": highest_rating,
                    "stars": stars,
                    "globalRank": global_rank,
                    "countryRank": country_rank,
                    "totalProblemsSolved": total_problems,
                    "contestsParticipated": len(contest_history),
                }

                try:
                    await redis_client.set(cache_key, json.dumps(result), ex=CACHE_TTL_CODECHEF)
                except Exception:
                    pass

                return result

        except httpx.TimeoutException:
            logger.error(f"CodeChef scraping timeout for {username}")
            return None
        except Exception as e:
            logger.error(f"CodeChef scraping error for {username}: {e}")
            return None

    async def fetch_recent_activity(self, username: str) -> list[dict]:
        """Fetch recent contest participation from CodeChef profile page."""
        cache_key = f"codechef:activity:{username}"
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

        try:
            async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
                response = await client.get(
                    f"https://www.codechef.com/users/{username}",
                    headers=self.headers,
                )
                if response.status_code != 200:
                    return []

                html = response.text

                # Extract contest data from Drupal.settings
                drupal_match = re.search(r'jQuery\.extend\(Drupal\.settings,\s*(\{.*?\})\);', html, re.DOTALL)
                if not drupal_match:
                    return []

                activities: list[dict] = []
                try:
                    settings = json.loads(drupal_match.group(1))
                    rating_data = settings.get("date_versus_rating", {}).get("all", [])

                    for contest in rating_data[-15:]:  # Last 15 contests
                        end_date = contest.get("end_date", "")
                        date_str = end_date[:10] if end_date else ""
                        # If end_date is empty, try constructing from year/month/day
                        if not date_str:
                            y = contest.get("getyear", "")
                            m = contest.get("getmonth", "")
                            d = contest.get("getday", "")
                            if y and m and d:
                                date_str = f"{y}-{int(m):02d}-{int(d):02d}"

                        activities.append({
                            "type": "contest",
                            "title": contest.get("name", contest.get("code", "Contest")),
                            "rating": int(contest.get("rating", 0)),
                            "rank": contest.get("rank", ""),
                            "date": date_str,
                        })

                    # Reverse so most recent is first
                    activities.reverse()

                except (json.JSONDecodeError, KeyError, TypeError) as e:
                    logger.warning(f"Failed to parse contest data: {e}")
                    return []

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

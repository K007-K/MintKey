# GitHub REST API scraper using httpx async with Redis caching
import logging
from typing import Optional
import httpx
from app.core.config import settings
from app.core.redis import redis_client
import json

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"
CACHE_TTL_GITHUB = 86400  # 24 hours


class GitHubScraper:
    """Async GitHub REST API client with Redis caching."""

    def __init__(self) -> None:
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "MintKey-Scraper",
        }
        if settings.GITHUB_TOKEN:
            self.headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    async def _get(self, endpoint: str) -> dict | list | None:
        """Make a GET request to GitHub API."""
        url = f"{GITHUB_API_BASE}{endpoint}"
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.get(url, headers=self.headers)
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    logger.warning(f"GitHub 404: {endpoint}")
                    return None
                else:
                    logger.error(f"GitHub API error {response.status_code}: {endpoint}")
                    return None
        except httpx.TimeoutException:
            logger.error(f"GitHub API timeout: {endpoint}")
            return None
        except Exception as e:
            logger.error(f"GitHub API error: {e}")
            return None

    async def _get_cached(self, cache_key: str, endpoint: str) -> dict | list | None:
        """Fetch from Redis cache first, then GitHub API if not cached."""
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                logger.info(f"Cache hit: {cache_key}")
                return json.loads(cached)
        except Exception as e:
            logger.warning(f"Redis cache read failed: {e}")

        data = await self._get(endpoint)
        if data is not None:
            try:
                await redis_client.set(cache_key, json.dumps(data), ex=CACHE_TTL_GITHUB)
            except Exception as e:
                logger.warning(f"Redis cache write failed: {e}")

        return data

    async def fetch_user_profile(self, username: str) -> Optional[dict]:
        """Fetch GitHub user profile."""
        cache_key = f"github:profile:{username}"
        return await self._get_cached(cache_key, f"/users/{username}")

    async def fetch_repos(self, username: str, per_page: int = 100) -> list[dict]:
        """Fetch all public repos for a user (up to 100)."""
        cache_key = f"github:repos:{username}"
        data = await self._get_cached(cache_key, f"/users/{username}/repos?per_page={per_page}&sort=updated")
        return data if isinstance(data, list) else []

    async def fetch_repo_details(self, owner: str, repo: str) -> Optional[dict]:
        """Fetch detailed info for a specific repo."""
        cache_key = f"github:repo:{owner}:{repo}"
        return await self._get_cached(cache_key, f"/repos/{owner}/{repo}")

    async def fetch_repo_languages(self, owner: str, repo: str) -> dict:
        """Fetch language breakdown for a repo (bytes per language)."""
        cache_key = f"github:langs:{owner}:{repo}"
        data = await self._get_cached(cache_key, f"/repos/{owner}/{repo}/languages")
        return data if isinstance(data, dict) else {}

    async def fetch_repo_commits(self, owner: str, repo: str, per_page: int = 30) -> list[dict]:
        """Fetch recent commits for a repo."""
        cache_key = f"github:commits:{owner}:{repo}"
        data = await self._get_cached(cache_key, f"/repos/{owner}/{repo}/commits?per_page={per_page}")
        return data if isinstance(data, list) else []

    async def fetch_repo_readme(self, owner: str, repo: str) -> Optional[str]:
        """Fetch README content (decoded from base64)."""
        cache_key = f"github:readme:{owner}:{repo}"
        cached = None
        try:
            cached = await redis_client.get(cache_key)
        except Exception:
            pass

        if cached:
            return cached

        data = await self._get(f"/repos/{owner}/{repo}/readme")
        if data and "content" in data:
            import base64
            content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
            try:
                await redis_client.set(cache_key, content, ex=CACHE_TTL_GITHUB)
            except Exception:
                pass
            return content
        return None

    async def fetch_full_profile(self, username: str) -> dict:
        """
        Fetch the complete GitHub profile data for analysis.
        Returns a structured dict with profile, repos, languages, and README summaries.
        """
        profile = await self.fetch_user_profile(username)
        if not profile:
            return {"error": f"User '{username}' not found", "username": username}

        repos = await self.fetch_repos(username)

        # Compute language distribution across all repos
        language_totals: dict[str, int] = {}
        top_repos = []

        for repo in repos[:20]:  # Analyze top 20 repos
            repo_name = repo.get("name", "")
            langs = await self.fetch_repo_languages(username, repo_name)
            for lang, bytes_count in langs.items():
                language_totals[lang] = language_totals.get(lang, 0) + bytes_count

            # Get commit count for each top repo
            commits = await self.fetch_repo_commits(username, repo_name, per_page=5)

            top_repos.append({
                "name": repo_name,
                "description": repo.get("description", ""),
                "stars": repo.get("stargazers_count", 0),
                "forks": repo.get("forks_count", 0),
                "language": repo.get("language"),
                "topics": repo.get("topics", []),
                "updated_at": repo.get("updated_at"),
                "is_fork": repo.get("fork", False),
                "recent_commit_count": len(commits),
                "languages": langs,
            })

        # Calculate language percentages
        total_bytes = sum(language_totals.values()) or 1
        language_distribution = {
            lang: round(bytes_count / total_bytes * 100, 1)
            for lang, bytes_count in sorted(language_totals.items(), key=lambda x: -x[1])
        }

        # Fetch contributions count and recent events
        contributions = await self.fetch_contribution_count(username)
        recent_events = await self.fetch_recent_events(username)

        return {
            "username": username,
            "profile": {
                "name": profile.get("name"),
                "bio": profile.get("bio"),
                "company": profile.get("company"),
                "location": profile.get("location"),
                "public_repos": profile.get("public_repos", 0),
                "followers": profile.get("followers", 0),
                "following": profile.get("following", 0),
                "created_at": profile.get("created_at"),
                "avatar_url": profile.get("avatar_url"),
            },
            "total_repos": len(repos),
            "original_repos": len([r for r in repos if not r.get("fork")]),
            "forked_repos": len([r for r in repos if r.get("fork")]),
            "language_distribution": language_distribution,
            "top_repos": top_repos[:10],
            "total_contributions": contributions,
            "recent_events": recent_events,
        }

    async def fetch_contribution_count(self, username: str) -> int:
        """Fetch total contributions from the user's GitHub profile page."""
        cache_key = f"github:contributions:{username}"
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return int(cached)
        except Exception:
            pass

        try:
            url = f"https://github.com/users/{username}/contributions"
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url, headers={"User-Agent": "MintKey-Scraper"})
                if response.status_code == 200:
                    import re
                    match = re.search(r'([\d,]+)\s+contributions?\s+in', response.text)
                    if match:
                        count = int(match.group(1).replace(",", ""))
                        try:
                            await redis_client.set(cache_key, str(count), ex=CACHE_TTL_GITHUB)
                        except Exception:
                            pass
                        return count
        except Exception as e:
            logger.warning(f"Failed to fetch contribution count for {username}: {e}")

        return 0

    async def fetch_recent_events(self, username: str, per_page: int = 30) -> list[dict]:
        """Fetch recent public events from the GitHub Events API."""
        cache_key = f"github:events:{username}"
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

        data = await self._get(f"/users/{username}/events/public?per_page={per_page}")
        if not isinstance(data, list):
            return []

        events = []
        for event in data[:20]:
            event_type = event.get("type", "")
            repo_name = event.get("repo", {}).get("name", "").split("/")[-1]
            created_at = event.get("created_at", "")
            payload = event.get("payload", {})

            if event_type == "PushEvent":
                commit_count = payload.get("size", 0)
                events.append({
                    "type": "push",
                    "repo": repo_name,
                    "detail": f"{commit_count} commit{'s' if commit_count != 1 else ''}",
                    "date": created_at,
                })
            elif event_type == "CreateEvent":
                ref_type = payload.get("ref_type", "repository")
                events.append({
                    "type": "create",
                    "repo": repo_name,
                    "detail": f"Created {ref_type}",
                    "date": created_at,
                })
            elif event_type == "PullRequestEvent":
                action = payload.get("action", "opened")
                pr_title = payload.get("pull_request", {}).get("title", "")
                events.append({
                    "type": "pr",
                    "repo": repo_name,
                    "detail": f"PR {action}: {pr_title[:60]}",
                    "date": created_at,
                })
            elif event_type == "IssuesEvent":
                action = payload.get("action", "opened")
                issue_title = payload.get("issue", {}).get("title", "")
                events.append({
                    "type": "issue",
                    "repo": repo_name,
                    "detail": f"Issue {action}: {issue_title[:60]}",
                    "date": created_at,
                })

        try:
            await redis_client.set(cache_key, json.dumps(events), ex=3600)  # 1hr cache
        except Exception:
            pass

        return events


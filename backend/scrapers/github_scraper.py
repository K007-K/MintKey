# GitHub REST API scraper using httpx async with Redis caching + in-memory fallback
import logging
import asyncio
import time
from typing import Optional
from datetime import datetime
from functools import lru_cache
import httpx
from app.core.config import settings
from app.core.redis import redis_client
import json

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"
CACHE_TTL_GITHUB = 86400  # 24 hours

# ── In-memory cache fallback when Redis is unreachable ──
_memory_cache: dict[str, tuple[float, str]] = {}  # key -> (expires_at, json_data)
_MEMORY_CACHE_TTL = 600  # 10 min in-memory fallback
_MEMORY_CACHE_MAX = 200  # max entries

# ── Redis health tracking — skip Redis calls when known down ──
_redis_healthy = True
_redis_last_check = 0.0
_REDIS_RETRY_INTERVAL = 60  # recheck Redis every 60s after failure

# ── Concurrency limiter — max 5 parallel GitHub API calls ──
_github_semaphore = asyncio.Semaphore(5)


def _mem_cache_get(key: str) -> str | None:
    """Read from in-memory cache, return raw JSON string or None."""
    entry = _memory_cache.get(key)
    if entry and entry[0] > time.time():
        return entry[1]
    # Expired — clean up
    _memory_cache.pop(key, None)
    return None


def _mem_cache_set(key: str, value: str, ttl: int = _MEMORY_CACHE_TTL) -> None:
    """Write to in-memory cache with TTL."""
    # Evict oldest entries if cache is full
    if len(_memory_cache) >= _MEMORY_CACHE_MAX:
        oldest_key = min(_memory_cache, key=lambda k: _memory_cache[k][0])
        _memory_cache.pop(oldest_key, None)
    _memory_cache[key] = (time.time() + ttl, value)


def _is_redis_available() -> bool:
    """Check if Redis should be attempted (health tracking)."""
    global _redis_healthy, _redis_last_check
    if _redis_healthy:
        return True
    # After failure, retry every _REDIS_RETRY_INTERVAL seconds
    if time.time() - _redis_last_check > _REDIS_RETRY_INTERVAL:
        return True
    return False


def _mark_redis_down() -> None:
    global _redis_healthy, _redis_last_check
    _redis_healthy = False
    _redis_last_check = time.time()


def _mark_redis_up() -> None:
    global _redis_healthy
    _redis_healthy = True


class GitHubScraper:
    """Async GitHub REST API client with Redis caching + in-memory fallback."""

    def __init__(self) -> None:
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "MintKey-Scraper",
        }
        if settings.GITHUB_TOKEN:
            self.headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    async def _get(self, endpoint: str) -> dict | list | None:
        """Make a GET request to GitHub API with concurrency limiting."""
        url = f"{GITHUB_API_BASE}{endpoint}"
        async with _github_semaphore:
            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    response = await client.get(url, headers=self.headers)
                    if response.status_code == 200:
                        return response.json()
                    elif response.status_code == 404:
                        logger.warning(f"GitHub 404: {endpoint}")
                        return None
                    elif response.status_code == 403:
                        remaining = response.headers.get("X-RateLimit-Remaining", "?")
                        reset = response.headers.get("X-RateLimit-Reset", "?")
                        logger.error(f"GitHub API rate limited (403): {endpoint} | remaining={remaining} reset={reset}")
                        return None
                    else:
                        logger.error(f"GitHub API error {response.status_code}: {endpoint}")
                        return None
            except httpx.TimeoutException:
                logger.error(f"GitHub API timeout: {endpoint}")
                return None
            except httpx.RemoteProtocolError as e:
                logger.error(f"GitHub API connection dropped ({type(e).__name__}): {endpoint} — {e}")
                return None
            except Exception as e:
                logger.error(f"GitHub API error ({type(e).__name__}): {endpoint} — {e}")
                return None

    async def _get_cached(self, cache_key: str, endpoint: str) -> dict | list | None:
        """Fetch from Redis → in-memory cache → GitHub API (with write-back to both)."""
        # 1. Try Redis (if healthy)
        if _is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    _mark_redis_up()
                    logger.debug(f"Redis cache hit: {cache_key}")
                    # Also warm in-memory cache
                    _mem_cache_set(cache_key, cached)
                    return json.loads(cached)
                _mark_redis_up()
            except Exception as e:
                _mark_redis_down()
                logger.warning(f"Redis unavailable, using in-memory fallback: {type(e).__name__}")

        # 2. Try in-memory cache
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            logger.debug(f"Memory cache hit: {cache_key}")
            return json.loads(mem_cached)

        # 3. Fetch from GitHub API
        data = await self._get(endpoint)
        if data is not None:
            json_data = json.dumps(data)
            # Write to in-memory cache (always works)
            _mem_cache_set(cache_key, json_data)
            # Try writing to Redis (non-blocking, best-effort)
            if _is_redis_available():
                try:
                    await redis_client.set(cache_key, json_data, ex=CACHE_TTL_GITHUB)
                    _mark_redis_up()
                except Exception:
                    _mark_redis_down()

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
        # Try Redis
        if _is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    _mark_redis_up()
                    _mem_cache_set(cache_key, cached)
                    return cached
                _mark_redis_up()
            except Exception:
                _mark_redis_down()
        # Try memory cache
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            return mem_cached

        data = await self._get(f"/repos/{owner}/{repo}/readme")
        if data and "content" in data:
            import base64
            content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
            _mem_cache_set(cache_key, content)
            if _is_redis_available():
                try:
                    await redis_client.set(cache_key, content, ex=CACHE_TTL_GITHUB)
                    _mark_redis_up()
                except Exception:
                    _mark_redis_down()
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

        # Compute language distribution across all repos — fetch in parallel
        language_totals: dict[str, int] = {}
        top_repos = []

        import asyncio as _asyncio

        async def _process_repo(repo: dict) -> dict:
            """Fetch languages + commits for a single repo concurrently."""
            repo_name = repo.get("name", "")
            langs_task = self.fetch_repo_languages(username, repo_name)
            commits_task = self.fetch_repo_commits(username, repo_name, per_page=5)
            langs, commits = await _asyncio.gather(langs_task, commits_task, return_exceptions=True)
            if isinstance(langs, Exception):
                langs = {}
            if isinstance(commits, Exception):
                commits = []
            return {
                "name": repo_name,
                "description": repo.get("description", ""),
                "stars": repo.get("stargazers_count", 0),
                "forks": repo.get("forks_count", 0),
                "language": repo.get("language"),
                "topics": repo.get("topics", []),
                "updated_at": repo.get("updated_at"),
                "is_fork": repo.get("fork", False),
                "recent_commit_count": len(commits) if isinstance(commits, list) else 0,
                "languages": langs if isinstance(langs, dict) else {},
            }

        # Process all repos concurrently (max 20)
        repo_results = await _asyncio.gather(
            *[_process_repo(repo) for repo in repos[:20]],
            return_exceptions=True,
        )

        for result in repo_results:
            if isinstance(result, Exception):
                continue
            top_repos.append(result)
            for lang, bytes_count in result.get("languages", {}).items():
                language_totals[lang] = language_totals.get(lang, 0) + bytes_count

        # Calculate language percentages
        total_bytes = sum(language_totals.values()) or 1
        language_distribution = {
            lang: round(bytes_count / total_bytes * 100, 1)
            for lang, bytes_count in sorted(language_totals.items(), key=lambda x: -x[1])
        }

        # Fetch contributions count, contribution calendar, and recent events
        contributions = await self.fetch_contribution_count(username)
        contribution_calendar = await self.fetch_contribution_calendar(username)
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
            "contribution_calendar": contribution_calendar,
            "recent_events": recent_events,
        }

    async def fetch_contribution_count(self, username: str) -> int:
        """Fetch total contributions from the user's GitHub profile page."""
        cache_key = f"github:contributions:{username}"
        # Try Redis
        if _is_redis_available():
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    _mark_redis_up()
                    _mem_cache_set(cache_key, cached)
                    return int(cached)
                _mark_redis_up()
            except Exception:
                _mark_redis_down()
        # Try memory cache
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            return int(mem_cached)

        try:
            url = f"https://github.com/users/{username}/contributions"
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url, headers={"User-Agent": "MintKey-Scraper"})
                if response.status_code == 200:
                    import re
                    match = re.search(r'([\d,]+)\s+contributions?\s+in', response.text)
                    if match:
                        count = int(match.group(1).replace(",", ""))
                        _mem_cache_set(cache_key, str(count))
                        if _is_redis_available():
                            try:
                                await redis_client.set(cache_key, str(count), ex=CACHE_TTL_GITHUB)
                                _mark_redis_up()
                            except Exception:
                                _mark_redis_down()
                        return count
        except Exception as e:
            logger.warning(f"Failed to fetch contribution count for {username}: {e}")

        return 0

    async def fetch_contribution_calendar(self, username: str, year: int | None = None) -> dict:
        """
        Fetch per-day contribution data from GitHub's contributions page.
        If year is specified, fetches that specific year. Otherwise fetches current view.
        Returns { "YYYY-MM-DD": level, ... } for all days with contributions > 0.
        """
        cache_key = f"github:calendar:{username}:{year or 'current'}"
        # Try Redis
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
        # Try memory cache
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            return json.loads(mem_cached)

        calendar: dict[str, int] = {}
        try:
            url = f"https://github.com/users/{username}/contributions"
            if year:
                url += f"?from={year}-01-01&to={year}-12-31"

            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.get(url, headers={"User-Agent": "MintKey-Scraper"})
                if response.status_code == 200:
                    import re
                    html = response.text

                    # Strategy: Match <tool-tip for="cell-id">N contributions on ...</tool-tip>
                    # to <td id="cell-id" data-date="YYYY-MM-DD"> cells for exact counts.

                    # Step 1: Build cell id → date mapping
                    cells = re.findall(
                        r'data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"',
                        html,
                    )
                    if not cells:
                        cells = re.findall(
                            r'id="([^"]+)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"',
                            html,
                        )
                        cells = [(d, cid) for cid, d in cells]
                    id_to_date = {cid: d for d, cid in cells}

                    # Step 2: Parse tool-tip elements: for="cell-id" ... >N contribution(s) on ...
                    tips = re.findall(
                        r'for="([^"]+)"[^>]*>(\d+)\s+contributions?\s+on\s+[^<]+',
                        html,
                    )
                    for tip_for, count_str in tips:
                        if tip_for in id_to_date and int(count_str) > 0:
                            calendar[id_to_date[tip_for]] = int(count_str)

                    # Fallback: if no tool-tips matched, use data-level (0-4 approximation)
                    if not calendar:
                        level_cells = re.findall(
                            r'data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"',
                            html,
                        )
                        for date_str, level in level_cells:
                            if int(level) > 0:
                                calendar[date_str] = int(level)

            if calendar:
                json_cal = json.dumps(calendar)
                _mem_cache_set(cache_key, json_cal)
                ttl = CACHE_TTL_GITHUB if not year or year == datetime.now().year else 86400 * 30  # 30 days for old years
                if _is_redis_available():
                    try:
                        await redis_client.set(cache_key, json_cal, ex=ttl)
                        _mark_redis_up()
                    except Exception:
                        _mark_redis_down()

        except Exception as e:
            logger.warning(f"Failed to fetch contribution calendar for {username} year={year}: {e}")

        return calendar

    async def fetch_full_history_calendar(self, username: str) -> dict[str, dict[str, int]]:
        """
        Fetch ALL historical contribution data since the user's GitHub account creation.
        Returns { "2023": { "2023-01-15": 2, ... }, "2024": { ... }, ... }
        """
        import asyncio

        # Get account creation year from profile
        profile = await self._get(f"/users/{username}")
        if not profile or not isinstance(profile, dict) or not profile.get("created_at"):
            # Fallback: just fetch current year
            cal = await self.fetch_contribution_calendar(username)
            current_year = datetime.now().year
            return {str(current_year): cal}

        created_at = profile["created_at"]  # "2023-03-15T..."
        start_year = int(created_at[:4])
        current_year = datetime.now().year

        result: dict[str, dict[str, int]] = {}
        for yr in range(start_year, current_year + 1):
            cal = await self.fetch_contribution_calendar(username, year=yr)
            if cal:
                result[str(yr)] = cal
            # Rate limit safety: small delay between years
            if yr < current_year:
                await asyncio.sleep(0.3)

        logger.info(f"GitHub full history for {username}: {len(result)} years, "
                     f"{sum(len(v) for v in result.values())} active days")
        return result

    async def fetch_recent_events(self, username: str, per_page: int = 30) -> list[dict]:
        """Fetch recent public events from the GitHub Events API."""
        cache_key = f"github:events:v3:{username}"
        # Try Redis
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
        # Try memory cache
        mem_cached = _mem_cache_get(cache_key)
        if mem_cached:
            return json.loads(mem_cached)

        data = await self._get(f"/users/{username}/events/public?per_page={per_page}")
        if not isinstance(data, list):
            return []

        raw_events = []
        for event in data[:30]:
            event_type = event.get("type", "")
            repo_full = event.get("repo", {}).get("name", "")
            repo_name = repo_full.split("/")[-1]
            created_at = event.get("created_at", "")
            payload = event.get("payload", {})

            if event_type == "PushEvent":
                # Public Events API strips commits/size; use head SHA fallback
                commit_count = payload.get("size", 0)
                commits_list = payload.get("commits", [])
                commit_msg = ""
                head_sha = payload.get("head", "")
                before_sha = payload.get("before", "")

                if commits_list:
                    # If commits array is present, use it directly
                    commit_msg = commits_list[-1].get("message", "").split("\n")[0][:60]
                elif head_sha and repo_full:
                    # Fallback: fetch commit message from head SHA
                    try:
                        commit_data = await self._get(f"/repos/{repo_full}/commits/{head_sha}")
                        if isinstance(commit_data, dict) and "commit" in commit_data:
                            commit_msg = commit_data["commit"].get("message", "").split("\n")[0][:60]
                        # Estimate commit count from compare if both SHAs exist
                        if not commit_count and before_sha and before_sha != "0000000000000000000000000000000000000000":
                            try:
                                compare = await self._get(f"/repos/{repo_full}/compare/{before_sha[:7]}...{head_sha[:7]}")
                                if isinstance(compare, dict):
                                    commit_count = compare.get("total_commits", 1)
                            except Exception:
                                commit_count = 1  # At least 1 commit if we have a head SHA
                        elif not commit_count:
                            commit_count = 1
                    except Exception:
                        pass

                raw_events.append({
                    "type": "push",
                    "repo": repo_name,
                    "commits": commit_count,
                    "commit_msg": commit_msg,
                    "detail": "",  # Will be set after consolidation
                    "date": created_at,
                    "url": f"https://github.com/{repo_full}",
                })
            elif event_type == "CreateEvent":
                ref_type = payload.get("ref_type", "repository")
                raw_events.append({
                    "type": "create",
                    "repo": repo_name,
                    "detail": f"Created {ref_type}",
                    "date": created_at,
                    "url": f"https://github.com/{repo_full}",
                })
            elif event_type == "PullRequestEvent":
                action = payload.get("action", "opened")
                pr_title = payload.get("pull_request", {}).get("title", "")
                pr_url = payload.get("pull_request", {}).get("html_url", f"https://github.com/{repo_full}/pulls")
                raw_events.append({
                    "type": "pr",
                    "repo": repo_name,
                    "detail": f"PR {action}: {pr_title[:60]}",
                    "date": created_at,
                    "url": pr_url,
                })
            elif event_type == "IssuesEvent":
                action = payload.get("action", "opened")
                issue_title = payload.get("issue", {}).get("title", "")
                issue_url = payload.get("issue", {}).get("html_url", f"https://github.com/{repo_full}/issues")
                raw_events.append({
                    "type": "issue",
                    "repo": repo_name,
                    "detail": f"Issue {action}: {issue_title[:60]}",
                    "date": created_at,
                    "url": issue_url,
                })

        # Consolidate same-repo same-day push events into one entry
        events = []
        seen_pushes: dict[str, int] = {}  # "repo|date" -> index in events
        for ev in raw_events:
            if ev["type"] == "push":
                day = ev["date"][:10]
                key = f"{ev['repo']}|{day}"
                if key in seen_pushes:
                    # Add commits to existing entry; keep latest commit_msg
                    idx = seen_pushes[key]
                    events[idx]["commits"] = events[idx].get("commits", 0) + ev.get("commits", 0)
                    c = events[idx]["commits"]
                    repo = events[idx]["repo"]
                    # Keep the first (most recent) commit message
                    if not events[idx].get("commit_msg") and ev.get("commit_msg"):
                        events[idx]["commit_msg"] = ev["commit_msg"]
                    msg = events[idx].get("commit_msg", "")
                    if c > 0:
                        events[idx]["detail"] = f"{c} commit{'s' if c != 1 else ''}" + (f" — {msg}" if msg else "")
                    else:
                        events[idx]["detail"] = f"Pushed to {repo}"
                else:
                    c = ev.get("commits", 0)
                    msg = ev.get("commit_msg", "")
                    if c > 0:
                        ev["detail"] = f"{c} commit{'s' if c != 1 else ''}" + (f" — {msg}" if msg else "")
                    else:
                        ev["detail"] = f"Pushed to {ev['repo']}"
                    seen_pushes[key] = len(events)
                    events.append(ev)
            else:
                events.append(ev)

        # Remove internal fields, keep only display fields
        for ev in events:
            ev.pop("commits", None)
            ev.pop("commit_msg", None)

        json_events = json.dumps(events)
        _mem_cache_set(cache_key, json_events)
        if _is_redis_available():
            try:
                await redis_client.set(cache_key, json_events, ex=3600)  # 1hr cache
                _mark_redis_up()
            except Exception:
                _mark_redis_down()

        return events


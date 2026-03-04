# Central tool dispatcher — maps tool names to handler functions
import logging
import json

logger = logging.getLogger(__name__)


async def execute_tool(tool_name: str, args: dict) -> str:
    """
    Central tool executor — routes tool calls to their implementations.
    All agent tool calls come through here. Never call DB or HelixDB directly.

    Args:
        tool_name: Name of the tool to execute
        args: Arguments passed by the LLM

    Returns:
        JSON string result
    """
    handlers = {
        "fetch_github_repos": _fetch_github_repos,
        "fetch_repo_details": _fetch_repo_details,
        "fetch_github_profile": _fetch_github_profile,
        "fetch_leetcode_stats": _fetch_leetcode_stats,
        "fetch_topic_distribution": _fetch_topic_distribution,
        "fetch_company_blueprint": _fetch_company_blueprint,
        "query_skill_graph": _query_skill_graph,
        "fetch_curated_resources": _fetch_curated_resources,
        "extract_skills_from_text": _extract_skills_from_text,
    }

    handler = handlers.get(tool_name)
    if not handler:
        logger.warning(f"Unknown tool: {tool_name}")
        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    try:
        result = await handler(args)
        return json.dumps(result) if not isinstance(result, str) else result
    except Exception as e:
        logger.error(f"Tool {tool_name} failed: {e}")
        return json.dumps({"error": f"Tool execution failed: {str(e)}"})


# --- Tool Implementations ---

async def _fetch_github_repos(args: dict) -> dict:
    """Fetch repos for a GitHub user."""
    from scrapers.github_scraper import GitHubScraper
    username = args.get("username", "")
    scraper = GitHubScraper()
    repos = await scraper.fetch_repos(username)
    return {
        "repos": [
            {
                "name": r.get("name"),
                "description": r.get("description"),
                "language": r.get("language"),
                "stars": r.get("stargazers_count", 0),
                "forks": r.get("forks_count", 0),
                "topics": r.get("topics", []),
                "is_fork": r.get("fork", False),
                "updated_at": r.get("updated_at"),
            }
            for r in repos[:20]
        ],
        "total": len(repos),
    }


async def _fetch_repo_details(args: dict) -> dict:
    """Fetch detailed info for a specific repo."""
    from scrapers.github_scraper import GitHubScraper
    scraper = GitHubScraper()
    owner = args.get("owner", "")
    repo = args.get("repo", "")
    details = await scraper.fetch_repo_details(owner, repo)
    langs = await scraper.fetch_repo_languages(owner, repo)
    return {
        "details": details or {},
        "languages": langs,
    }


async def _fetch_github_profile(args: dict) -> dict:
    """Fetch full GitHub profile for analysis."""
    from scrapers.github_scraper import GitHubScraper
    scraper = GitHubScraper()
    return await scraper.fetch_full_profile(args.get("username", ""))


async def _fetch_leetcode_stats(args: dict) -> dict:
    """Fetch full LeetCode stats."""
    from scrapers.leetcode_scraper import LeetCodeScraper
    scraper = LeetCodeScraper()
    return await scraper.fetch_full_stats(args.get("username", ""))


async def _fetch_topic_distribution(args: dict) -> dict:
    """Fetch LeetCode topic breakdown."""
    from scrapers.leetcode_scraper import LeetCodeScraper
    scraper = LeetCodeScraper()
    topics = await scraper.fetch_topic_stats(args.get("username", ""))
    return {"topics": topics or []}


async def _fetch_company_blueprint(args: dict) -> dict:
    """Fetch company blueprint from database."""
    from app.core.database import async_session_factory
    from app.models.db import CompanyBlueprint
    from sqlalchemy import select

    company_slug = args.get("company_slug", "")
    async with async_session_factory() as session:
        result = await session.execute(
            select(CompanyBlueprint).where(CompanyBlueprint.slug == company_slug)
        )
        blueprint = result.scalar_one_or_none()
        if blueprint:
            return {
                "name": blueprint.name,
                "slug": blueprint.slug,
                "hiring_data": blueprint.hiring_data or {},
                "dsa_requirements": blueprint.dsa_requirements or {},
                "tech_stack": blueprint.tech_stack or [],
                "interview_format": blueprint.interview_format or {},
            }
    return {"error": f"No blueprint found for {company_slug}"}


async def _query_skill_graph(args: dict) -> dict:
    """Query HelixDB skill graph for dependencies."""
    # Stub — full HelixDB integration in Phase 4
    skill = args.get("skill", "")
    query_type = args.get("query_type", "prerequisites")
    depth = args.get("depth", 2)
    return {
        "skill": skill,
        "query_type": query_type,
        "depth": depth,
        "result": f"Skill graph query stub for '{skill}' — HelixDB integration in Phase 4",
        "dependencies": [],
    }


async def _fetch_curated_resources(args: dict) -> dict:
    """Fetch learning resources for a skill/topic."""
    # Returns curated resource suggestions
    skill = args.get("skill", "")
    args.get("type", "all")  # used for filtering
    return {
        "skill": skill,
        "resources": [
            {"type": "documentation", "title": f"{skill} Official Docs", "url": f"https://docs.example.com/{skill.lower()}"},
            {"type": "course", "title": f"Learn {skill}", "url": f"https://learn.example.com/{skill.lower()}"},
            {"type": "practice", "title": f"{skill} Exercises", "url": f"https://practice.example.com/{skill.lower()}"},
        ],
    }


async def _extract_skills_from_text(args: dict) -> dict:
    """Extract skills from arbitrary text using taxonomy."""
    from nlp.skill_extractor import SkillExtractor
    extractor = SkillExtractor()
    text = args.get("text", "")
    skills = extractor.extract_from_text(text)
    return {"skills": skills[:20]}


# --- Tool Definitions for LLM (OpenAI function calling format) ---

GITHUB_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "fetch_github_repos",
            "description": "Fetch all public repositories for a GitHub user",
            "parameters": {
                "type": "object",
                "properties": {
                    "username": {"type": "string", "description": "GitHub username"}
                },
                "required": ["username"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_repo_details",
            "description": "Fetch detailed info and language breakdown for a specific repo",
            "parameters": {
                "type": "object",
                "properties": {
                    "owner": {"type": "string", "description": "Repository owner"},
                    "repo": {"type": "string", "description": "Repository name"},
                },
                "required": ["owner", "repo"],
            },
        },
    },
]

LEETCODE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "fetch_leetcode_stats",
            "description": "Fetch complete LeetCode statistics for a user",
            "parameters": {
                "type": "object",
                "properties": {
                    "username": {"type": "string", "description": "LeetCode username"}
                },
                "required": ["username"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_topic_distribution",
            "description": "Fetch LeetCode problem topic/tag breakdown",
            "parameters": {
                "type": "object",
                "properties": {
                    "username": {"type": "string", "description": "LeetCode username"}
                },
                "required": ["username"],
            },
        },
    },
]

COMPANY_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "fetch_company_blueprint",
            "description": "Fetch hiring blueprint for a company from our database",
            "parameters": {
                "type": "object",
                "properties": {
                    "company_slug": {"type": "string", "description": "Company slug (e.g. google, amazon)"}
                },
                "required": ["company_slug"],
            },
        },
    },
]

SKILL_GRAPH_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "query_skill_graph",
            "description": "Query the skill dependency graph for prerequisite chains",
            "parameters": {
                "type": "object",
                "properties": {
                    "skill": {"type": "string", "description": "Skill to query"},
                    "query_type": {"type": "string", "enum": ["prerequisites", "dependents", "related"], "description": "Type of graph query"},
                    "depth": {"type": "integer", "description": "Traversal depth (1-3)", "default": 2},
                },
                "required": ["skill"],
            },
        },
    },
]

RESOURCE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "fetch_curated_resources",
            "description": "Fetch curated learning resources for a specific skill/topic",
            "parameters": {
                "type": "object",
                "properties": {
                    "skill": {"type": "string", "description": "Skill/topic to find resources for"},
                    "type": {"type": "string", "enum": ["all", "course", "documentation", "practice"], "default": "all"},
                },
                "required": ["skill"],
            },
        },
    },
]

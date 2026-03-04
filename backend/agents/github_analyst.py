# Agent 1: GitHub Intelligence Analyst
import logging
import json
from agents.core.agentic_loop import run_agent_loop
from agents.core.tool_executor import execute_tool, GITHUB_TOOLS
from agents.core.models import GitHubAnalysis

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the GitHub Intelligence Analyst for MintKey, an AI career targeting platform.

Your job is to analyze a user's GitHub profile and repositories to produce a comprehensive engineering assessment.

You MUST produce a JSON response with these exact fields:
- project_depth_score (0-100): Quality and complexity of projects
- engineering_maturity_index (0-100): Code quality, testing, CI/CD, documentation
- language_distribution: {language: percentage}
- key_strengths: [list of strengths]
- key_weaknesses: [list of weaknesses]
- top_projects: [{name, description, complexity, impact}]
- technology_stack: [list of technologies used]
- recommendations: [list of actionable recommendations]

Scoring guidelines:
- 80-100: Production-grade projects, comprehensive testing, clean architecture
- 60-79: Good projects with some testing and documentation
- 40-59: Average projects, limited scope, minimal testing
- 20-39: Tutorial-level projects, no testing, poor code quality
- 0-19: Barely any projects or all forks

Use the tools to fetch GitHub data, then analyze deeply. Return ONLY valid JSON."""


async def run_github_analyst(github_username: str) -> GitHubAnalysis:
    """Run the GitHub Intelligence Analyst agent."""
    logger.info(f"[GitHub Analyst] Starting analysis for {github_username}")

    user_message = f"""Analyze the GitHub profile for user: {github_username}

Fetch their repos and analyze:
1. Project quality and depth (are they original? complex? well-structured?)
2. Language distribution and technology breadth
3. Engineering maturity (testing, CI/CD, documentation, code quality)
4. Key strengths and weaknesses as a developer

Return your analysis as a JSON object."""

    result = await run_agent_loop(
        system_prompt=SYSTEM_PROMPT,
        user_message=user_message,
        tools=GITHUB_TOOLS,
        tool_executor=execute_tool,
        temperature=0.2,
        max_tokens=2000,
        agent_name="GitHub Analyst",
    )

    try:
        # Try to parse JSON from the result
        data = _extract_json(result)
        return GitHubAnalysis(**data)
    except Exception as e:
        logger.error(f"[GitHub Analyst] Failed to parse output: {e}")
        return GitHubAnalysis(
            recommendations=[f"Analysis failed: {str(e)}"],
        )


def _extract_json(text: str) -> dict:
    """Extract JSON from LLM response (may be wrapped in markdown code blocks)."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        json_lines = [line for line in lines if not line.startswith("```")]
        text = "\n".join(json_lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON in the text
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
        raise

# Agent 4: Market Trend Watcher
import logging
import json
from agents.core.agentic_loop import run_agent_loop
from agents.core.models import TrendData

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Market Trend Intelligence agent for MintKey, an AI career targeting platform.

Your job is to analyze what skills are in demand for a target company and identify gaps.

You MUST produce a JSON response with these exact fields:
- market_required_skills: [skills required by the market/company]
- user_missing_skills: [skills the user doesn't have]
- rising_skills: [{skill, growth_rate, demand}] — skills growing in demand
- declining_skills: [skills losing relevance]
- gap_alert: string describing the most critical gap
- recommendations: [list of actionable recommendations]

Base your analysis on the provided user skills and target company stack.
Return ONLY valid JSON."""


async def run_trend_watcher(target_company: str, user_skills: list[str]) -> TrendData:
    """Run the Market Trend Watcher agent."""
    logger.info(f"[Trend Watcher] Analyzing trends for {target_company}")

    user_message = f"""Analyze market trends for company: {target_company}

User's current skills: {json.dumps(user_skills)}

Based on your knowledge:
1. What skills does this company require currently?
2. Which of the user's skills are missing for this company?
3. What skills are rising in demand in this space?
4. What skills are declining?
5. What is the most critical gap?

Return your analysis as a JSON object."""

    result = await run_agent_loop(
        system_prompt=SYSTEM_PROMPT,
        user_message=user_message,
        tools=None,
        temperature=0.3,
        max_tokens=2000,
        agent_name="Trend Watcher",
    )

    try:
        data = _extract_json(result)
        return TrendData(**data)
    except Exception as e:
        logger.error(f"[Trend Watcher] Failed to parse output: {e}")
        return TrendData(recommendations=[f"Analysis failed: {str(e)}"])


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        json_lines = [line for line in lines if not line.startswith("```")]
        text = "\n".join(json_lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
        raise

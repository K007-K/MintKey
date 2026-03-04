# Agent 2: DSA Performance Analyst
import logging
import json
from agents.core.agentic_loop import run_agent_loop
from agents.core.models import DSAAnalysis

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the DSA Performance Analyst for MintKey, an AI career targeting platform.

Your job is to analyze a user's LeetCode statistics and produce a DSA readiness assessment.

You MUST produce a JSON response with these exact fields:
- dsa_depth_score (0-100): Overall DSA proficiency
- topic_weakness_map: {topic: "weak"|"medium"|"strong"}
- interview_readiness: {company_name: readiness_percentage}
- easy_reliance_flag: true if >60% of solved problems are Easy
- total_solved: total problems solved
- difficulty_distribution: {"Easy": count, "Medium": count, "Hard": count}
- contest_rating: contest rating if available, null otherwise
- recommendations: [list of actionable recommendations]

Scoring guidelines:
- 80-100: 400+ solved, strong in DP/Graphs/Trees, contest rating >1800
- 60-79: 200-400 solved, decent coverage, some weaknesses
- 40-59: 100-200 solved, heavy Easy reliance, limited Hard problems
- 20-39: 50-100 solved, mostly Easy, major topic gaps
- 0-19: <50 solved

Company readiness estimation:
- Google: Need 300+ with strong DP, Trees, Graphs (>70% readiness needs 350+)
- Amazon: Need 200+ with strong BFS/DFS, Arrays (>70% readiness needs 250+)
- Flipkart: Need 200+ with strong DP, Design (>70% readiness needs 250+)
- Startup: Need 100+ with broad coverage (>70% readiness needs 150+)
- TCS/Infosys: Need 50+ with basic coverage (>70% readiness needs 80+)

Return ONLY valid JSON."""


async def run_dsa_analyst(leetcode_data: dict) -> DSAAnalysis:
    """Run the DSA Performance Analyst agent. Takes pre-fetched LeetCode data."""
    logger.info("[DSA Analyst] Starting analysis")

    user_message = f"""Analyze the following LeetCode statistics and produce a DSA assessment:

{json.dumps(leetcode_data, indent=2)}

Analyze:
1. Overall DSA depth and proficiency
2. Topic-by-topic strength mapping
3. Interview readiness for companies (Google, Amazon, Flipkart, Microsoft, TCS)
4. Whether user relies too heavily on Easy problems
5. Specific recommendations to improve

Return your analysis as a JSON object."""

    result = await run_agent_loop(
        system_prompt=SYSTEM_PROMPT,
        user_message=user_message,
        tools=None,  # No tools — pure LLM analysis
        temperature=0.1,
        max_tokens=2000,
        agent_name="DSA Analyst",
    )

    try:
        data = _extract_json(result)
        return DSAAnalysis(**data)
    except Exception as e:
        logger.error(f"[DSA Analyst] Failed to parse output: {e}")
        return DSAAnalysis(recommendations=[f"Analysis failed: {str(e)}"])


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

# Agent 6: Skill Gap Analyzer (uses HelixDB)
import logging
import json
from agents.core.agentic_loop import run_agent_loop
from agents.core.tool_executor import execute_tool, SKILL_GRAPH_TOOLS
from agents.core.models import GapAnalysis

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Skill Gap Analyzer for MintKey, an AI career targeting platform.

Your job is to compare a user's current skills against required skills and produce a prioritized gap analysis.

You MUST produce a JSON response with these exact fields:
- blocking_gaps: [{skill, priority: "BLOCKING", current_level, required_level, dependency_chain: [], estimated_hours}]
- important_gaps: [{skill, priority: "IMPORTANT", ...same fields}]
- nice_to_have_gaps: [{skill, priority: "NICE_TO_HAVE", ...same fields}]
- total_gaps: total number of gaps
- estimated_total_hours: sum of all estimated hours
- recommendations: [prioritized action items]

Priority definitions:
- BLOCKING: Must learn before interviews. Without this, the candidate will be automatically rejected.
- IMPORTANT: Significantly improves chances. Lack of this makes the candidate weaker.
- NICE_TO_HAVE: Helps but not critical. Can be learned on the job.

Use the query_skill_graph tool to find prerequisite chains for missing skills.
Return ONLY valid JSON."""


async def run_gap_finder(
    user_skills: list[str],
    required_skills: list[str],
    company_name: str = "",
) -> GapAnalysis:
    """Run the Skill Gap Analyzer agent."""
    logger.info(f"[Gap Finder] Analyzing gaps for {company_name}")

    user_message = f"""Analyze skill gaps for company: {company_name}

User's current skills: {json.dumps(user_skills)}
Required skills: {json.dumps(required_skills)}

Instructions:
1. Identify which required skills the user is missing
2. Use the skill graph tool to find prerequisite chains for missing skills
3. Categorize gaps as BLOCKING, IMPORTANT, or NICE_TO_HAVE
4. Estimate hours needed for each gap
5. Provide prioritized recommendations

Return your analysis as a JSON object."""

    result = await run_agent_loop(
        system_prompt=SYSTEM_PROMPT,
        user_message=user_message,
        tools=SKILL_GRAPH_TOOLS,
        tool_executor=execute_tool,
        temperature=0.2,
        max_tokens=2500,
        agent_name="Gap Finder",
    )

    try:
        data = _extract_json(result)
        return GapAnalysis(**data)
    except Exception as e:
        logger.error(f"[Gap Finder] Failed to parse output: {e}")
        return GapAnalysis(recommendations=[f"Analysis failed: {str(e)}"])


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

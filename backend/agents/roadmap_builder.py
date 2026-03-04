# Agent 7: Roadmap Generator
import logging
import json
from agents.core.agentic_loop import run_agent_loop
from agents.core.tool_executor import execute_tool, RESOURCE_TOOLS
from agents.core.models import RoadmapOutput

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Roadmap Generator for MintKey, an AI career targeting platform.

Your job is to create a week-by-week preparation roadmap based on gap analysis, DSA analysis, and company requirements.

You MUST produce a JSON response with these exact fields:
- company: company name
- total_weeks: total preparation weeks
- hours_per_day: daily study hours
- weeks: [{week_number, theme, tasks: [{task, category, estimated_hours, resource_url}], dsa_problems, milestone}]
- key_milestones: [list of major milestones]

Roadmap design guidelines:
- First 2 weeks: Fill BLOCKING skill gaps (prerequisites first)
- Week 3-4: Core DSA topics (arrays, strings, trees, graphs)
- Week 5-8: Company-specific focus (DP for Google, BFS/DFS for Amazon)
- Week 9-12: Mock interviews, system design, advanced topics
- Each week should have a clear theme and measurable milestone
- Balance DSA practice with project/skill building
- Include rest days and review sessions

Categories for tasks: "dsa", "skill_learning", "project", "system_design", "mock_interview", "review"

Use the fetch_curated_resources tool to find learning resources.
Return ONLY valid JSON."""


async def run_roadmap_builder(
    gap_analysis: dict,
    dsa_analysis: dict,
    company_blueprint: dict,
    months_available: int = 3,
    hours_per_day: float = 4.0,
) -> RoadmapOutput:
    """Run the Roadmap Generator agent."""
    company = company_blueprint.get("company_name", "Unknown")
    logger.info(f"[Roadmap Builder] Generating roadmap for {company}")

    user_message = f"""Generate a week-by-week preparation roadmap.

Company: {company}
Available time: {months_available} months ({months_available * 4} weeks)
Study hours per day: {hours_per_day}

Gap Analysis: {json.dumps(gap_analysis, indent=2)}

DSA Analysis: {json.dumps(dsa_analysis, indent=2)}

Company Blueprint: {json.dumps(company_blueprint, indent=2)}

Create a detailed weekly plan with specific tasks, DSA problem targets, and milestones.
Fetch learning resources for key skill gaps.

Return your roadmap as a JSON object."""

    result = await run_agent_loop(
        system_prompt=SYSTEM_PROMPT,
        user_message=user_message,
        tools=RESOURCE_TOOLS,
        tool_executor=execute_tool,
        temperature=0.7,
        max_tokens=4000,
        agent_name="Roadmap Builder",
    )

    try:
        data = _extract_json(result)
        return RoadmapOutput(**data)
    except Exception as e:
        logger.error(f"[Roadmap Builder] Failed to parse output: {e}")
        return RoadmapOutput(
            company=company,
            key_milestones=[f"Roadmap generation failed: {str(e)}"],
        )


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

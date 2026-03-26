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
    company = company_blueprint.get("company_name", "") or company_blueprint.get("company_slug", "Unknown")
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
        output = RoadmapOutput(**data)
        if output.weeks and len(output.weeks) > 0:
            return output
        logger.warning(f"[Roadmap Builder] LLM returned empty weeks, using template fallback")
    except Exception as e:
        logger.error(f"[Roadmap Builder] Failed to parse output: {e}")

    # Deterministic template fallback when LLM fails or returns empty
    return _build_template_roadmap(company, company_blueprint, gap_analysis, dsa_analysis, months_available, hours_per_day)


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


def _build_template_roadmap(
    company: str,
    blueprint: dict,
    gap_analysis: dict,
    dsa_analysis: dict,
    months: int,
    hours_per_day: float,
) -> RoadmapOutput:
    """Build a deterministic roadmap from company blueprint data when LLM fails."""
    from agents.core.models import WeeklyRoadmap, WeeklyTask

    total_weeks = months * 4

    # Extract DSA topics from blueprint
    dsa_topics = blueprint.get("dsa_topics", [])
    if isinstance(dsa_topics, dict):
        dsa_topics = list(dsa_topics.keys())
    if not dsa_topics:
        dsa_topics = ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack",
                       "Binary Search", "Linked List", "Trees", "Graphs",
                       "Dynamic Programming", "Backtracking", "Heap", "Greedy"]

    required_stack = blueprint.get("required_stack", [])
    if isinstance(required_stack, dict):
        required_stack = list(required_stack.keys())

    # Extract blocking gaps
    blocking = gap_analysis.get("blocking_gaps", [])
    if isinstance(blocking, list):
        blocking_skills = [g.get("skill", g) if isinstance(g, dict) else str(g) for g in blocking[:4]]
    else:
        blocking_skills = []

    # Build phases
    phases = [
        {"name": "Foundation & Gap Filling", "weeks": max(2, total_weeks // 6), "focus": "blocking_gaps"},
        {"name": "Core DSA Patterns", "weeks": max(3, total_weeks // 3), "focus": "dsa"},
        {"name": "Company-Specific Focus", "weeks": max(2, total_weeks // 4), "focus": "company"},
        {"name": "System Design & Projects", "weeks": max(2, total_weeks // 6), "focus": "system_design"},
        {"name": "Mock Interviews & Review", "weeks": max(1, total_weeks // 6), "focus": "mock"},
    ]

    # Adjust to fit total weeks
    allocated = sum(p["weeks"] for p in phases)
    if allocated < total_weeks:
        phases[1]["weeks"] += total_weeks - allocated  # Add extra to DSA phase

    weeks = []
    week_num = 1
    milestones = []

    for phase in phases:
        topics_for_phase = []
        if phase["focus"] == "blocking_gaps":
            topics_for_phase = blocking_skills or dsa_topics[:2]
        elif phase["focus"] == "dsa":
            topics_for_phase = dsa_topics
        elif phase["focus"] == "company":
            topics_for_phase = (required_stack or dsa_topics[-3:])
        elif phase["focus"] == "system_design":
            topics_for_phase = ["System Design", "API Design", "Database Design"]
        elif phase["focus"] == "mock":
            topics_for_phase = ["Mock Interview", "Code Review", "Behavioral"]

        for i in range(phase["weeks"]):
            topic_idx = i % max(1, len(topics_for_phase))
            topic = topics_for_phase[topic_idx] if topics_for_phase else phase["name"]

            tasks = [
                WeeklyTask(
                    task=f"Study {topic} fundamentals",
                    category="skill_learning",
                    estimated_hours=hours_per_day * 2,
                ),
                WeeklyTask(
                    task=f"Solve 5 {topic} problems on LeetCode",
                    category="dsa",
                    estimated_hours=hours_per_day * 3,
                ),
                WeeklyTask(
                    task=f"Review solutions and patterns for {topic}",
                    category="review",
                    estimated_hours=hours_per_day * 1,
                ),
            ]

            if phase["focus"] in ("company", "system_design"):
                tasks.append(WeeklyTask(
                    task=f"Build mini-project using {topic}",
                    category="project",
                    estimated_hours=hours_per_day * 2,
                ))

            weeks.append(WeeklyRoadmap(
                week_number=week_num,
                theme=f"{phase['name']}: {topic}",
                tasks=tasks,
                dsa_problems=5 + (i * 2),
                milestone=f"Complete {topic} module" if (i + 1) == phase["weeks"] else "",
            ))

            if (i + 1) == phase["weeks"]:
                milestones.append(f"Phase complete: {phase['name']}")

            week_num += 1
            if week_num > total_weeks:
                break

        if week_num > total_weeks:
            break

    logger.info(f"[Roadmap Builder] Template fallback generated {len(weeks)} weeks for {company}")

    return RoadmapOutput(
        company=company,
        total_weeks=total_weeks,
        hours_per_day=hours_per_day,
        weeks=weeks,
        key_milestones=milestones,
    )


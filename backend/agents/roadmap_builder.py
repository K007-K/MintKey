# Agent 7: Roadmap Generator — enriched output with daily_plan, DSA tags, phases, kanban tasks
import logging
import json
from agents.core.agentic_loop import run_agent_loop
from agents.core.tool_executor import execute_tool, RESOURCE_TOOLS
from agents.core.models import (
    RoadmapOutput, WeeklyRoadmap, WeeklyTask, DsaTask, ProjectTask,
    ResourceItem, RoadmapPhaseOutput, KanbanTask, TOPIC_TO_LC_TAG,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Roadmap Generator for MintKey, an AI career targeting platform.

Your job is to create a week-by-week preparation roadmap based on gap analysis, DSA analysis, and company requirements.

You MUST produce a JSON response with these exact top-level fields:

{
  "company": "Company Name",
  "total_weeks": 24,
  "hours_per_day": 4,
  "phases": [
    {
      "phase_number": 1,
      "title": "DSA Foundation",
      "week_start": 1,
      "week_end": 6,
      "status": "unlocked",
      "unlock_condition": { "type": "always_unlocked" }
    }
  ],
  "weeks": [
    {
      "week_number": 1,
      "theme": "Foundation & Gap Filling: Arrays",
      "phase_id": 1,
      "hours_per_day": 4,
      "focus_topic": "Arrays & Hashing",
      "daily_plan": {
        "monday": "Study array fundamentals and common patterns",
        "tuesday": "Solve 3 easy array problems on LeetCode",
        "wednesday": "Study hash map patterns and two-sum variants",
        "thursday": "Solve 3 medium array/hash problems",
        "friday": "Timed practice: 2 medium problems in 40 min",
        "saturday": "Review solutions, study editorials",
        "sunday": "Rest & light review"
      },
      "dsa_task": {
        "label": "Solve 5 Array & Hashing problems on LeetCode",
        "lc_tag": "array",
        "count": 5,
        "difficulty": "medium"
      },
      "project_task": {
        "label": "Project work",
        "score_impact": 3,
        "difficulty": "medium",
        "hours": 4
      },
      "resources": [
        { "type": "article", "title": "NeetCode Arrays", "url": "https://neetcode.io" }
      ],
      "tasks": [
        { "task": "Study array fundamentals", "category": "skill_learning", "estimated_hours": 8 }
      ],
      "milestone": ""
    }
  ],
  "kanban_tasks": [
    {
      "type": "dsa",
      "title": "Master Arrays & Hashing",
      "difficulty": "hard",
      "estimated_weeks": 6,
      "score_impact": 8,
      "lc_tag": "array",
      "lc_count_required": 30
    }
  ],
  "key_milestones": ["Phase 1 complete: DSA Foundation"]
}

Roadmap design guidelines:
- Create exactly 4 phases: DSA Foundation, Projects & Stack, System Design, Final Prep
- First phase: Fill BLOCKING skill gaps (prerequisites first)
- Each week needs a UNIQUE daily_plan with 7 different daily tasks
- Map each week's DSA topic to a LeetCode tag in dsa_task.lc_tag
- Create 8-12 kanban_tasks covering DSA, projects, system design, stack, consistency
- Balance DSA practice with project/skill building
- Include rest days on Sunday

Categories for tasks: "dsa", "skill_learning", "project", "system_design", "mock_interview", "review"
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

Create a detailed weekly plan with:
1. daily_plan dict with 7 unique daily tasks
2. dsa_task with lc_tag mapped to LeetCode categories
3. project_task with score impact
4. resources with links
5. 4 phases (DSA Foundation, Projects & Stack, System Design, Final Prep)
6. 8-12 kanban_tasks for the task board

Return your roadmap as a JSON object."""

    result = await run_agent_loop(
        system_prompt=SYSTEM_PROMPT,
        user_message=user_message,
        tools=RESOURCE_TOOLS,
        tool_executor=execute_tool,
        temperature=0.7,
        max_tokens=8000,
        agent_name="Roadmap Builder",
    )

    try:
        data = _extract_json(result)
        output = RoadmapOutput(**data)
        if output.weeks and len(output.weeks) > 0:
            return output
        logger.warning("[Roadmap Builder] LLM returned empty weeks, using template fallback")
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


# --- Daily plan templates for different focus areas ---

_DAILY_TEMPLATES = {
    "dsa": {
        "monday": "Study {topic} fundamentals and common patterns",
        "tuesday": "Solve 3 easy {topic} problems on LeetCode",
        "wednesday": "Study advanced {topic} patterns and edge cases",
        "thursday": "Solve 3 medium {topic} problems on LeetCode",
        "friday": "Timed practice: 2 medium problems in 40 min",
        "saturday": "Review solutions, read NeetCode editorials",
        "sunday": "Rest & light review",
    },
    "project": {
        "monday": "Plan {topic} project architecture and setup",
        "tuesday": "Implement core features using {topic}",
        "wednesday": "Write tests and handle edge cases",
        "thursday": "Refine code quality and documentation",
        "friday": "Solve 2 DSA problems related to {topic}",
        "saturday": "Review project, prepare demo",
        "sunday": "Rest & portfolio update",
    },
    "system_design": {
        "monday": "Study {topic} concepts and trade-offs",
        "tuesday": "Design a real-world system using {topic}",
        "wednesday": "Practice whiteboard {topic} walkthrough",
        "thursday": "Study case studies and failure modes",
        "friday": "Mock design interview practice",
        "saturday": "Review designs and iterate",
        "sunday": "Rest & review notes",
    },
    "mock": {
        "monday": "Review weak areas from previous weeks",
        "tuesday": "Full mock coding interview (45 min)",
        "wednesday": "Behavioral question practice (STAR method)",
        "thursday": "Full mock system design interview",
        "friday": "Timed LeetCode: 3 problems in 60 min",
        "saturday": "Review all mock feedback",
        "sunday": "Rest & mental preparation",
    },
}


def _build_daily_plan(topic: str, focus_type: str) -> dict[str, str]:
    """Generate a unique daily plan dict for a given topic and focus type."""
    template = _DAILY_TEMPLATES.get(focus_type, _DAILY_TEMPLATES["dsa"])
    return {day: task.format(topic=topic) for day, task in template.items()}


def _get_lc_tag(topic: str) -> str:
    """Map a human-readable topic name to a LeetCode tag slug."""
    return TOPIC_TO_LC_TAG.get(topic, topic.lower().replace(" ", "-").replace("&", ""))


def _build_template_roadmap(
    company: str,
    blueprint: dict,
    gap_analysis: dict,
    dsa_analysis: dict,
    months: int,
    hours_per_day: float,
) -> RoadmapOutput:
    """Build a deterministic enriched roadmap from company blueprint data when LLM fails."""
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

    # --- Build 4 phases (per spec) ---
    phase_defs = [
        {"phase_number": 1, "title": "DSA Foundation", "fraction": 0.35, "focus": "dsa",
         "unlock": {"type": "always_unlocked"}},
        {"phase_number": 2, "title": "Projects & Stack", "fraction": 0.25, "focus": "project",
         "unlock": {"type": "phase_progress", "phase": 1, "min_progress": 60}},
        {"phase_number": 3, "title": "System Design", "fraction": 0.25, "focus": "system_design",
         "unlock": {"type": "phase_progress", "phase": 2, "min_progress": 50}},
        {"phase_number": 4, "title": "Final Prep", "fraction": 0.15, "focus": "mock",
         "unlock": {"type": "overall_progress", "min_progress": 75}},
    ]

    # Allocate weeks to phases
    week_cursor = 1
    phases_out: list[RoadmapPhaseOutput] = []
    phase_week_ranges: list[tuple[int, int, dict]] = []  # (start, end, phase_def)

    for pdef in phase_defs:
        phase_weeks = max(2, round(total_weeks * pdef["fraction"]))
        if pdef["phase_number"] == 4:
            # Last phase gets whatever remains
            phase_weeks = max(2, total_weeks - week_cursor + 1)

        week_start = week_cursor
        week_end = min(week_cursor + phase_weeks - 1, total_weeks)

        phases_out.append(RoadmapPhaseOutput(
            phase_number=pdef["phase_number"],
            title=pdef["title"],
            week_start=week_start,
            week_end=week_end,
            status="unlocked" if pdef["phase_number"] == 1 else "locked",
            unlock_condition=pdef["unlock"],
        ))
        phase_week_ranges.append((week_start, week_end, pdef))
        week_cursor = week_end + 1

    # --- Build enriched weeks ---
    weeks: list[WeeklyRoadmap] = []
    milestones: list[str] = []

    for phase_start, phase_end, pdef in phase_week_ranges:
        # Select topics based on phase focus
        if pdef["focus"] == "dsa":
            topics = blocking_skills + dsa_topics if blocking_skills else dsa_topics
        elif pdef["focus"] == "project":
            topics = required_stack or ["React", "Node.js", "Python", "API Design"]
        elif pdef["focus"] == "system_design":
            topics = ["System Design", "API Design", "Database Design", "Distributed Systems"]
        elif pdef["focus"] == "mock":
            topics = ["Mock Interview", "Code Review", "Behavioral", "Final Review"]
        else:
            topics = dsa_topics

        for wk in range(phase_start, min(phase_end + 1, total_weeks + 1)):
            topic_idx = (wk - phase_start) % max(1, len(topics))
            topic = topics[topic_idx]
            lc_tag = _get_lc_tag(topic)

            # Determine DSA problem count (gradually increases)
            dsa_count = 5 + ((wk - phase_start) * 2)
            difficulty = "easy" if wk <= 3 else ("medium" if wk <= total_weeks - 4 else "hard")

            # Build daily plan from templates
            daily_plan = _build_daily_plan(topic, pdef["focus"])

            # Build DSA task
            dsa_task = DsaTask(
                label=f"Solve {dsa_count} {topic} problems on LeetCode",
                lc_tag=lc_tag,
                count=dsa_count,
                count_done=0,
                difficulty=difficulty,
                status="upcoming",
            )

            # Build project task
            project_task = ProjectTask(
                label="Project work" if pdef["focus"] != "project" else f"Build {topic} project",
                score_impact=3 if pdef["focus"] != "project" else 5,
                difficulty="medium",
                hours=int(hours_per_day),
                done=False,
            )

            # Build resource items from blueprint
            resources: list[ResourceItem] = []
            bp_resources = blueprint.get("resources", {})
            if isinstance(bp_resources, dict):
                if pdef["focus"] == "dsa":
                    for r in bp_resources.get("dsa", [])[:2]:
                        if isinstance(r, dict):
                            resources.append(ResourceItem(type="article", title=r.get("name", ""), url=r.get("url", "")))
                        elif isinstance(r, str):
                            resources.append(ResourceItem(type="article", title=r, url=""))
                elif pdef["focus"] == "system_design":
                    for r in bp_resources.get("system_design", [])[:2]:
                        if isinstance(r, dict):
                            resources.append(ResourceItem(type="article", title=r.get("name", ""), url=r.get("url", "")))
                        elif isinstance(r, str):
                            resources.append(ResourceItem(type="article", title=r, url=""))

            # Build tasks list (legacy compat)
            tasks = [
                WeeklyTask(task=f"Study {topic} fundamentals", category="skill_learning", estimated_hours=hours_per_day * 2),
                WeeklyTask(task=f"Solve {dsa_count} {topic} problems on LeetCode", category="dsa", estimated_hours=hours_per_day * 3),
                WeeklyTask(task=f"Review solutions and patterns for {topic}", category="review", estimated_hours=hours_per_day),
            ]
            if pdef["focus"] in ("project", "system_design"):
                tasks.append(WeeklyTask(task=f"Build mini-project using {topic}", category="project", estimated_hours=hours_per_day * 2))

            is_phase_end = (wk == phase_end)
            milestone = f"Phase complete: {pdef['title']}" if is_phase_end else ""
            if is_phase_end:
                milestones.append(milestone)

            weeks.append(WeeklyRoadmap(
                week_number=wk,
                theme=f"{pdef['title']}: {topic}",
                phase_id=pdef["phase_number"],
                hours_per_day=hours_per_day,
                focus_topic=topic,
                progress=0.0,
                tasks=tasks,
                daily_plan=daily_plan,
                dsa_task=dsa_task,
                project_task=project_task,
                resources=resources,
                dsa_problems=dsa_count,
                milestone=milestone,
            ))

    # --- Build kanban tasks ---
    kanban_tasks: list[KanbanTask] = []

    # Add DSA kanban tasks — one per major topic
    for i, topic in enumerate(dsa_topics[:6]):
        lc_tag = _get_lc_tag(topic)
        kanban_tasks.append(KanbanTask(
            type="dsa",
            title=f"Master {topic}",
            difficulty="hard" if i < 3 else "medium",
            estimated_weeks=max(2, total_weeks // 6),
            score_impact=8 - i,
            lc_tag=lc_tag,
            lc_count_required=30 - (i * 3),
        ))

    # Add project kanban tasks
    for stack_item in (required_stack or ["Portfolio Project"])[:2]:
        kanban_tasks.append(KanbanTask(
            type="project",
            title=f"Build {stack_item} project",
            difficulty="medium",
            estimated_weeks=4,
            score_impact=5,
        ))

    # Add system design kanban task
    kanban_tasks.append(KanbanTask(
        type="system_design",
        title="Complete System Design study",
        difficulty="hard",
        estimated_weeks=6,
        score_impact=6,
    ))

    # Add consistency kanban task
    kanban_tasks.append(KanbanTask(
        type="consistency",
        title="Maintain daily coding streak",
        difficulty="medium",
        estimated_weeks=total_weeks,
        score_impact=4,
    ))

    logger.info(f"[Roadmap Builder] Template fallback generated {len(weeks)} weeks, {len(phases_out)} phases, {len(kanban_tasks)} kanban tasks for {company}")

    return RoadmapOutput(
        company=company,
        total_weeks=total_weeks,
        hours_per_day=hours_per_day,
        weeks=weeks,
        phases=phases_out,
        kanban_tasks=kanban_tasks,
        key_milestones=milestones,
    )

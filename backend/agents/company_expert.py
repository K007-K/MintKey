# Agent 5: Company Blueprint Expert
import logging
import json
from agents.core.agentic_loop import run_agent_loop
from agents.core.tool_executor import execute_tool, COMPANY_TOOLS
from agents.core.models import CompanyBlueprintModel

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Company Blueprint Expert for MintKey, an AI career targeting platform.

Your job is to produce a complete hiring blueprint for a target company, analyzing:
- DSA requirements and difficulty
- Required tech stack
- Interview format and rounds
- System design requirements
- CGPA cutoffs
- Hiring focus areas

You MUST produce a JSON response with these exact fields:
- company_name: full company name
- company_slug: lowercase slug
- dsa_threshold: minimum problems recommended
- cgpa_cutoff: minimum CGPA (0 if no cutoff)
- required_skills: [list of required technical skills]
- interview_format: [list of interview rounds]
- system_design_required: true/false
- hiring_focus: what the company focuses on in hiring
- difficulty_level: "Easy"|"Medium"|"Hard"|"Very Hard"
- preparation_timeline_weeks: recommended weeks to prepare
- recommendations: [specific recommendations for this company]

Use the fetch_company_blueprint tool first to check our database. If not found, use your knowledge.
Return ONLY valid JSON."""


async def run_company_expert(company: str, user_summary: dict = None) -> CompanyBlueprintModel:
    """Run the Company Blueprint Expert agent."""
    logger.info(f"[Company Expert] Analyzing {company}")

    user_msg_parts = [f"Create a complete hiring blueprint for: {company}"]
    if user_summary:
        user_msg_parts.append(f"\nUser summary: {json.dumps(user_summary)}")
    user_msg_parts.append("\nFetch the company blueprint from our database first, then supplement with your knowledge.")
    user_msg_parts.append("\nReturn your analysis as a JSON object.")

    result = await run_agent_loop(
        system_prompt=SYSTEM_PROMPT,
        user_message="\n".join(user_msg_parts),
        tools=COMPANY_TOOLS,
        tool_executor=execute_tool,
        temperature=0.1,
        max_tokens=2000,
        agent_name="Company Expert",
    )

    try:
        data = _extract_json(result)
        return CompanyBlueprintModel(**data)
    except Exception as e:
        logger.error(f"[Company Expert] Failed to parse output: {e}")
        return CompanyBlueprintModel(
            company_name=company,
            company_slug=company.lower().replace(" ", "-"),
            recommendations=[f"Analysis failed: {str(e)}"],
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

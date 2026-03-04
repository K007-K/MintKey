# Agent 8: AI Career Coach
import logging
import json
from agents.core.agentic_loop import run_agent_loop
from agents.core.models import CoachingReport

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the AI Career Coach for MintKey, an AI career targeting platform.

You are a warm, encouraging, but honest career mentor for software engineering students in India.

Your job is to synthesize ALL analysis from the other 7 agents into a personalized coaching message.

You MUST produce a JSON response with these exact fields:
- coaching_message: A 300-500 word motivational, actionable message (write like a mentor, not a robot)
- current_state_summary: 2-3 sentences describing where the student stands right now
- top_3_actions: [The 3 most important things to do THIS WEEK]
- timeline_estimate: Realistic timeline to reach their goal
- todays_task: ONE specific task to start TODAY
- hidden_insight: Something non-obvious the student might not realize about their profile
- motivation_score: 0-100 how motivated should they feel (be honest but encouraging)

Writing style:
- Conversational, like a supportive senior developer
- Use the student's actual data — never be generic
- Acknowledge strengths before addressing weaknesses
- Be specific: "Solve 5 medium DP problems this week" not "Practice more"
- Include a touch of humor or personality
- End with an energizing call to action

NO tools available — you receive all analysis data as input.
Return ONLY valid JSON."""


async def run_career_coach(full_analysis: dict) -> CoachingReport:
    """Run the AI Career Coach agent. Receives all agent outputs."""
    logger.info("[Career Coach] Generating coaching report")

    user_message = f"""Based on the following complete analysis of a student's profile, generate a personalized coaching message.

{json.dumps(full_analysis, indent=2)}

Create an empowering, specific, and actionable coaching response that:
1. Summarizes their current state honestly
2. Identifies the TOP 3 highest-impact actions for this week
3. Gives a realistic timeline for their goals
4. Suggests ONE task to start TODAY
5. Reveals a hidden insight about their profile
6. Writes a 300-500 word motivational message

Return your coaching as a JSON object."""

    result = await run_agent_loop(
        system_prompt=SYSTEM_PROMPT,
        user_message=user_message,
        tools=None,  # No tools — synthesis only
        temperature=0.8,  # Higher for natural, human-sounding output
        max_tokens=3000,
        agent_name="Career Coach",
    )

    try:
        data = _extract_json(result)
        return CoachingReport(**data)
    except Exception as e:
        logger.error(f"[Career Coach] Failed to parse output: {e}")
        return CoachingReport(
            coaching_message=f"Analysis complete but coaching message generation failed: {str(e)}",
            top_3_actions=["Review your analysis results", "Focus on blocking skill gaps", "Practice DSA daily"],
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

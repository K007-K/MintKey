# Agent 3: Resume Intelligence Parser
import logging
import json
from agents.core.agentic_loop import run_agent_loop
from agents.core.models import ResumeData

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Resume Intelligence Parser for MintKey, an AI career targeting platform.

Your job is to analyze parsed resume data and produce a structured skill assessment.

You MUST produce a JSON response with these exact fields:
- resume_strength_score (0-100): Overall resume quality
- extracted_skills: [list of technical skills found]
- academic_eligibility: {company: true/false based on CGPA cutoffs}
- cgpa: numeric CGPA value, null if not found
- cgpa_scale: the scale (usually 10.0)
- internship_count: number of internships
- project_count: number of projects
- certifications: [list of certifications]
- recommendations: [list of recommendations to improve resume]

CGPA cutoffs for eligibility:
- Google: 7.0/10
- Amazon: 6.5/10
- Microsoft: 7.0/10
- Flipkart: 7.0/10
- Razorpay: 7.5/10
- TCS: 6.0/10
- Infosys: 6.0/10
- Wipro: 5.5/10
- Startups: No cutoff

Scoring guidelines:
- 80-100: Strong projects, relevant internships, good skills, high CGPA
- 60-79: Decent projects, some experience, adequate skills
- 40-59: Basic resume, limited experience
- 20-39: Weak resume, few projects, no internships
- 0-19: Minimal or empty resume

Return ONLY valid JSON. Use temperature 0.0 for deterministic extraction."""


async def run_resume_parser(resume_data: dict) -> ResumeData:
    """Run the Resume Intelligence Parser agent. Takes pre-parsed resume data."""
    logger.info("[Resume Parser] Starting analysis")

    user_message = f"""Analyze the following parsed resume data and extract a structured skill assessment:

{json.dumps(resume_data, indent=2)}

Instructions:
1. Extract ALL technical skills mentioned
2. Calculate resume strength based on projects, internships, and skills breadth
3. Determine academic eligibility for each company based on CGPA
4. Count internships and projects
5. List certifications
6. Provide specific recommendations

Return your analysis as a JSON object."""

    result = await run_agent_loop(
        system_prompt=SYSTEM_PROMPT,
        user_message=user_message,
        tools=None,  # No tools — pure NLP extraction
        temperature=0.0,  # Deterministic
        max_tokens=2000,
        agent_name="Resume Parser",
    )

    try:
        data = _extract_json(result)
        return ResumeData(**data)
    except Exception as e:
        logger.error(f"[Resume Parser] Failed to parse output: {e}")
        return ResumeData(recommendations=[f"Analysis failed: {str(e)}"])


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

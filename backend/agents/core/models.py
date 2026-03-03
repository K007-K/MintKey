# Pydantic models for agent input/output — stub for Phase 3
from pydantic import BaseModel
from typing import Optional


class AgentInput(BaseModel):
    """Base input for all agents."""
    user_id: str
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    resume_text: Optional[str] = None
    target_company: Optional[str] = None


class AgentOutput(BaseModel):
    """Base output for all agents."""
    agent_name: str
    status: str = "success"
    data: dict = {}
    error: Optional[str] = None

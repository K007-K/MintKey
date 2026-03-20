# Pydantic v2 DTOs for all request/response shapes
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


# --- Standard response envelope ---
class APIResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = True
    data: Any = None
    error: Optional[str] = None


# --- Enums ---


class GapPriorityEnum(str, Enum):
    BLOCKING = "blocking"
    IMPORTANT = "important"
    NICE_TO_HAVE = "nice_to_have"


# --- User schemas ---
class UserCreate(BaseModel):
    email: str
    name: Optional[str] = None
    github_username: Optional[str] = None
    github_oauth_id: Optional[str] = None
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    kaggle_username: Optional[str] = None
    hackerrank_username: Optional[str] = None
    codechef_username: Optional[str] = None
    institution_name: Optional[str] = None
    cgpa: Optional[float] = Field(None, ge=0, le=10)
    branch: Optional[str] = None
    college_tier: Optional[int] = Field(None, ge=1, le=4)
    graduation_year: Optional[int] = None
    internship_count: Optional[int] = Field(None, ge=0)
    available_months: Optional[int] = Field(None, ge=1, le=12)
    is_onboarded: Optional[bool] = None
    settings: Optional[dict] = None
    resume_url: Optional[str] = None
    resume_parsed_data: Optional[dict] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    hackerrank_username: Optional[str] = None
    codechef_username: Optional[str] = None
    institution_name: Optional[str] = None
    cgpa: Optional[float] = None
    branch: Optional[str] = None
    college_tier: Optional[int] = None
    graduation_year: Optional[int] = None
    internship_count: int = 0
    is_onboarded: bool = False
    settings: Optional[dict] = None
    resume_url: Optional[str] = None
    resume_parsed_data: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Auth schemas ---
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: Optional[int] = None


# --- Analysis schemas ---
class AnalysisRequest(BaseModel):
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    target_companies: list[str] = Field(default_factory=list, max_length=5)
    resume_text: Optional[str] = None


class AnalysisTriggerResponse(BaseModel):
    task_id: str
    status: str = "queued"
    estimated_seconds: int = 12


class AnalysisStatusResponse(BaseModel):
    task_id: str
    status: str
    progress: Optional[dict] = None
    result: Optional[dict] = None
    error: Optional[str] = None


# --- Company schemas ---
class CompanyBlueprintResponse(BaseModel):
    slug: str
    name: str
    type: Optional[str] = None
    logo_url: Optional[str] = None
    hiring_data: Optional[dict] = None
    dsa_requirements: Optional[dict] = None
    tech_stack: Optional[dict] = None
    system_design: Optional[dict] = None
    interview_format: Optional[dict] = None
    behavioral: Optional[dict] = None
    projects: Optional[dict] = None
    resources: Optional[dict] = None
    scoring_weights: Optional[dict] = None
    raw_sources: Optional[list] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- Match score schemas ---
class MatchScoreResponse(BaseModel):
    company_slug: str
    overall_score: float
    breakdown: Optional[dict] = None
    status_label: Optional[str] = None
    weeks_away: Optional[int] = None
    computed_at: datetime

    model_config = {"from_attributes": True}


# --- Onboarding schemas ---
class OnboardingStep1(BaseModel):
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    kaggle_username: Optional[str] = None


class OnboardingStep2(BaseModel):
    cgpa: Optional[float] = Field(None, ge=0, le=10)
    branch: Optional[str] = None
    college_tier: Optional[int] = Field(None, ge=1, le=4)
    graduation_year: Optional[int] = None
    internship_count: Optional[int] = Field(None, ge=0)


class OnboardingStep4(BaseModel):
    target_companies: list[str] = Field(max_length=5)


# --- DSA Progress schemas ---
class DSAProgressToggle(BaseModel):
    """Mark a problem solved or unsolved."""
    lc_number: Optional[int] = None
    title: str
    difficulty: str = "Medium"
    topic: str = "General"
    sheet: str = "neetcode_150"
    solved: bool = True


class DSAProgressBulkSync(BaseModel):
    """Bulk sync solved problems from localStorage."""
    sheet: str = "neetcode_150"
    problems: list[dict]


class DSAProgressResponse(BaseModel):
    """Single DSA progress record."""
    lc_number: Optional[int] = None
    title: str
    difficulty: str
    topic: str
    sheet: str
    solved: bool
    solved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

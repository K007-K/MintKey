# Pydantic models for agent input/output — structured data flowing between agents
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# --- Agent Input ---

class UserAnalysisRequest(BaseModel):
    """Input to the orchestrator from the API."""
    user_id: str
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    resume_text: Optional[str] = None
    target_companies: list[str] = Field(default_factory=list)
    months_available: int = 6
    hours_per_day: float = 4.0


# --- Agent 1: GitHub Analyst Output ---

class GitHubAnalysis(BaseModel):
    """Output from Agent 1: GitHub Intelligence Analyst."""
    project_depth_score: float = Field(0, ge=0, le=100, description="0-100 score")
    engineering_maturity_index: float = Field(0, ge=0, le=100)
    language_distribution: dict[str, float] = Field(default_factory=dict)
    key_strengths: list[str] = Field(default_factory=list)
    key_weaknesses: list[str] = Field(default_factory=list)
    top_projects: list[dict] = Field(default_factory=list)
    technology_stack: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


# --- Agent 2: DSA Analyst Output ---

class DSAAnalysis(BaseModel):
    """Output from Agent 2: DSA Performance Analyst."""
    dsa_depth_score: float = Field(0, ge=0, le=100)
    topic_weakness_map: dict[str, str] = Field(default_factory=dict, description="topic → weak/medium/strong")
    interview_readiness: dict[str, float] = Field(default_factory=dict, description="company → readiness %")
    easy_reliance_flag: bool = False
    total_solved: int = 0
    difficulty_distribution: dict[str, int] = Field(default_factory=dict)
    contest_rating: Optional[float] = None
    recommendations: list[str] = Field(default_factory=list)


# --- Agent 3: Resume Parser Output ---

class ResumeData(BaseModel):
    """Output from Agent 3: Resume Intelligence Parser."""
    resume_strength_score: float = Field(0, ge=0, le=100)
    extracted_skills: list[str] = Field(default_factory=list)
    academic_eligibility: dict[str, bool] = Field(default_factory=dict, description="company → eligible")
    cgpa: Optional[float] = None
    cgpa_scale: float = 10.0
    internship_count: int = 0
    project_count: int = 0
    certifications: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


# --- Agent 4: Trend Watcher Output ---

class TrendData(BaseModel):
    """Output from Agent 4: Market Trend Intelligence."""
    market_required_skills: list[str] = Field(default_factory=list)
    user_missing_skills: list[str] = Field(default_factory=list)
    rising_skills: list[dict] = Field(default_factory=list, description="[{skill, growth_rate, demand}]")
    declining_skills: list[str] = Field(default_factory=list)
    gap_alert: str = ""
    recommendations: list[str] = Field(default_factory=list)


# --- Agent 5: Company Expert Output ---

class CompanyBlueprintModel(BaseModel):
    """Output from Agent 5: Company Blueprint Expert."""
    company_name: str = ""
    company_slug: str = ""
    dsa_threshold: int = 0
    cgpa_cutoff: float = 0.0
    required_skills: list[str] = Field(default_factory=list)
    interview_format: list[str] = Field(default_factory=list)
    system_design_required: bool = False
    hiring_focus: str = ""
    difficulty_level: str = ""
    preparation_timeline_weeks: int = 12
    recommendations: list[str] = Field(default_factory=list)


# --- Agent 6: Gap Finder Output ---

class GapPriority(str, Enum):
    BLOCKING = "BLOCKING"
    IMPORTANT = "IMPORTANT"
    NICE_TO_HAVE = "NICE_TO_HAVE"


class SkillGap(BaseModel):
    """A single skill gap with priority and dependency chain."""
    skill: str
    priority: GapPriority
    current_level: str = "none"
    required_level: str = "intermediate"
    dependency_chain: list[str] = Field(default_factory=list)
    estimated_hours: int = 0


class GapAnalysis(BaseModel):
    """Output from Agent 6: Skill Gap Analyzer."""
    blocking_gaps: list[SkillGap] = Field(default_factory=list)
    important_gaps: list[SkillGap] = Field(default_factory=list)
    nice_to_have_gaps: list[SkillGap] = Field(default_factory=list)
    total_gaps: int = 0
    estimated_total_hours: int = 0
    recommendations: list[str] = Field(default_factory=list)


# --- Agent 7: Roadmap Builder Output ---

# LeetCode tag mapping for DSA topics
TOPIC_TO_LC_TAG = {
    "Arrays & Hashing": "array",
    "Two Pointers": "two-pointers",
    "Sliding Window": "sliding-window",
    "Binary Search": "binary-search",
    "Trees": "tree",
    "Graphs": "graph",
    "Dynamic Programming": "dynamic-programming",
    "Linked Lists": "linked-list",
    "Linked List": "linked-list",
    "Stacks": "stack",
    "Stack": "stack",
    "Recursion": "recursion",
    "Greedy": "greedy",
    "Backtracking": "backtracking",
    "Heaps": "heap-priority-queue",
    "Heap": "heap-priority-queue",
    "Tries": "trie",
    "Bit Manipulation": "bit-manipulation",
    "System Design": "system-design",
    "API Design": "system-design",
    "Database Design": "system-design",
    "Mock Interview": "mock-interview",
    "Code Review": "review",
    "Behavioral": "behavioral",
}


class WeeklyTask(BaseModel):
    """A single task within a weekly roadmap."""
    task: str
    category: str = "general"
    estimated_hours: float = 1.0
    resource_url: Optional[str] = None


class DsaTask(BaseModel):
    """DSA practice task for a given week."""
    label: str = ""                    # "Solve 5 Two Pointers problems on LeetCode"
    lc_tag: str = ""                   # "two-pointers"
    count: int = 5                     # Number of problems
    count_done: int = 0                # Progress
    difficulty: str = "medium"         # easy | medium | hard
    status: str = "upcoming"           # upcoming | in_progress | done


class ProjectTask(BaseModel):
    """Project work task for a given week."""
    label: str = "Project work"
    score_impact: int = 3              # Percentage impact on score
    difficulty: str = "medium"
    hours: int = 4
    done: bool = False


class ResourceItem(BaseModel):
    """A learning resource for a weekly plan."""
    type: str = "article"              # article | video | course | tool
    title: str = ""
    url: str = ""


class WeeklyRoadmap(BaseModel):
    """One week of the roadmap — enriched with daily plan, DSA tracking, resources."""
    week_number: int
    theme: str
    phase_id: int = 1                  # Which phase this week belongs to
    hours_per_day: float = 4.0
    focus_topic: str = ""
    progress: float = 0.0             # 0–100, updated as user progresses
    tasks: list[WeeklyTask] = Field(default_factory=list)
    daily_plan: dict[str, str] = Field(default_factory=dict)  # {"monday": "...", ...}
    dsa_task: Optional[DsaTask] = None
    project_task: Optional[ProjectTask] = None
    resources: list[ResourceItem] = Field(default_factory=list)
    dsa_problems: int = 0
    milestone: str = ""


class RoadmapPhaseOutput(BaseModel):
    """Phase definition for the roadmap (4 phases)."""
    phase_number: int
    title: str
    week_start: int
    week_end: int
    status: str = "locked"             # locked | unlocked | done
    unlock_condition: dict = Field(default_factory=dict)


class KanbanTask(BaseModel):
    """Kanban board task generated by Agent 7."""
    type: str                          # dsa | project | system_design | stack | experience | consistency
    title: str
    difficulty: str = "medium"
    estimated_weeks: int = 4
    score_impact: int = 5
    lc_tag: Optional[str] = None
    lc_count_required: Optional[int] = None


class RoadmapOutput(BaseModel):
    """Output from Agent 7: Roadmap Generator — enriched with phases and kanban tasks."""
    company: str = ""
    total_weeks: int = 0
    hours_per_day: float = 4.0
    weeks: list[WeeklyRoadmap] = Field(default_factory=list)
    phases: list[RoadmapPhaseOutput] = Field(default_factory=list)
    kanban_tasks: list[KanbanTask] = Field(default_factory=list)
    key_milestones: list[str] = Field(default_factory=list)


# --- Agent 8: Career Coach Output ---

class CoachingReport(BaseModel):
    """Output from Agent 8: AI Career Coach."""
    coaching_message: str = ""
    current_state_summary: str = ""
    top_3_actions: list[str] = Field(default_factory=list)
    timeline_estimate: str = ""
    todays_task: str = ""
    hidden_insight: str = ""
    motivation_score: float = Field(0, ge=0, le=100)


# --- Complete Analysis Result ---

class CompleteAnalysis(BaseModel):
    """Full merged analysis from all 8 agents."""
    user_id: str
    github_analysis: Optional[GitHubAnalysis] = None
    dsa_analysis: Optional[DSAAnalysis] = None
    resume_data: Optional[ResumeData] = None
    trend_data: Optional[TrendData] = None
    company_blueprints: dict[str, CompanyBlueprintModel] = Field(default_factory=dict)
    gap_analysis: Optional[GapAnalysis] = None
    roadmaps: dict[str, RoadmapOutput] = Field(default_factory=dict)
    coaching: Optional[CoachingReport] = None
    match_scores: dict[str, float] = Field(default_factory=dict)
    overall_readiness: float = 0.0
    analysis_timestamp: str = ""

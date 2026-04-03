# SQLAlchemy ORM models for MintKey database
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text,
    ForeignKey, Enum as SAEnum, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import DeclarativeBase, relationship
import enum


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class GapPriority(str, enum.Enum):
    """Skill gap priority levels."""
    BLOCKING = "blocking"
    IMPORTANT = "important"
    NICE_TO_HAVE = "nice_to_have"


class User(Base):
    """User profile table."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)

    # Platform usernames
    github_username = Column(String(100), nullable=True, index=True)
    leetcode_username = Column(String(100), nullable=True)
    kaggle_username = Column(String(100), nullable=True)
    hackerrank_username = Column(String(100), nullable=True)
    codechef_username = Column(String(100), nullable=True)

    # Academic background
    institution_name = Column(String(255), nullable=True)
    cgpa = Column(Float, nullable=True)
    branch = Column(String(50), nullable=True)
    college_tier = Column(Integer, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    internship_count = Column(Integer, default=0)
    available_months = Column(Integer, default=4)

    # Resume
    resume_url = Column(Text, nullable=True)
    resume_parsed_data = Column(JSONB, nullable=True)

    # Auth
    github_oauth_id = Column(String(100), nullable=True, unique=True)
    is_onboarded = Column(Boolean, default=False)
    settings = Column(JSONB, nullable=True, default=dict)
    activity_calendar = Column(JSONB, nullable=True, default=dict)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    platform_scores = relationship("PlatformScore", back_populates="user", cascade="all, delete-orphan")
    company_match_scores = relationship("CompanyMatchScore", back_populates="user", cascade="all, delete-orphan")
    target_companies = relationship("UserTargetCompany", back_populates="user", cascade="all, delete-orphan")
    skill_gaps = relationship("UserSkillGap", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("UserRoadmap", back_populates="user", cascade="all, delete-orphan")
    analyses = relationship("AnalysisResult", back_populates="user", cascade="all, delete-orphan")
    dsa_progress = relationship("UserDSAProgress", back_populates="user", cascade="all, delete-orphan")
    problem_progress = relationship("UserProblemProgress", back_populates="user", cascade="all, delete-orphan")
    lc_submissions = relationship("LcSubmission", back_populates="user", cascade="all, delete-orphan")


class PlatformScore(Base):
    """Stores synced platform data and computed scores."""
    __tablename__ = "platform_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    platform = Column(String(50), nullable=False)  # github, leetcode, kaggle
    raw_data = Column(JSONB, nullable=True)
    computed_score = Column(Float, nullable=True)
    breakdown = Column(JSONB, nullable=True)

    synced_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="platform_scores")


class CompanyBlueprint(Base):
    """Company hiring blueprint — all complex data stored as JSONB for flexibility."""
    __tablename__ = "company_blueprints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=True)       # "FAANG", "Fintech Unicorn", "IT Services"
    logo_url = Column(Text, nullable=True)

    # All complex data as JSONB — flexible, queryable, extensible
    hiring_data = Column(JSONB, nullable=True)       # package, cgpa, rounds, difficulty, timeline
    dsa_requirements = Column(JSONB, nullable=True)  # topic targets, difficulty breakdown, problem counts
    tech_stack = Column(JSONB, nullable=True)         # languages, frameworks, tools evaluated
    system_design = Column(JSONB, nullable=True)      # required topics, depth, must-know designs
    interview_format = Column(JSONB, nullable=True)   # rounds breakdown, OA platform, behavioral
    behavioral = Column(JSONB, nullable=True)         # framework, key attributes, common questions
    projects = Column(JSONB, nullable=True)           # must-have, strong signals, impressive projects
    resources = Column(JSONB, nullable=True)          # curated DSA, system design, mock interview links
    scoring_weights = Column(JSONB, nullable=True)    # match score weight distribution (decimals)
    raw_sources = Column(JSONB, nullable=True)        # URLs + access dates of data sources

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CompanyMatchScore(Base):
    """User's match score against a specific company — time-series."""
    __tablename__ = "company_match_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_slug = Column(String(100), ForeignKey("company_blueprints.slug"), nullable=False, index=True)

    overall_score = Column(Float, nullable=False)
    breakdown = Column(JSONB, nullable=True)
    status_label = Column(String(50), nullable=True)  # "Preparing", "Almost Ready", "Ready"
    weeks_away = Column(Integer, nullable=True)

    computed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="company_match_scores")


class UserTargetCompany(Base):
    """Companies a user is targeting (max 5)."""
    __tablename__ = "user_target_companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_slug = Column(String(100), ForeignKey("company_blueprints.slug"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="target_companies")


class UserSkillGap(Base):
    """Identified skill gaps for a user."""
    __tablename__ = "user_skill_gaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_slug = Column(String(100), nullable=True)

    skill_name = Column(String(100), nullable=False)
    priority = Column(SAEnum(GapPriority, values_callable=lambda x: [e.value for e in x], create_type=False), nullable=False)
    current_level = Column(Float, nullable=True)
    required_level = Column(Float, nullable=True)
    dependency_chain = Column(JSONB, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="skill_gaps")


class UserRoadmap(Base):
    """Generated roadmap for a user targeting a company."""
    __tablename__ = "user_roadmaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_slug = Column(String(100), nullable=False)

    total_weeks = Column(Integer, nullable=False)
    hours_per_day = Column(Integer, default=5)
    weeks_data = Column(JSONB, nullable=False)  # Array of week objects
    progress_pct = Column(Float, default=0.0)
    current_week = Column(Integer, default=1)

    # New columns (Sprint 2A — Gaps #5, #10, #11, #7)
    target_level = Column(String(50), nullable=True)       # "L3 SWE" — subtitle display
    streak_days = Column(Integer, default=0)                 # Consecutive LC solve days
    last_solved_at = Column(DateTime, nullable=True)         # Last LC solve timestamp
    problems_this_week = Column(Integer, default=0)          # Weekly problem count
    last_synced_at = Column(DateTime, nullable=True)         # "Last synced: X mins ago"
    generation_hash = Column(String(64), nullable=True)      # SHA256 cache key for AI gen

    generated_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="roadmaps")
    phases = relationship("RoadmapPhase", back_populates="roadmap", cascade="all, delete-orphan")
    tasks = relationship("RoadmapTask", back_populates="roadmap", cascade="all, delete-orphan")
    score_snapshots = relationship("ScoreSnapshot", back_populates="roadmap", cascade="all, delete-orphan")
    skill_progress = relationship("SkillProgress", back_populates="roadmap", cascade="all, delete-orphan")


class RoadmapPhase(Base):
    """Phase tracking for a roadmap (4 phases per roadmap)."""
    __tablename__ = "roadmap_phases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    roadmap_id = Column(UUID(as_uuid=True), ForeignKey("user_roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)

    phase_number = Column(Integer, nullable=False)       # 1, 2, 3, 4
    title = Column(String(255), nullable=False)           # "DSA Foundation"
    week_start = Column(Integer, nullable=False)          # 1
    week_end = Column(Integer, nullable=False)            # 5
    status = Column(String(20), default="locked")         # locked | unlocked | done
    progress = Column(Float, default=0.0)                 # 0–100
    unlock_condition = Column(JSONB, nullable=True)       # { type: "always_unlocked" }

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    roadmap = relationship("UserRoadmap", back_populates="phases")


class RoadmapTask(Base):
    """Kanban board tasks for a roadmap (TODO/IN_PROGRESS/DONE)."""
    __tablename__ = "roadmap_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    roadmap_id = Column(UUID(as_uuid=True), ForeignKey("user_roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)

    type = Column(String(50), nullable=False)             # dsa | project | system_design | stack | experience | consistency
    title = Column(String(255), nullable=False)           # "Master Arrays Strings"
    difficulty = Column(String(20), nullable=True)        # hard | medium | easy
    estimated_weeks = Column(Integer, nullable=True)
    score_impact = Column(Integer, nullable=True)         # +8, +7, etc.
    status = Column(String(20), default="todo")           # todo | in_progress | done

    # DSA-specific fields
    lc_tag = Column(String(100), nullable=True)           # "array" — maps to LeetCode tag
    lc_count_required = Column(Integer, nullable=True)
    lc_count_done = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    roadmap = relationship("UserRoadmap", back_populates="tasks")


class ScoreSnapshot(Base):
    """Time-series score data for the Match Score Over Time chart."""
    __tablename__ = "score_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    roadmap_id = Column(UUID(as_uuid=True), ForeignKey("user_roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)

    week_number = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    projected_score = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    roadmap = relationship("UserRoadmap", back_populates="score_snapshots")


class SkillProgress(Base):
    """Per-topic DSA progress (solved vs required)."""
    __tablename__ = "skill_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    roadmap_id = Column(UUID(as_uuid=True), ForeignKey("user_roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)

    topic = Column(String(100), nullable=False)           # "Arrays Strings"
    lc_tag = Column(String(100), nullable=False)          # "array"
    solved = Column(Integer, default=0)
    required = Column(Integer, nullable=False)
    progress = Column(Float, default=0.0)                 # solved / required * 100

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    roadmap = relationship("UserRoadmap", back_populates="skill_progress")

    __table_args__ = (
        UniqueConstraint('roadmap_id', 'topic', name='uq_roadmap_skill_topic'),
    )


class LcSubmission(Base):
    """Raw synced LeetCode submission data."""
    __tablename__ = "lc_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    lc_problem_id = Column(String(20), nullable=False)    # LeetCode problem ID
    title_slug = Column(String(255), nullable=False)       # "two-sum"
    title = Column(String(255), nullable=False)            # "Two Sum"
    difficulty = Column(String(10), nullable=False)        # Easy | Medium | Hard
    tags = Column(ARRAY(Text), nullable=True)              # ["array", "hash-table"]
    solved_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="lc_submissions")

    __table_args__ = (
        UniqueConstraint('user_id', 'lc_problem_id', name='uq_user_lc_problem'),
        Index('ix_lc_sub_user_solved', 'user_id', 'solved_at'),
    )


class AnalysisResult(Base):
    """Full analysis result from the 8-agent orchestrator."""
    __tablename__ = "analysis_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    status = Column(String(20), default="pending")  # pending, running, complete, error
    agent_outputs = Column(JSONB, nullable=True)
    merged_analysis = Column(JSONB, nullable=True)
    coaching_message = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="analyses")


class UserDSAProgress(Base):
    """Tracks which DSA problems a user has solved on the platform."""
    __tablename__ = "user_dsa_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    lc_number = Column(Integer, nullable=True)
    title = Column(Text, nullable=False)
    difficulty = Column(String(10), nullable=False)
    topic = Column(String(100), nullable=False)
    sheet = Column(String(50), nullable=False)
    solved = Column(Boolean, default=True)

    solved_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="dsa_progress")


class ExternalProblem(Base):
    """Unified problem database — CSES, NeetCode, Striver, Blind 75, etc."""
    __tablename__ = "external_problems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(Text, nullable=False)
    external_id = Column(Text, nullable=True)
    title = Column(Text, nullable=False)
    slug = Column(Text, nullable=True)
    difficulty = Column(Text, nullable=True)
    tags = Column(ARRAY(Text), nullable=True)
    description = Column(Text, nullable=True)
    url = Column(Text, nullable=True)
    category = Column(Text, nullable=True)
    study_plans = Column(ARRAY(Text), nullable=True)
    company_tags = Column(ARRAY(Text), nullable=True)
    hints = Column(ARRAY(Text), nullable=True)
    solution_approach = Column(Text, nullable=True)
    solution_code = Column(JSONB, nullable=True)
    complexity_analysis = Column(Text, nullable=True)
    pattern = Column(Text, nullable=True)
    lc_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    progress = relationship("UserProblemProgress", back_populates="problem", cascade="all, delete-orphan")


class UserProblemProgress(Base):
    """Tracks which problems a user has solved/attempted."""
    __tablename__ = "user_problem_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("external_problems.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Text, default="unsolved")
    solved_at = Column(DateTime, nullable=True)
    time_spent_sec = Column(Integer, nullable=True)
    attempts_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="problem_progress")
    problem = relationship("ExternalProblem", back_populates="progress")


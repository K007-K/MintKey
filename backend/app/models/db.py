# SQLAlchemy ORM models for MintKey database
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text,
    ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, relationship
import enum


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class CompanyTier(str, enum.Enum):
    """Company tier classification."""
    FAANG = "faang"
    PRODUCT = "product"
    FINTECH = "fintech"
    STARTUP = "startup"
    IT_SERVICES = "it_services"


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

    # Academic background
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
    """Company hiring blueprint and requirements."""
    __tablename__ = "company_blueprints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    logo_url = Column(Text, nullable=True)
    tier = Column(SAEnum(CompanyTier), nullable=False)
    package_range = Column(String(50), nullable=True)

    # Requirements
    dsa_intensity = Column(String(20), nullable=True)  # extreme, high, medium, low
    min_cgpa = Column(Float, nullable=True)
    required_skills = Column(JSONB, nullable=True)
    dsa_thresholds = Column(JSONB, nullable=True)
    interview_format = Column(JSONB, nullable=True)
    system_design_required = Column(Boolean, default=False)

    # Scoring weights
    scoring_weights = Column(JSONB, nullable=True)

    # Description
    hiring_description = Column(Text, nullable=True)

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


class UserSkillGap(Base):
    """Identified skill gaps for a user."""
    __tablename__ = "user_skill_gaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_slug = Column(String(100), nullable=True)

    skill_name = Column(String(100), nullable=False)
    priority = Column(SAEnum(GapPriority), nullable=False)
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

    generated_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="roadmaps")


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

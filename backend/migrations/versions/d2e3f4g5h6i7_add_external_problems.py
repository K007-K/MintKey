"""add external_problems and user_problem_progress tables

Revision ID: d2e3f4g5h6i7
Revises: c1d2e3f4g5h6
Create Date: 2026-03-20

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d2e3f4g5h6i7"
down_revision = "c1d2e3f4g5h6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # External problems — unified problem database from CSES, NeetCode, Striver, etc.
    op.create_table(
        "external_problems",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source", sa.Text, nullable=False),
        sa.Column("external_id", sa.Text, nullable=True),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("slug", sa.Text, nullable=True),
        sa.Column("difficulty", sa.Text, nullable=True),
        sa.Column("tags", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("url", sa.Text, nullable=True),
        sa.Column("category", sa.Text, nullable=True),
        sa.Column("study_plans", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("company_tags", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("hints", postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column("solution_approach", sa.Text, nullable=True),
        sa.Column("solution_code", postgresql.JSONB, nullable=True),
        sa.Column("complexity_analysis", sa.Text, nullable=True),
        sa.Column("pattern", sa.Text, nullable=True),
        sa.Column("lc_number", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("idx_problems_source", "external_problems", ["source"])
    op.create_index("idx_problems_difficulty", "external_problems", ["difficulty"])
    op.create_index("idx_problems_pattern", "external_problems", ["pattern"])
    op.create_index("idx_problems_lc_number", "external_problems", ["lc_number"])

    # User problem progress — tracks solved/attempted status
    op.create_table(
        "user_problem_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("problem_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("external_problems.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.Text, server_default="unsolved"),
        sa.Column("solved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("time_spent_sec", sa.Integer, nullable=True),
        sa.Column("attempts_count", sa.Integer, server_default="0"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.UniqueConstraint("user_id", "problem_id", name="uq_user_problem"),
    )
    op.create_index("idx_progress_user", "user_problem_progress", ["user_id"])
    op.create_index("idx_progress_problem", "user_problem_progress", ["problem_id"])


def downgrade() -> None:
    op.drop_index("idx_progress_problem")
    op.drop_index("idx_progress_user")
    op.drop_table("user_problem_progress")
    op.drop_index("idx_problems_lc_number")
    op.drop_index("idx_problems_pattern")
    op.drop_index("idx_problems_difficulty")
    op.drop_index("idx_problems_source")
    op.drop_table("external_problems")

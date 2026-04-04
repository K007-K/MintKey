"""add roadmap_problem_map table for slug-level progress tracking

Revision ID: e3f4g5h6i7j8
Revises: d2e3f4g5h6i7
Create Date: 2026-04-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "e3f4g5h6i7j8"
down_revision = "d2e3f4g5h6i7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Roadmap problem map — maps specific problem slugs to roadmap weeks
    # Source of truth for progress tracking (not weeks_data JSONB)
    op.create_table(
        "roadmap_problem_map",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("roadmap_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_roadmaps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("week_number", sa.Integer, nullable=False),
        sa.Column("problem_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("problem_slug", sa.Text, nullable=False),
        sa.Column("topic", sa.Text, nullable=False),
        sa.Column("difficulty", sa.Text, nullable=True),
        sa.Column("status", sa.Text, server_default="pending"),           # pending | solved
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),  # anti-cheat timestamp
        sa.Column("solved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("submission_url", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("roadmap_id", "week_number", "problem_slug", name="uq_roadmap_week_slug"),
    )
    op.create_index("idx_rpm_roadmap", "roadmap_problem_map", ["roadmap_id"])
    op.create_index("idx_rpm_slug", "roadmap_problem_map", ["problem_slug"])
    op.create_index("idx_rpm_roadmap_week", "roadmap_problem_map", ["roadmap_id", "week_number"])


def downgrade() -> None:
    op.drop_index("idx_rpm_roadmap_week")
    op.drop_index("idx_rpm_slug")
    op.drop_index("idx_rpm_roadmap")
    op.drop_table("roadmap_problem_map")

"""add user_dsa_progress table

Revision ID: c1d2e3f4g5h6
Revises: b9c3d5e7f1a2
Create Date: 2026-03-20

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c1d2e3f4g5h6"
down_revision = "b9c3d5e7f1a2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_dsa_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("lc_number", sa.Integer, nullable=True),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("difficulty", sa.String(10), nullable=False),
        sa.Column("topic", sa.String(100), nullable=False),
        sa.Column("sheet", sa.String(50), nullable=False),
        sa.Column("solved", sa.Boolean, default=True),
        sa.Column("solved_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "title", "sheet", name="uq_user_problem_sheet"),
    )
    op.create_index("idx_dsa_user_topic", "user_dsa_progress", ["user_id", "topic"])
    op.create_index("idx_dsa_user_sheet", "user_dsa_progress", ["user_id", "sheet"])


def downgrade() -> None:
    op.drop_index("idx_dsa_user_sheet")
    op.drop_index("idx_dsa_user_topic")
    op.drop_table("user_dsa_progress")

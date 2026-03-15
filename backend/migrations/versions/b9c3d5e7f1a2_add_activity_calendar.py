# Add activity_calendar JSONB column to users table
"""add activity_calendar column to users

Revision ID: b9c3d5e7f1a2
Revises: a8f2c3d4e5f6
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers
revision = "b9c3d5e7f1a2"
down_revision = "a8f2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("activity_calendar", JSONB, nullable=True, server_default="{}"))


def downgrade() -> None:
    op.drop_column("users", "activity_calendar")

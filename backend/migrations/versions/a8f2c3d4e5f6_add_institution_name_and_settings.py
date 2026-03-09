# Add institution_name and settings columns to users table
"""add institution_name and settings to users

Revision ID: a8f2c3d4e5f6
Revises: 53106128a969
Create Date: 2026-03-09 23:45:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers
revision = 'a8f2c3d4e5f6'
down_revision = '53106128a969'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('institution_name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('settings', JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'settings')
    op.drop_column('users', 'institution_name')

"""Add password_change_required column to users table

Revision ID: 002
Revises: 001
Create Date: 2025-11-12 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    """Add password_change_required column to users table"""
    
    # SAFETY: Check and add column only if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'users' AND column_name = 'password_change_required') THEN
                ALTER TABLE users ADD COLUMN password_change_required BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;
    """)


def downgrade():
    """Remove password_change_required column from users table"""
    
    # SAFETY: Check if column exists before dropping
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'password_change_required') THEN
                ALTER TABLE users DROP COLUMN password_change_required;
            END IF;
        END $$;
    """)


"""Create OTP table for email verification

Revision ID: 003
Revises: 002
Create Date: 2025-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    """Create OTP table for email verification"""
    
    # Check if table already exists
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                          WHERE table_name = 'otps') THEN
                CREATE TABLE otps (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    code VARCHAR(6) NOT NULL,
                    purpose VARCHAR(50) NOT NULL DEFAULT 'registration',
                    is_verified BOOLEAN DEFAULT FALSE,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    verified_at TIMESTAMP WITH TIME ZONE,
                    user_id INTEGER REFERENCES users(id)
                );
                
                CREATE INDEX idx_otps_email ON otps(email);
                CREATE INDEX idx_otps_code ON otps(code);
                CREATE INDEX idx_otps_purpose ON otps(purpose);
            END IF;
        END $$;
    """)


def downgrade():
    """Drop OTP table"""
    
    # Check if table exists before dropping
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables 
                      WHERE table_name = 'otps') THEN
                DROP TABLE otps;
            END IF;
        END $$;
    """)


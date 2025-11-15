"""add_missing_lesson_progress_columns

Revision ID: b5fb0e8fa8b1
Revises: 001
Create Date: 2025-10-26 18:23:47.222363

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5fb0e8fa8b1'
down_revision: Union[str, Sequence[str], None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing columns to lesson_progress table (only columns that don't exist)"""
    
    # Check and add status column only if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'lesson_progress' AND column_name = 'status') THEN
                ALTER TABLE lesson_progress ADD COLUMN status VARCHAR(50) DEFAULT 'not_started';
            END IF;
        END $$;
    """)
    
    # Check and add completion_percentage column only if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'lesson_progress' AND column_name = 'completion_percentage') THEN
                ALTER TABLE lesson_progress ADD COLUMN completion_percentage DOUBLE PRECISION DEFAULT 0.0;
            END IF;
        END $$;
    """)
    
    # Check and add video_watched_duration column only if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'lesson_progress' AND column_name = 'video_watched_duration') THEN
                ALTER TABLE lesson_progress ADD COLUMN video_watched_duration INTEGER DEFAULT 0;
            END IF;
        END $$;
    """)
    
    # Check and add completion criteria columns only if they don't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'lesson_progress' AND column_name = 'video_completed') THEN
                ALTER TABLE lesson_progress ADD COLUMN video_completed BOOLEAN DEFAULT false; u
            END IF;
        END $$;
    """)
    
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'lesson_progress' AND column_name = 'quiz_completed') THEN
                ALTER TABLE lesson_progress ADD COLUMN quiz_completed BOOLEAN DEFAULT false;
            END IF;
        END $$;
    """)
    
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'lesson_progress' AND column_name = 'assignment_completed') THEN
                ALTER TABLE lesson_progress ADD COLUMN assignment_completed BOOLEAN DEFAULT false;
            END IF;
        END $$;
    """)
    
    # Check and add started_at column only if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'lesson_progress' AND column_name = 'started_at') THEN
                ALTER TABLE lesson_progress ADD COLUMN started_at TIMESTAMPTZ;
            END IF;
        END $$;
    """)
    
    # Check and add last_accessed_at column only if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'lesson_progress' AND column_name = 'last_accessed_at') THEN
                ALTER TABLE lesson_progress ADD COLUMN last_accessed_at TIMESTAMPTZ DEFAULT NOW();
            END IF;
        END $$;
    """)
    
    # Update existing records with default values for newly added columns
    op.execute("UPDATE lesson_progress SET status = 'not_started' WHERE status IS NULL")
    op.execute("UPDATE lesson_progress SET completion_percentage = 0.0 WHERE completion_percentage IS NULL")
    op.execute("UPDATE lesson_progress SET video_watched_duration = 0 WHERE video_watched_duration IS NULL")
    op.execute("UPDATE lesson_progress SET video_completed = false WHERE video_completed IS NULL")
    op.execute("UPDATE lesson_progress SET quiz_completed = false WHERE quiz_completed IS NULL")
    op.execute("UPDATE lesson_progress SET assignment_completed = false WHERE assignment_completed IS NULL")
    op.execute("UPDATE lesson_progress SET last_accessed_at = NOW() WHERE last_accessed_at IS NULL")


def downgrade() -> None:
    """Remove added columns from lesson_progress table (only if they exist)"""
    
    # Drop columns only if they exist
    op.execute("ALTER TABLE lesson_progress DROP COLUMN IF EXISTS last_accessed_at")
    op.execute("ALTER TABLE lesson_progress DROP COLUMN IF EXISTS started_at")
    op.execute("ALTER TABLE lesson_progress DROP COLUMN IF EXISTS assignment_completed")
    op.execute("ALTER TABLE lesson_progress DROP COLUMN IF EXISTS quiz_completed")
    op.execute("ALTER TABLE lesson_progress DROP COLUMN IF EXISTS video_completed")
    op.execute("ALTER TABLE lesson_progress DROP COLUMN IF EXISTS video_watched_duration")
    op.execute("ALTER TABLE lesson_progress DROP COLUMN IF EXISTS completion_percentage")
    op.execute("ALTER TABLE lesson_progress DROP COLUMN IF EXISTS status")
    
    # Note: We don't drop completed_at or time_spent_seconds as they already existed

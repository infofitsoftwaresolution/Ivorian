"""Add missing columns to quizzes table

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Add missing columns to quizzes table (SAFE: Only adds columns, never deletes data)"""
    
    # SAFETY: Check and add columns only if they don't exist to prevent errors
    # Add instructions column
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'instructions') THEN
                ALTER TABLE quizzes ADD COLUMN instructions TEXT;
            END IF;
        END $$;
    """)
    
    # Create enum type first (if it doesn't exist)
    quizstatus_enum = sa.Enum('DRAFT', 'PUBLISHED', 'ARCHIVED', name='quizstatus')
    quizstatus_enum.create(op.get_bind(), checkfirst=True)
    
    # Add status column (enum) - only if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'status') THEN
                ALTER TABLE quizzes ADD COLUMN status quizstatus;
            END IF;
        END $$;
    """)
    
    # Add shuffle_questions column
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'shuffle_questions') THEN
                ALTER TABLE quizzes ADD COLUMN shuffle_questions BOOLEAN;
            END IF;
        END $$;
    """)
    
    # Add show_correct_answers column
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'show_correct_answers') THEN
                ALTER TABLE quizzes ADD COLUMN show_correct_answers BOOLEAN;
            END IF;
        END $$;
    """)
    
    # Add show_results_immediately column
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'show_results_immediately') THEN
                ALTER TABLE quizzes ADD COLUMN show_results_immediately BOOLEAN;
            END IF;
        END $$;
    """)
    
    # Add scoring columns
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'total_points') THEN
                ALTER TABLE quizzes ADD COLUMN total_points DOUBLE PRECISION;
            END IF;
        END $$;
    """)
    
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'points_per_question') THEN
                ALTER TABLE quizzes ADD COLUMN points_per_question DOUBLE PRECISION;
            END IF;
        END $$;
    """)
    
    # Add statistics columns
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'total_questions') THEN
                ALTER TABLE quizzes ADD COLUMN total_questions INTEGER;
            END IF;
        END $$;
    """)
    
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'total_submissions') THEN
                ALTER TABLE quizzes ADD COLUMN total_submissions INTEGER;
            END IF;
        END $$;
    """)
    
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'average_score') THEN
                ALTER TABLE quizzes ADD COLUMN average_score DOUBLE PRECISION;
            END IF;
        END $$;
    """)
    
    # Add published_at column
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'quizzes' AND column_name = 'published_at') THEN
                ALTER TABLE quizzes ADD COLUMN published_at TIMESTAMPTZ;
            END IF;
        END $$;
    """)
    
    # SAFETY: Set default values ONLY for NULL values (never overwrite existing data)
    op.execute("UPDATE quizzes SET status = 'DRAFT' WHERE status IS NULL")
    op.execute("UPDATE quizzes SET shuffle_questions = false WHERE shuffle_questions IS NULL")
    op.execute("UPDATE quizzes SET show_correct_answers = true WHERE show_correct_answers IS NULL")
    op.execute("UPDATE quizzes SET show_results_immediately = true WHERE show_results_immediately IS NULL")
    op.execute("UPDATE quizzes SET total_points = 100.0 WHERE total_points IS NULL")
    op.execute("UPDATE quizzes SET points_per_question = 1.0 WHERE points_per_question IS NULL")
    op.execute("UPDATE quizzes SET total_questions = 0 WHERE total_questions IS NULL")
    op.execute("UPDATE quizzes SET total_submissions = 0 WHERE total_submissions IS NULL")
    op.execute("UPDATE quizzes SET average_score = 0.0 WHERE average_score IS NULL")


def downgrade():
    """Remove added columns from quizzes table"""
    
    # Remove added columns
    op.drop_column('quizzes', 'published_at')
    op.drop_column('quizzes', 'average_score')
    op.drop_column('quizzes', 'total_submissions')
    op.drop_column('quizzes', 'total_questions')
    op.drop_column('quizzes', 'points_per_question')
    op.drop_column('quizzes', 'total_points')
    op.drop_column('quizzes', 'show_results_immediately')
    op.drop_column('quizzes', 'show_correct_answers')
    op.drop_column('quizzes', 'shuffle_questions')
    op.drop_column('quizzes', 'status')
    op.drop_column('quizzes', 'instructions')
    
    # Drop the enum type
    quizstatus_enum = sa.Enum('DRAFT', 'PUBLISHED', 'ARCHIVED', name='quizstatus')
    quizstatus_enum.drop(op.get_bind())

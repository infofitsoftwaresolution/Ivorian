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
    """Add missing columns to quizzes table"""
    
    # Add instructions column
    op.add_column('quizzes', sa.Column('instructions', sa.Text(), nullable=True))
    
    # Create enum type first (if it doesn't exist)
    quizstatus_enum = sa.Enum('DRAFT', 'PUBLISHED', 'ARCHIVED', name='quizstatus')
    quizstatus_enum.create(op.get_bind(), checkfirst=True)
    
    # Add status column (enum)
    op.add_column('quizzes', sa.Column('status', quizstatus_enum, nullable=True))
    
    # Add shuffle_questions column
    op.add_column('quizzes', sa.Column('shuffle_questions', sa.Boolean(), nullable=True))
    
    # Add show_correct_answers column
    op.add_column('quizzes', sa.Column('show_correct_answers', sa.Boolean(), nullable=True))
    
    # Add show_results_immediately column
    op.add_column('quizzes', sa.Column('show_results_immediately', sa.Boolean(), nullable=True))
    
    # Add scoring columns
    op.add_column('quizzes', sa.Column('total_points', sa.Float(), nullable=True))
    op.add_column('quizzes', sa.Column('points_per_question', sa.Float(), nullable=True))
    
    # Add statistics columns
    op.add_column('quizzes', sa.Column('total_questions', sa.Integer(), nullable=True))
    op.add_column('quizzes', sa.Column('total_submissions', sa.Integer(), nullable=True))
    op.add_column('quizzes', sa.Column('average_score', sa.Float(), nullable=True))
    
    # Add published_at column
    op.add_column('quizzes', sa.Column('published_at', sa.DateTime(timezone=True), nullable=True))
    
    # Set default values for existing records
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

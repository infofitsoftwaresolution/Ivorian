"""
Analytics model for the LMS application
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func

from app.core.database import Base


class LearningAnalytics(Base):
    """
    Learning analytics model
    """
    __tablename__ = "learning_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    metric_name = Column(String(100))
    metric_value = Column(Float)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())


class AIInteraction(Base):
    """
    AI interaction model
    """
    __tablename__ = "ai_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    interaction_type = Column(String(50))  # question_generation, content_summary, recommendation
    input_data = Column(JSON)
    output_data = Column(JSON)
    model_used = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 
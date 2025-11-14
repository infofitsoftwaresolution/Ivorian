"""
Configuration settings for the LMS application
"""
from typing import List, Optional, Any
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Modern LMS API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Modern AI-Integrated LMS"
    
    # CORS - Use Any to prevent automatic JSON parsing, then convert in validator
    BACKEND_CORS_ORIGINS: Any = Field(
        default=[
            "http://localhost:3000", 
            "http://localhost:8080", 
            "http://127.0.0.1:3000",
            "http://15.206.84.110:3000",
            "https://15.206.84.110:3000",
            "https://edumentry.com",
            "http://edumentry.com",
            "https://www.edumentry.com",
            "http://www.edumentry.com"
        ],
        env="BACKEND_CORS_ORIGINS"
    )
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        """Parse CORS origins from various formats"""
        default_origins = [
            "http://localhost:3000", 
            "http://localhost:8080", 
            "http://127.0.0.1:3000",
            "http://15.206.84.110:3000",
            "https://15.206.84.110:3000",
            "https://edumentry.com",
            "http://edumentry.com",
            "https://www.edumentry.com",
            "http://www.edumentry.com"
        ]
        
        if v is None:
            return default_origins
        
        if isinstance(v, list):
            return v
        
        if isinstance(v, str):
            # Remove surrounding quotes if present
            v = v.strip().strip('"').strip("'")
            # Handle JSON array string
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return parsed
                except:
                    # If JSON parsing fails, try comma-separated
                    v = v.strip("[]")
            # Handle comma-separated string
            origins = [i.strip().strip('"').strip("'") for i in v.split(",") if i.strip()]
            return origins if origins else default_origins
        
        return default_origins
    
    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    DATABASE_ECHO: bool = Field(default=False, env="DATABASE_ECHO")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # AWS
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = Field(default="us-east-1", env="AWS_REGION")
    AWS_S3_BUCKET: Optional[str] = Field(default=None, env="AWS_S3_BUCKET")
    
    # AI Services
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    
    # Email
    SMTP_TLS: bool = Field(default=True, env="SMTP_TLS")
    SMTP_PORT: Optional[int] = Field(default=None, env="SMTP_PORT")
    SMTP_HOST: Optional[str] = Field(default=None, env="SMTP_HOST")
    SMTP_USER: Optional[str] = Field(default=None, env="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: Optional[str] = Field(default=None, env="EMAILS_FROM_EMAIL")
    EMAILS_FROM_NAME: Optional[str] = Field(default=None, env="EMAILS_FROM_NAME")
    
    # Payment
    STRIPE_SECRET_KEY: Optional[str] = Field(default=None, env="STRIPE_SECRET_KEY")
    STRIPE_PUBLISHABLE_KEY: Optional[str] = Field(default=None, env="STRIPE_PUBLISHABLE_KEY")
    
    # Monitoring
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings() 
@echo off
REM Activate virtual environment
call venv\Scripts\activate.bat

REM Set PYTHONPATH to current directory to fix ModuleNotFoundError with uvicorn --reload
set PYTHONPATH=%CD%

REM Set environment variables if .env doesn't exist
if not exist .env (
    set SECRET_KEY=dev-secret-key-change-in-production
    set DATABASE_URL=postgresql+asyncpg://lms_user:lms_password@localhost:5432/lms_db
    set REDIS_URL=redis://localhost:6379
)

REM Run the application
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


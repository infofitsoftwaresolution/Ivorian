#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Set PYTHONPATH to current directory to fix ModuleNotFoundError with uvicorn --reload
export PYTHONPATH=$(pwd)

# Set environment variables if .env doesn't exist
if [ ! -f .env ]; then
    export SECRET_KEY=dev-secret-key-change-in-production
    export DATABASE_URL=postgresql+asyncpg://lms_user:lms_password@localhost:5432/lms_db
    export REDIS_URL=redis://localhost:6379
fi

# Run the application
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


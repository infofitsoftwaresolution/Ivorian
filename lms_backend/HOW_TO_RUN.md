# How to Run the Backend Manually

## The Problem

When you run `python -m uvicorn app.main:app --reload`, you might get this error:
```
ModuleNotFoundError: No module named 'app'
```

This happens because uvicorn's `--reload` feature spawns a subprocess that doesn't preserve the working directory context, so it can't find the `app` module.

## The Solution

You need to set `PYTHONPATH` to the current directory before running uvicorn.

## Method 1: Use the Batch Script (Easiest)

Simply double-click or run:
```bash
start_backend.bat
```

Or from command prompt:
```bash
cd lms_backend
start_backend.bat
```

## Method 2: Manual Steps (Windows)

1. **Open Command Prompt or PowerShell**

2. **Navigate to the backend directory:**
   ```bash
   cd D:\19.infofit_Soft\infofitlabs-main\lms_backend
   ```

3. **Activate the virtual environment:**
   ```bash
   venv\Scripts\activate
   ```

4. **Set PYTHONPATH (THIS IS THE KEY FIX):**
   ```bash
   set PYTHONPATH=%CD%
   ```

5. **Set environment variables (if you don't have a .env file):**
   ```bash
   set SECRET_KEY=dev-secret-key-change-in-production
   set DATABASE_URL=postgresql+asyncpg://lms_user:lms_password@localhost:5432/lms_db
   set REDIS_URL=redis://localhost:6379
   ```

6. **Run the application:**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Method 3: Manual Steps (macOS/Linux)

1. **Open Terminal**

2. **Navigate to the backend directory:**
   ```bash
   cd lms_backend
   ```

3. **Activate the virtual environment:**
   ```bash
   source venv/bin/activate
   ```

4. **Set PYTHONPATH (THIS IS THE KEY FIX):**
   ```bash
   export PYTHONPATH=$(pwd)
   ```

5. **Set environment variables (if you don't have a .env file):**
   ```bash
   export SECRET_KEY=dev-secret-key-change-in-production
   export DATABASE_URL=postgresql+asyncpg://lms_user:lms_password@localhost:5432/lms_db
   export REDIS_URL=redis://localhost:6379
   ```

6. **Run the application:**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Method 4: Create a .env File (Recommended)

Instead of setting environment variables manually each time:

1. **Copy the example file:**
   ```bash
   copy env.example .env
   ```
   (On macOS/Linux: `cp env.example .env`)

2. **Edit `.env` file** and set your values:
   ```env
   SECRET_KEY=dev-secret-key-change-in-production
   DATABASE_URL=postgresql+asyncpg://lms_user:lms_password@localhost:5432/lms_db
   REDIS_URL=redis://localhost:6379
   ```

3. **Then run with PYTHONPATH set:**
   ```bash
   # Windows
   set PYTHONPATH=%CD%
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   
   # macOS/Linux
   export PYTHONPATH=$(pwd)
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Why PYTHONPATH is Needed

- When uvicorn runs with `--reload`, it spawns a subprocess to monitor file changes
- This subprocess doesn't automatically inherit the current working directory in Python's module search path
- Setting `PYTHONPATH` to the current directory (`%CD%` on Windows, `$(pwd)` on Linux/Mac) tells Python where to find the `app` module

## Quick Reference

**The essential command you need:**
```bash
# Windows
set PYTHONPATH=%CD% && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# macOS/Linux
export PYTHONPATH=$(pwd) && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Verify It's Working

After starting, check:
- Backend is running: http://localhost:8000/health
- API docs: http://localhost:8000/docs


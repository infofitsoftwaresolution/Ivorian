#!/usr/bin/env python3
"""
Script to verify the FastAPI project structure
"""
import os
import sys
from pathlib import Path

def check_directory_structure():
    """Check if all required directories exist"""
    required_dirs = [
        "app",
        "app/core",
        "app/api",
        "app/api/v1",
        "app/models",
        "app/schemas",
        "app/services",
        "app/utils",
        "app/websockets",
        "alembic",
        "tests"
    ]
    
    missing_dirs = []
    for dir_path in required_dirs:
        if not os.path.exists(dir_path):
            missing_dirs.append(dir_path)
    
    if missing_dirs:
        print(f"❌ Missing directories: {missing_dirs}")
        return False
    else:
        print("✅ All required directories exist")
        return True

def check_required_files():
    """Check if all required files exist"""
    required_files = [
        "app/__init__.py",
        "app/main.py",
        "app/core/__init__.py",
        "app/core/config.py",
        "app/core/database.py",
        "app/core/security.py",
        "app/core/dependencies.py",
        "app/api/__init__.py",
        "app/api/v1/__init__.py",
        "app/api/v1/auth.py",
        "app/api/v1/users.py",
        "app/api/v1/courses.py",
        "app/api/v1/assessments.py",
        "app/api/v1/ai.py",
        "app/api/v1/analytics.py",
        "app/api/deps.py",
        "app/models/__init__.py",
        "app/models/user.py",
        "app/models/course.py",
        "app/models/assessment.py",
        "app/models/analytics.py",
        "app/schemas/__init__.py",
        "app/services/__init__.py",
        "app/utils/__init__.py",
        "app/websockets/__init__.py",
        "tests/__init__.py",
        "tests/test_main.py",
        "requirements.txt",
        "Dockerfile",
        "docker-compose.yml",
        "env.example",
        "README.md"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print(f"❌ Missing files: {missing_files}")
        return False
    else:
        print("✅ All required files exist")
        return True

def main():
    """Main verification function"""
    print("🔍 Verifying FastAPI LMS Backend Project Structure...")
    print("=" * 50)
    
    dirs_ok = check_directory_structure()
    files_ok = check_required_files()
    
    print("=" * 50)
    if dirs_ok and files_ok:
        print("🎉 Project structure verification completed successfully!")
        print("✅ Ready to proceed with development")
        return True
    else:
        print("❌ Project structure verification failed!")
        print("Please fix the missing directories and files before proceeding.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 
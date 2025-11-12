# InfoFit Labs - Modern AI-Integrated LMS

A comprehensive Learning Management System built with Python FastAPI and Next.js, featuring AI-powered content generation, gamification, and advanced analytics.

> **CI/CD Test**: Automated deployment is now active! 🚀  
> **Latest**: AWS SES email service integrated with retry logic for reliable deployments

## 🚀 Project Overview

InfoFit Labs is a modern, AI-integrated Learning Management System designed to cater to organizations, individual tutors, and students. The platform combines cutting-edge AI technology with gamification elements to create an engaging learning experience.

## 🏗️ Architecture

This project follows a **monorepo** structure with separate frontend and backend applications:

```
infofitlabs/
├── lms_backend/          # Python FastAPI backend
├── lms_frontend/         # Next.js frontend
├── docs/                 # Documentation
├── .github/             # GitHub Actions workflows
└── README.md            # This file
```

## 🛠️ Technology Stack

### Backend (lms_backend/)

- **Framework**: Python FastAPI
- **Database**: PostgreSQL with SQLAlchemy
- **Cache**: Redis
- **AI/ML**: OpenAI, Anthropic Claude, TensorFlow/PyTorch
- **Authentication**: JWT with Python-Jose
- **Testing**: pytest, pytest-asyncio

### Frontend (lms_frontend/)

- **Framework**: Next.js 14 with React 19
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: React Query
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Headless UI

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Backend Setup

```bash
cd lms_backend

# Create virtual environment for python
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the application
# Windows: Set PYTHONPATH to fix ModuleNotFoundError with uvicorn --reload
set PYTHONPATH=%CD%
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# macOS/Linux: Set PYTHONPATH to fix ModuleNotFoundError with uvicorn --reload
export PYTHONPATH=$(pwd)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# OR use the provided startup script:
# Windows: start_backend.bat
# macOS/Linux: ./start_backend.sh (if created)
```

### Frontend Setup

```bash
cd lms_frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run the development server
npm run dev
```

## 📚 Documentation

- [Software Requirements Specification](SRS_Modern_LMS_Solution.md)
- [Technical Architecture Plan](Technical_Architecture_Plan.md)
- [Business Model & Market Analysis](Business_Model_Market_Analysis.md)
- [Project Roadmap](Project_Roadmap.md)
- [Detailed Task List](Detailed_Task_List.md)
- [CI/CD Setup Guide](CI_CD_SETUP_GUIDE.md)

## 🎯 Features

### Core Features

- **User Management**: Multi-role system (Super Admin, Org Admin, Instructor, Student, TA)
- **Course Management**: Create, manage, and enroll in courses
- **Content Management**: Rich text editor, file uploads, video lessons
- **Assessment System**: Quizzes, assignments, AI-powered grading
- **Progress Tracking**: Real-time analytics and reporting

### AI Features

- **Content Generation**: AI-powered question generation and content summarization
- **Personalization**: Adaptive learning paths and content recommendations
- **Analytics**: Predictive analytics and performance insights
- **Tutor Matching**: AI-driven instructor-student matching

### Gamification

- **Achievement System**: Badges, certificates, and milestones
- **Points & Rewards**: Gamified learning experience
- **Leaderboards**: Competitive learning environment
- **Progress Visualization**: Engaging progress tracking

## 🔧 Development

### Project Structure

```
lms_backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── core/                # Configuration and utilities
│   ├── api/v1/              # API endpoints
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
├── tests/                   # Test suite
├── requirements.txt         # Python dependencies
└── Dockerfile              # Docker configuration

lms_frontend/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── lib/                 # Utilities and configurations
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── package.json             # Node.js dependencies
└── Dockerfile              # Docker configuration
```

### Development Workflow

1. Create feature branch from `develop`
2. Make changes in both frontend and backend
3. Write tests for new features
4. Run linting and tests locally
5. Create pull request to `develop`
6. After review, merge to `develop`
7. Deploy to staging for testing
8. Merge `develop` to `main` for production

## 🚀 Deployment

### Staging Environment

- Automatically deployed from `main` branch
- URL: `https://staging.infofitlabs.com`

### Production Environment

- Manually deployed from `main` branch
- URL: `https://app.infofitlabs.com`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the docs folder
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🏆 Acknowledgments

- Built with modern web technologies
- Inspired by leading LMS platforms
- Designed for scalability and performance

---

**InfoFit Labs** - Transforming Education with AI

demo organization profile
admin@infofitlabs.com
Admin@123!

demo organization profile
abcd@gmail.com
admin@123

demo tutor organization profile
anish@gmail.com
admin@1234

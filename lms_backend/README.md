# Modern AI-Integrated LMS Backend

A modern, AI-integrated Learning Management System (LMS) backend built with FastAPI, Python, and PostgreSQL.

## 🚀 Features

- **FastAPI Framework**: High-performance, modern Python web framework
- **AI Integration**: OpenAI, Anthropic Claude, and local ML models
- **Authentication**: JWT-based authentication with role-based access control
- **Database**: PostgreSQL with SQLAlchemy ORM and async support
- **Caching**: Redis for session management and caching
- **Background Tasks**: Celery for async task processing
- **Real-time**: WebSocket support for live features
- **File Storage**: AWS S3 integration
- **Analytics**: Learning analytics and progress tracking
- **Gamification**: Points, badges, and leaderboards
- **Assessment System**: Quizzes, assignments, and AI-powered grading

## 🛠️ Technology Stack

- **Backend**: Python 3.11+ with FastAPI
- **Database**: PostgreSQL 15+ with SQLAlchemy
- **Cache**: Redis 7+
- **AI/ML**: OpenAI GPT-4, Anthropic Claude, TensorFlow, scikit-learn
- **Background Tasks**: Celery with Redis broker
- **File Storage**: AWS S3
- **Containerization**: Docker & Docker Compose
- **Testing**: pytest with async support

## 📁 Project Structure

```
lms_backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Configuration settings
│   │   ├── security.py         # JWT and password utilities
│   │   ├── database.py         # Database connection
│   │   └── dependencies.py     # Dependency injection
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── users.py        # User management
│   │   │   ├── courses.py      # Course management
│   │   │   ├── assessments.py  # Assessment system
│   │   │   ├── ai.py           # AI integration endpoints
│   │   │   └── analytics.py    # Analytics endpoints
│   │   └── deps.py             # Shared dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # User SQLAlchemy models
│   │   ├── course.py           # Course models
│   │   ├── assessment.py       # Assessment models
│   │   └── analytics.py        # Analytics models
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # Pydantic schemas
│   │   ├── course.py           # Course schemas
│   │   ├── assessment.py       # Assessment schemas
│   │   └── ai.py               # AI request/response schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_service.py       # AI integration service
│   │   ├── analytics_service.py # Analytics processing
│   │   ├── email_service.py    # Email notifications
│   │   └── payment_service.py  # Payment processing
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── ai_utils.py         # AI helper functions
│   │   ├── analytics_utils.py  # Analytics utilities
│   │   └── file_utils.py       # File handling utilities
│   └── websockets/
│       ├── __init__.py
│       └── chat.py             # WebSocket handlers
├── alembic/                    # Database migrations
├── tests/                      # Test suite
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Container configuration
├── docker-compose.yml          # Development environment
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lms_backend
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Install dependencies (if running locally)**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the application**
   ```bash
   # With Docker Compose (recommended)
   docker-compose up api
   
   # Or locally
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Access the API**
   - API Documentation: http://localhost:8000/docs
   - ReDoc Documentation: http://localhost:8000/redoc
   - Health Check: http://localhost:8000/health

### Database Setup

1. **Run migrations**
   ```bash
   alembic upgrade head
   ```

2. **Seed initial data**
   ```bash
   python -m app.utils.seed_data
   ```

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

- `SECRET_KEY`: JWT secret key
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

### Development vs Production

- **Development**: Uses Docker Compose with local services
- **Production**: Uses managed services (RDS, ElastiCache, etc.)

## 📚 API Documentation

The API is automatically documented using OpenAPI/Swagger:

- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Key Endpoints

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/courses` - List courses
- `POST /api/v1/courses` - Create course
- `POST /api/v1/ai/generate-questions` - AI question generation
- `GET /api/v1/analytics/user/{user_id}/progress` - User progress

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py

# Run async tests
pytest tests/ -v
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build production image
docker build -t lms-backend .

# Run with production settings
docker run -p 8000:8000 --env-file .env lms-backend
```

### Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation at `/docs`

## 🔮 Roadmap

- [ ] Complete authentication system
- [ ] Course management features
- [ ] AI integration
- [ ] Assessment system
- [ ] Analytics dashboard
- [ ] Mobile app backend
- [ ] Enterprise features
- [ ] Performance optimization

---

**Built with ❤️ by InfoFit Labs** 
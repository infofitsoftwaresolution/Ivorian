"""
Basic tests for the main application
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_read_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert data["message"] == "Welcome to Modern AI-Integrated LMS API"


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data


def test_openapi_docs():
    """Test OpenAPI documentation endpoint"""
    response = client.get("/docs")
    assert response.status_code == 200


def test_redoc_docs():
    """Test ReDoc documentation endpoint"""
    response = client.get("/redoc")
    assert response.status_code == 200 
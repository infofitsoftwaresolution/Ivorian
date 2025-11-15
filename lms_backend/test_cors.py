"""
Test script to verify CORS functionality and API endpoints
"""
import requests
import json
from datetime import datetime


def test_cors_and_api():
    """Test CORS headers and API functionality"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing CORS and API Functionality...")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1. Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health Check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health Check Failed: {str(e)}")
    
    # Test 2: Root Endpoint
    print("\n2. Testing Root Endpoint...")
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root Endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root Endpoint Failed: {str(e)}")
    
    # Test 3: CORS Preflight Request
    print("\n3. Testing CORS Preflight...")
    try:
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type,Authorization"
        }
        response = requests.options(f"{base_url}/api/v1/auth/register", headers=headers)
        print(f"✅ CORS Preflight: {response.status_code}")
        print(f"   Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")
        print(f"   Access-Control-Allow-Methods: {response.headers.get('Access-Control-Allow-Methods')}")
        print(f"   Access-Control-Allow-Headers: {response.headers.get('Access-Control-Allow-Headers')}")
    except Exception as e:
        print(f"❌ CORS Preflight Failed: {str(e)}")
    
    # Test 4: API Documentation
    print("\n4. Testing API Documentation...")
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"✅ API Docs: {response.status_code}")
    except Exception as e:
        print(f"❌ API Docs Failed: {str(e)}")
    
    # Test 5: Registration Endpoint (with CORS headers)
    print("\n5. Testing Registration Endpoint...")
    try:
        headers = {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        }
        data = {
            "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User",
            "organization_id": 1
        }
        response = requests.post(f"{base_url}/api/v1/auth/register", 
                               headers=headers, 
                               data=json.dumps(data))
        print(f"✅ Registration: {response.status_code}")
        print(f"   CORS Headers: {dict(response.headers)}")
        if response.status_code != 200:
            print(f"   Error Response: {response.text}")
    except Exception as e:
        print(f"❌ Registration Failed: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎉 CORS and API Testing Complete!")


if __name__ == "__main__":
    test_cors_and_api()

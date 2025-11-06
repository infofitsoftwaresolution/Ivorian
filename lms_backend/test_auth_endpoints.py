#!/usr/bin/env python3
"""
Test script for authentication endpoints
"""
import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def test_register_endpoint() -> Dict[str, Any]:
    """Test user registration"""
    print("🔐 Testing User Registration...")
    
    url = f"{API_BASE}/auth/register"
    data = {
        "email": "testuser2@example.com",
        "password": "testpassword123",
        "first_name": "John",
        "last_name": "Doe",
        "role": "student"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Registration successful!")
            print(f"User ID: {result['data']['user']['id']}")
            return result['data']['tokens']
        else:
            print(f"❌ Registration failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error during registration: {e}")
        return None


def test_organization_register_endpoint() -> Dict[str, Any]:
    """Test organization registration"""
    print("\n🏢 Testing Organization Registration...")
    
    url = f"{API_BASE}/auth/register/organization"
    data = {
        "name": "Test University",
        "description": "A test university for learning management",
        "website": "https://testuniversity.com",
        "contact_email": "admin@testuniversity.com",
        "contact_phone": "+1234567890",
        "address": "123 Test Street, Test City, TC 12345",
        "industry": "Education",
        "size": "51-200",
        "admin_email": "admin@testuniversity.com",
        "admin_password": "adminpassword123",
        "admin_first_name": "Admin",
        "admin_last_name": "User"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Organization registration successful!")
            print(f"Organization ID: {result['data']['organization']['id']}")
            print(f"Admin User ID: {result['data']['admin_user']['id']}")
            return result['data']['tokens']
        else:
            print(f"❌ Organization registration failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error during organization registration: {e}")
        return None

def test_login_endpoint() -> Dict[str, Any]:
    """Test user login"""
    print("\n🔑 Testing User Login...")
    
    url = f"{API_BASE}/auth/login"
    data = {
        "username": "testuser2@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Login successful!")
            return result['data']['tokens']
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None

def test_refresh_token(tokens: Dict[str, Any]) -> bool:
    """Test token refresh"""
    print("\n🔄 Testing Token Refresh...")
    
    url = f"{API_BASE}/auth/refresh"
    data = {
        "refresh_token": tokens.get('refresh_token')
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Token refresh successful!")
            return True
        else:
            print(f"❌ Token refresh failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during token refresh: {e}")
        return False

def test_get_current_user(tokens: Dict[str, Any]) -> bool:
    """Test getting current user info"""
    print("\n👤 Testing Get Current User...")
    
    url = f"{API_BASE}/auth/me"
    headers = {
        "Authorization": f"Bearer {tokens.get('access_token')}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Get current user successful!")
            print(f"User: {result['data']['first_name']} {result['data']['last_name']}")
            return True
        else:
            print(f"❌ Get current user failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error getting current user: {e}")
        return False

def test_change_password(tokens: Dict[str, Any]) -> bool:
    """Test password change"""
    print("\n🔒 Testing Change Password...")
    
    url = f"{API_BASE}/auth/change-password"
    headers = {
        "Authorization": f"Bearer {tokens.get('access_token')}"
    }
    data = {
        "current_password": "testpassword123",
        "new_password": "newpassword123"
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Password change successful!")
            return True
        else:
            print(f"❌ Password change failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error changing password: {e}")
        return False

def test_forgot_password() -> bool:
    """Test forgot password endpoint"""
    print("\n📧 Testing Forgot Password...")
    
    url = f"{API_BASE}/auth/forgot-password"
    data = {
        "email": "testuser2@example.com"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Forgot password request successful!")
            return True
        else:
            print(f"❌ Forgot password failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error in forgot password: {e}")
        return False

def test_logout() -> bool:
    """Test logout endpoint"""
    print("\n🚪 Testing Logout...")
    
    url = f"{API_BASE}/auth/logout"
    
    try:
        response = requests.post(url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Logout successful!")
            return True
        else:
            print(f"❌ Logout failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during logout: {e}")
        return False

def main():
    """Run all authentication tests"""
    print("🚀 Starting Authentication Endpoint Tests")
    print("=" * 50)
    
    # Test organization registration first
    org_tokens = test_organization_register_endpoint()
    if not org_tokens:
        print("❌ Organization registration failed, trying user registration...")
    
    # Test user registration
    tokens = test_register_endpoint()
    if not tokens:
        print("❌ User registration failed, skipping other tests")
        return
    
    # Test login
    login_tokens = test_login_endpoint()
    if not login_tokens:
        print("❌ Login failed, skipping other tests")
        return
    
    # Test token refresh
    test_refresh_token(login_tokens)
    
    # Test get current user
    test_get_current_user(login_tokens)
    
    # Test change password
    test_change_password(login_tokens)
    
    # Test forgot password
    test_forgot_password()
    
    # Test logout
    test_logout()
    
    print("\n" + "=" * 50)
    print("🎉 Authentication endpoint tests completed!")

if __name__ == "__main__":
    main()

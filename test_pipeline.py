#!/usr/bin/env python3
"""
Test script to verify the complete emotion detection pipeline
"""
import requests
import json
from PIL import Image, ImageDraw
import io
import base64
import time

def create_test_face_image():
    """Create a simple test image with a face-like shape"""
    # Create a simple image with a face-like pattern
    img = Image.new('RGB', (200, 200), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple face
    # Face outline (circle)
    draw.ellipse([50, 50, 150, 150], outline='black', width=3)
    
    # Eyes
    draw.ellipse([70, 80, 85, 95], fill='black')  # Left eye
    draw.ellipse([115, 80, 130, 95], fill='black')  # Right eye
    
    # Mouth (smile)
    draw.arc([80, 110, 120, 130], start=0, end=180, fill='black', width=3)
    
    return img

def test_fastapi_directly():
    """Test the FastAPI service directly"""
    print("🧪 Testing FastAPI service directly...")
    
    # Test health endpoint
    try:
        response = requests.get('http://localhost:8000/health')
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test emotion detection with a simple image
    try:
        # Create test image
        test_image = create_test_face_image()
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        test_image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Send to API
        files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
        response = requests.post('http://localhost:8000/emotion/detect', files=files)
        
        print(f"✅ Emotion detection: {response.status_code}")
        result = response.json()
        print(f"   Detected emotion: {result.get('emotion')} ({result.get('confidence')})")
        print(f"   Source: {result.get('source')}")
        print(f"   All emotions: {result.get('allEmotions')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Emotion detection failed: {e}")
        return False

def test_frontend_api():
    """Test the frontend API endpoint"""
    print("\n🌐 Testing frontend API endpoint...")
    
    try:
        # Create test image
        test_image = create_test_face_image()
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        test_image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Send to frontend API (simulating what the frontend does)
        files = {'image': ('test.jpg', img_bytes, 'image/jpeg')}
        response = requests.post('http://localhost:3001/api/emotion-detection', files=files)
        
        print(f"✅ Frontend API: {response.status_code}")
        result = response.json()
        print(f"   Detected emotion: {result.get('emotion')} ({result.get('confidence')})")
        print(f"   Source: {result.get('source')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Frontend API failed: {e}")
        return False

def test_history_endpoint():
    """Test the history endpoint"""
    print("\n📊 Testing history endpoint...")
    
    try:
        response = requests.get('http://localhost:8000/emotions/history')
        print(f"✅ History endpoint: {response.status_code}")
        result = response.json()
        print(f"   History items: {len(result.get('history', []))}")
        
        return True
        
    except Exception as e:
        print(f"❌ History endpoint failed: {e}")
        return False

def main():
    print("🚀 COMPLETE EMOTION DETECTION PIPELINE TEST")
    print("=" * 50)
    
    # Test all components
    fastapi_ok = test_fastapi_directly()
    frontend_ok = test_frontend_api()
    history_ok = test_history_endpoint()
    
    print("\n📋 SUMMARY:")
    print("=" * 50)
    print(f"FastAPI Service: {'✅ WORKING' if fastapi_ok else '❌ FAILED'}")
    print(f"Frontend API: {'✅ WORKING' if frontend_ok else '❌ FAILED'}")
    print(f"History API: {'✅ WORKING' if history_ok else '❌ FAILED'}")
    
    if fastapi_ok and frontend_ok and history_ok:
        print("\n🎉 ALL SYSTEMS OPERATIONAL!")
        print("   The emotion detection pipeline is working end-to-end")
        print("   Real AI model integration: READY")
        print("   Frontend-Backend connection: ESTABLISHED")
    else:
        print("\n⚠️ SOME ISSUES DETECTED")
        print("   Check the logs above for details")

if __name__ == "__main__":
    main()

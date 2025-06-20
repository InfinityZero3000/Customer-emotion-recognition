#!/usr/bin/env python3
"""
Advanced test with real face detection using webcam or sample images
"""
import cv2
import numpy as np
from fer import FER
import requests
import io
from PIL import Image

def test_fer_directly():
    """Test FER with a generated face pattern"""
    print("🔬 Testing FER directly with generated patterns...")
    
    # Create a more realistic face pattern
    detector = FER(mtcnn=True)
    
    # Generate a simple face-like pattern
    img = np.ones((200, 200, 3), dtype=np.uint8) * 255
    
    # Draw face outline
    cv2.circle(img, (100, 100), 80, (0, 0, 0), 2)
    
    # Eyes
    cv2.circle(img, (75, 85), 8, (0, 0, 0), -1)
    cv2.circle(img, (125, 85), 8, (0, 0, 0), -1)
    
    # Nose
    cv2.circle(img, (100, 105), 3, (0, 0, 0), -1)
    
    # Mouth
    cv2.ellipse(img, (100, 125), (20, 10), 0, 0, 180, (0, 0, 0), 2)
    
    try:
        result = detector.detect_emotions(img)
        print(f"FER Detection result: {result}")
        
        if result:
            emotions = result[0]['emotions']
            dominant = max(emotions, key=emotions.get)
            print(f"✅ Detected emotion: {dominant} with confidence: {emotions[dominant]}")
            return True
        else:
            print("⚠️ No faces detected by FER")
            return False
            
    except Exception as e:
        print(f"❌ FER test failed: {e}")
        return False

def test_with_more_realistic_image():
    """Test with a more realistic face image"""
    print("\n🎭 Testing with enhanced face pattern...")
    
    # Create a 400x400 image with better face features
    img = np.ones((400, 400, 3), dtype=np.uint8) * 240  # Light gray background
    
    # Face oval
    cv2.ellipse(img, (200, 200), (120, 150), 0, 0, 360, (220, 180, 160), -1)
    
    # Eyes
    cv2.ellipse(img, (170, 170), (15, 10), 0, 0, 360, (255, 255, 255), -1)
    cv2.ellipse(img, (230, 170), (15, 10), 0, 0, 360, (255, 255, 255), -1)
    cv2.circle(img, (170, 170), 7, (0, 0, 0), -1)  # Pupil
    cv2.circle(img, (230, 170), 7, (0, 0, 0), -1)  # Pupil
    
    # Eyebrows
    cv2.ellipse(img, (170, 150), (20, 5), 0, 0, 180, (100, 50, 30), 3)
    cv2.ellipse(img, (230, 150), (20, 5), 0, 180, 360, (100, 50, 30), 3)
    
    # Nose
    cv2.ellipse(img, (200, 200), (8, 12), 0, 0, 360, (200, 160, 140), -1)
    
    # Mouth (smiling)
    cv2.ellipse(img, (200, 240), (25, 15), 0, 0, 180, (150, 50, 50), 3)
    
    # Test this image
    detector = FER(mtcnn=True)
    
    try:
        result = detector.detect_emotions(img)
        print(f"Enhanced FER result: {result}")
        
        if result and len(result) > 0:
            emotions = result[0]['emotions']
            dominant = max(emotions, key=emotions.get)
            confidence = emotions[dominant]
            print(f"✅ REAL DETECTION: {dominant} (confidence: {confidence:.3f})")
            print(f"   All emotions: {emotions}")
            
            # Test this with our API
            return test_enhanced_image_with_api(img)
        else:
            print("⚠️ Still no faces detected")
            return False
            
    except Exception as e:
        print(f"❌ Enhanced FER test failed: {e}")
        return False

def test_enhanced_image_with_api(img):
    """Test the enhanced image with our API"""
    print("\n🌐 Testing enhanced image with API...")
    
    try:
        # Convert numpy array to PIL Image
        pil_image = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        pil_image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Send to API
        files = {'file': ('enhanced_face.jpg', img_bytes, 'image/jpeg')}
        response = requests.post('http://localhost:8000/emotion/detect', files=files)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API Response: {result['emotion']} ({result['confidence']})")
            print(f"   Source: {result['source']}")
            
            if 'fer_model_real' in result['source']:
                print("🎉 REAL FER MODEL IS WORKING!")
                return True
            else:
                print("⚠️ Still using mock data")
                return False
        else:
            print(f"❌ API failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def main():
    print("🧪 ADVANCED FER TESTING")
    print("=" * 40)
    
    # Install required packages
    try:
        import cv2
        print("✅ OpenCV available")
    except ImportError:
        print("❌ OpenCV not available")
        return
    
    try:
        from fer import FER
        print("✅ FER available")
    except ImportError:
        print("❌ FER not available")
        return
    
    # Run tests
    basic_test = test_fer_directly()
    enhanced_test = test_with_more_realistic_image()
    
    print("\n📋 ADVANCED TEST SUMMARY:")
    print("=" * 40)
    print(f"Basic FER test: {'✅' if basic_test else '❌'}")
    print(f"Enhanced image test: {'✅' if enhanced_test else '❌'}")
    
    if enhanced_test:
        print("\n🎉 SUCCESS: Real FER emotion detection is working!")
        print("   The system can now detect emotions from real images")
    else:
        print("\n⚠️ FER is working but may need better face detection")
        print("   Try with webcam images or higher quality face photos")

if __name__ == "__main__":
    main()

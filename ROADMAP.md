# Roadmap: Chuyển từ Mock Data sang Real Data

## 🎯 Mục tiêu: Ứng dụng hoạt động thực tế với dữ liệu thật

---

## 📋 PHASE 1: Backend Foundation (Ưu tiên cao)

### 1.1 Khắc phục FastAPI Service
**Thời gian**: 2-3 giờ  
**Mức độ**: Dễ

**Nhiệm vụ:**
- [ ] Sửa lỗi syntax trong `main.py`
- [ ] Cài đặt Python dependencies
- [ ] Kiểm tra và sửa các router files
- [ ] Test FastAPI service chạy được

**Commands cần chạy:**
```bash
cd apps/ai-service/fastapi-service
pip install -r requirements.txt
python main.py
```

**Files cần sửa:**
- `main.py` (dòng 76 - syntax error)
- `requirements.txt` (kiểm tra dependencies)

### 1.2 Database Setup
**Thời gian**: 3-4 giờ  
**Mức độ**: Trung bình

**Nhiệm vụ:**
- [ ] Cài đặt PostgreSQL
- [ ] Tạo database schemas
- [ ] Thiết lập tables cho:
  - Users
  - Emotion detections
  - Product catalog
  - Analytics data

**Database Schema cần tạo:**
```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Emotion detections table
CREATE TABLE emotion_detections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    emotion VARCHAR(50),
    confidence FLOAT,
    timestamp TIMESTAMP DEFAULT NOW(),
    session_id VARCHAR(255)
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(100),
    image_url VARCHAR(500),
    emotion_tags TEXT[]
);
```

---

## 🤖 PHASE 2: AI Models Integration (Ưu tiên cao)

### 2.1 Emotion Detection Models
**Thời gian**: 4-6 giờ  
**Mức độ**: Khó

**Models cần tải:**

#### Option A: Lightweight Models (Recommended)
```python
# 1. FER2013 model (Emotion Recognition)
pip install fer
# hoặc
pip install deepface

# 2. MediaPipe (Face Detection)
pip install mediapipe

# 3. OpenCV (Image Processing)
pip install opencv-python
```

#### Option B: Advanced Models
```python
# 1. Hugging Face Transformers
pip install transformers torch torchvision

# Models to use:
# - microsoft/DialoGPT-medium (emotion classification)
# - j-hartmann/emotion-english-distilroberta-base
```

**Implementation Steps:**
- [ ] Integrate FER library cho emotion detection
- [ ] Thay thế mock AI trong `/api/emotion-detection`
- [ ] Test với real camera input
- [ ] Optimize inference speed

### 2.2 Product Recommendation AI
**Thời gian**: 3-4 giờ  
**Mức độ**: Trung bình

**Approach:**
```python
# Emotion-to-Product mapping
EMOTION_PRODUCT_MAP = {
    'happy': ['entertainment', 'social', 'luxury'],
    'sad': ['comfort', 'self-care', 'books'],
    'angry': ['sports', 'stress-relief', 'meditation'],
    'surprised': ['tech', 'gadgets', 'novelty'],
    'fearful': ['security', 'insurance', 'comfort'],
    'disgusted': ['cleaning', 'health', 'fresh'],
    'neutral': ['everyday', 'practical', 'utility']
}
```

**Tasks:**
- [ ] Implement emotion-based product filtering
- [ ] Create recommendation algorithm
- [ ] Connect với product database

---

## 🔄 PHASE 3: Data Integration (Ưu tiên trung bình)

### 3.1 Replace Mock Data trong Frontend
**Thời gian**: 2-3 giờ  
**Mức độ**: Dễ

**Files cần sửa:**
- [ ] `/history/page.tsx` - Connect to real API
- [ ] `/insights/page.tsx` - Calculate from real data
- [ ] `/recommendations/page.tsx` - Use AI recommendations

### 3.2 Real-time Data Updates
**Thời gian**: 2-3 giờ  
**Mức độ**: Trung bình

**Implementation:**
- [ ] WebSocket connection for live updates
- [ ] Real-time analytics calculation
- [ ] Live emotion detection streaming

---

## 📊 PHASE 4: Analytics Engine (Ưu tiên thấp)

### 4.1 Historical Analytics
**Thời gian**: 3-4 giờ  
**Mức độ**: Trung bình

**Features:**
- [ ] Calculate emotion trends over time
- [ ] Pattern recognition in user behavior
- [ ] Peak hours analysis
- [ ] Emotional stability scoring

### 4.2 Advanced Insights
**Thời gian**: 4-5 giờ  
**Mức độ**: Khó

**Features:**
- [ ] Predictive analytics
- [ ] Anomaly detection
- [ ] Personalized insights
- [ ] Comparison with population data

---

## 🛠️ DETAILED IMPLEMENTATION GUIDE

### Step 1: Fix FastAPI Service (START HERE)
**Estimated time: 2 hours**

1. **Sửa main.py:**
```python
# Thay thế dòng 76-80 bằng:
# TODO: Implement authentication
# def get_current_user():
#     pass

# TODO: Implement admin middleware  
# def admin_required():
#     pass
```

2. **Install dependencies:**
```bash
cd apps/ai-service/fastapi-service
pip install fastapi uvicorn python-multipart pillow numpy opencv-python
```

3. **Test service:**
```bash
python main.py
# Should run on http://localhost:8000
```

### Step 2: Implement Real Emotion Detection
**Estimated time: 3 hours**

1. **Install AI libraries:**
```bash
pip install fer deepface mediapipe
```

2. **Update emotion_detector.py:**
```python
from fer import FER
import cv2
import numpy as np

class EmotionDetector:
    def __init__(self):
        self.detector = FER(mtcnn=True)
    
    def detect_emotion(self, image_data):
        # Convert image to OpenCV format
        image = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)
        
        # Detect emotions
        result = self.detector.detect_emotions(image)
        
        if result:
            emotions = result[0]['emotions']
            dominant_emotion = max(emotions, key=emotions.get)
            confidence = emotions[dominant_emotion]
            
            return {
                'emotion': dominant_emotion,
                'confidence': confidence,
                'all_emotions': emotions
            }
        
        return None
```

### Step 3: Database Integration
**Estimated time: 2 hours**

1. **Install PostgreSQL:**
```bash
brew install postgresql
brew services start postgresql
createdb emotion_recognition
```

2. **Create database connection:**
```python
# In FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://username:password@localhost/emotion_recognition"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

3. **Create tables:**
```sql
-- Run in PostgreSQL
\c emotion_recognition;
-- (Insert schema from above)
```

### Step 4: Connect Frontend to Real APIs
**Estimated time: 1 hour**

1. **Update API endpoints:**
```typescript
// In /api/emotion-detection/route.ts
const response = await fetch('http://localhost:8000/emotion/detect', {
    method: 'POST',
    body: formData,
});
```

2. **Update history page:**
```typescript
// In /history/page.tsx
const response = await fetch('http://localhost:8000/history/user/123');
const realHistory = await response.json();
setEmotionHistory(realHistory);
```

---

## 🔧 RECOMMENDED MODELS & LIBRARIES

### For Emotion Detection:
1. **FER (Facial Emotion Recognition)** - Lightweight, good accuracy
2. **DeepFace** - Multiple models, more accurate
3. **MediaPipe** - Google's solution, very fast

### For Face Detection:
1. **OpenCV Haar Cascades** - Fast, simple
2. **MediaPipe Face Detection** - More accurate
3. **MTCNN** - Best accuracy, slower

### For Product Recommendations:
1. **Scikit-learn** - Simple ML algorithms
2. **Sentence Transformers** - For semantic search
3. **Custom rule-based system** - Fastest to implement

---

## 📅 TIMELINE SUMMARY

**Week 1: Core Infrastructure**
- Day 1-2: Fix FastAPI + Database setup
- Day 3-4: Implement real emotion detection
- Day 5: Connect frontend to backend

**Week 2: Features & Polish**
- Day 1-2: Product recommendations
- Day 3-4: Real analytics
- Day 5: Testing & optimization

**Total Estimated Time: 8-10 days**

---

## 🚀 QUICK START (First 2 hours)

1. **Fix FastAPI service** (Highest priority)
2. **Install basic AI libraries**
3. **Test emotion detection with camera**
4. **Verify data flow end-to-end**

**Commands to run right now:**
```bash
# 1. Fix FastAPI
cd apps/ai-service/fastapi-service
pip install -r requirements.txt

# 2. Install AI libraries  
pip install fer opencv-python

# 3. Test the service
python main.py
```

Bạn muốn tôi bắt đầu implement phần nào trước?

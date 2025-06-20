from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
import io
import numpy as np
import cv2
from datetime import datetime
from typing import Dict, Any, Optional
import random
import time
from PIL import Image

# Database imports
from database import db_manager, EmotionDetection, init_database, cleanup_database

# Try to import FER, fallback to mock if not available
try:
    from fer import FER
    FER_AVAILABLE = True
    print("✅ FER library imported successfully")
except ImportError as e:
    FER_AVAILABLE = False
    print(f"⚠️ FER library not available: {e}")
    print("   Will use mock data instead")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmotionDetectorService:
    def __init__(self):
        self.fer_detector = None
        self.model_loaded = False
        self.database_connected = False
        self.load_model()
    
    def load_model(self):
        """Load the FER model"""
        if FER_AVAILABLE:
            try:
                self.fer_detector = FER(mtcnn=True)
                self.model_loaded = True
                logger.info("✅ FER model loaded successfully")
            except Exception as e:
                logger.error(f"❌ Failed to load FER model: {e}")
                self.model_loaded = False
        else:
            logger.warning("⚠️ FER not available, using mock detection")
            self.model_loaded = False
    
    async def detect_emotion(self, image_file: UploadFile, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Detect emotions from uploaded image and save to database"""
        start_time = time.time()
        
        try:
            # Read image data
            image_data = await image_file.read()
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            if self.model_loaded and self.fer_detector:
                result = await self._detect_with_fer(image_data, processing_time_ms, session_id)
            else:
                result = await self._generate_mock_emotion_data("real_structure", processing_time_ms, session_id)
            
            # Save to database
            try:
                emotion_detection = EmotionDetection(
                    session_id=session_id,
                    dominant_emotion=result['emotion'],
                    confidence=result['confidence'],
                    all_emotions=result['allEmotions'],
                    num_faces=result.get('num_faces', 1),
                    face_box=result.get('face_box'),
                    source=result['source'],
                    processing_time_ms=processing_time_ms,
                    image_size=f"{len(image_data)} bytes",
                    detected_at=datetime.now()
                )
                
                detection_id = await db_manager.save_emotion_detection(emotion_detection)
                result['detection_id'] = detection_id
                result['saved_to_database'] = True
                
                logger.info(f"✅ Emotion detection saved to database: {detection_id}")
                
            except Exception as db_error:
                logger.error(f"⚠️ Failed to save to database: {db_error}")
                result['saved_to_database'] = False
                result['database_error'] = str(db_error)
            
            return result
                
        except Exception as e:
            logger.error(f"Error during emotion detection: {e}")
            return await self._generate_mock_emotion_data("error_fallback", 0, session_id)
    
    async def _detect_with_fer(self, image_data: bytes, processing_time_ms: int, session_id: Optional[str]) -> Dict[str, Any]:
        """Use FER model for real emotion detection"""
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert PIL image to cv2 format
            img_np = np.array(image)
            if len(img_np.shape) == 3 and img_np.shape[2] == 3:
                img_cv2 = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            else:
                img_cv2 = img_np
            
            # Detect emotions using FER
            result = self.fer_detector.detect_emotions(img_cv2)
            
            if result and len(result) > 0:
                # Get the first face's emotions
                emotions = result[0]['emotions']
                face_box = result[0]['box']
                
                # Find dominant emotion
                dominant_emotion = max(emotions, key=emotions.get)
                confidence = emotions[dominant_emotion]
                
                return {
                    "emotion": dominant_emotion,
                    "confidence": round(confidence, 3),
                    "allEmotions": {k: round(v, 3) for k, v in emotions.items()},
                    "num_faces": len(result),
                    "face_box": face_box,
                    "processing_time_ms": processing_time_ms,
                    "timestamp": datetime.now().isoformat(),
                    "source": "fer_model_real",
                    "session_id": session_id
                }
            else:
                logger.warning("No faces detected in image")
                return await self._generate_mock_emotion_data("no_faces_detected", processing_time_ms, session_id)
                
        except Exception as e:
            logger.error(f"FER detection error: {e}")
            return await self._generate_mock_emotion_data("fer_error", processing_time_ms, session_id)
    
    async def _generate_mock_emotion_data(self, reason="fallback", processing_time_ms=0, session_id=None) -> Dict[str, Any]:
        """Generate realistic mock emotion data"""
        emotions = {
            'happy': random.uniform(0.1, 0.9),
            'sad': random.uniform(0.1, 0.9),
            'angry': random.uniform(0.1, 0.9),
            'surprise': random.uniform(0.1, 0.9),
            'fear': random.uniform(0.1, 0.9),
            'disgust': random.uniform(0.1, 0.9),
            'neutral': random.uniform(0.1, 0.9)
        }
        
        # Normalize to sum to 1
        total = sum(emotions.values())
        emotions = {k: round(v/total, 3) for k, v in emotions.items()}
        
        # Find dominant emotion
        dominant_emotion = max(emotions, key=emotions.get)
        confidence = emotions[dominant_emotion]
        
        return {
            "emotion": dominant_emotion,
            "confidence": round(confidence, 3),
            "allEmotions": emotions,
            "processing_time_ms": processing_time_ms,
            "timestamp": datetime.now().isoformat(),
            "source": f"mock_data_{reason}",
            "session_id": session_id
        }

# Create FastAPI app
app = FastAPI(
    title="Emotion Detection API with Database",
    description="Real-time emotion detection service with persistent data storage",
    version="3.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the emotion detector service
emotion_service = EmotionDetectorService()

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    logger.info("🚀 Starting Emotion Detection API with Database Integration")
    success = await init_database()
    if success:
        emotion_service.database_connected = True
        logger.info("✅ Database connection established")
    else:
        logger.warning("⚠️ Database connection failed - running in fallback mode")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup database connections on shutdown"""
    await cleanup_database()
    logger.info("Database connections closed")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    database_status = await db_manager.test_connection() if emotion_service.database_connected else False
    
    status = {
        "status": "ok",
        "service": "emotion-ai-service-database",
        "version": "3.0.0",
        "fer_available": FER_AVAILABLE,
        "model_loaded": emotion_service.model_loaded,
        "database_connected": emotion_service.database_connected,
        "database_status": database_status,
        "timestamp": datetime.now().isoformat()
    }
    return status

@app.post("/emotion/detect")
async def detect_emotion(file: UploadFile = File(...), session_id: Optional[str] = None):
    """
    Detect emotions from an uploaded image.
    Uses FER model if available, saves results to database.
    """
    logger.info(f"Emotion detection request received. File: {file.filename}, Session: {session_id}")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Detect emotions and save to database
    result = await emotion_service.detect_emotion(file, session_id)
    
    logger.info(f"Emotion detection result: {result['emotion']} ({result['confidence']}) from {result['source']}")
    
    return result

@app.get("/emotions/history")
async def get_emotion_history(limit: int = 50):
    """Get emotion detection history from database"""
    try:
        history = await db_manager.get_emotion_history(limit=limit)
        return {
            "history": history,
            "count": len(history),
            "source": "database_real" if history else "database_empty"
        }
    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        # Fallback to mock data
        mock_history = []
        emotions = ['happy', 'sad', 'angry', 'surprise', 'fear', 'disgust', 'neutral']
        
        for i in range(min(10, limit)):
            emotion = random.choice(emotions)
            mock_history.append({
                "id": f"mock-{i + 1}",
                "emotion": emotion,
                "confidence": round(random.uniform(0.6, 0.95), 3),
                "timestamp": datetime.now().isoformat(),
                "source": "mock_fallback"
            })
        
        return {
            "history": mock_history,
            "count": len(mock_history),
            "source": "mock_fallback",
            "error": str(e)
        }

@app.get("/emotions/analytics")
async def get_emotion_analytics(days: int = 7):
    """Get emotion analytics from database"""
    try:
        analytics = await db_manager.get_emotion_analytics(days=days)
        analytics['source'] = 'database_real'
        return analytics
    except Exception as e:
        logger.error(f"Failed to get analytics: {e}")
        # Return mock analytics
        return {
            "period_days": days,
            "total_detections": 0,
            "unique_users": 0,
            "avg_confidence": 0,
            "emotion_distribution": [],
            "daily_trends": [],
            "source": "mock_fallback",
            "error": str(e)
        }

@app.get("/emotions/recommendations/{emotion}")
async def get_emotion_recommendations(emotion: str, limit: int = 5):
    """Get product recommendations based on detected emotion"""
    try:
        recommendations = await db_manager.get_emotion_recommendations(emotion, limit)
        return {
            "emotion": emotion,
            "recommendations": recommendations,
            "count": len(recommendations),
            "source": "database_real"
        }
    except Exception as e:
        logger.error(f"Failed to get recommendations: {e}")
        return {
            "emotion": emotion,
            "recommendations": [],
            "count": 0,
            "source": "database_error",
            "error": str(e)
        }

if __name__ == "__main__":
    print("🚀 Starting Emotion Detection API with Database Integration")
    print(f"   FER Available: {FER_AVAILABLE}")
    print(f"   Model Loaded: {emotion_service.model_loaded}")
    print("   Database: PostgreSQL with asyncpg")
    print("   Access at: http://localhost:8000")
    print("   API Docs: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)

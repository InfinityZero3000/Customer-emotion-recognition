from fastapi import FastAPI, UploadFile, File, HTTPException
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
from PIL import Image

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

# Create FastAPI app
app = FastAPI(
    title="Emotion Detection API with FER",
    description="Real-time emotion detection service using FER model",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmotionDetectorService:
    def __init__(self):
        self.fer_detector = None
        self.model_loaded = False
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
    
    async def detect_emotion(self, image_file: UploadFile) -> Dict[str, Any]:
        """Detect emotions from uploaded image"""
        try:
            # Read image data
            image_data = await image_file.read()
            
            if self.model_loaded and self.fer_detector:
                return await self._detect_with_fer(image_data)
            else:
                return self._generate_mock_emotion_data("real_structure")
                
        except Exception as e:
            logger.error(f"Error during emotion detection: {e}")
            return self._generate_mock_emotion_data("error_fallback")
    
    async def _detect_with_fer(self, image_data: bytes) -> Dict[str, Any]:
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
                
                # Find dominant emotion
                dominant_emotion = max(emotions, key=emotions.get)
                confidence = emotions[dominant_emotion]
                
                return {
                    "emotion": dominant_emotion,
                    "confidence": round(confidence, 3),
                    "allEmotions": emotions,
                    "num_faces": len(result),
                    "timestamp": datetime.now().isoformat(),
                    "source": "fer_model_real"
                }
            else:
                logger.warning("No faces detected in image")
                return self._generate_mock_emotion_data("no_faces_detected")
                
        except Exception as e:
            logger.error(f"FER detection error: {e}")
            return self._generate_mock_emotion_data("fer_error")
    
    def _generate_mock_emotion_data(self, reason="fallback") -> Dict[str, Any]:
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
            "timestamp": datetime.now().isoformat(),
            "source": f"mock_data_{reason}"
        }

# Initialize the emotion detector service
emotion_service = EmotionDetectorService()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    status = {
        "status": "ok",
        "service": "emotion-ai-service-fer",
        "version": "2.0.0",
        "fer_available": FER_AVAILABLE,
        "model_loaded": emotion_service.model_loaded
    }
    return status

@app.post("/emotion/detect")
async def detect_emotion(file: UploadFile = File(...)):
    """
    Detect emotions from an uploaded image.
    Uses FER model if available, otherwise falls back to mock data.
    """
    logger.info(f"Emotion detection request received. File: {file.filename}, Content-Type: {file.content_type}")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Detect emotions
    result = await emotion_service.detect_emotion(file)
    
    logger.info(f"Emotion detection result: {result['emotion']} ({result['confidence']}) from {result['source']}")
    
    return result

@app.get("/emotions/history")
async def get_emotion_history():
    """Get emotion detection history (mock data for now)"""
    mock_history = []
    emotions = ['happy', 'sad', 'angry', 'surprise', 'fear', 'disgust', 'neutral']
    
    for i in range(10):
        emotion = random.choice(emotions)
        mock_history.append({
            "id": i + 1,
            "emotion": emotion,
            "confidence": round(random.uniform(0.6, 0.95), 3),
            "timestamp": datetime.now().isoformat(),
            "source": "history_mock"
        })
    
    return {"history": mock_history}

if __name__ == "__main__":
    print("🚀 Starting Emotion Detection API with FER integration")
    print(f"   FER Available: {FER_AVAILABLE}")
    print(f"   Model Loaded: {emotion_service.model_loaded}")
    print("   Access at: http://localhost:8000")
    print("   API Docs: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)

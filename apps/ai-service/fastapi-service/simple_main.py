from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
from datetime import datetime
from typing import Dict, Any
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Emotion Detection API",
    description="Real-time emotion detection service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_mock_emotion_data() -> Dict[str, Any]:
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
        "confidence": confidence,
        "allEmotions": emotions,
        "timestamp": datetime.now().isoformat(),
        "source": "fast_api_mock"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "emotion-ai-service", "version": "1.0.0"}

@app.post("/emotion/detect")
async def detect_emotion(file: UploadFile = File(...)):
    """
    Detect emotion from uploaded image
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file content
        contents = await file.read()
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        logger.info(f"Processing image: {file.filename}, size: {len(contents)} bytes")
        
        # For now, return mock data
        # In real implementation, would process the image with AI model
        result = generate_mock_emotion_data()
        
        logger.info(f"Detected emotion: {result['emotion']} with confidence: {result['confidence']}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.get("/emotions/history")
async def get_emotion_history():
    """Get emotion detection history"""
    # Mock history data
    history = []
    for i in range(10):
        emotion_data = generate_mock_emotion_data()
        history.append({
            "id": f"detection_{i}",
            "emotion": emotion_data["emotion"],
            "confidence": emotion_data["confidence"],
            "timestamp": datetime.now().isoformat(),
        })
    
    return {
        "success": True,
        "data": history,
        "total": len(history)
    }

if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", "8000"))
    host = os.getenv("AI_HOST", "0.0.0.0")
    
    logger.info(f"Starting Emotion Detection API on {host}:{port}")
    
    uvicorn.run(
        "simple_main:app", 
        host=host, 
        port=port, 
        reload=True,
        log_level="info"
    )

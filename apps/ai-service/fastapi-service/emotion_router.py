from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
import logging
from pydantic import BaseModel
import json
from emotion_detector import EmotionDetector
from emotion_agent import EmotionAgent

# Configure logging
logger = logging.getLogger("emotion-router")

# Create router
emotion_router = APIRouter()

# Initialize models
emotion_detector = EmotionDetector()
emotion_agent = EmotionAgent()

# Pydantic models for request/response
class EmotionResponse(BaseModel):
    emotions: Dict[str, float]
    dominant_emotion: str
    confidence: float
    timestamp: str

class ProductPreferenceResponse(BaseModel):
    user_id: str
    recommended_categories: List[str]
    reasoning: str
    confidence_score: float

class UserPreferenceInput(BaseModel):
    user_id: str
    previous_interactions: Optional[List[Dict[str, Any]]] = None
    current_emotion: Optional[Dict[str, float]] = None
    session_context: Optional[Dict[str, Any]] = None

# Endpoints
@emotion_router.post("/detect-emotion", response_model=EmotionResponse)
async def detect_emotion(image: UploadFile = File(...)):
    """
    Detect emotions from an uploaded facial image.
    """
    try:
        # Process the image and detect emotions
        result = await emotion_detector.detect_from_image(image)
        return result
    except Exception as e:
        logger.error(f"Error detecting emotion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@emotion_router.post("/predict-preferences", response_model=ProductPreferenceResponse)
async def predict_preferences(input_data: UserPreferenceInput):
    """
    Predict product preferences based on user's detected emotion and interaction history.
    """
    try:
        # Get product preferences using the emotion agent
        preferences = await emotion_agent.predict_preferences(
            user_id=input_data.user_id,
            emotions=input_data.current_emotion,
            previous_interactions=input_data.previous_interactions,
            session_context=input_data.session_context
        )
        return preferences
    except Exception as e:
        logger.error(f"Error predicting preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error predicting preferences: {str(e)}")

@emotion_router.post("/streaming-recommendations")
async def streaming_recommendations(input_data: UserPreferenceInput):
    """
    Stream product recommendations based on user's emotion.
    """
    try:
        # Create a generator for streaming responses
        return StreamingResponse(
            emotion_agent.stream_recommendations(
                user_id=input_data.user_id,
                emotions=input_data.current_emotion,
                previous_interactions=input_data.previous_interactions,
                session_context=input_data.session_context
            ),
            media_type="application/json"
        )
    except Exception as e:
        logger.error(f"Error streaming recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error streaming recommendations: {str(e)}")

@emotion_router.get("/emotion-stats/{user_id}")
async def get_emotion_stats(user_id: str, timeframe: str = Query("daily", enum=["daily", "weekly", "monthly"])):
    """
    Get emotion statistics for a user over a specified timeframe.
    """
    try:
        stats = await emotion_agent.get_emotion_stats(user_id, timeframe)
        return stats
    except Exception as e:
        logger.error(f"Error getting emotion stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting emotion stats: {str(e)}")
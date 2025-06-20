from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Set
from emotion_detector import EmotionDetector
from core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Emotion Detection AI Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global emotion detector instance
emotion_detector = EmotionDetector()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_sessions: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, client_id: str, user_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = set()
        self.user_sessions[user_id].add(client_id)
        
        logger.info(f"Client {client_id} connected for user {user_id}")

    def disconnect(self, client_id: str, user_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        if user_id in self.user_sessions:
            self.user_sessions[user_id].discard(client_id)
            if not self.user_sessions[user_id]:
                del self.user_sessions[user_id]
        
        logger.info(f"Client {client_id} disconnected")

    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                # Remove broken connection
                if client_id in self.active_connections:
                    del self.active_connections[client_id]

    async def broadcast_to_user(self, message: dict, user_id: str):
        if user_id in self.user_sessions:
            tasks = []
            for client_id in self.user_sessions[user_id].copy():
                tasks.append(self.send_personal_message(message, client_id))
            
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

    def get_stats(self):
        return {
            "total_connections": len(self.active_connections),
            "total_users": len(self.user_sessions),
            "connections_per_user": {user_id: len(sessions) for user_id, sessions in self.user_sessions.items()}
        }

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "Emotion Detection AI Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "connections": manager.get_stats()
    }

@app.post("/emotions/detect-image")
async def detect_emotion_from_image(image: UploadFile = File(...)):
    """
    Detect emotions from an uploaded image.
    """
    try:
        # Validate file type
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Detect emotions
        result = await emotion_detector.detect_from_image(image)
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in emotion detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Emotion detection failed: {str(e)}")

@app.websocket("/emotions/stream/{user_id}")
async def emotion_stream_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time emotion streaming.
    """
    client_id = str(uuid.uuid4())
    
    try:
        await manager.connect(websocket, client_id, user_id)
        
        # Send welcome message
        await manager.send_personal_message({
            "type": "connection_established",
            "data": {
                "client_id": client_id,
                "user_id": user_id,
                "message": "Connected to emotion detection stream"
            },
            "timestamp": datetime.now().isoformat()
        }, client_id)
        
        while True:
            # Receive data from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            await handle_websocket_message(message, client_id, user_id)
            
    except WebSocketDisconnect:
        manager.disconnect(client_id, user_id)
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        manager.disconnect(client_id, user_id)

async def handle_websocket_message(message: dict, client_id: str, user_id: str):
    """
    Handle incoming WebSocket messages from clients.
    """
    try:
        message_type = message.get("type")
        
        if message_type == "ping":
            await manager.send_personal_message({
                "type": "pong",
                "timestamp": datetime.now().isoformat()
            }, client_id)
        
        elif message_type == "detect_emotion":
            # Handle base64 image data for emotion detection
            image_data = message.get("data", {}).get("image_data")
            if image_data:
                result = await process_base64_emotion_detection(image_data, user_id)
                
                # Send result back to client
                await manager.send_personal_message({
                    "type": "emotion_detected",
                    "data": result,
                    "timestamp": datetime.now().isoformat()
                }, client_id)
                
                # Broadcast to all user sessions
                await manager.broadcast_to_user({
                    "type": "emotion_update",
                    "data": {
                        "user_id": user_id,
                        "emotion": result,
                        "source": "realtime_detection"
                    },
                    "timestamp": datetime.now().isoformat()
                }, user_id)
        
        elif message_type == "get_emotion_history":
            # Mock emotion history - in real implementation, would query database
            history = generate_mock_emotion_history(user_id)
            await manager.send_personal_message({
                "type": "emotion_history",
                "data": history,
                "timestamp": datetime.now().isoformat()
            }, client_id)
        
        else:
            await manager.send_personal_message({
                "type": "error",
                "data": {"message": f"Unknown message type: {message_type}"},
                "timestamp": datetime.now().isoformat()
            }, client_id)
    
    except Exception as e:
        logger.error(f"Error handling WebSocket message: {e}")
        await manager.send_personal_message({
            "type": "error",
            "data": {"message": "Internal server error"},
            "timestamp": datetime.now().isoformat()
        }, client_id)

async def process_base64_emotion_detection(image_data: str, user_id: str):
    """
    Process base64 encoded image data for emotion detection.
    """
    try:
        import base64
        from io import BytesIO
        from PIL import Image
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        
        # Create a mock UploadFile object
        class MockUploadFile:
            def __init__(self, image_bytes):
                self.file = BytesIO(image_bytes)
                self.content_type = "image/jpeg"
            
            async def read(self):
                self.file.seek(0)
                return self.file.read()
        
        mock_file = MockUploadFile(image_bytes)
        result = await emotion_detector.detect_from_image(mock_file)
        
        # Add user context
        result["user_id"] = user_id
        result["detection_method"] = "websocket_stream"
        
        return result
    
    except Exception as e:
        logger.error(f"Error processing base64 image: {e}")
        return {
            "error": "Failed to process image",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }

def generate_mock_emotion_history(user_id: str) -> List[dict]:
    """
    Generate mock emotion history for testing.
    In a real implementation, this would query the database.
    """
    import random
    from datetime import timedelta
    
    emotions = ['happy', 'sad', 'angry', 'surprise', 'fear', 'disgust', 'neutral']
    history = []
    
    for i in range(20):  # Last 20 detections
        timestamp = datetime.now() - timedelta(minutes=i * 5)
        dominant_emotion = random.choice(emotions)
        
        emotion_data = {
            "dominant_emotion": dominant_emotion,
            "confidence": random.uniform(0.6, 0.95),
            "emotions": {emotion: random.uniform(0.01, 0.3) for emotion in emotions},
            "timestamp": timestamp.isoformat(),
            "user_id": user_id
        }
        
        # Make dominant emotion have highest confidence
        emotion_data["emotions"][dominant_emotion] = emotion_data["confidence"]
        
        history.append(emotion_data)
    
    return history

@app.get("/emotions/stats")
async def get_connection_stats():
    """
    Get WebSocket connection statistics.
    """
    return manager.get_stats()

@app.post("/emotions/batch-detect")
async def batch_emotion_detection(images: List[UploadFile] = File(...)):
    """
    Detect emotions from multiple images in batch.
    """
    try:
        results = []
        
        for image in images:
            if not image.content_type.startswith('image/'):
                results.append({"error": f"File {image.filename} is not an image"})
                continue
            
            try:
                result = await emotion_detector.detect_from_image(image)
                result["filename"] = image.filename
                results.append(result)
            except Exception as e:
                results.append({
                    "filename": image.filename,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "total_processed": len(results),
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error in batch emotion detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch detection failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

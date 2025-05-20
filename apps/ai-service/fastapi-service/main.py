import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from dotenv import load_dotenv
from emotion_router import emotion_router
import uvicorn

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("emotion-ai-service")

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load models and initialize resources
    logger.info("Starting up the Emotion AI Service")
    yield
    # Shutdown: Release resources
    logger.info("Shutting down the Emotion AI Service")

# Create FastAPI app
app = FastAPI(
    title="E-Commerce Emotion Recognition API",
    description="API for detecting customer emotions and predicting product preferences",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# Include routers
app.include_router(emotion_router, prefix="/api/v1", tags=["emotion"])

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "emotion-ai-service"}

# Run the application
if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", "5000"))
    host = os.getenv("AI_HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
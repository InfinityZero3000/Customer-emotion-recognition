import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from dotenv import load_dotenv
from emotion_router import emotion_router
import uvicorn
from auth_router import router as auth_router
from user_router import router as user_router
from history_router import router as history_router
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from webcam_emotion_router import webcam_router
from webcam_ws_router import ws_router
from batch_router import batch_router
from visualization_router import visualization_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger(__name__)

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load models and initialize resources
    logger.info("Starting up the Emotion AI Service")
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(429, _rate_limit_exceeded_handler)
    yield
    # Shutdown: Release resources
    logger.info("Shutting down the Emotion AI Service")

# Create FastAPI app
app = FastAPI(
    title="Emotion Recognition API",
    description="API for detecting customer emotions and predicting product preferences",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(user_router, prefix="/api/v1/user", tags=["user"])
app.include_router(history_router, prefix="/api/v1/history", tags=["history"])
app.include_router(webcam_router, prefix="/api/v1", tags=["webcam"])
app.include_router(ws_router, prefix="/api/v1", tags=["webcam-ws"])
app.include_router(batch_router, prefix="/api/v1", tags=["batch"])
app.include_router(visualization_router, prefix="/api/v1", tags=["visualization"])

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "emotion-ai-service"}

# TODO: Implement authentication later
# def get_current_user():
#     # Return user and role
#     pass

# TODO: Implement admin middleware later
# def admin_required(user=Depends(get_current_user)):
#     if user.role != "admin":
#         raise HTTPException(status_code=403, detail="Admin only")
#     return user

# TODO: Implement admin endpoints later
# @app.get("/admin-only")
# def admin_endpoint(user=Depends(admin_required)):
#     return {"message": "Admin only endpoint"}

# Run the application
if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", "8000"))
    host = os.getenv("AI_HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
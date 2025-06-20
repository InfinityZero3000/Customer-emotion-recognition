"""
Database connection and models for emotion recognition system
"""
import os
import asyncio
import asyncpg
import json
from datetime import datetime, date
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/emotion_recognition")

@dataclass
class EmotionDetection:
    id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    dominant_emotion: str = ""
    confidence: float = 0.0
    all_emotions: Dict[str, float] = None
    num_faces: int = 1
    face_box: Optional[Dict] = None
    source: str = "fer_model"
    processing_time_ms: Optional[int] = None
    image_size: Optional[str] = None
    detected_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

@dataclass
class Product:
    id: Optional[str] = None
    name: str = ""
    category: str = ""
    subcategory: str = ""
    description: str = ""
    price: float = 0.0
    image_url: str = ""
    target_emotions: List[str] = None
    emotion_scores: Dict[str, float] = None

class DatabaseManager:
    def __init__(self, database_url: str = DATABASE_URL):
        self.database_url = database_url
        self.pool = None
    
    async def init_pool(self):
        """Initialize database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=1,
                max_size=10,
                command_timeout=60
            )
            logger.info("✅ Database connection pool initialized")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize database pool: {e}")
            return False
    
    async def close_pool(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database pool closed")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get database connection from pool"""
        if not self.pool:
            await self.init_pool()
        
        conn = await self.pool.acquire()
        try:
            yield conn
        finally:
            await self.pool.release(conn)
    
    async def save_emotion_detection(self, emotion_data: EmotionDetection) -> str:
        """Save emotion detection to database"""
        try:
            async with self.get_connection() as conn:
                query = """
                INSERT INTO emotion_detections (
                    user_id, session_id, dominant_emotion, confidence, 
                    all_emotions, num_faces, face_box, source, 
                    processing_time_ms, image_size, detected_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
                """
                
                detected_at = emotion_data.detected_at or datetime.now()
                all_emotions_json = json.dumps(emotion_data.all_emotions or {})
                face_box_json = json.dumps(emotion_data.face_box) if emotion_data.face_box else None
                
                result = await conn.fetchrow(
                    query,
                    emotion_data.user_id,
                    emotion_data.session_id,
                    emotion_data.dominant_emotion,
                    emotion_data.confidence,
                    all_emotions_json,
                    emotion_data.num_faces,
                    face_box_json,
                    emotion_data.source,
                    emotion_data.processing_time_ms,
                    emotion_data.image_size,
                    detected_at
                )
                
                detection_id = str(result['id'])
                logger.info(f"✅ Saved emotion detection: {detection_id} ({emotion_data.dominant_emotion})")
                return detection_id
                
        except Exception as e:
            logger.error(f"❌ Failed to save emotion detection: {e}")
            raise
    
    async def get_emotion_history(self, user_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Get emotion detection history"""
        try:
            async with self.get_connection() as conn:
                if user_id:
                    query = """
                    SELECT id, dominant_emotion, confidence, all_emotions, 
                           num_faces, source, detected_at, created_at
                    FROM emotion_detections 
                    WHERE user_id = $1
                    ORDER BY detected_at DESC 
                    LIMIT $2
                    """
                    rows = await conn.fetch(query, user_id, limit)
                else:
                    query = """
                    SELECT id, dominant_emotion, confidence, all_emotions, 
                           num_faces, source, detected_at, created_at
                    FROM emotion_detections 
                    ORDER BY detected_at DESC 
                    LIMIT $1
                    """
                    rows = await conn.fetch(query, limit)
                
                history = []
                for row in rows:
                    history.append({
                        "id": str(row['id']),
                        "emotion": row['dominant_emotion'],
                        "confidence": float(row['confidence']),
                        "allEmotions": json.loads(row['all_emotions']) if row['all_emotions'] else {},
                        "num_faces": row['num_faces'],
                        "source": row['source'],
                        "timestamp": row['detected_at'].isoformat(),
                        "created_at": row['created_at'].isoformat()
                    })
                
                logger.info(f"✅ Retrieved {len(history)} emotion history records")
                return history
                
        except Exception as e:
            logger.error(f"❌ Failed to get emotion history: {e}")
            return []
    
    async def get_emotion_analytics(self, days: int = 7) -> Dict[str, Any]:
        """Get emotion analytics for the past N days"""
        try:
            async with self.get_connection() as conn:
                # Overall stats
                stats_query = """
                SELECT 
                    COUNT(*) as total_detections,
                    COUNT(DISTINCT user_id) as unique_users,
                    AVG(confidence) as avg_confidence,
                    MIN(detected_at) as first_detection,
                    MAX(detected_at) as last_detection
                FROM emotion_detections 
                WHERE detected_at >= NOW() - INTERVAL '%s days'
                """ % days
                
                stats = await conn.fetchrow(stats_query)
                
                # Emotion distribution
                emotion_query = """
                SELECT 
                    dominant_emotion,
                    COUNT(*) as count,
                    AVG(confidence) as avg_confidence
                FROM emotion_detections 
                WHERE detected_at >= NOW() - INTERVAL '%s days'
                GROUP BY dominant_emotion
                ORDER BY count DESC
                """ % days
                
                emotions = await conn.fetch(emotion_query)
                
                # Daily trends
                daily_query = """
                SELECT 
                    DATE(detected_at) as date,
                    dominant_emotion,
                    COUNT(*) as count
                FROM emotion_detections 
                WHERE detected_at >= NOW() - INTERVAL '%s days'
                GROUP BY DATE(detected_at), dominant_emotion
                ORDER BY date DESC, count DESC
                """ % days
                
                daily_trends = await conn.fetch(daily_query)
                
                # Format results
                analytics = {
                    "period_days": days,
                    "total_detections": stats['total_detections'],
                    "unique_users": stats['unique_users'],
                    "avg_confidence": float(stats['avg_confidence']) if stats['avg_confidence'] else 0,
                    "first_detection": stats['first_detection'].isoformat() if stats['first_detection'] else None,
                    "last_detection": stats['last_detection'].isoformat() if stats['last_detection'] else None,
                    "emotion_distribution": [
                        {
                            "emotion": row['dominant_emotion'],
                            "count": row['count'],
                            "avg_confidence": float(row['avg_confidence'])
                        } for row in emotions
                    ],
                    "daily_trends": [
                        {
                            "date": row['date'].isoformat(),
                            "emotion": row['dominant_emotion'],
                            "count": row['count']
                        } for row in daily_trends
                    ]
                }
                
                logger.info(f"✅ Generated analytics for {days} days: {stats['total_detections']} detections")
                return analytics
                
        except Exception as e:
            logger.error(f"❌ Failed to get emotion analytics: {e}")
            return {}
    
    async def get_emotion_recommendations(self, emotion: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get product recommendations based on detected emotion"""
        try:
            async with self.get_connection() as conn:
                query = """
                SELECT 
                    id, name, category, price,
                    (emotion_scores->>$1)::DECIMAL(5,3) as emotion_score
                FROM products
                WHERE emotion_scores ? $1
                  AND (emotion_scores->>$1)::DECIMAL(5,3) > 0.5
                ORDER BY (emotion_scores->>$1)::DECIMAL(5,3) DESC
                LIMIT $2
                """
                
                rows = await conn.fetch(query, emotion, limit)
                
                recommendations = []
                for row in rows:
                    recommendations.append({
                        "id": str(row['id']),
                        "name": row['name'],
                        "category": row['category'],
                        "price": float(row['price']),
                        "emotion_score": float(row['emotion_score']),
                        "reason": f"Perfect for when you're feeling {emotion}"
                    })
                
                logger.info(f"✅ Generated {len(recommendations)} recommendations for emotion: {emotion}")
                return recommendations
                
        except Exception as e:
            logger.error(f"❌ Failed to get recommendations: {e}")
            return []
    
    async def test_connection(self) -> bool:
        """Test database connection"""
        try:
            async with self.get_connection() as conn:
                result = await conn.fetchrow("SELECT 1 as test")
                logger.info("✅ Database connection test successful")
                return True
        except Exception as e:
            logger.error(f"❌ Database connection test failed: {e}")
            return False

# Global database manager instance
db_manager = DatabaseManager()

# Utility functions
async def init_database():
    """Initialize database connection"""
    return await db_manager.init_pool()

async def cleanup_database():
    """Cleanup database connections"""
    await db_manager.close_pool()

# Export main functions
__all__ = [
    'db_manager',
    'EmotionDetection', 
    'Product',
    'init_database',
    'cleanup_database'
]

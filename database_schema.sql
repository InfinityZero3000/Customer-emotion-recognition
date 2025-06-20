-- Customer Emotion Recognition Database Schema
-- PostgreSQL Database Setup

-- Create database (run this manually if needed)
-- CREATE DATABASE emotion_recognition;

-- Connect to the database
\c emotion_recognition;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Emotion detections table (main data store)
CREATE TABLE IF NOT EXISTS emotion_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    
    -- Emotion data
    dominant_emotion VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,3) NOT NULL,
    
    -- All emotion scores (JSON)
    all_emotions JSONB NOT NULL,
    
    -- Face detection metadata
    num_faces INTEGER DEFAULT 1,
    face_box JSONB, -- Bounding box coordinates
    
    -- Processing metadata
    source VARCHAR(100) DEFAULT 'fer_model',
    processing_time_ms INTEGER,
    image_size VARCHAR(50),
    
    -- Timestamps
    detected_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products table (for recommendations)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2),
    image_url VARCHAR(500),
    
    -- Emotion targeting
    target_emotions JSONB, -- Array of emotions this product targets
    emotion_scores JSONB,  -- Scores for each emotion
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    
    -- Preference data
    preferred_categories JSONB,
    emotion_product_mapping JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Recommendations table (recommendation history)
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    emotion_detection_id UUID REFERENCES emotion_detections(id),
    
    -- Recommendation data
    recommended_products JSONB NOT NULL, -- Array of product IDs with scores
    algorithm_used VARCHAR(100),
    confidence_score DECIMAL(5,3),
    
    -- User interaction
    clicked_products JSONB, -- Track which products user clicked
    purchased_products JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics aggregation table (for performance)
CREATE TABLE IF NOT EXISTS emotion_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Time period
    date_period DATE NOT NULL,
    hour_period INTEGER, -- 0-23 for hourly stats
    
    -- Aggregated data
    total_detections INTEGER DEFAULT 0,
    emotion_counts JSONB NOT NULL, -- {"happy": 10, "sad": 5, ...}
    avg_confidence DECIMAL(5,3),
    
    -- User metrics
    unique_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique periods
    UNIQUE(date_period, hour_period)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emotion_detections_user_id ON emotion_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_detections_detected_at ON emotion_detections(detected_at);
CREATE INDEX IF NOT EXISTS idx_emotion_detections_dominant_emotion ON emotion_detections(dominant_emotion);
CREATE INDEX IF NOT EXISTS idx_emotion_detections_session_id ON emotion_detections(session_id);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_target_emotions ON products USING GIN(target_emotions);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at);

CREATE INDEX IF NOT EXISTS idx_emotion_analytics_date_period ON emotion_analytics(date_period);
CREATE INDEX IF NOT EXISTS idx_emotion_analytics_hour_period ON emotion_analytics(hour_period);

-- Insert sample products for testing
INSERT INTO products (name, category, subcategory, description, price, target_emotions, emotion_scores) VALUES
('Comfort Food Cookbook', 'Books', 'Cooking', 'Feel-good recipes for every mood', 24.99, 
 '["sad", "neutral"]', 
 '{"happy": 0.8, "sad": 0.9, "neutral": 0.7, "angry": 0.3, "fear": 0.4, "surprise": 0.5, "disgust": 0.2}'),

('Energizing Workout Gear', 'Sports', 'Fitness', 'Get your energy up with premium gear', 89.99,
 '["happy", "neutral"]',
 '{"happy": 0.9, "sad": 0.3, "neutral": 0.7, "angry": 0.6, "fear": 0.4, "surprise": 0.8, "disgust": 0.2}'),

('Calming Tea Collection', 'Food', 'Beverages', 'Relaxing herbal teas for peace of mind', 34.99,
 '["fear", "angry", "sad"]',
 '{"happy": 0.6, "sad": 0.8, "neutral": 0.9, "angry": 0.8, "fear": 0.9, "surprise": 0.3, "disgust": 0.5}'),

('Adventure Travel Guide', 'Books', 'Travel', 'Exciting destinations for thrill seekers', 19.99,
 '["surprise", "happy"]',
 '{"happy": 0.9, "sad": 0.2, "neutral": 0.5, "angry": 0.3, "fear": 0.4, "surprise": 0.9, "disgust": 0.2}'),

('Luxury Spa Kit', 'Beauty', 'Self-Care', 'Pamper yourself with premium spa products', 149.99,
 '["sad", "angry", "fear"]',
 '{"happy": 0.8, "sad": 0.9, "neutral": 0.8, "angry": 0.9, "fear": 0.8, "surprise": 0.4, "disgust": 0.6}')

ON CONFLICT DO NOTHING;

-- Create a sample user for testing
INSERT INTO users (name, email) VALUES 
('Test User', 'test@example.com')
ON CONFLICT (email) DO NOTHING;

-- Create views for easy analytics
CREATE OR REPLACE VIEW daily_emotion_summary AS
SELECT 
    DATE(detected_at) as date,
    dominant_emotion,
    COUNT(*) as detection_count,
    AVG(confidence) as avg_confidence,
    COUNT(DISTINCT user_id) as unique_users
FROM emotion_detections 
GROUP BY DATE(detected_at), dominant_emotion
ORDER BY date DESC, detection_count DESC;

CREATE OR REPLACE VIEW hourly_emotion_trends AS
SELECT 
    DATE(detected_at) as date,
    EXTRACT(HOUR FROM detected_at) as hour,
    dominant_emotion,
    COUNT(*) as detection_count,
    AVG(confidence) as avg_confidence
FROM emotion_detections 
GROUP BY DATE(detected_at), EXTRACT(HOUR FROM detected_at), dominant_emotion
ORDER BY date DESC, hour DESC, detection_count DESC;

-- Function to get emotion-based product recommendations
CREATE OR REPLACE FUNCTION get_emotion_recommendations(target_emotion TEXT, limit_count INTEGER DEFAULT 5)
RETURNS TABLE(
    product_id UUID,
    product_name VARCHAR(255),
    category VARCHAR(100),
    price DECIMAL(10,2),
    emotion_score DECIMAL(5,3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        (p.emotion_scores->>target_emotion)::DECIMAL(5,3) as emotion_score
    FROM products p
    WHERE p.emotion_scores ? target_emotion
      AND (p.emotion_scores->>target_emotion)::DECIMAL(5,3) > 0.5
    ORDER BY (p.emotion_scores->>target_emotion)::DECIMAL(5,3) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;

#!/bin/bash

# Vector Database Setup Script for PostgreSQL with pgvector
# This script sets up the database with vector capabilities for emotion embeddings

set -e

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-emotion_recognition}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

echo "Setting up vector database for emotion recognition..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql is not installed. Please install PostgreSQL client."
    exit 1
fi

# Check if database exists, create if not
echo "Checking database existence..."
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -w $DB_NAME | wc -l)

if [ $DB_EXISTS -eq 0 ]; then
    echo "Creating database $DB_NAME..."
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
fi

# Run migrations
echo "Running vector database migrations..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create emotion_embeddings table for vector similarity search
CREATE TABLE IF NOT EXISTS emotion_embeddings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    emotion_vector vector(512), -- 512-dimensional vector for emotion embeddings
    emotion_data JSONB NOT NULL, -- Store original emotion detection data
    dominant_emotion VARCHAR(50) NOT NULL,
    confidence FLOAT NOT NULL,
    metadata JSONB DEFAULT '{}', -- Additional metadata (device, location, etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key to users table
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS emotion_vector_idx 
ON emotion_embeddings USING ivfflat (emotion_vector vector_cosine_ops)
WITH (lists = 100);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_emotion_embeddings_user_id 
ON emotion_embeddings (user_id);

-- Create index for dominant emotion
CREATE INDEX IF NOT EXISTS idx_emotion_embeddings_dominant_emotion 
ON emotion_embeddings (dominant_emotion);

-- Create index for timestamp queries
CREATE INDEX IF NOT EXISTS idx_emotion_embeddings_created_at 
ON emotion_embeddings (created_at DESC);

-- Create user_emotion_patterns table for aggregated patterns
CREATE TABLE IF NOT EXISTS user_emotion_patterns (
    user_id VARCHAR(255) PRIMARY KEY,
    dominant_emotions JSONB DEFAULT '{}', -- Count of each dominant emotion
    emotion_frequency JSONB DEFAULT '{}', -- Average confidence for each emotion
    total_sessions INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key to users table
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create product_recommendations table
CREATE TABLE IF NOT EXISTS product_recommendations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    emotion VARCHAR(50) NOT NULL,
    product_categories JSONB NOT NULL, -- Array of recommended categories
    confidence_scores JSONB NOT NULL, -- Confidence for each category
    generated_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign key to users table
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create index for product recommendations
CREATE INDEX IF NOT EXISTS idx_product_recommendations_user_emotion 
ON product_recommendations (user_id, emotion);

-- Create emotion_sessions table for session tracking
CREATE TABLE IF NOT EXISTS emotion_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    total_detections INTEGER DEFAULT 0,
    dominant_session_emotion VARCHAR(50),
    session_metadata JSONB DEFAULT '{}',
    
    -- Foreign key to users table
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_emotion_sessions_user_id 
ON emotion_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_emotion_sessions_session_id 
ON emotion_sessions (session_id);

-- Function to update user emotion patterns
CREATE OR REPLACE FUNCTION update_user_emotion_pattern()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user emotion pattern
    INSERT INTO user_emotion_patterns (user_id, dominant_emotions, emotion_frequency, total_sessions, last_updated)
    VALUES (
        NEW.user_id,
        jsonb_build_object(NEW.dominant_emotion, 1),
        NEW.emotion_data->'emotions',
        1,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        dominant_emotions = COALESCE(user_emotion_patterns.dominant_emotions, '{}'::jsonb) || 
                           jsonb_build_object(
                               NEW.dominant_emotion, 
                               COALESCE((user_emotion_patterns.dominant_emotions->>NEW.dominant_emotion)::integer, 0) + 1
                           ),
        emotion_frequency = CASE 
            WHEN user_emotion_patterns.emotion_frequency IS NULL THEN NEW.emotion_data->'emotions'
            ELSE user_emotion_patterns.emotion_frequency || NEW.emotion_data->'emotions'
        END,
        total_sessions = user_emotion_patterns.total_sessions + 1,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user patterns when new emotion is detected
DROP TRIGGER IF EXISTS trigger_update_user_pattern ON emotion_embeddings;
CREATE TRIGGER trigger_update_user_pattern
    AFTER INSERT ON emotion_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_emotion_pattern();

-- Function to find similar emotions using vector similarity
CREATE OR REPLACE FUNCTION find_similar_emotions(
    input_vector vector(512),
    user_filter VARCHAR(255) DEFAULT NULL,
    similarity_threshold FLOAT DEFAULT 0.7,
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    user_id VARCHAR(255),
    dominant_emotion VARCHAR(50),
    confidence FLOAT,
    similarity FLOAT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.user_id,
        e.dominant_emotion,
        e.confidence,
        1 - (e.emotion_vector <=> input_vector) as similarity,
        e.created_at
    FROM emotion_embeddings e
    WHERE (user_filter IS NULL OR e.user_id = user_filter)
    AND (1 - (e.emotion_vector <=> input_vector)) >= similarity_threshold
    ORDER BY e.emotion_vector <=> input_vector
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user emotion statistics
CREATE OR REPLACE FUNCTION get_user_emotion_stats(input_user_id VARCHAR(255))
RETURNS TABLE (
    total_detections BIGINT,
    most_common_emotion VARCHAR(50),
    emotion_counts JSONB,
    avg_confidence FLOAT,
    first_detection TIMESTAMP,
    last_detection TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_detections,
        (
            SELECT e2.dominant_emotion
            FROM emotion_embeddings e2
            WHERE e2.user_id = input_user_id
            GROUP BY e2.dominant_emotion
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_common_emotion,
        (
            SELECT jsonb_object_agg(dominant_emotion, emotion_count)
            FROM (
                SELECT dominant_emotion, COUNT(*) as emotion_count
                FROM emotion_embeddings
                WHERE user_id = input_user_id
                GROUP BY dominant_emotion
            ) emotion_stats
        ) as emotion_counts,
        AVG(e.confidence) as avg_confidence,
        MIN(e.created_at) as first_detection,
        MAX(e.created_at) as last_detection
    FROM emotion_embeddings e
    WHERE e.user_id = input_user_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (optional)
INSERT INTO users (user_id, email) VALUES 
('test_user_1', 'test1@example.com'),
('test_user_2', 'test2@example.com')
ON CONFLICT (user_id) DO NOTHING;

-- Create sample views for analytics
CREATE OR REPLACE VIEW emotion_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    dominant_emotion,
    COUNT(*) as detection_count,
    AVG(confidence) as avg_confidence,
    COUNT(DISTINCT user_id) as unique_users
FROM emotion_embeddings
GROUP BY DATE_TRUNC('day', created_at), dominant_emotion
ORDER BY date DESC, detection_count DESC;

-- View for user emotion trends
CREATE OR REPLACE VIEW user_emotion_trends AS
SELECT 
    user_id,
    DATE_TRUNC('hour', created_at) as hour,
    dominant_emotion,
    COUNT(*) as detection_count,
    AVG(confidence) as avg_confidence
FROM emotion_embeddings
GROUP BY user_id, DATE_TRUNC('hour', created_at), dominant_emotion
ORDER BY user_id, hour DESC;

COMMIT;

EOF

echo "Vector database setup completed successfully!"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""
echo "Created tables:"
echo "  - users"
echo "  - emotion_embeddings (with vector index)"
echo "  - user_emotion_patterns"
echo "  - product_recommendations"
echo "  - emotion_sessions"
echo ""
echo "Created functions:"
echo "  - find_similar_emotions()"
echo "  - get_user_emotion_stats()"
echo "  - update_user_emotion_pattern() (trigger function)"
echo ""
echo "Created views:"
echo "  - emotion_analytics"
echo "  - user_emotion_trends"

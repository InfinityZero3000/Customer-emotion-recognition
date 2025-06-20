import { Pool, Client } from 'pg';
import { EmotionData } from '@repo/shared-types';

export interface EmotionEmbedding {
  id?: number;
  userId: string;
  emotionVector: number[];
  emotionData: EmotionData;
  dominantEmotion: string;
  confidence: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export interface SimilarEmotion {
  userId: string;
  dominantEmotion: string;
  confidence: number;
  similarity: number;
  createdAt: Date;
}

export interface UserEmotionStats {
  totalDetections: number;
  mostCommonEmotion: string;
  emotionCounts: Record<string, number>;
  avgConfidence: number;
  firstDetection: Date;
  lastDetection: Date;
}

export class VectorEmbeddingService {
  private pool: Pool;

  constructor(connectionConfig?: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  }) {
    const config = {
      host: connectionConfig?.host || process.env.DB_HOST || 'localhost',
      port: connectionConfig?.port || parseInt(process.env.DB_PORT || '5432'),
      database: connectionConfig?.database || process.env.DB_NAME || 'emotion_recognition',
      user: connectionConfig?.user || process.env.DB_USER || 'postgres',
      password: connectionConfig?.password || process.env.DB_PASSWORD || 'password',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    };

    this.pool = new Pool(config);
    
    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async initialize(): Promise<void> {
    try {
      const client = await this.pool.connect();
      
      // Test connection
      await client.query('SELECT NOW()');
      
      console.log('Vector database connection established');
      client.release();
    } catch (error) {
      console.error('Failed to connect to vector database:', error);
      throw error;
    }
  }

  async storeEmotionEmbedding(embedding: EmotionEmbedding): Promise<number> {
    const client = await this.pool.connect();
    
    try {
      // Ensure user exists
      await this.ensureUserExists(client, embedding.userId);
      
      // Generate vector embedding from emotion data
      const emotionVector = this.generateEmbeddingFromEmotion(embedding.emotionData);
      
      const query = `
        INSERT INTO emotion_embeddings (
          user_id, emotion_vector, emotion_data, dominant_emotion, 
          confidence, metadata, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `;
      
      const values = [
        embedding.userId,
        JSON.stringify(emotionVector), // Store as JSON, pgvector will handle conversion
        JSON.stringify(embedding.emotionData),
        embedding.dominantEmotion,
        embedding.confidence,
        JSON.stringify(embedding.metadata || {})
      ];
      
      const result = await client.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error('Error storing emotion embedding:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async findSimilarEmotions(
    emotionData: EmotionData,
    userId?: string,
    similarityThreshold: number = 0.7,
    limit: number = 10
  ): Promise<SimilarEmotion[]> {
    const client = await this.pool.connect();
    
    try {
      const emotionVector = this.generateEmbeddingFromEmotion(emotionData);
      
      const result = await client.query(
        'SELECT * FROM find_similar_emotions($1, $2, $3, $4)',
        [JSON.stringify(emotionVector), userId, similarityThreshold, limit]
      );
      
      return result.rows.map(row => ({
        userId: row.user_id,
        dominantEmotion: row.dominant_emotion,
        confidence: row.confidence,
        similarity: row.similarity,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error finding similar emotions:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserEmotionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<EmotionEmbedding[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          id, user_id, emotion_data, dominant_emotion, 
          confidence, metadata, created_at
        FROM emotion_embeddings
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await client.query(query, [userId, limit, offset]);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        emotionVector: [], // Don't return full vector for history
        emotionData: JSON.parse(row.emotion_data),
        dominantEmotion: row.dominant_emotion,
        confidence: row.confidence,
        metadata: JSON.parse(row.metadata || '{}'),
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error getting user emotion history:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserEmotionStats(userId: string): Promise<UserEmotionStats | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM get_user_emotion_stats($1)',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        totalDetections: parseInt(row.total_detections),
        mostCommonEmotion: row.most_common_emotion,
        emotionCounts: JSON.parse(row.emotion_counts || '{}'),
        avgConfidence: parseFloat(row.avg_confidence),
        firstDetection: row.first_detection,
        lastDetection: row.last_detection
      };
    } catch (error) {
      console.error('Error getting user emotion stats:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserEmotionPattern(userId: string): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT dominant_emotions, emotion_frequency, total_sessions, last_updated
        FROM user_emotion_patterns
        WHERE user_id = $1
      `;
      
      const result = await client.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return {
          dominantEmotions: {},
          emotionFrequency: {},
          totalSessions: 0,
          lastUpdated: new Date()
        };
      }
      
      const row = result.rows[0];
      return {
        dominantEmotions: JSON.parse(row.dominant_emotions || '{}'),
        emotionFrequency: JSON.parse(row.emotion_frequency || '{}'),
        totalSessions: row.total_sessions,
        lastUpdated: row.last_updated
      };
    } catch (error) {
      console.error('Error getting user emotion pattern:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async storeProductRecommendations(
    userId: string,
    emotion: string,
    categories: string[],
    confidenceScores: Record<string, number>
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await this.ensureUserExists(client, userId);
      
      const query = `
        INSERT INTO product_recommendations (
          user_id, emotion, product_categories, confidence_scores, generated_at
        )
        VALUES ($1, $2, $3, $4, NOW())
      `;
      
      await client.query(query, [
        userId,
        emotion,
        JSON.stringify(categories),
        JSON.stringify(confidenceScores)
      ]);
    } catch (error) {
      console.error('Error storing product recommendations:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getProductRecommendations(
    userId: string,
    emotion?: string,
    limit: number = 10
  ): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT emotion, product_categories, confidence_scores, generated_at
        FROM product_recommendations
        WHERE user_id = $1
      `;
      const params = [userId];
      
      if (emotion) {
        query += ' AND emotion = $2';
        params.push(emotion);
      }
      
      query += ' ORDER BY generated_at DESC LIMIT $' + (params.length + 1);
      params.push(limit.toString());
      
      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        emotion: row.emotion,
        categories: JSON.parse(row.product_categories),
        confidenceScores: JSON.parse(row.confidence_scores),
        generatedAt: row.generated_at
      }));
    } catch (error) {
      console.error('Error getting product recommendations:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensureUserExists(client: any, userId: string): Promise<void> {
    const checkQuery = 'SELECT user_id FROM users WHERE user_id = $1';
    const result = await client.query(checkQuery, [userId]);
    
    if (result.rows.length === 0) {
      const insertQuery = 'INSERT INTO users (user_id) VALUES ($1)';
      await client.query(insertQuery, [userId]);
    }
  }

  private generateEmbeddingFromEmotion(emotionData: EmotionData): number[] {
    // This is a simplified embedding generation
    // In a real implementation, you would use a proper ML model to generate embeddings
    
    const emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'];
    const embedding: number[] = new Array(512).fill(0);
    
    // Use emotion scores to create a basic embedding
    emotions.forEach((emotion, index) => {
      const score = emotionData.emotions?.[emotion as keyof typeof emotionData.emotions] || 0;
      const baseIndex = index * 73; // Spread emotions across the 512-dim vector
      
      for (let i = 0; i < 73 && baseIndex + i < 512; i++) {
        embedding[baseIndex + i] = score * Math.sin(i * 0.1) + Math.random() * 0.1;
      }
    });
    
    // Add dominant emotion influence
    const dominantIndex = emotions.indexOf(emotionData.dominantEmotion);
    if (dominantIndex >= 0) {
      const confidence = emotionData.confidence || 0;
      for (let i = 0; i < 50; i++) {
        if (i < embedding.length) {
          embedding[i] += confidence * 0.5;
        }
      }
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  async getEmotionAnalytics(
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT date, dominant_emotion, detection_count, avg_confidence, unique_users
        FROM emotion_analytics
      `;
      const params: any[] = [];
      
      if (startDate || endDate) {
        const conditions = [];
        if (startDate) {
          conditions.push(`date >= $${params.length + 1}`);
          params.push(startDate);
        }
        if (endDate) {
          conditions.push(`date <= $${params.length + 1}`);
          params.push(endDate);
        }
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ` ORDER BY date DESC, detection_count DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      
      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting emotion analytics:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default VectorEmbeddingService;

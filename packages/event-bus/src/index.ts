import { EventEmitter } from 'events';
import Redis from 'ioredis';

// Local emotion data interface to avoid circular dependencies
export interface EmotionData {
  dominant_emotion: string;
  confidence: number;
  emotions?: Record<string, number>;
  timestamp?: string;
}

export interface EmotionEvent {
  type: 'EMOTION_DETECTED' | 'PREDICTION_GENERATED' | 'RECOMMENDATION_UPDATED' | 'USER_PATTERN_UPDATED';
  userId: string;
  data: any;
  timestamp: number;
  sessionId?: string;
}

export interface EmotionStreamData {
  emotion: EmotionData;
  recommendations?: any[];
  userPattern?: any;
  timestamp: number;
}

export class EmotionEventBus extends EventEmitter {
  private redis: Redis;
  private isConnected: boolean = false;

  constructor(redisUrl?: string) {
    super();
    this.redis = new Redis(redisUrl || 'redis://localhost:6379');
    this.setupRedisConnection();
  }

  private setupRedisConnection() {
    this.redis.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to Redis for event bus');
    });

    this.redis.on('error', (error: Error) => {
      console.error('Redis connection error:', error);
      this.isConnected = false;
    });
  }

  async publishEmotionDetected(userId: string, emotion: EmotionData, sessionId?: string) {
    const event: EmotionEvent = {
      type: 'EMOTION_DETECTED',
      userId,
      data: emotion,
      timestamp: Date.now(),
      sessionId
    };

    // Emit locally
    this.emit('emotion:detected', event);

    // Publish to Redis for cross-service communication
    if (this.isConnected) {
      await this.redis.publish('emotion:events', JSON.stringify(event));
    }

    // Store in user emotion history
    await this.storeEmotionHistory(userId, emotion);

    // Trigger downstream services
    await this.triggerPredictionService(event);
    await this.updateUserProfile(event);

    return event;
  }

  async publishPredictionGenerated(userId: string, predictions: any[], sessionId?: string) {
    const event: EmotionEvent = {
      type: 'PREDICTION_GENERATED',
      userId,
      data: predictions,
      timestamp: Date.now(),
      sessionId
    };

    this.emit('prediction:generated', event);

    if (this.isConnected) {
      await this.redis.publish('emotion:events', JSON.stringify(event));
    }

    return event;
  }

  async publishRecommendationUpdated(userId: string, recommendations: any[], sessionId?: string) {
    const event: EmotionEvent = {
      type: 'RECOMMENDATION_UPDATED',
      userId,
      data: recommendations,
      timestamp: Date.now(),
      sessionId
    };

    this.emit('recommendation:updated', event);

    if (this.isConnected) {
      await this.redis.publish('emotion:events', JSON.stringify(event));
    }

    return event;
  }

  private async triggerPredictionService(event: EmotionEvent) {
    try {
      // In a real implementation, this would call the AI service
      // For now, we'll emit an event that the AI service can listen to
      this.emit('trigger:prediction', event);
    } catch (error) {
      console.error('Error triggering prediction service:', error);
    }
  }

  private async updateUserProfile(event: EmotionEvent) {
    try {
      // Update user emotion pattern in cache
      const userKey = `user:emotion_pattern:${event.userId}`;
      const existingPattern = await this.getUserEmotionPattern(event.userId);
      
      // Update pattern with new emotion data
      const updatedPattern = this.updateEmotionPattern(existingPattern, event.data);
      
      if (this.isConnected) {
        await this.redis.setex(userKey, 3600, JSON.stringify(updatedPattern)); // 1 hour TTL
      }

      // Emit pattern update event
      const patternEvent: EmotionEvent = {
        type: 'USER_PATTERN_UPDATED',
        userId: event.userId,
        data: updatedPattern,
        timestamp: Date.now(),
        sessionId: event.sessionId
      };

      this.emit('user:pattern_updated', patternEvent);
      
      if (this.isConnected) {
        await this.redis.publish('emotion:events', JSON.stringify(patternEvent));
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  private async storeEmotionHistory(userId: string, emotion: EmotionData) {
    try {
      const historyKey = `user:emotion_history:${userId}`;
      const emotionEntry = {
        ...emotion,
        timestamp: Date.now()
      };

      if (this.isConnected) {
        // Store in Redis list (keep last 100 entries)
        await this.redis.lpush(historyKey, JSON.stringify(emotionEntry));
        await this.redis.ltrim(historyKey, 0, 99); // Keep only last 100 entries
        await this.redis.expire(historyKey, 86400); // 24 hours TTL
      }
    } catch (error) {
      console.error('Error storing emotion history:', error);
    }
  }

  async getUserEmotionHistory(userId: string, limit: number = 20): Promise<EmotionData[]> {
    try {
      if (!this.isConnected) return [];

      const historyKey = `user:emotion_history:${userId}`;
      const history = await this.redis.lrange(historyKey, 0, limit - 1);
      
      return history.map((entry: string) => JSON.parse(entry));
    } catch (error) {
      console.error('Error getting emotion history:', error);
      return [];
    }
  }

  async getUserEmotionPattern(userId: string): Promise<any> {
    try {
      if (!this.isConnected) return this.getDefaultEmotionPattern();

      const userKey = `user:emotion_pattern:${userId}`;
      const pattern = await this.redis.get(userKey);
      
      return pattern ? JSON.parse(pattern) : this.getDefaultEmotionPattern();
    } catch (error) {
      console.error('Error getting user emotion pattern:', error);
      return this.getDefaultEmotionPattern();
    }
  }

  private getDefaultEmotionPattern() {
    return {
      dominantEmotions: {},
      emotionFrequency: {},
      lastUpdated: Date.now(),
      totalSessions: 0
    };
  }

  private updateEmotionPattern(existingPattern: any, newEmotion: EmotionData) {
    const pattern = { ...existingPattern };
    
    // Update dominant emotions count
    if (newEmotion.dominant_emotion) {
      pattern.dominantEmotions[newEmotion.dominant_emotion] = 
        (pattern.dominantEmotions[newEmotion.dominant_emotion] || 0) + 1;
    }

    // Update emotion frequency
    if (newEmotion.emotions) {
      Object.entries(newEmotion.emotions).forEach(([emotion, confidence]) => {
        if (!pattern.emotionFrequency[emotion]) {
          pattern.emotionFrequency[emotion] = { total: 0, count: 0 };
        }
        pattern.emotionFrequency[emotion].total += confidence as number;
        pattern.emotionFrequency[emotion].count += 1;
      });
    }

    pattern.lastUpdated = Date.now();
    pattern.totalSessions += 1;

    return pattern;
  }

  async subscribeToEvents(callback: (event: EmotionEvent) => void) {
    if (!this.isConnected) {
      console.warn('Redis not connected, only local events will be received');
      return;
    }

    const subscriber = new Redis(this.redis.options);
    await subscriber.subscribe('emotion:events');
    
    subscriber.on('message', (channel: string, message: string) => {
      if (channel === 'emotion:events') {
        try {
          const event = JSON.parse(message) as EmotionEvent;
          callback(event);
        } catch (error) {
          console.error('Error parsing event message:', error);
        }
      }
    });
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export default EmotionEventBus;

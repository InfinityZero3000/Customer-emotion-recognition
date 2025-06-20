import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EmotionData } from 'shared-types';
import { EmotionHistoryEntry, User } from '../entities';

@Injectable()
export class EmotionsService {
  constructor(
    @InjectRepository(EmotionHistoryEntry)
    private emotionHistoryRepository: Repository<EmotionHistoryEntry>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Ensure user exists, create if not
  private async ensureUserExists(userId: string): Promise<User> {
    let user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      user = this.userRepository.create({
        id: userId,
        preferences: {
          emotionTrackingEnabled: true,
          showPersonalizedRecommendations: true,
          theme: 'system',
        },
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  // Record a new emotion detection for a user
  async recordEmotion(
    userId: string, 
    emotionData: EmotionData, 
    pageUrl?: string, 
    contextItemId?: string
  ): Promise<EmotionHistoryEntry> {
    // Ensure user exists
    await this.ensureUserExists(userId);

    // Create a history entry
    const historyEntry = this.emotionHistoryRepository.create({
      userId,
      emotion: emotionData.dominantEmotion,
      confidence: emotionData.confidence,
      timestamp: new Date(emotionData.timestamp || new Date().toISOString()),
      pageUrl,
      contextItemId,
      allEmotions: emotionData.emotions,
      source: 'nestjs_api',
    });

    // Save to database
    return await this.emotionHistoryRepository.save(historyEntry);
  }

  // Get emotion history for a user
  async getEmotionHistory(userId: string, limit: number = 10): Promise<EmotionHistoryEntry[]> {
    return await this.emotionHistoryRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  // Get emotion statistics for a user
  async getEmotionStats(userId: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') {
    // Get the cutoff date based on the timeframe
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeframe) {
      case 'weekly':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        break;
      case 'monthly':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        break;
      case 'daily':
      default:
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        break;
    }

    // Get filtered history from database
    const filteredHistory = await this.emotionHistoryRepository.find({
      where: {
        userId,
        timestamp: Between(cutoffDate, now),
      },
      order: { timestamp: 'DESC' },
    });

    // Count occurrences of each emotion
    const emotionCounts: Record<string, number> = {};
    
    filteredHistory.forEach(entry => {
      if (emotionCounts[entry.emotion]) {
        emotionCounts[entry.emotion]++;
      } else {
        emotionCounts[entry.emotion] = 1;
      }
    });

    // Find the dominant emotion
    let dominantEmotion: string | null = null;
    let maxCount = 0;
    
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion;
      }
    }

    return {
      emotionCounts,
      dominantEmotion,
      timeframe,
      total: filteredHistory.length,
    };
  }
}

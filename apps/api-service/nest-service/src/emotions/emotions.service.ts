import { Injectable } from '@nestjs/common';
import { EmotionData, EmotionHistoryEntry } from 'shared-types';

@Injectable()
export class EmotionsService {
  // In-memory storage for demo purposes
  // In a real app, this would use a database
  private emotionHistory: Record<string, EmotionHistoryEntry[]> = {};

  // Record a new emotion detection for a user
  async recordEmotion(userId: string, emotionData: EmotionData, pageUrl?: string, contextItemId?: string): Promise<EmotionHistoryEntry> {
    // Create a history entry
    const historyEntry: EmotionHistoryEntry = {
      emotion: emotionData.dominantEmotion,
      confidence: emotionData.confidence,
      timestamp: emotionData.timestamp || new Date().toISOString(),
      pageUrl,
      contextItemId,
    };

    // Initialize the user's history array if it doesn't exist
    if (!this.emotionHistory[userId]) {
      this.emotionHistory[userId] = [];
    }

    // Add the entry to the user's history
    this.emotionHistory[userId].unshift(historyEntry);

    // For demo purposes, cap the history at 50 entries per user
    if (this.emotionHistory[userId].length > 50) {
      this.emotionHistory[userId] = this.emotionHistory[userId].slice(0, 50);
    }

    return historyEntry;
  }

  // Get emotion history for a user
  async getEmotionHistory(userId: string, limit: number = 10): Promise<EmotionHistoryEntry[]> {
    // Return empty array if user has no history
    if (!this.emotionHistory[userId]) {
      return [];
    }

    // Return the most recent entries up to the specified limit
    return this.emotionHistory[userId].slice(0, limit);
  }

  // Get emotion statistics for a user
  async getEmotionStats(userId: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'daily') {
    // Get the user's history
    if (!this.emotionHistory[userId]) {
      return {
        emotionCounts: {},
        dominantEmotion: null,
        timeframe,
      };
    }

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

    // Filter the history entries by timeframe
    const filteredHistory = this.emotionHistory[userId].filter(
      entry => new Date(entry.timestamp) >= cutoffDate
    );

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

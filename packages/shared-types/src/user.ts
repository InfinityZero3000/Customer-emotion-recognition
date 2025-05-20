export interface User {
  /** Unique identifier for the user */
  id: string;
  
  /** User email (if available) */
  email?: string;
  
  /** Display name */
  displayName?: string;
  
  /** ISO timestamp of when the user first visited */
  firstVisitAt: string;
  
  /** ISO timestamp of when the user last visited */
  lastVisitAt: string;
  
  /** User preferences */
  preferences?: UserPreferences;
  
  /** User's emotion history */
  emotionHistory?: EmotionHistoryEntry[];
}

export interface UserPreferences {
  /** Preferred product categories (if known) */
  preferredCategories?: string[];
  
  /** Whether the user has opted into emotion tracking */
  emotionTrackingEnabled: boolean;
  
  /** Whether to show personalized recommendations */
  showPersonalizedRecommendations: boolean;
  
  /** UI theme preference */
  theme?: 'light' | 'dark' | 'system';
}

// Using EmotionHistoryEntry from emotion.ts
import { EmotionHistoryEntry } from './emotion';

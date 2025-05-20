// This file contains local copies of the shared-types to avoid import issues
// Ideally, we would use the shared-types package directly

export type EmotionType = 'happy' | 'sad' | 'angry' | 'disgust' | 'fear' | 'surprise' | 'neutral' | 'unknown';

export interface EmotionData {
  /** Map of emotions to their confidence values (0-1) */
  emotions: Record<EmotionType, number>;
  
  /** The emotion with the highest confidence value */
  dominantEmotion: EmotionType;
  
  /** Confidence score for the dominant emotion (0-1) */
  confidence: number;
  
  /** ISO timestamp when the emotion was detected */
  timestamp: string;
}

export interface ProductCategory {
  /** Unique identifier for the category */
  id: string;
  
  /** Display name of the category */
  name: string;
  
  /** Optional category description */
  description?: string;
  
  /** Parent category ID (if applicable) */
  parentId?: string;
  
  /** URL path for the category (for routing) */
  slug: string;
  
  /** Image URL for the category */
  imageUrl?: string;
}

export interface ProductRecommendation {
  /** Array of recommended product categories */
  recommendedCategories: ProductCategory[];
  
  /** Reasoning behind the recommendations */
  reasoning: string;
  
  /** Confidence score for the recommendations (0-1) */
  confidenceScore: number;
  
  /** User ID for which the recommendations were generated */
  userId: string;
  
  /** ISO timestamp when the recommendations were generated */
  timestamp: string;
}

export interface UserInteraction {
  userId: string;
  itemId: string;
  interactionType: string;
  timestamp: string;
}

export interface ProductPreferenceRequest {
  /** User ID for which to generate recommendations */
  userId: string;
  
  /** Current detected emotions (if available) */
  currentEmotion?: Record<string, number>;
  
  /** Previous user interactions with products/categories */
  previousInteractions?: UserInteraction[];
  
  /** Current session context data */
  sessionContext?: Record<string, any>;
}

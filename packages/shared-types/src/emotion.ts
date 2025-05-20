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

export interface EmotionDetectionRequest {
  /** Base64 encoded image data (if applicable) */
  imageData?: string;
  
  /** User ID for tracking purposes */
  userId?: string;
  
  /** Session ID to associate with the emotion detection */
  sessionId?: string;
}

export interface EmotionDetectionResponse {
  /** The detected emotion data */
  emotionData: EmotionData;
  
  /** Optional processing metadata */
  metadata?: {
    processingTimeMs: number;
    modelVersion: string;
    detectionMethod: string;
  };
}

export interface EmotionHistoryEntry {
  /** The emotion detected */
  emotion: string;
  
  /** Confidence score for the emotion (0-1) */
  confidence: number;
  
  /** ISO timestamp when the emotion was detected */
  timestamp: string;
  
  /** URL of the page where the emotion was detected */
  pageUrl?: string;
  
  /** Optional ID of the item being viewed (product, article, etc.) */
  contextItemId?: string;
}

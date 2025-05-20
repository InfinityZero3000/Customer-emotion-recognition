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

export interface UserInteraction {
  /** Type of interaction (view, click, purchase, etc.) */
  type: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'favorite';
  
  /** Product or category ID that was interacted with */
  itemId: string;
  
  /** Whether the item is a product or category */
  itemType: 'product' | 'category';
  
  /** ISO timestamp when the interaction occurred */
  timestamp: string;
  
  /** Optional duration of the interaction in seconds */
  durationSec?: number;
  
  /** Optional additional data about the interaction */
  metadata?: Record<string, any>;
}

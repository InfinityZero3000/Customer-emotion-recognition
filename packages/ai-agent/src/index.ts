import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { EmotionData } from '@repo/shared-types';
import { VectorEmbeddingService } from '@repo/vector-db';

export interface ServiceRoute {
  service: 'product_recommendation' | 'user_analysis' | 'content_personalization' | 'mood_tracking';
  confidence: number;
  reasoning: string;
  parameters: Record<string, any>;
}

export interface EmotionContext {
  emotion: EmotionData;
  userId: string;
  sessionId?: string;
  userHistory?: any[];
  userPattern?: any;
  timestamp: number;
}

export interface AgentConfig {
  openaiApiKey?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

export class EmotionPredictionAgent {
  private vectorService: VectorEmbeddingService;
  private config: AgentConfig;
  private emotionToServiceMap: Record<string, string[]>;
  private confidenceThresholds: Record<string, number>;

  constructor(vectorService: VectorEmbeddingService, config: AgentConfig = {}) {
    this.vectorService = vectorService;
    this.config = {
      modelName: 'gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: 1000,
      ...config
    };

    // Define emotion to service routing map
    this.emotionToServiceMap = {
      happy: ['product_recommendation', 'content_personalization'],
      sad: ['mood_tracking', 'content_personalization', 'user_analysis'],
      angry: ['mood_tracking', 'user_analysis'],
      fear: ['mood_tracking', 'user_analysis'],
      surprise: ['product_recommendation', 'content_personalization'],
      disgust: ['user_analysis', 'mood_tracking'],
      neutral: ['product_recommendation', 'user_analysis']
    };

    // Define confidence thresholds for routing decisions
    this.confidenceThresholds = {
      product_recommendation: 0.7,
      user_analysis: 0.5,
      content_personalization: 0.6,
      mood_tracking: 0.8
    };
  }

  async routeToService(context: EmotionContext): Promise<ServiceRoute[]> {
    try {
      // Get user context from vector database
      const [userPattern, userHistory, similarEmotions] = await Promise.all([
        this.vectorService.getUserEmotionPattern(context.userId),
        this.vectorService.getUserEmotionHistory(context.userId, 10),
        this.vectorService.findSimilarEmotions(context.emotion, context.userId, 0.8, 5)
      ]);

      // Enhance context with additional data
      const enhancedContext = {
        ...context,
        userPattern,
        userHistory,
        similarEmotions
      };

      // Generate routing decisions
      const routes = await this.generateRoutingDecisions(enhancedContext);
      
      // Filter by confidence thresholds
      const filteredRoutes = routes.filter(route => 
        route.confidence >= (this.confidenceThresholds[route.service] || 0.5)
      );

      return filteredRoutes.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error in service routing:', error);
      // Fallback to basic routing
      return this.getFallbackRouting(context);
    }
  }

  private async generateRoutingDecisions(context: EmotionContext): Promise<ServiceRoute[]> {
    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(`You are an AI agent that routes user emotions to appropriate services for an e-commerce platform.

Available services:
1. product_recommendation - Recommend products based on emotional state
2. user_analysis - Analyze user behavior patterns and emotional trends
3. content_personalization - Personalize website content and layout
4. mood_tracking - Track and monitor user emotional wellness

Your task is to analyze the user's emotional context and determine which services should be activated, with what confidence level, and what parameters to pass.

Respond in JSON format with an array of service routes:
[
  {
    "service": "service_name",
    "confidence": 0.0-1.0,
    "reasoning": "explanation",
    "parameters": {"key": "value"}
  }
]`),
      new HumanMessage(`
Current Emotion Analysis:
- Dominant Emotion: ${context.emotion.dominantEmotion}
- Confidence: ${context.emotion.confidence}
- Full Emotion Breakdown: ${JSON.stringify(context.emotion.emotions)}
- User ID: ${context.userId}
- Timestamp: ${new Date(context.timestamp).toISOString()}

User Context:
- Total Sessions: ${context.userPattern?.totalSessions || 0}
- Most Common Emotions: ${JSON.stringify(context.userPattern?.dominantEmotions || {})}
- Recent History: ${context.userHistory?.length || 0} recent detections
- Similar Users: ${context.userPattern?.similarUsers?.length || 0} users with similar emotions

Please analyze this emotional context and route to appropriate services.`)
    ]);

    try {
      // For demo purposes, we'll use rule-based routing
      // In production, you would integrate with OpenAI or another LLM
      return this.getRuleBasedRouting(context);
    } catch (error) {
      console.error('Error generating routing decisions:', error);
      return this.getFallbackRouting(context);
    }
  }

  private getRuleBasedRouting(context: EmotionContext): ServiceRoute[] {
    const routes: ServiceRoute[] = [];
    const emotion = context.emotion.dominantEmotion;
    const confidence = context.emotion.confidence || 0;

    // Product Recommendation Logic
    if (['happy', 'surprise', 'neutral'].includes(emotion) && confidence > 0.6) {
      routes.push({
        service: 'product_recommendation',
        confidence: confidence * 0.9,
        reasoning: `High confidence ${emotion} emotion suggests user is in good mood for product discovery`,
        parameters: {
          emotion_category: this.getProductCategoryForEmotion(emotion),
          user_pattern: context.userPattern,
          price_sensitivity: this.getPriceSensitivity(emotion)
        }
      });
    }

    // User Analysis Logic
    if (context.userHistory && context.userHistory.length > 5) {
      const recentEmotions = context.userHistory.slice(0, 5);
      const emotionalVariability = this.calculateEmotionalVariability(recentEmotions);
      
      if (emotionalVariability > 0.5) {
        routes.push({
          service: 'user_analysis',
          confidence: 0.8,
          reasoning: 'High emotional variability detected, user analysis recommended',
          parameters: {
            analysis_type: 'emotional_pattern',
            variability_score: emotionalVariability,
            recent_emotions: recentEmotions.map(h => h.dominantEmotion)
          }
        });
      }
    }

    // Content Personalization Logic
    if (confidence > 0.7) {
      routes.push({
        service: 'content_personalization',
        confidence: confidence * 0.8,
        reasoning: `High confidence emotion detection enables precise content personalization`,
        parameters: {
          personalization_type: this.getPersonalizationType(emotion),
          emotion_intensity: confidence,
          content_filters: this.getContentFilters(emotion)
        }
      });
    }

    // Mood Tracking Logic
    if (['sad', 'angry', 'fear'].includes(emotion) || this.detectEmotionalConcern(context)) {
      routes.push({
        service: 'mood_tracking',
        confidence: 0.9,
        reasoning: 'Negative emotion or concerning pattern detected, mood tracking activated',
        parameters: {
          tracking_type: 'wellness_monitoring',
          concern_level: this.assessConcernLevel(context),
          support_resources: true
        }
      });
    }

    return routes;
  }

  private getFallbackRouting(context: EmotionContext): ServiceRoute[] {
    // Basic fallback routing when advanced analysis fails
    const emotion = context.emotion.dominantEmotion;
    const services = this.emotionToServiceMap[emotion] || ['user_analysis'];
    
    return services.map(service => ({
      service: service as any,
      confidence: 0.5,
      reasoning: 'Fallback routing based on emotion mapping',
      parameters: { emotion, fallback: true }
    }));
  }

  private getProductCategoryForEmotion(emotion: string): string[] {
    const categoryMap: Record<string, string[]> = {
      happy: ['entertainment', 'food', 'books', 'toys', 'travel'],
      surprise: ['tech', 'gadgets', 'novelty', 'gifts', 'experiences'],
      neutral: ['general', 'popular', 'trending', 'recommended'],
      sad: ['comfort', 'books', 'music', 'self-care', 'home'],
      angry: ['sports', 'fitness', 'games', 'stress-relief'],
      fear: ['security', 'comfort', 'health', 'insurance']
    };
    
    return categoryMap[emotion] || categoryMap.neutral;
  }

  private getPriceSensitivity(emotion: string): 'low' | 'medium' | 'high' {
    const sensitivityMap: Record<string, 'low' | 'medium' | 'high'> = {
      happy: 'low',
      surprise: 'medium',
      neutral: 'medium',
      sad: 'high',
      angry: 'high',
      fear: 'high'
    };
    
    return sensitivityMap[emotion] || 'medium';
  }

  private getPersonalizationType(emotion: string): string {
    const typeMap: Record<string, string> = {
      happy: 'celebratory',
      sad: 'comforting',
      angry: 'calming',
      fear: 'reassuring',
      surprise: 'exciting',
      neutral: 'balanced'
    };
    
    return typeMap[emotion] || 'balanced';
  }

  private getContentFilters(emotion: string): string[] {
    const filterMap: Record<string, string[]> = {
      happy: ['positive', 'bright', 'energetic'],
      sad: ['calm', 'muted', 'gentle'],
      angry: ['cool', 'minimal', 'structured'],
      fear: ['safe', 'familiar', 'trusted'],
      surprise: ['dynamic', 'colorful', 'engaging'],
      neutral: ['clean', 'professional', 'balanced']
    };
    
    return filterMap[emotion] || filterMap.neutral;
  }

  private calculateEmotionalVariability(history: any[]): number {
    if (history.length < 2) return 0;
    
    const emotions = history.map(h => h.dominantEmotion);
    const uniqueEmotions = new Set(emotions).size;
    
    return uniqueEmotions / emotions.length;
  }

  private detectEmotionalConcern(context: EmotionContext): boolean {
    const negativeEmotions = ['sad', 'angry', 'fear', 'disgust'];
    
    // Check if recent history shows concerning pattern
    if (context.userHistory) {
      const recentNegative = context.userHistory
        .slice(0, 5)
        .filter(h => negativeEmotions.includes(h.dominantEmotion));
      
      return recentNegative.length >= 3; // 3 out of last 5 are negative
    }
    
    return negativeEmotions.includes(context.emotion.dominantEmotion) && 
           (context.emotion.confidence || 0) > 0.8;
  }

  private assessConcernLevel(context: EmotionContext): 'low' | 'medium' | 'high' {
    const confidence = context.emotion.confidence || 0;
    const negativeEmotions = ['sad', 'angry', 'fear'];
    
    if (negativeEmotions.includes(context.emotion.dominantEmotion)) {
      if (confidence > 0.9) return 'high';
      if (confidence > 0.7) return 'medium';
    }
    
    return 'low';
  }

  async generateProductRecommendations(
    emotion: EmotionData,
    userId: string,
    parameters: Record<string, any> = {}
  ): Promise<any[]> {
    try {
      // Get similar users and their preferences
      const similarEmotions = await this.vectorService.findSimilarEmotions(emotion, undefined, 0.8, 10);
      
      // Get categories for this emotion
      const categories = this.getProductCategoryForEmotion(emotion.dominantEmotion);
      
      // Generate mock recommendations (in production, integrate with product API)
      const recommendations = categories.map(category => ({
        category,
        confidence: Math.random() * 0.3 + 0.7,
        products: this.generateMockProducts(category, parameters.price_sensitivity || 'medium'),
        reasoning: `Recommended based on ${emotion.dominantEmotion} emotion with ${(emotion.confidence * 100).toFixed(1)}% confidence`
      }));

      // Store recommendations in vector database
      await this.vectorService.storeProductRecommendations(
        userId,
        emotion.dominantEmotion,
        categories,
        recommendations.reduce((acc, rec) => ({ ...acc, [rec.category]: rec.confidence }), {})
      );

      return recommendations;
    } catch (error) {
      console.error('Error generating product recommendations:', error);
      return [];
    }
  }

  private generateMockProducts(category: string, priceSensitivity: string): any[] {
    const basePrice = priceSensitivity === 'low' ? 50 : priceSensitivity === 'medium' ? 25 : 15;
    
    return Array.from({ length: 3 }, (_, i) => ({
      id: Math.floor(Math.random() * 10000),
      name: `${category} product ${i + 1}`,
      price: basePrice + Math.floor(Math.random() * basePrice),
      category,
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0 rating
      image: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`
    }));
  }

  async close(): Promise<void> {
    // Cleanup resources if needed
    await this.vectorService.close();
  }
}

export default EmotionPredictionAgent;

import { Injectable } from '@nestjs/common';
import { EmotionData } from 'shared-types';
import { ProductsService } from '../products/products.service';
import { EmotionsService } from '../emotions/emotions.service';
import { Product } from '../entities';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly emotionsService: EmotionsService,
  ) {}

  // Get product recommendations based on emotion and user history
  async getProductRecommendations(
    userId: string,
    emotionData?: EmotionData,
    limit: number = 10
  ): Promise<{
    products: Product[];
    reasoning: string;
    confidence: number;
    emotion?: string;
  }> {
    let targetEmotion = 'neutral';
    let confidence = 0.5;
    let reasoning = 'General recommendations based on popular products';

    // Use provided emotion data or get latest from user history
    if (emotionData) {
      targetEmotion = emotionData.dominantEmotion;
      confidence = emotionData.confidence;
      reasoning = `Recommendations based on detected emotion: ${targetEmotion} (${Math.round(confidence * 100)}% confidence)`;
    } else {
      // Get user's recent emotion history to determine preferences
      const recentHistory = await this.emotionsService.getEmotionHistory(userId, 5);
      if (recentHistory.length > 0) {
        // Use most recent emotion
        const latestEmotion = recentHistory[0];
        targetEmotion = latestEmotion.emotion;
        confidence = latestEmotion.confidence;
        reasoning = `Recommendations based on your recent emotion: ${targetEmotion}`;
      }
    }

    // Get emotion-based product recommendations
    const products = await this.productsService.getRecommendations(
      targetEmotion,
      userId,
      limit
    );

    return {
      products,
      reasoning,
      confidence,
      emotion: targetEmotion,
    };
  }

  // Get product categories recommendations based on emotion
  async getRecommendedCategories(userId: string, emotionData: EmotionData): Promise<{
    userId: string;
    recommendedCategories: string[];
    reasoning: string;
    timestamp: string;
  }> {
    const { dominantEmotion } = emotionData;
    
    // Get emotion-based products to determine popular categories
    const emotionProducts = await this.productsService.getProductsByEmotion(dominantEmotion);
    
    // Extract categories from emotion-based products
    const emotionCategories = [...new Set(emotionProducts.map(p => p.category))];
    
    // If we don't have enough emotion-specific categories, add popular ones
    let recommendedCategories = emotionCategories;
    if (recommendedCategories.length < 4) {
      const allProducts = await this.productsService.getAllProducts();
      const allCategories = [...new Set(allProducts.map(p => p.category))];
      
      // Add categories not already included
      const additionalCategories = allCategories.filter(
        cat => !recommendedCategories.includes(cat)
      );
      recommendedCategories = [...recommendedCategories, ...additionalCategories].slice(0, 4);
    }

    // Create reasoning based on emotion
    let reasoning = '';
    switch (dominantEmotion) {
      case 'happy':
        reasoning = 'Based on your happy mood, we recommend these categories that might enhance your positive energy!';
        break;
      case 'sad':
        reasoning = 'These categories contain products that might help comfort and uplift your mood.';
        break;
      case 'angry':
        reasoning = 'These categories offer products that might help you relax and manage stress.';
        break;
      case 'surprise':
        reasoning = 'Since you seem surprised, explore these exciting categories for new discoveries!';
        break;
      case 'fear':
        reasoning = 'These categories contain comforting and reassuring products.';
        break;
      case 'disgust':
        reasoning = 'These carefully curated categories might offer products you\'ll find appealing.';
        break;
      default:
        reasoning = 'Here are some popular categories we think you might enjoy browsing.';
    }

    return {
      userId,
      recommendedCategories,
      reasoning,
      timestamp: new Date().toISOString(),
    };
  }

  // Get personalized recommendations based on user history
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<{
    products: Product[];
    reasoning: string;
    basedOn: string[];
  }> {
    // Get user's emotion history
    const emotionHistory = await this.emotionsService.getEmotionHistory(userId, 20);
    
    if (emotionHistory.length === 0) {
      // New user - return popular products
      const products = await this.productsService.getAllProducts();
      return {
        products: products.slice(0, limit),
        reasoning: 'Popular products for new users',
        basedOn: ['popularity'],
      };
    }

    // Analyze user's emotional patterns
    const emotionCounts = emotionHistory.reduce((acc, entry) => {
      acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top emotions
    const topEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);

    // Get recommendations for each top emotion
    const recommendationPromises = topEmotions.map(emotion =>
      this.productsService.getProductsByEmotion(emotion)
    );

    const emotionProducts = await Promise.all(recommendationPromises);
    const allRecommendations = emotionProducts.flat();

    // Remove duplicates and sort by rating
    const uniqueProducts = allRecommendations
      .filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    return {
      products: uniqueProducts,
      reasoning: `Recommendations based on your emotional patterns: ${topEmotions.join(', ')}`,
      basedOn: topEmotions,
    };
  }

  // Get trending products that match current emotion
  async getTrendingRecommendations(
    emotion: string,
    limit: number = 5
  ): Promise<Product[]> {
    // Get products that match the emotion and have high ratings
    const emotionProducts = await this.productsService.getProductsByEmotion(emotion);
    return emotionProducts
      .filter(product => product.rating >= 4.0)
      .slice(0, limit);
  }

  // Get all available product categories
  async getAllCategories(): Promise<string[]> {
    const allProducts = await this.productsService.getAllProducts();
    return [...new Set(allProducts.map(p => p.category))];
  }

  // Get emotion-based shopping insights for analytics
  async getEmotionInsights(userId: string): Promise<{
    topEmotions: string[];
    preferredCategories: string[];
    emotionHistory: any[];
    insights: string[];
  }> {
    const emotionHistory = await this.emotionsService.getEmotionHistory(userId, 50);
    
    if (emotionHistory.length === 0) {
      return {
        topEmotions: [],
        preferredCategories: [],
        emotionHistory: [],
        insights: ['No emotion data available yet.'],
      };
    }

    // Analyze emotional patterns
    const emotionCounts = emotionHistory.reduce((acc, entry) => {
      acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion);

    // Get preferred categories based on emotions
    const categoryPromises = topEmotions.map(emotion =>
      this.productsService.getProductsByEmotion(emotion)
    );
    const emotionProducts = await Promise.all(categoryPromises);
    const allCategories = emotionProducts.flat().map(p => p.category);
    const categoryFrequency = allCategories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredCategories = Object.entries(categoryFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    // Generate insights
    const insights = [
      `Your most common emotion is "${topEmotions[0]}" (${Math.round((emotionCounts[topEmotions[0]] / emotionHistory.length) * 100)}% of the time)`,
      `You tend to prefer products in these categories: ${preferredCategories.slice(0, 3).join(', ')}`,
      `Total emotion records: ${emotionHistory.length}`,
    ];

    return {
      topEmotions,
      preferredCategories,
      emotionHistory: emotionHistory.slice(0, 10), // Return recent 10
      insights,
    };
  }
}

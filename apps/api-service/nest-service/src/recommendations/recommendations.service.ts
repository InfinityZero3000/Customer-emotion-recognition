import { Injectable } from '@nestjs/common';
import { EmotionData, ProductCategory } from '../types';

@Injectable()
export class RecommendationsService {
  private readonly mockCategories: ProductCategory[] = [
    {
      id: '1',
      name: 'Electronics',
      description: 'Latest gadgets and tech accessories',
      slug: 'electronics',
      imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1650&q=80',
    },
    {
      id: '2',
      name: 'Clothing',
      description: 'Stylish apparel for all occasions',
      slug: 'clothing',
      imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    },
    {
      id: '3',
      name: 'Home & Kitchen',
      description: 'Everything for your home',
      slug: 'home-kitchen',
      imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1968&q=80',
    },
    {
      id: '4',
      name: 'Beauty & Personal Care',
      description: 'Self-care and beauty products',
      slug: 'beauty-personal-care',
      imageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1888&q=80',
    },
    {
      id: '5',
      name: 'Books',
      description: 'Books for all interests',
      slug: 'books',
      imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2090&q=80',
    },
    {
      id: '6',
      name: 'Sports & Outdoors',
      description: 'Gear for active lifestyles',
      slug: 'sports-outdoors',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    },
    {
      id: '7',
      name: 'Toys & Games',
      description: 'Fun for all ages',
      slug: 'toys-games',
      imageUrl: 'https://images.unsplash.com/photo-1536846511313-4b07b637b5e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80',
    },
  ];

  // Get recommendations based on user emotion
  async getRecommendedCategories(userId: string, emotionData: EmotionData) {
    // In a real implementation, we would:
    // 1. Get the user's browsing/purchase history from a database
    // 2. Combine that with the emotional state to create a better recommendation
    // 3. Train and use a machine learning model for recommendations
    
    // For this demo, we'll use a simple rule-based system
    const { dominantEmotion } = emotionData;
    
    let filteredRecommendations: ProductCategory[] = [];
    let reasoning = '';
    
    switch (dominantEmotion) {
      case 'happy':
        filteredRecommendations = [
          this.mockCategories.find(c => c.id === '2')!, // Clothing
          this.mockCategories.find(c => c.id === '6')!, // Sports & Outdoors
          this.mockCategories.find(c => c.id === '7')!, // Toys & Games
          this.mockCategories.find(c => c.id === '1')!, // Electronics
        ];
        reasoning = 'Based on your happy mood, we think you might enjoy browsing these energetic and fun categories!';
        break;
        
      case 'sad':
        filteredRecommendations = [
          this.mockCategories.find(c => c.id === '5')!, // Books
          this.mockCategories.find(c => c.id === '3')!, // Home & Kitchen
          this.mockCategories.find(c => c.id === '4')!, // Beauty & Personal Care
          this.mockCategories.find(c => c.id === '7')!, // Toys & Games
        ];
        reasoning = 'These comforting categories might help improve your mood.';
        break;
        
      case 'angry':
        filteredRecommendations = [
          this.mockCategories.find(c => c.id === '6')!, // Sports & Outdoors
          this.mockCategories.find(c => c.id === '4')!, // Beauty & Personal Care
          this.mockCategories.find(c => c.id === '3')!, // Home & Kitchen
          this.mockCategories.find(c => c.id === '5')!, // Books
        ];
        reasoning = 'These categories offer relaxing and stress-relieving products that might help ease tension.';
        break;
        
      case 'surprise':
        filteredRecommendations = [
          this.mockCategories.find(c => c.id === '1')!, // Electronics
          this.mockCategories.find(c => c.id === '7')!, // Toys & Games
          this.mockCategories.find(c => c.id === '2')!, // Clothing
          this.mockCategories.find(c => c.id === '6')!, // Sports & Outdoors
        ];
        reasoning = 'Since you seem surprised, we thought you might enjoy discovering our innovative and exciting categories!';
        break;
        
      case 'neutral':
      default:
        filteredRecommendations = this.mockCategories.slice(0, 4); // First 4 categories
        reasoning = 'Here are some of our popular categories we thought you might enjoy browsing.';
        break;
    }
    
    return {
      userId,
      recommendedCategories: filteredRecommendations,
      reasoning,
      timestamp: new Date().toISOString(),
    };
  }

  // Get all available product categories
  async getAllCategories() {
    return this.mockCategories;
  }
}

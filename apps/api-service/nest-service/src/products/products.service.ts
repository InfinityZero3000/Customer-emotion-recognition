import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Get all products
  async getAllProducts(): Promise<Product[]> {
    return await this.productRepository.find({
      where: { isActive: true },
      order: { rating: 'DESC', createdAt: 'DESC' },
    });
  }

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { category, isActive: true },
      order: { rating: 'DESC' },
    });
  }

  // Get products by emotion
  async getProductsByEmotion(emotion: string): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.emotionTags @> :emotion', { emotion: JSON.stringify([emotion]) })
      .orderBy('product.rating', 'DESC')
      .getMany();
  }

  // Get product recommendations based on emotion and user history
  async getRecommendations(
    emotion: string,
    userId: string,
    limit: number = 10
  ): Promise<Product[]> {
    // For now, simple emotion-based recommendations
    // In future, this can include collaborative filtering and user history
    const emotionProducts = await this.getProductsByEmotion(emotion);
    
    if (emotionProducts.length >= limit) {
      return emotionProducts.slice(0, limit);
    }

    // If not enough emotion-specific products, fill with popular products
    const popularProducts = await this.productRepository.find({
      where: { isActive: true },
      order: { rating: 'DESC' },
      take: limit - emotionProducts.length,
    });

    return [...emotionProducts, ...popularProducts].slice(0, limit);
  }

  // Seed initial products (for development)
  async seedProducts(): Promise<void> {
    const existingCount = await this.productRepository.count();
    
    if (existingCount > 0) {
      return; // Already seeded
    }

    const seedProducts = [
      {
        name: 'Energizing Workout Gear',
        description: 'High-quality workout equipment to boost your energy and motivation',
        category: 'Sports & Fitness',
        price: 89.99,
        imageUrl: '/images/workout-gear.jpg',
        emotionTags: ['happy', 'energetic', 'motivated'],
        rating: 4.5,
      },
      {
        name: 'Comfort Food Cookbook',
        description: 'Delicious recipes to lift your spirits and warm your heart',
        category: 'Books',
        price: 24.99,
        imageUrl: '/images/cookbook.jpg',
        emotionTags: ['sad', 'nostalgic', 'comfort'],
        rating: 4.3,
      },
      {
        name: 'Adventure Travel Guide',
        description: 'Explore amazing destinations and create unforgettable memories',
        category: 'Travel',
        price: 34.99,
        imageUrl: '/images/travel-guide.jpg',
        emotionTags: ['surprise', 'excited', 'curious'],
        rating: 4.7,
      },
      {
        name: 'Meditation & Mindfulness Kit',
        description: 'Find peace and tranquility with this complete mindfulness set',
        category: 'Wellness',
        price: 49.99,
        imageUrl: '/images/meditation-kit.jpg',
        emotionTags: ['calm', 'peaceful', 'neutral'],
        rating: 4.6,
      },
      {
        name: 'Stress Relief Essential Oils',
        description: 'Natural aromatherapy to help manage stress and anxiety',
        category: 'Health & Beauty',
        price: 29.99,
        imageUrl: '/images/essential-oils.jpg',
        emotionTags: ['anxious', 'stressed', 'overwhelmed'],
        rating: 4.4,
      },
    ];

    for (const productData of seedProducts) {
      const product = this.productRepository.create(productData);
      await this.productRepository.save(product);
    }
  }
}

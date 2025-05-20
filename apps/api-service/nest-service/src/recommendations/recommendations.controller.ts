import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { EmotionData } from 'shared-types';

class RecommendationRequest {
  userId: string;
  currentEmotion: EmotionData;
}

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post('predict-preferences')
  @ApiOperation({ summary: 'Get product recommendations based on emotional state' })
  @ApiResponse({ status: 200, description: 'Returns recommended product categories based on emotion' })
  async getRecommendations(@Body() request: RecommendationRequest) {
    return this.recommendationsService.getRecommendedCategories(
      request.userId,
      request.currentEmotion
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: 200, description: 'Returns all available product categories' })
  async getAllCategories() {
    return {
      categories: await this.recommendationsService.getAllCategories(),
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get recommendations for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user-specific recommendations' })
  async getUserRecommendations(@Param('userId') userId: string) {
    // In a real implementation, this would get the user's previous emotion data
    // and browsing history to create personalized recommendations
    
    // For now, we'll use a neutral emotion as a fallback
    const neutralEmotion: EmotionData = {
      emotions: {
        happy: 0.1,
        sad: 0.1,
        angry: 0.1,
        disgust: 0.1,
        fear: 0.1,
        surprise: 0.1,
        neutral: 0.4,
        unknown: 0
      },
      dominantEmotion: 'neutral',
      confidence: 0.4,
      timestamp: new Date().toISOString()
    };
    
    return this.recommendationsService.getRecommendedCategories(userId, neutralEmotion);
  }
}

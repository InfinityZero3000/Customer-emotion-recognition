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

  @Post('products')
  @ApiOperation({ summary: 'Get product recommendations based on emotion' })
  @ApiResponse({ status: 200, description: 'Returns recommended products based on emotion' })
  async getProductRecommendations(
    @Body() request: RecommendationRequest,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.recommendationsService.getProductRecommendations(
      request.userId,
      request.currentEmotion,
      limitNum
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
  @ApiOperation({ summary: 'Get recommendations for a specific user based on history' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recommendations' })
  @ApiResponse({ status: 200, description: 'Returns user-specific recommendations' })
  async getUserRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.recommendationsService.getPersonalizedRecommendations(userId, limitNum);
  }

  @Get('user/:userId/insights')
  @ApiOperation({ summary: 'Get emotion-based shopping insights for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user emotion insights and preferences' })
  async getUserInsights(@Param('userId') userId: string) {
    return this.recommendationsService.getEmotionInsights(userId);
  }

  @Get('trending/:emotion')
  @ApiOperation({ summary: 'Get trending products for a specific emotion' })
  @ApiParam({ name: 'emotion', description: 'Emotion name' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products to return' })
  @ApiResponse({ status: 200, description: 'Returns trending products for the emotion' })
  async getTrendingByEmotion(
    @Param('emotion') emotion: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return {
      emotion,
      products: await this.recommendationsService.getTrendingRecommendations(emotion, limitNum),
    };
  }
}

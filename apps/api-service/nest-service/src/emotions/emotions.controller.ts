import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EmotionsService } from './emotions.service';
import { EmotionData } from 'shared-types';

class RecordEmotionRequest {
  userId: string;
  emotionData: EmotionData;
  pageUrl?: string;
  contextItemId?: string;
}

@ApiTags('emotions')
@Controller('emotions')
export class EmotionsController {
  constructor(private readonly emotionsService: EmotionsService) {}

  @Post('record')
  @ApiOperation({ summary: 'Record an emotion detection' })
  @ApiResponse({ status: 201, description: 'Emotion recorded successfully' })
  async recordEmotion(@Body() request: RecordEmotionRequest) {
    const historyEntry = await this.emotionsService.recordEmotion(
      request.userId,
      request.emotionData,
      request.pageUrl,
      request.contextItemId
    );

    return {
      success: true,
      entry: historyEntry,
    };
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get emotion history for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of entries to return' })
  @ApiResponse({ status: 200, description: 'Returns emotion history' })
  async getEmotionHistory(
    @Param('userId') userId: string,
    @Query('limit') limit?: number
  ) {
    const history = await this.emotionsService.getEmotionHistory(
      userId,
      limit ? parseInt(limit.toString(), 10) : 10
    );

    return {
      userId,
      emotionHistory: history,
    };
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get emotion statistics for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Timeframe for statistics (daily, weekly, monthly)' })
  @ApiResponse({ status: 200, description: 'Returns emotion statistics' })
  async getEmotionStats(
    @Param('userId') userId: string,
    @Query('timeframe') timeframe?: 'daily' | 'weekly' | 'monthly'
  ) {
    const stats = await this.emotionsService.getEmotionStats(
      userId,
      timeframe || 'daily'
    );

    return {
      userId,
      ...stats,
    };
  }
}

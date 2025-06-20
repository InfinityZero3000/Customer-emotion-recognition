import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from '../entities';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Returns all active products' })
  async getAllProducts(): Promise<Product[]> {
    return this.productsService.getAllProducts();
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Returns products in the specified category' })
  async getProductsByCategory(@Param('category') category: string): Promise<Product[]> {
    return this.productsService.getProductsByCategory(category);
  }

  @Get('emotion/:emotion')
  @ApiOperation({ summary: 'Get products by emotion' })
  @ApiResponse({ status: 200, description: 'Returns products suitable for the specified emotion' })
  async getProductsByEmotion(@Param('emotion') emotion: string): Promise<Product[]> {
    return this.productsService.getProductsByEmotion(emotion);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get personalized product recommendations' })
  @ApiResponse({ status: 200, description: 'Returns personalized product recommendations' })
  async getRecommendations(
    @Query('emotion') emotion: string,
    @Query('userId') userId: string,
    @Query('limit') limit?: string
  ): Promise<Product[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productsService.getRecommendations(emotion, userId, limitNum);
  }

  @Get('seed')
  @ApiOperation({ summary: 'Seed initial products (development only)' })
  @ApiResponse({ status: 200, description: 'Seeds initial products for development' })
  async seedProducts(): Promise<{ message: string }> {
    await this.productsService.seedProducts();
    return { message: 'Products seeded successfully' };
  }
}

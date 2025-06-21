import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { ProductsModule } from '../products/products.module';
import { EmotionsModule } from '../emotions/emotions.module';

@Module({
  imports: [ProductsModule, EmotionsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}

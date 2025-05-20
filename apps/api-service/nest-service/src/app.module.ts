import { Module } from '@nestjs/common';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { EmotionsModule } from './emotions/emotions.module';

@Module({
  imports: [
    RecommendationsModule,
    EmotionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

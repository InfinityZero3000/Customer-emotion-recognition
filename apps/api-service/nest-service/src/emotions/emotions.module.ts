import { Module } from '@nestjs/common';
import { EmotionsController } from './emotions.controller';
import { EmotionsService } from './emotions.service';

@Module({
  controllers: [EmotionsController],
  providers: [EmotionsService],
  exports: [EmotionsService],
})
export class EmotionsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmotionsController } from './emotions.controller';
import { EmotionsService } from './emotions.service';
import { EmotionHistoryEntry, User } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([EmotionHistoryEntry, User])],
  controllers: [EmotionsController],
  providers: [EmotionsService],
  exports: [EmotionsService],
})
export class EmotionsModule {}

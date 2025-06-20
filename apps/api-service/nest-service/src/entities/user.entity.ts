import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { EmotionHistoryEntry } from './emotion.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  displayName?: string;

  @CreateDateColumn()
  firstVisitAt: Date;

  @UpdateDateColumn()
  lastVisitAt: Date;

  @Column('json', { nullable: true })
  preferences: {
    preferredCategories?: string[];
    emotionTrackingEnabled: boolean;
    showPersonalizedRecommendations: boolean;
    theme?: 'light' | 'dark' | 'system';
  } | null;

  @OneToMany(() => EmotionHistoryEntry, emotion => emotion.user)
  emotionHistory: EmotionHistoryEntry[];
}

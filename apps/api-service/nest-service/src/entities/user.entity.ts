import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { EmotionHistoryEntry } from './emotion.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

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

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('emotion_history')
export class EmotionHistoryEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  emotion: string;

  @Column('float')
  confidence: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  pageUrl?: string;

  @Column({ nullable: true })
  contextItemId?: string;

  @Column('json', { nullable: true })
  allEmotions?: Record<string, number>;

  @Column({ nullable: true })
  source?: string; // 'fer_model_real', 'mock', etc.

  @ManyToOne(() => User, user => user.emotionHistory)
  @JoinColumn({ name: 'userId' })
  user: User;
}

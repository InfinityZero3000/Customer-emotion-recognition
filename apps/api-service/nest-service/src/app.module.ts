import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { EmotionsModule } from './emotions/emotions.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './config/database.config';
import { User, EmotionHistoryEntry, Product } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'emotion_recognition',
        entities: [User, EmotionHistoryEntry, Product],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    AuthModule,
    RecommendationsModule,
    EmotionsModule,
    ProductsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ProductsService } from './products/products.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'https://your-production-url.com' 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Configure Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Emotion Recognition API')
    .setDescription('API for customer emotion recognition and product recommendation')
    .setVersion('1.0')
    .addTag('emotions')
    .addTag('recommendations')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Seed initial data
  try {
    const productsService = app.get(ProductsService);
    await productsService.seedProducts();
    console.log('✅ Initial product data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding initial data:', error.message);
  }

  // Start the server
  const port = process.env.API_PORT || 3001;
  const host = process.env.API_HOST || 'localhost';
  await app.listen(port, host);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);
  console.log(`📚 API Documentation available at: ${await app.getUrl()}/api`);
}

bootstrap();

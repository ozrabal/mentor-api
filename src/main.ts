import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(configService));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors();

  // Swagger Documentation (only in non-production environments)
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Mentor API')
      .setDescription(
        'API for AI-powered mock interview preparation. Parses job descriptions, generates tailored interviews, scores answers, and predicts interview success probability.',
      )
      .setVersion('1.0.0')
      .addServer(`http://localhost:${port}`, 'Development')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('health', 'Health check endpoints')
      .addTag('auth', 'Authentication endpoints')
      .addTag('job-profiles', 'Job profile management')
      .addTag('interviews', 'Interview session management')
      .addTag('reports', 'Interview reports')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();


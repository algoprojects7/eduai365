import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from '@eduai365/config';
import { AppModule } from './app.module';

process.env.DATABASE_URL = process.env.DATABASE_URL ?? config.databaseUrl;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: [
      config.appUrl,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:6006',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('eduAI365 API')
    .setDescription('Multi-Tenant K-12 School Operating System — API Gateway')
    .setVersion('0.2.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & sessions')
    .addTag('tenants', 'School tenants')
    .addTag('school-admin', 'School admin portal (tenant-scoped)')
    .addTag('students', 'Student records — deprecated; use school-admin')
    .addTag('platform', 'Super Admin platform management')
    .addTag('teacher', 'Teacher portal')
    .addTag('student', 'Student portal')
    .addTag('parent', 'Parent portal')
    .addTag('notifications', 'In-app notifications')
    .addTag('ai', 'AI copilot, insights, and predictions')
    .addTag('integrations', 'Webhooks, GPS, SMS, WhatsApp')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.apiPort);
  console.log(`eduAI365 API Gateway running on ${config.apiUrl}`);
  console.log(`Swagger docs: ${config.apiUrl}/docs`);
}

bootstrap();

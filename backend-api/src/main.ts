import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // Tắt body parser mặc định (100KB) để cấu hình dung lượng 10MB gọn gàng, an toàn
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Giới hạn payload 10MB tối ưu cho ảnh CCCD từ điện thoại
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Cho phép CORS cho Expo / React Native
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Tiền tố API v1
  app.setGlobalPrefix('api/v1');

  // Tự động validate DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Tài liệu OpenAPI Swagger
  const config = new DocumentBuilder()
    .setTitle('JobFlash Core API')
    .setDescription('Hệ thống máy chủ thời gian thực JobFlash - Kết nối việc tức thì')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 JobFlash Backend đang chạy tại http://localhost:${port}/api/v1`);
  console.log(`🌐 Truy cập từ điện thoại qua mạng LAN: http://192.168.4.10:${port}/api/v1`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api-docs`);
}

bootstrap();

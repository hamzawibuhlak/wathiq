import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });

    // Global prefix (exclude uploads for static file serving)
    app.setGlobalPrefix('api', {
        exclude: ['/uploads/(.*)'],
    });

    // CORS configuration
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Global Exception Filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global Logging Interceptor
    app.useGlobalInterceptors(new LoggingInterceptor());

    // Global Validation Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            validationError: {
                target: false,
                value: false,
            },
        }),
    );

    // Swagger setup with enhanced UI
    const config = new DocumentBuilder()
        .setTitle('Watheeq API')
        .setDescription(`
# 📚 Watheeq - Law Office Management System API

نظام **وثيق** لإدارة المكاتب القانونية

## 🔐 Authentication
جميع الـ endpoints (ما عدا /auth/register و /auth/login) تتطلب JWT token.

أرسل الـ token في الـ header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## 🏢 Multi-Tenancy
كل البيانات معزولة حسب المكتب (tenantId).
الـ tenantId يُستخرج تلقائياً من JWT token.

## 📋 Response Format
\`\`\`json
{
  "data": { ... },
  "message": "Success message",
  "meta": { "page": 1, "limit": 10, "total": 100 }
}
\`\`\`

## ⚠️ Error Format
\`\`\`json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "BadRequest",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
\`\`\`
    `)
        .setVersion('1.0.0')
        .setContact('Watheeq Team', '', 'support@watheeq.sa')
        .setLicense('Proprietary', '')
        .addServer('http://localhost:3000', 'Development Server')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'أدخل الـ JWT token الذي حصلت عليه من /auth/login',
                in: 'header',
            },
            'JWT-auth',
        )
        .addTag('Auth', '🔐 تسجيل الدخول والتسجيل')
        .addTag('Users', '👥 إدارة المستخدمين')
        .addTag('Tenants', '🏢 إعدادات المكتب')
        .addTag('Clients', '👤 إدارة العملاء')
        .addTag('Cases', '⚖️ إدارة القضايا')
        .addTag('Hearings', '📅 إدارة الجلسات')
        .addTag('Documents', '📄 إدارة المستندات')
        .addTag('Invoices', '💰 إدارة الفواتير')
        .addTag('Dashboard', '📊 لوحة التحكم')
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'Watheeq API Docs',
        customfavIcon: '/favicon.ico',
        customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .info .title { color: #1a56db }
    `,
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none',
            filter: true,
            showRequestDuration: true,
        },
    });

    // Start server
    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
    logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();

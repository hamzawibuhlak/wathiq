import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './common/prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'API Root' })
  getRoot() {
    return {
      status: 'ok',
      message: 'Watheeq API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health Check' })
  async getHealth() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: 'ok',
        database: dbStatus,
      },
    };
  }

  @Get('api')
  @ApiOperation({ summary: 'API Info' })
  getApiInfo() {
    return {
      status: 'ok',
      name: 'Watheeq API',
      version: '1.0.0',
      description: 'نظام وثيق لإدارة المكاتب القانونية',
    };
  }

  @Get('api/health')
  @ApiOperation({ summary: 'API Health Check' })
  async getApiHealth() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        api: 'ok',
        database: dbStatus,
      },
    };
  }
}

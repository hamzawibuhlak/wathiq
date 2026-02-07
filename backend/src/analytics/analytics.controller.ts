import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { AnalyticsService } from './analytics.service';
import { UserRole } from '@prisma/client';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.LAWYER)
  @ApiOperation({ summary: 'إحصائيات لوحة التحكم الشاملة' })
  @ApiQuery({ name: 'period', enum: ['week', 'month', 'year'], required: false })
  getDashboard(
    @TenantId() tenantId: string,
    @Query('period') period?: 'week' | 'month' | 'year',
  ) {
    return this.analyticsService.getDashboardAnalytics(tenantId, period || 'month');
  }

  @Get('lawyers/performance')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'تقرير أداء المحامين' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getLawyerPerformance(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.analyticsService.getLawyerPerformance(tenantId, start, end);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'ADMIN', 'LAWYER')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) { }

  @Get('overview')
  @ApiOperation({ summary: 'Get comprehensive analytics overview' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiQuery({ name: 'caseType', required: false, description: 'Filter by case type' })
  @ApiQuery({ name: 'lawyer', required: false, description: 'Filter by lawyer ID' })
  async getOverview(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('caseType') caseType?: string,
    @Query('lawyer') lawyer?: string,
  ) {
    const filters: any = {};

    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    if (caseType) filters.caseType = caseType;
    if (lawyer) filters.lawyer = lawyer;

    return this.analyticsService.getOverview(user.tenantId, filters);
  }

  @Get('cases')
  @ApiOperation({ summary: 'Get cases analytics only' })
  async getCasesAnalytics(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};

    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const overview = await this.analyticsService.getOverview(user.tenantId, filters);
    return overview.cases;
  }

  @Get('financial')
  @ApiOperation({ summary: 'Get financial analytics only' })
  async getFinancialAnalytics(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};

    if (startDate && endDate) {
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const overview = await this.analyticsService.getOverview(user.tenantId, filters);
    return overview.financial;
  }

  @Get('clients')
  @ApiOperation({ summary: 'Get clients analytics only' })
  async getClientsAnalytics(@CurrentUser() user: User) {
    const overview = await this.analyticsService.getOverview(user.tenantId);
    return overview.clients;
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get team performance analytics' })
  async getPerformanceAnalytics(@CurrentUser() user: User) {
    const overview = await this.analyticsService.getOverview(user.tenantId);
    return overview.performance;
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get 12-month trends' })
  async getTrendsAnalytics(@CurrentUser() user: User) {
    const overview = await this.analyticsService.getOverview(user.tenantId);
    return overview.trends;
  }

  @Get('kpi')
  @ApiOperation({ summary: 'Get key performance indicators summary' })
  async getKPISummary(@CurrentUser() user: User) {
    const overview = await this.analyticsService.getOverview(user.tenantId);

    return {
      totalCases: overview.cases.total,
      closureRate: overview.cases.closureRate,
      averageCaseDuration: overview.cases.averageDuration,
      totalRevenue: overview.financial.total.amount,
      paidRevenue: overview.financial.paid.amount,
      pendingRevenue: overview.financial.pending.amount,
      overdueRevenue: overview.financial.overdue.amount,
      paymentSuccessRate: overview.financial.paymentSuccessRate,
      totalClients: overview.clients.total,
      activeClients: overview.clients.active,
      retentionRate: overview.clients.retentionRate,
      averageCasesPerClient: overview.clients.averageCasesPerClient,
      averageRevenuePerClient: overview.clients.averageRevenuePerClient,
      topPerformer: overview.performance.topPerformer,
    };
  }
}

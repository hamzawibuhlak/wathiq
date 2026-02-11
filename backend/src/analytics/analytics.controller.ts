import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { DashboardService } from '../dashboard/dashboard.service';
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
  constructor(
    private analyticsService: AnalyticsService,
    private dashboardService: DashboardService,
  ) { }

  // ── Dashboard (comprehensive, used by frontend performance page) ──
  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive analytics dashboard' })
  @ApiQuery({ name: 'period', required: false, description: 'Period: week, month, year' })
  async getDashboard(
    @CurrentUser() user: User,
    @Query('period') period: string = 'month',
  ) {
    const now = new Date();
    let startDate: Date;
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const overview = await this.analyticsService.getOverview(user.tenantId!, {
      dateRange: { start: startDate, end: now },
    });

    const statsResult = await this.dashboardService.getStats(user.tenantId!, user.id, user.role);
    const topClientsResult = await this.dashboardService.getTopClients(user.tenantId!);
    const s = statsResult?.data;
    const tc = topClientsResult?.data || [];

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      cases: {
        total: overview.cases?.total || 0,
        growth: 0,
        byStatus: overview.cases?.byStatus || [],
        byType: overview.cases?.byType || [],
        byPriority: [],
        recentlyClosed: 0,
        avgCaseDuration: overview.cases?.averageDuration || 0,
        closureRate: overview.cases?.closureRate || 0,
        totalAllCases: s?.cases?.total || 0,
        totalClosedCases: s?.cases?.closed || 0,
      },
      hearings: {
        total: s?.hearings?.total || 0,
        upcoming: s?.hearings?.upcoming || 0,
        past: 0,
        today: s?.hearings?.today || 0,
        thisWeek: s?.hearings?.thisWeek || 0,
        byStatus: [],
        attendanceRate: 0,
      },
      financial: {
        totalRevenue: s?.invoices?.totalRevenue || 0,
        revenueGrowth: 0,
        pending: s?.invoices?.pendingAmount || 0,
        overdue: 0,
        totalInvoices: s?.invoices?.total || 0,
        byStatus: [],
      },
      clients: {
        total: s?.clients?.total || 0,
        newClients: 0,
        activeClients: s?.clients?.active || 0,
        byType: [],
      },
      trends: {
        cases: overview.trends?.cases || [],
        hearings: [],
        revenue: overview.trends?.revenue || [],
      },
      topClients: tc,
      topInvoices: [],
      documents: {
        total: 0,
        totalSizeBytes: 0,
        totalSizeMB: 0,
        byType: [],
        recentDocs: [],
      },
      tasks: {
        total: 0,
        tasksInPeriod: 0,
        completionRate: 0,
        overdueTasks: 0,
        byStatus: [],
        byUser: [],
        recentTasks: [],
      },
    };
  }

  // ── Lawyers Performance ──
  @Get('lawyers/performance')
  @ApiOperation({ summary: 'Get lawyer performance metrics' })
  async getLawyerPerformance(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getLawyerPerformance(user.tenantId!);
  }

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

    return this.analyticsService.getOverview(user.tenantId!, filters);
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

    const overview = await this.analyticsService.getOverview(user.tenantId!, filters);
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

    const overview = await this.analyticsService.getOverview(user.tenantId!, filters);
    return overview.financial;
  }

  @Get('clients')
  @ApiOperation({ summary: 'Get clients analytics only' })
  async getClientsAnalytics(@CurrentUser() user: User) {
    const overview = await this.analyticsService.getOverview(user.tenantId!);
    return overview.clients;
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get team performance analytics' })
  async getPerformanceAnalytics(@CurrentUser() user: User) {
    const overview = await this.analyticsService.getOverview(user.tenantId!);
    return overview.performance;
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get 12-month trends' })
  async getTrendsAnalytics(@CurrentUser() user: User) {
    const overview = await this.analyticsService.getOverview(user.tenantId!);
    return overview.trends;
  }

  @Get('kpi')
  @ApiOperation({ summary: 'Get key performance indicators summary' })
  async getKPISummary(@CurrentUser() user: User) {
    const overview = await this.analyticsService.getOverview(user.tenantId!);

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

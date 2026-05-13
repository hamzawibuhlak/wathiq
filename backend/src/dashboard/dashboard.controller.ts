import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    @ApiOperation({ summary: 'الحصول على إحصائيات لوحة التحكم الشاملة' })
    @ApiResponse({ status: 200, description: 'إحصائيات لوحة التحكم' })
    async getStats(

        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.dashboardService.getStats(userId, userRole);
    }

    @Get('upcoming-hearings')
    @ApiOperation({ summary: 'الحصول على الجلسات القادمة' })
    @ApiResponse({ status: 200, description: 'الجلسات القادمة' })
    @ApiQuery({ name: 'days', required: false, description: 'عدد الأيام (افتراضي: 7)' })
    async getUpcomingHearings(

        @Query('days') days?: number,
        @CurrentUser('id') userId?: string,
        @CurrentUser('role') userRole?: UserRole,
    ) {
        return this.dashboardService.getUpcomingHearings(days, userId, userRole);
    }

    @Get('recent-cases')
    @ApiOperation({ summary: 'الحصول على القضايا الأخيرة' })
    @ApiResponse({ status: 200, description: 'القضايا الأخيرة' })
    @ApiQuery({ name: 'limit', required: false, description: 'عدد القضايا (افتراضي: 5)' })
    async getRecentCases(

        @Query('limit') limit?: number,
    ) {
        return this.dashboardService.getRecentCases(limit);
    }

    @Get('recent-activity')
    @ApiOperation({ summary: 'الحصول على النشاط الأخير' })
    @ApiResponse({ status: 200, description: 'النشاط الأخير' })
    async getRecentActivity(

        @CurrentUser('id') userId: string,
        @CurrentUser('role') userRole: UserRole,
    ) {
        return this.dashboardService.getRecentActivity(userId, userRole);
    }

    // ============ ANALYTICS CHARTS ENDPOINTS ============

    @Get('cases-trend')
    @ApiOperation({ summary: 'الحصول على اتجاه القضايا آخر 12 شهر' })
    @ApiResponse({ status: 200, description: 'اتجاه القضايا' })
    async getCasesTrend() {
        return this.dashboardService.getCasesTrend();
    }

    @Get('revenue-trend')
    @ApiOperation({ summary: 'الحصول على اتجاه الإيرادات آخر 12 شهر' })
    @ApiResponse({ status: 200, description: 'اتجاه الإيرادات' })
    async getRevenueTrend() {
        return this.dashboardService.getRevenueTrend();
    }

    @Get('cases-by-type')
    @ApiOperation({ summary: 'الحصول على توزيع القضايا حسب النوع' })
    @ApiResponse({ status: 200, description: 'توزيع القضايا' })
    async getCasesByType() {
        return this.dashboardService.getCasesByTypeChart();
    }

    @Get('top-clients')
    @ApiOperation({ summary: 'الحصول على أكثر العملاء نشاطاً' })
    @ApiResponse({ status: 200, description: 'أكثر العملاء' })
    @ApiQuery({ name: 'limit', required: false, description: 'عدد العملاء (افتراضي: 5)' })
    async getTopClients(

        @Query('limit') limit?: number,
    ) {
        return this.dashboardService.getTopClients(limit || 5);
    }

    @Get('lawyer-performance')
    @ApiOperation({ summary: 'الحصول على أداء المحامين' })
    @ApiResponse({ status: 200, description: 'أداء المحامين' })
    async getLawyerPerformance() {
        return this.dashboardService.getLawyerPerformance();
    }

    @Get('overdue-tasks')
    @ApiOperation({ summary: 'الحصول على المهام المتأخرة' })
    @ApiResponse({ status: 200, description: 'المهام المتأخرة' })
    @ApiQuery({ name: 'limit', required: false, description: 'عدد المهام (افتراضي: 5)' })
    async getOverdueTasks(

        @Query('limit') limit?: number,
    ) {
        return this.dashboardService.getOverdueTasks(limit || 5);
    }
}

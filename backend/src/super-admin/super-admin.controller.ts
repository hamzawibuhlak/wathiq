import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { SuperAdmin } from '../auth/decorators/super-admin.decorator';
import { SuperAdminService } from './super-admin.service';

@SuperAdmin()
@Controller('super-admin')
export class SuperAdminController {
    constructor(private svc: SuperAdminService) { }

    // Dashboard
    @Get('dashboard')
    getDashboard() { return this.svc.getDashboardStats(); }

    @Get('revenue/analytics')
    getRevenue(@Query('months') months?: string) { return this.svc.getRevenueAnalytics(months ? +months : 12); }

    // Tenants
    @Get('tenants')
    getTenants(@Query('status') status?: string, @Query('search') search?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.svc.getAllTenants({ status, search, page: page ? +page : 1, limit: limit ? +limit : 20 });
    }

    @Get('tenants/:id')
    getTenant(@Param('id') id: string) { return this.svc.getTenantDetails(id); }

    @Patch('tenants/:id/suspend')
    suspend(@Param('id') id: string, @Body('reason') reason: string, @Body('adminId') adminId: string) {
        return this.svc.suspendTenant(id, adminId, reason);
    }

    @Patch('tenants/:id/activate')
    activate(@Param('id') id: string, @Body('adminId') adminId: string) {
        return this.svc.activateTenant(id, adminId);
    }

    @Delete('tenants/:id')
    deleteTenant(@Param('id') id: string, @Body('adminId') adminId: string) {
        return this.svc.deleteTenant(id, adminId);
    }

    // Subscriptions
    @Patch('tenants/:id/plan')
    changePlan(@Param('id') id: string, @Body('planId') planId: string, @Body('adminId') adminId: string) {
        return this.svc.changeTenantPlan(id, adminId, planId);
    }

    @Patch('tenants/:id/extend-trial')
    extendTrial(@Param('id') id: string, @Body('days') days: number, @Body('adminId') adminId: string) {
        return this.svc.extendTrial(id, adminId, days);
    }

    // Plans
    @Get('plans')
    getPlans() { return this.svc.getPlans(); }

    @Post('plans')
    createPlan(@Body() data: any) { return this.svc.createPlan(data, data.adminId); }

    @Patch('plans/:id')
    updatePlan(@Param('id') id: string, @Body() data: any) { return this.svc.updatePlan(id, data, data.adminId); }

    // Feature Flags
    @Get('feature-flags')
    getFlags() { return this.svc.getFeatureFlags(); }

    @Patch('feature-flags/:key')
    toggleFlag(@Param('key') key: string, @Body() data: { isEnabled: boolean; enabledFor?: string[]; adminId: string }) {
        return this.svc.toggleFeatureFlag(key, data.adminId, data.isEnabled, data.enabledFor);
    }

    // System Health
    @Get('system/health')
    getHealth() { return this.svc.getSystemHealth(); }

    // Announcements
    @Get('announcements')
    getAnnouncements() { return this.svc.getAnnouncements(); }

    @Post('announcements')
    createAnnouncement(@Body() data: any) { return this.svc.createAnnouncement(data.adminId, data); }

    // Audit Logs
    @Get('audit-logs')
    getAuditLogs(@Query('tenantId') tenantId?: string, @Query('action') action?: string, @Query('page') page?: string) {
        return this.svc.getAuditLogs({ tenantId, action, page: page ? +page : 1 });
    }
}

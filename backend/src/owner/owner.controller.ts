import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OwnerOnly } from '../auth/decorators/owner.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { OwnerService } from './owner.service';

@ApiTags('Owner Panel')
@ApiBearerAuth()
@OwnerOnly()
@Controller('owner')
export class OwnerController {
    constructor(private ownerService: OwnerService) { }

    // ── Dashboard Stats ────────────────────────
    @Get('dashboard')
    getDashboard(@TenantId() tenantId: string) {
        return this.ownerService.getDashboardStats(tenantId);
    }

    // ── Company Profile ────────────────────────
    @Get('company')
    getCompanyProfile(@TenantId() tenantId: string) {
        return this.ownerService.getCompanyProfile(tenantId);
    }

    @Patch('company')
    updateCompanyProfile(@TenantId() tenantId: string, @Body() data: any) {
        return this.ownerService.updateCompanyProfile(tenantId, data);
    }

    // ── Users & Roles ──────────────────────────
    @Get('users')
    getUsers(@TenantId() tenantId: string) {
        return this.ownerService.getTenantUsers(tenantId);
    }

    @Post('users/invite')
    inviteUser(
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
        @Body() data: { name: string; email: string; role: string; tenantRoleId?: string; title?: string },
    ) {
        return this.ownerService.inviteUser(tenantId, user.id, data as any);
    }

    @Patch('users/:id/role')
    changeRole(
        @Param('id') id: string,
        @TenantId() tenantId: string,
        @Body('role') role: string,
    ) {
        return this.ownerService.changeUserRole(id, tenantId, role as any);
    }

    @Patch('users/:id/toggle')
    toggleUser(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.ownerService.toggleUserStatus(id, tenantId);
    }

    @Delete('users/:id')
    deleteUser(
        @Param('id') id: string,
        @TenantId() tenantId: string,
        @CurrentUser() user: any,
    ) {
        return this.ownerService.deleteUser(id, tenantId, user.id);
    }

    @Patch('users/:id')
    updateUser(
        @Param('id') id: string,
        @TenantId() tenantId: string,
        @Body() data: { name?: string; role?: string; tenantRoleId?: string | null; title?: string | null },
    ) {
        return this.ownerService.updateUser(id, tenantId, data);
    }

    // ── Integrations ───────────────────────────
    @Get('integrations')
    getIntegrations(@TenantId() tenantId: string) {
        return this.ownerService.getIntegrations(tenantId);
    }

    @Post('integrations/:type')
    saveIntegration(
        @Param('type') type: string,
        @TenantId() tenantId: string,
        @Body() config: any,
    ) {
        return this.ownerService.saveIntegration(tenantId, type, config);
    }

    @Post('integrations/:type/test')
    testIntegration(@Param('type') type: string, @TenantId() tenantId: string) {
        return this.ownerService.testIntegration(tenantId, type);
    }

    @Patch('integrations/:type/toggle')
    toggleIntegration(@Param('type') type: string, @TenantId() tenantId: string) {
        return this.ownerService.toggleIntegration(tenantId, type);
    }

    // ── Workflows ──────────────────────────────
    @Get('workflows')
    getWorkflows(@TenantId() tenantId: string) {
        return this.ownerService.getWorkflows(tenantId);
    }

    @Post('workflows')
    createWorkflow(
        @TenantId() tenantId: string,
        @Body() data: any,
    ) {
        return this.ownerService.createWorkflow(tenantId, data);
    }

    @Patch('workflows/:id/toggle')
    toggleWorkflow(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.ownerService.toggleWorkflow(id, tenantId);
    }

    @Delete('workflows/:id')
    deleteWorkflow(@Param('id') id: string, @TenantId() tenantId: string) {
        return this.ownerService.deleteWorkflow(id, tenantId);
    }

    // ── Billing & Usage ────────────────────────
    @Get('billing')
    getBilling(@TenantId() tenantId: string) {
        return this.ownerService.getBillingInfo(tenantId);
    }

    @Get('usage')
    getUsage(@TenantId() tenantId: string) {
        return this.ownerService.getUsageStats(tenantId);
    }

    // ── Job Titles (المسميات الوظيفية) ─────────
    @Get('job-titles')
    getJobTitles(@TenantId() tenantId: string) {
        return this.ownerService.getJobTitles(tenantId);
    }

    @Post('job-titles')
    createJobTitle(
        @TenantId() tenantId: string,
        @Body() data: { name: string; nameEn?: string },
    ) {
        return this.ownerService.createJobTitle(tenantId, data);
    }

    @Patch('job-titles/:id')
    updateJobTitle(
        @Param('id') id: string,
        @TenantId() tenantId: string,
        @Body() data: { name?: string; nameEn?: string },
    ) {
        return this.ownerService.updateJobTitle(id, tenantId, data);
    }

    @Delete('job-titles/:id')
    deleteJobTitle(
        @Param('id') id: string,
        @TenantId() tenantId: string,
    ) {
        return this.ownerService.deleteJobTitle(id, tenantId);
    }
}

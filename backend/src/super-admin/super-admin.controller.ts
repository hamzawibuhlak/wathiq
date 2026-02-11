import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query, UseGuards, Req, SetMetadata,
} from '@nestjs/common';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { SuperAdminService } from './super-admin.service';
import { StaffService } from './staff.service';
import { SuperAdminChatService } from './chat.service';
import { SuperAdminDashboardGuard } from './guards/super-admin-dashboard.guard';

// ═══════════════════════════════════════
// AUTH — Public endpoints (no guard)
// ═══════════════════════════════════════

@Controller('super-admin/auth')
export class SuperAdminAuthController {
    constructor(private authService: SuperAdminAuthService) { }

    @Post('login')
    login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }

    @Post('init')
    createFirstOwner(@Body() body: { name: string; email: string; password: string }) {
        return this.authService.createFirstOwner(body);
    }
}

// ═══════════════════════════════════════
// DASHBOARD — Protected endpoints
// ═══════════════════════════════════════

@UseGuards(SuperAdminDashboardGuard)
@Controller('super-admin')
export class SuperAdminDashboardController {
    constructor(
        private svc: SuperAdminService,
        private authService: SuperAdminAuthService,
        private staffService: StaffService,
        private chatService: SuperAdminChatService,
    ) { }

    // ─── Auth ───
    @Get('me')
    getMe(@Req() req: any) {
        return this.authService.getMe(req.superAdmin.sub);
    }

    // ─── Overview ───
    @Get('overview')
    getOverview() { return this.svc.getOverviewStats(); }

    @Get('overview/recent')
    getRecent(@Query('limit') limit?: string) {
        return this.svc.getRecentRegistrations(limit ? +limit : 10);
    }

    // ─── Tenants ───
    @Get('tenants')
    getTenants(
        @Query('search') search?: string,
        @Query('planType') planType?: string,
        @Query('isFrozen') isFrozen?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.svc.getAllTenants({
            search, planType, isFrozen,
            page: page ? +page : 1,
            limit: limit ? +limit : 20,
        });
    }

    @Get('tenants/:id')
    getTenant(@Param('id') id: string) {
        return this.svc.getTenantDetails(id);
    }

    @Post('tenants/:id/freeze')
    freeze(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
        return this.svc.freezeTenant(id, reason, req.superAdmin.sub);
    }

    @Post('tenants/:id/unfreeze')
    unfreeze(@Param('id') id: string, @Req() req: any) {
        return this.svc.unfreezeTenant(id, req.superAdmin.sub);
    }

    @Patch('tenants/:id/plan')
    changePlan(@Param('id') id: string, @Body('planType') planType: string, @Req() req: any) {
        return this.svc.changePlan(id, planType, req.superAdmin.sub);
    }

    @Delete('tenants/:id/soft')
    softDelete(@Param('id') id: string, @Req() req: any) {
        return this.svc.softDeleteTenant(id, req.superAdmin.sub);
    }

    @SetMetadata('superAdminRole', 'OWNER')
    @Delete('tenants/:id/hard')
    hardDelete(@Param('id') id: string, @Req() req: any) {
        return this.svc.hardDeleteTenant(id, req.superAdmin.sub);
    }

    @Post('tenants/:id/notes')
    addNote(
        @Param('id') id: string,
        @Body('content') content: string,
        @Body('type') type: string,
        @Req() req: any,
    ) {
        return this.svc.addNote(id, req.superAdmin.sub, content, type);
    }

    // ─── Staff ───
    @Get('staff')
    getStaff() { return this.staffService.getStaff(); }

    @Post('staff')
    addStaff(@Body() body: { name: string; email: string; password: string; role: string }) {
        return this.staffService.addStaff(body);
    }

    @Patch('staff/:id/role')
    updateRole(@Param('id') id: string, @Body('role') role: string) {
        return this.staffService.updateStaffRole(id, role);
    }

    @Patch('staff/:id/deactivate')
    deactivateStaff(@Param('id') id: string) {
        return this.staffService.deactivateStaff(id);
    }

    @Patch('staff/:id/activate')
    activateStaff(@Param('id') id: string) {
        return this.staffService.activateStaff(id);
    }

    @Patch('staff/:id/reset-password')
    resetPassword(@Param('id') id: string, @Body('password') password: string) {
        return this.staffService.resetPassword(id, password);
    }

    // ─── Chat ───
    @Get('chat/rooms')
    getChatRooms() { return this.chatService.getAllRooms(); }

    @Get('chat/rooms/:tenantId')
    getChatRoom(@Param('tenantId') tenantId: string) {
        return this.chatService.getOrCreateRoom(tenantId);
    }

    @Post('chat/rooms/:roomId/messages')
    sendMessage(@Param('roomId') roomId: string, @Body('content') content: string, @Req() req: any) {
        return this.chatService.sendFromAdmin(roomId, req.superAdmin.sub, req.superAdmin.name, content);
    }

    @Post('chat/rooms/:roomId/read')
    markRead(@Param('roomId') roomId: string) {
        return this.chatService.markAsRead(roomId);
    }

    @Post('chat/rooms/:roomId/resolve')
    resolveRoom(@Param('roomId') roomId: string) {
        return this.chatService.resolveRoom(roomId);
    }

    // ─── Audit Logs ───
    @Get('audit-logs')
    getAuditLogs(@Query('page') page?: string, @Query('action') action?: string) {
        return this.svc.getAuditLogs({ page: page ? +page : 1, action });
    }
}

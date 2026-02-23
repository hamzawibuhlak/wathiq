import {
    Controller, Get, Post, Patch, Delete,
    Param, Body, Query, UseGuards, Req, SetMetadata,
} from '@nestjs/common';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { SuperAdminService } from './super-admin.service';
import { StaffService } from './staff.service';
import { SuperAdminChatService } from './chat.service';
import { CustomRolesService } from './roles.service';
import { PermissionService } from './permission.service';
import { ModuleSettingsService } from './module-settings.service';
import { SuperAdminDashboardGuard } from './guards/super-admin-dashboard.guard';
import { PermissionGuard } from './guards/permission.guard';
import { RequirePermission } from './decorators/require-permission.decorator';

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

@UseGuards(SuperAdminDashboardGuard, PermissionGuard)
@Controller('super-admin')
export class SuperAdminDashboardController {
    constructor(
        private svc: SuperAdminService,
        private authService: SuperAdminAuthService,
        private staffService: StaffService,
        private chatService: SuperAdminChatService,
        private rolesService: CustomRolesService,
        private permissionService: PermissionService,
        private moduleSettingsService: ModuleSettingsService,
    ) { }

    // ─── Auth ───
    @Get('me')
    getMe(@Req() req: any) {
        return this.authService.getMe(req.superAdmin.sub);
    }

    @Get('my-permissions')
    getMyPermissions(@Req() req: any) {
        return this.permissionService.getUserPermissions(req.superAdmin.sub);
    }

    // ─── Overview ───
    @Get('overview')
    @RequirePermission('dashboard', 'view_overview')
    getOverview() { return this.svc.getOverviewStats(); }

    @Get('overview/recent')
    @RequirePermission('dashboard', 'view_recent')
    getRecent(@Query('limit') limit?: string) {
        return this.svc.getRecentRegistrations(limit ? +limit : 10);
    }

    // ─── Tenants ───
    @Get('tenants')
    @RequirePermission('tenants', 'view_list')
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
    @RequirePermission('tenants', 'view_details')
    getTenant(@Param('id') id: string) {
        return this.svc.getTenantDetails(id);
    }

    @Post('tenants/:id/freeze')
    @RequirePermission('tenants', 'freeze', 'EDIT')
    freeze(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
        return this.svc.freezeTenant(id, reason, req.superAdmin.sub);
    }

    @Post('tenants/:id/unfreeze')
    @RequirePermission('tenants', 'unfreeze', 'EDIT')
    unfreeze(@Param('id') id: string, @Req() req: any) {
        return this.svc.unfreezeTenant(id, req.superAdmin.sub);
    }

    @Patch('tenants/:id/plan')
    @RequirePermission('tenants', 'change_plan', 'EDIT')
    changePlan(@Param('id') id: string, @Body('planType') planType: string, @Req() req: any) {
        return this.svc.changePlan(id, planType, req.superAdmin.sub);
    }

    @Delete('tenants/:id/soft')
    @RequirePermission('tenants', 'soft_delete', 'FULL')
    softDelete(@Param('id') id: string, @Req() req: any) {
        return this.svc.softDeleteTenant(id, req.superAdmin.sub);
    }

    @Delete('tenants/:id/hard')
    @RequirePermission('tenants', 'hard_delete', 'FULL')
    hardDelete(@Param('id') id: string, @Req() req: any) {
        return this.svc.hardDeleteTenant(id, req.superAdmin.sub);
    }

    @Post('tenants/:id/notes')
    @RequirePermission('notes', 'create', 'EDIT')
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
    @RequirePermission('staff', 'view_list')
    getStaff() { return this.staffService.getStaff(); }

    @Post('staff')
    @RequirePermission('staff', 'create', 'EDIT')
    addStaff(@Body() body: { name: string; email: string; password: string; role: string; customRoleId?: string }) {
        return this.staffService.addStaff(body);
    }

    @Patch('staff/:id/role')
    @RequirePermission('staff', 'assign_role', 'EDIT')
    updateRole(@Param('id') id: string, @Body('role') role: string) {
        return this.staffService.updateStaffRole(id, role);
    }

    @Patch('staff/:id/assign-custom-role')
    @RequirePermission('staff', 'assign_role', 'EDIT')
    assignCustomRole(@Param('id') id: string, @Body('customRoleId') customRoleId: string) {
        return this.rolesService.assignRoleToUser(id, customRoleId);
    }

    @Patch('staff/:id/deactivate')
    @RequirePermission('staff', 'deactivate', 'EDIT')
    deactivateStaff(@Param('id') id: string) {
        return this.staffService.deactivateStaff(id);
    }

    @Patch('staff/:id/activate')
    @RequirePermission('staff', 'activate', 'EDIT')
    activateStaff(@Param('id') id: string) {
        return this.staffService.activateStaff(id);
    }

    @Patch('staff/:id/reset-password')
    @RequirePermission('staff', 'reset_password', 'FULL')
    resetPassword(@Param('id') id: string, @Body('password') password: string) {
        return this.staffService.resetPassword(id, password);
    }

    // ─── Chat ───
    @Get('chat/rooms')
    @RequirePermission('chat', 'view_rooms')
    getChatRooms() { return this.chatService.getAllRooms(); }

    @Get('chat/rooms/:tenantId')
    @RequirePermission('chat', 'view_messages')
    getChatRoom(@Param('tenantId') tenantId: string) {
        return this.chatService.getOrCreateRoom(tenantId);
    }

    @Post('chat/rooms/:roomId/messages')
    @RequirePermission('chat', 'send_messages', 'EDIT')
    sendMessage(@Param('roomId') roomId: string, @Body('content') content: string, @Req() req: any) {
        return this.chatService.sendFromAdmin(roomId, req.superAdmin.sub, req.superAdmin.name, content);
    }

    @Post('chat/rooms/:roomId/read')
    @RequirePermission('chat', 'view_messages')
    markRead(@Param('roomId') roomId: string) {
        return this.chatService.markAsRead(roomId);
    }

    @Post('chat/rooms/:roomId/resolve')
    @RequirePermission('chat', 'resolve', 'EDIT')
    resolveRoom(@Param('roomId') roomId: string) {
        return this.chatService.resolveRoom(roomId);
    }

    // ─── Audit Logs ───
    @Get('audit-logs')
    @RequirePermission('audit_log', 'view')
    getAuditLogs(@Query('page') page?: string, @Query('action') action?: string) {
        return this.svc.getAuditLogs({ page: page ? +page : 1, action });
    }

    // ═══════════════════════════════════════
    // ROLES — Phase 34: Advanced RBAC
    // ═══════════════════════════════════════

    @Get('roles')
    @RequirePermission('roles', 'view')
    getRoles() {
        return this.rolesService.getAllRoles();
    }

    @Get('roles/templates')
    @RequirePermission('roles', 'view')
    getRoleTemplates() {
        return this.rolesService.getPermissionTemplates();
    }

    @Get('roles/:id')
    @RequirePermission('roles', 'view')
    getRoleDetails(@Param('id') id: string) {
        return this.rolesService.getRoleDetails(id);
    }

    @Post('roles')
    @RequirePermission('roles', 'create', 'EDIT')
    createRole(@Body() body: any, @Req() req: any) {
        return this.rolesService.createRole(body, req.superAdmin.sub);
    }

    @Patch('roles/:id')
    @RequirePermission('roles', 'edit', 'EDIT')
    updateRoleData(@Param('id') id: string, @Body() body: any) {
        return this.rolesService.updateRole(id, body);
    }

    @Delete('roles/:id')
    @RequirePermission('roles', 'delete', 'FULL')
    deleteRole(@Param('id') id: string) {
        return this.rolesService.deleteRole(id);
    }

    @Post('roles/:id/clone')
    @RequirePermission('roles', 'create', 'EDIT')
    cloneRole(@Param('id') id: string, @Body('name') name: string, @Req() req: any) {
        return this.rolesService.cloneRole(id, name, req.superAdmin.sub);
    }

    // ═══════════════════════════════════════
    // CONFIG — System Integrations & API Keys
    // ═══════════════════════════════════════

    @Get('config')
    getConfigs(@Query('category') category?: string) {
        return this.svc.getConfigs(category);
    }

    @Post('config')
    setConfig(@Body() body: { key: string; value: string; category?: string; label?: string; encrypted?: boolean }) {
        return this.svc.setConfig(body);
    }

    @Delete('config/:key')
    deleteConfig(@Param('key') key: string) {
        return this.svc.deleteConfig(key);
    }

    @Post('config/test-ai')
    testAIConnection() {
        return this.svc.testAIConnection();
    }

    @Post('config/test-smtp')
    testSmtpConnection(@Body('testEmail') testEmail: string) {
        return this.svc.testSmtpConnection(testEmail);
    }

    // ─── Phase 42: Module Control ───

    @Get('tenants/:id/modules')
    getTenantModules(@Param('id') id: string) {
        return this.moduleSettingsService.getTenantModules(id);
    }

    @Patch('tenants/:id/modules/:moduleKey')
    updateTenantModule(
        @Param('id') id: string,
        @Param('moduleKey') moduleKey: string,
        @Body() body: { enabled: boolean; reason?: string },
        @Req() req: any,
    ) {
        return this.moduleSettingsService.updateModule(
            id, moduleKey, body.enabled, req.superAdmin.sub, body.reason,
        );
    }

    @Patch('tenants/:id/modules/:moduleKey/features/:featureKey')
    updateTenantFeature(
        @Param('id') id: string,
        @Param('moduleKey') moduleKey: string,
        @Param('featureKey') featureKey: string,
        @Body() body: { enabled: boolean; reason?: string },
        @Req() req: any,
    ) {
        return this.moduleSettingsService.updateFeature(
            id, moduleKey, featureKey, body.enabled, req.superAdmin.sub, body.reason,
        );
    }

    @Patch('tenants/:id/modules-bulk')
    bulkUpdateTenantModules(
        @Param('id') id: string,
        @Body() body: { updates: Array<{ moduleKey: string; enabled: boolean }>; reason?: string },
        @Req() req: any,
    ) {
        return this.moduleSettingsService.bulkUpdate(
            id, body.updates, req.superAdmin.sub, body.reason,
        );
    }

    @Post('tenants/:id/modules-apply-plan')
    applyPlanToTenant(
        @Param('id') id: string,
        @Body() body: { plan: string },
        @Req() req: any,
    ) {
        return this.moduleSettingsService.applyPlan(id, body.plan, req.superAdmin.sub);
    }

    @Get('tenants/:id/modules-changelog')
    getTenantModuleChangelog(@Param('id') id: string) {
        return this.moduleSettingsService.getChangeLog(id);
    }
}

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { TenantRolesService } from './tenant-roles.service';
import { TenantPermissionService } from './tenant-permission.service';
import {
    CreateTenantRoleDto,
    UpdateTenantRoleDto,
    AssignRoleDto,
    CloneRoleDto,
} from './dto/tenant-roles.dto';
import { TENANT_PERMISSION_MAP, getTotalPermissionCount } from './constants/permission-map.constants';

@Controller(':slug/tenant-roles')
@UseGuards(JwtAuthGuard)
export class TenantRolesController {
    constructor(
        private readonly rolesService: TenantRolesService,
        private readonly permissionService: TenantPermissionService,
    ) { }

    // ─── Permission Map (any auth user) ─────────────────

    /** Get the full permission catalog (for building the UI matrix) */
    @Get('permission-map')
    getPermissionMap() {
        return {
            modules: TENANT_PERMISSION_MAP,
            totalActions: getTotalPermissionCount(),
        };
    }

    /** Get current user's permission map */
    @Get('my-permissions')
    async getMyPermissions(@Request() req: any) {
        return this.permissionService.getPermissionsForFrontend(
            req.user.id,
            req.user.tenantId,
        );
    }

    // ─── Templates (any auth user) ──────────────────────

    /** Get available role templates */
    @Get('templates')
    getTemplates() {
        return this.rolesService.getTemplates();
    }

    /** Get a specific template's permissions */
    @Get('templates/:name')
    getTemplatePermissions(@Param('name') name: string) {
        return this.rolesService.getTemplatePermissions(name);
    }

    // ─── CRUD (Owner only) ──────────────────────────────

    /** List all roles for the tenant */
    @Get()
    @UseGuards(OwnerGuard)
    async findAll(@Request() req: any) {
        return this.rolesService.findAll(req.user.tenantId);
    }

    /** Get a single role with permissions */
    @Get(':id')
    @UseGuards(OwnerGuard)
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.rolesService.findOne(id, req.user.tenantId);
    }

    /** Create a new role */
    @Post()
    @UseGuards(OwnerGuard)
    async create(@Body() dto: CreateTenantRoleDto, @Request() req: any) {
        return this.rolesService.create(req.user.tenantId, dto);
    }

    /** Update a role */
    @Patch(':id')
    @UseGuards(OwnerGuard)
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateTenantRoleDto,
        @Request() req: any,
    ) {
        return this.rolesService.update(id, req.user.tenantId, dto);
    }

    /** Delete a role */
    @Delete(':id')
    @UseGuards(OwnerGuard)
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.rolesService.delete(id, req.user.tenantId);
    }

    // ─── Role Actions ───────────────────────────────────

    /** Clone a role */
    @Post(':id/clone')
    @UseGuards(OwnerGuard)
    async cloneRole(
        @Param('id') id: string,
        @Body() dto: CloneRoleDto,
        @Request() req: any,
    ) {
        return this.rolesService.cloneRole(id, req.user.tenantId, dto);
    }

    /** Assign a role to a user */
    @Post('assign')
    @UseGuards(OwnerGuard)
    async assignRole(@Body() dto: AssignRoleDto, @Request() req: any) {
        return this.rolesService.assignRoleToUser(
            dto.userId,
            dto.roleId,
            req.user.tenantId,
        );
    }

    /** Unassign role from a user */
    @Post('unassign/:userId')
    @UseGuards(OwnerGuard)
    async unassignRole(@Param('userId') userId: string, @Request() req: any) {
        return this.rolesService.unassignRole(userId, req.user.tenantId);
    }

    /** Seed default roles for the tenant */
    @Post('seed')
    @UseGuards(OwnerGuard)
    async seedRoles(@Request() req: any) {
        return this.rolesService.seedDefaultRoles(req.user.tenantId);
    }
}

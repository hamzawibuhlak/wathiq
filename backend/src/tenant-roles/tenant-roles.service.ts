import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TenantPermissionService } from './tenant-permission.service';
import { CreateTenantRoleDto, UpdateTenantRoleDto, CloneRoleDto } from './dto/tenant-roles.dto';
import { ROLE_TEMPLATES } from './constants/role-templates.constants';
import { getAllPermissionKeys } from './constants/permission-map.constants';
import { AccessLevel, AccessScope } from '@prisma/client';

@Injectable()
export class TenantRolesService {
    private readonly logger = new Logger(TenantRolesService.name);

    constructor(
        private prisma: PrismaService,
        private permissionService: TenantPermissionService,
    ) { }

    // ─── List Roles ─────────────────────────────────────

    async findAll(tenantId: string) {
        const roles = await this.prisma.tenantRole.findMany({
            where: { tenantId },
            include: {
                _count: { select: { users: true, permissions: true } },
                permissions: {
                    select: { accessLevel: true },
                },
            },
            orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
        });

        return roles.map((role) => {
            const enabledCount = role.permissions.filter(
                (p) => p.accessLevel !== 'NONE',
            ).length;
            const totalCount = role.permissions.length;

            return {
                id: role.id,
                name: role.name,
                nameEn: role.nameEn,
                description: role.description,
                color: role.color,
                icon: role.icon,
                isActive: role.isActive,
                isSystem: role.isSystem,
                usersCount: role._count.users,
                enabledPermissions: enabledCount,
                totalPermissions: totalCount,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
            };
        });
    }

    // ─── Get Single Role ────────────────────────────────

    async findOne(id: string, tenantId: string) {
        const role = await this.prisma.tenantRole.findFirst({
            where: { id, tenantId },
            include: {
                permissions: {
                    select: {
                        id: true,
                        resource: true,
                        action: true,
                        accessLevel: true,
                        scope: true,
                    },
                    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
                },
                _count: { select: { users: true } },
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        role: true,
                    },
                    take: 10,
                },
            },
        });

        if (!role) {
            throw new NotFoundException('الدور غير موجود');
        }

        return role;
    }

    // ─── Create Role ────────────────────────────────────

    async create(tenantId: string, dto: CreateTenantRoleDto) {
        // Check for duplicate name
        const existing = await this.prisma.tenantRole.findUnique({
            where: { tenantId_name: { tenantId, name: dto.name } },
        });

        if (existing) {
            throw new ConflictException('يوجد دور بنفس الاسم بالفعل');
        }

        const role = await this.prisma.tenantRole.create({
            data: {
                name: dto.name,
                nameEn: dto.nameEn,
                description: dto.description,
                color: dto.color || '#6366f1',
                icon: dto.icon || 'shield',
                tenantId,
                permissions: {
                    create: dto.permissions.map((p) => ({
                        resource: p.resource,
                        action: p.action,
                        accessLevel: p.accessLevel,
                        scope: p.scope || AccessScope.ALL,
                    })),
                },
            },
            include: {
                permissions: true,
                _count: { select: { users: true } },
            },
        });

        this.logger.log(`Created role "${dto.name}" for tenant ${tenantId}`);
        return role;
    }

    // ─── Update Role ────────────────────────────────────

    async update(id: string, tenantId: string, dto: UpdateTenantRoleDto) {
        const role = await this.prisma.tenantRole.findFirst({
            where: { id, tenantId },
        });

        if (!role) {
            throw new NotFoundException('الدور غير موجود');
        }

        // Update the role info
        const updatedRole = await this.prisma.tenantRole.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.color !== undefined && { color: dto.color }),
                ...(dto.icon !== undefined && { icon: dto.icon }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });

        // Update permissions if provided (replace all)
        if (dto.permissions) {
            await this.prisma.tenantRolePermission.deleteMany({
                where: { roleId: id },
            });

            await this.prisma.tenantRolePermission.createMany({
                data: dto.permissions.map((p) => ({
                    roleId: id,
                    resource: p.resource,
                    action: p.action,
                    accessLevel: p.accessLevel,
                    scope: p.scope || AccessScope.ALL,
                })),
            });

            // Clear cache for all users with this role
            await this.permissionService.clearRoleCache(id);
        }

        this.logger.log(`Updated role "${updatedRole.name}" for tenant ${tenantId}`);

        return this.findOne(id, tenantId);
    }

    // ─── Delete Role ────────────────────────────────────

    async delete(id: string, tenantId: string) {
        const role = await this.prisma.tenantRole.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { users: true } } },
        });

        if (!role) {
            throw new NotFoundException('الدور غير موجود');
        }

        if (role.isSystem) {
            throw new BadRequestException('لا يمكن حذف أدوار النظام');
        }

        if (role._count.users > 0) {
            throw new BadRequestException(
                `لا يمكن حذف هذا الدور لأنه معين لـ ${role._count.users} مستخدم. قم بإلغاء التعيين أولاً.`,
            );
        }

        await this.prisma.tenantRole.delete({ where: { id } });

        this.logger.log(`Deleted role "${role.name}" from tenant ${tenantId}`);
        return { message: 'تم حذف الدور بنجاح' };
    }

    // ─── Clone Role ─────────────────────────────────────

    async cloneRole(id: string, tenantId: string, dto: CloneRoleDto) {
        const source = await this.findOne(id, tenantId);

        return this.create(tenantId, {
            name: dto.newName,
            nameEn: source.nameEn ? `${source.nameEn} (Copy)` : undefined,
            description: source.description || undefined,
            color: source.color,
            icon: source.icon,
            permissions: source.permissions.map((p) => ({
                resource: p.resource,
                action: p.action,
                accessLevel: p.accessLevel,
                scope: p.scope,
            })),
        });
    }

    // ─── Assign Role to User ────────────────────────────

    async assignRoleToUser(userId: string, roleId: string, tenantId: string) {
        const role = await this.prisma.tenantRole.findFirst({
            where: { id: roleId, tenantId },
        });

        if (!role) {
            throw new NotFoundException('الدور غير موجود');
        }

        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
        });

        if (!user) {
            throw new NotFoundException('المستخدم غير موجود');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { tenantRoleId: roleId },
        });

        // Clear the user's permission cache
        await this.permissionService.clearUserCache(userId);

        this.logger.log(`Assigned role "${role.name}" to user ${user.name} in tenant ${tenantId}`);
        return { message: `تم تعيين الدور "${role.name}" للمستخدم "${user.name}" بنجاح` };
    }

    // ─── Unassign Role ──────────────────────────────────

    async unassignRole(userId: string, tenantId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
        });

        if (!user) {
            throw new NotFoundException('المستخدم غير موجود');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { tenantRoleId: null },
        });

        await this.permissionService.clearUserCache(userId);
        return { message: 'تم إلغاء تعيين الدور بنجاح' };
    }

    // ─── Seed Default Roles ─────────────────────────────

    async seedDefaultRoles(tenantId: string) {
        const existingRoles = await this.prisma.tenantRole.findMany({
            where: { tenantId, isSystem: true },
        });

        if (existingRoles.length > 0) {
            this.logger.log(`Default roles already seeded for tenant ${tenantId}`);
            return existingRoles;
        }

        const createdRoles = [];
        for (const template of ROLE_TEMPLATES) {
            try {
                const role = await this.prisma.tenantRole.create({
                    data: {
                        name: template.name,
                        nameEn: template.nameEn,
                        description: template.description,
                        color: template.color,
                        icon: template.icon,
                        isSystem: template.isSystem,
                        tenantId,
                        permissions: {
                            create: template.permissions.map((p) => ({
                                resource: p.resource,
                                action: p.action,
                                accessLevel: p.accessLevel,
                                scope: p.scope,
                            })),
                        },
                    },
                });
                createdRoles.push(role);
            } catch (err) {
                this.logger.warn(`Failed to seed role "${template.name}": ${err.message}`);
            }
        }

        this.logger.log(`Seeded ${createdRoles.length} default roles for tenant ${tenantId}`);
        return createdRoles;
    }

    // ─── Get Templates ──────────────────────────────────

    getTemplates() {
        return ROLE_TEMPLATES.map((t) => ({
            name: t.name,
            nameEn: t.nameEn,
            description: t.description,
            color: t.color,
            icon: t.icon,
            permissionCount: t.permissions.filter(
                (p) => p.accessLevel !== 'NONE',
            ).length,
            totalPermissions: t.permissions.length,
        }));
    }

    /**
     * Get a specific template's full permission set
     */
    getTemplatePermissions(templateName: string) {
        const template = ROLE_TEMPLATES.find(
            (t) => t.nameEn === templateName || t.name === templateName,
        );
        if (!template) {
            throw new NotFoundException('القالب غير موجود');
        }
        return template.permissions;
    }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CustomRolesService {
    constructor(private prisma: PrismaService) { }

    // ── All Roles ───────────────────────
    async getAllRoles() {
        return this.prisma.customRole.findMany({
            include: {
                permissions: true,
                _count: { select: { users: true } },
            },
            orderBy: [
                { isSystem: 'desc' },
                { createdAt: 'asc' },
            ],
        });
    }

    // ── Role Details ──────────────────────
    async getRoleDetails(roleId: string) {
        const role = await this.prisma.customRole.findUnique({
            where: { id: roleId },
            include: {
                permissions: true,
                users: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        if (!role) throw new NotFoundException('الدور غير موجود');
        return role;
    }

    // ── Create Role ───────────────────────
    async createRole(data: {
        name: string;
        nameEn?: string;
        description?: string;
        color?: string;
        permissions: Array<{ resource: string; action: string; accessLevel: string }>;
    }, createdBy: string) {
        const existing = await this.prisma.customRole.findUnique({
            where: { name: data.name },
        });
        if (existing) {
            throw new BadRequestException('اسم الدور موجود مسبقاً');
        }

        return this.prisma.customRole.create({
            data: {
                name: data.name,
                nameEn: data.nameEn,
                description: data.description,
                color: data.color || '#6366f1',
                createdBy,
                permissions: {
                    create: data.permissions
                        .filter(p => p.accessLevel !== 'NONE')
                        .map(p => ({
                            resource: p.resource,
                            action: p.action,
                            accessLevel: p.accessLevel as any,
                        })),
                },
            },
            include: { permissions: true },
        });
    }

    // ── Update Role ────────────────────────
    async updateRole(roleId: string, data: {
        name?: string;
        description?: string;
        color?: string;
        isActive?: boolean;
        permissions?: Array<{ resource: string; action: string; accessLevel: string }>;
    }) {
        const role = await this.prisma.customRole.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('الدور غير موجود');
        if (role.isSystem) {
            throw new BadRequestException('لا يمكن تعديل الأدوار الأساسية');
        }

        if (data.permissions) {
            await this.prisma.sAPermission.deleteMany({ where: { roleId } });
        }

        return this.prisma.customRole.update({
            where: { id: roleId },
            data: {
                name: data.name,
                description: data.description,
                color: data.color,
                isActive: data.isActive,
                ...(data.permissions && {
                    permissions: {
                        create: data.permissions
                            .filter(p => p.accessLevel !== 'NONE')
                            .map(p => ({
                                resource: p.resource,
                                action: p.action,
                                accessLevel: p.accessLevel as any,
                            })),
                    },
                }),
            },
            include: { permissions: true },
        });
    }

    // ── Delete Role ──────────────────────────
    async deleteRole(roleId: string) {
        const role = await this.prisma.customRole.findUnique({
            where: { id: roleId },
            include: { _count: { select: { users: true } } },
        });

        if (!role) throw new NotFoundException('الدور غير موجود');
        if (role.isSystem) throw new BadRequestException('لا يمكن حذف الأدوار الأساسية');
        if (role._count.users > 0) {
            throw new BadRequestException(`الدور مسند لـ ${role._count.users} موظف — أزل الإسناد أولاً`);
        }

        await this.prisma.customRole.delete({ where: { id: roleId } });
        return { success: true };
    }

    // ── Clone Role ──────────────────────────
    async cloneRole(roleId: string, newName: string, createdBy: string) {
        const original = await this.prisma.customRole.findUnique({
            where: { id: roleId },
            include: { permissions: true },
        });
        if (!original) throw new NotFoundException('الدور غير موجود');

        return this.prisma.customRole.create({
            data: {
                name: newName,
                nameEn: original.nameEn ? `${original.nameEn} Copy` : undefined,
                description: original.description,
                color: original.color,
                createdBy,
                permissions: {
                    create: original.permissions.map(p => ({
                        resource: p.resource,
                        action: p.action,
                        accessLevel: p.accessLevel,
                    })),
                },
            },
            include: { permissions: true },
        });
    }

    // ── Assign Role to User ─────────────────
    async assignRoleToUser(userId: string, roleId: string) {
        return this.prisma.superAdminUser.update({
            where: { id: userId },
            data: { customRoleId: roleId },
            select: { id: true, name: true, email: true, customRoleId: true },
        });
    }

    // ── Permission Templates ──────────────
    getPermissionTemplates() {
        return [
            {
                id: 'full_access',
                label: 'كل الصلاحيات',
                description: 'وصول كامل لجميع الموارد',
                color: '#8b5cf6',
            },
            {
                id: 'read_only',
                label: 'مشاهدة فقط',
                description: 'مشاهدة بدون تعديل',
                color: '#3b82f6',
            },
            {
                id: 'support_staff',
                label: 'دعم فني',
                description: 'الدردشة + مشاهدة المكاتب',
                color: '#10b981',
            },
            {
                id: 'data_analyst',
                label: 'محلل بيانات',
                description: 'لوحة المعلومات + التقارير',
                color: '#f59e0b',
            },
        ];
    }
}

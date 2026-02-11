import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SuperAdminService {
    constructor(private prisma: PrismaService) { }

    // ═══════════════════════════════════════
    // OVERVIEW & STATS
    // ═══════════════════════════════════════

    async getOverviewStats() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [total, active, frozen, newThisMonth, newLastMonth, basic, pro, enterprise, openChats] =
            await Promise.all([
                this.prisma.tenant.count({ where: { deletedAt: null } }),
                this.prisma.tenant.count({ where: { deletedAt: null, isFrozen: false } }),
                this.prisma.tenant.count({ where: { isFrozen: true } }),
                this.prisma.tenant.count({ where: { createdAt: { gte: thisMonth } } }),
                this.prisma.tenant.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
                this.prisma.tenant.count({ where: { planType: 'BASIC', deletedAt: null } }),
                this.prisma.tenant.count({ where: { planType: 'PROFESSIONAL', deletedAt: null } }),
                this.prisma.tenant.count({ where: { planType: 'ENTERPRISE', deletedAt: null } }),
                this.prisma.superAdminChatRoom.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            ]);

        const growth = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : 100;
        const estimatedRevenue = basic * 500 + pro * 1500 + enterprise * 3500;

        return {
            tenants: { total, active, frozen, newThisMonth, growth },
            plans: { basic, professional: pro, enterprise },
            revenue: { estimated: estimatedRevenue },
            support: { openChats },
        };
    }

    async getRecentRegistrations(limit = 10) {
        return this.prisma.tenant.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true, name: true, slug: true, planType: true,
                createdAt: true, city: true, isFrozen: true,
                users: {
                    where: { role: 'OWNER' },
                    select: { name: true, email: true },
                    take: 1,
                },
            },
        });
    }

    // ═══════════════════════════════════════
    // TENANT MANAGEMENT
    // ═══════════════════════════════════════

    async getAllTenants(filters?: {
        search?: string; planType?: string; isFrozen?: string;
        page?: number; limit?: number;
    }) {
        const { page = 1, limit = 20 } = filters || {};
        const where: any = { deletedAt: null };

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { slug: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters?.planType) where.planType = filters.planType;
        if (filters?.isFrozen === 'true') where.isFrozen = true;
        if (filters?.isFrozen === 'false') where.isFrozen = false;

        const [tenants, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                select: {
                    id: true, name: true, slug: true, city: true, email: true,
                    planType: true, isFrozen: true, frozenReason: true,
                    createdAt: true, planEndDate: true, isActive: true,
                    _count: { select: { users: true, cases: true } },
                    users: {
                        where: { role: 'OWNER' },
                        select: { name: true, email: true, phone: true },
                        take: 1,
                    },
                    superAdminChatRoom: {
                        select: { unreadCount: true, status: true, lastMessageAt: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.tenant.count({ where }),
        ]);

        return { data: tenants, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async getTenantDetails(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                users: {
                    select: {
                        id: true, name: true, email: true, phone: true,
                        role: true, isActive: true, createdAt: true, lastLoginAt: true,
                    },
                },
                _count: { select: { cases: true, clients: true, documents: true, users: true } },
                tenantNotes: { orderBy: { createdAt: 'desc' }, take: 20 },
                superAdminChatRoom: {
                    include: {
                        messages: { orderBy: { createdAt: 'desc' }, take: 20 },
                    },
                },
            },
        });
        if (!tenant) throw new NotFoundException('المكتب غير موجود');
        return tenant;
    }

    async freezeTenant(tenantId: string, reason: string, adminId: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { isFrozen: true, frozenReason: reason, frozenAt: new Date() },
        });
        await this.logAction(adminId, 'FREEZE_TENANT', 'TENANT', tenantId, { reason });
        return tenant;
    }

    async unfreezeTenant(tenantId: string, adminId: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { isFrozen: false, frozenReason: null, frozenAt: null },
        });
        await this.logAction(adminId, 'UNFREEZE_TENANT', 'TENANT', tenantId, {});
        return tenant;
    }

    async changePlan(tenantId: string, planType: string, adminId: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { planType: planType as any },
        });
        await this.logAction(adminId, 'CHANGE_PLAN', 'TENANT', tenantId, { planType });
        return tenant;
    }

    // حذف ناعم — قابل للاسترجاع
    async softDeleteTenant(tenantId: string, adminId: string) {
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { deletedAt: new Date(), isFrozen: true, frozenReason: 'تم حذف المكتب' },
        });
        await this.logAction(adminId, 'SOFT_DELETE_TENANT', 'TENANT', tenantId, {});
        return { success: true };
    }

    // حذف نهائي — OWNER فقط
    async hardDeleteTenant(tenantId: string, adminId: string) {
        // Delete in order to respect foreign key constraints
        await this.prisma.$transaction(async (tx) => {
            // Delete all related data
            await tx.tenantNote.deleteMany({ where: { tenantId } });
            await tx.superAdminChatMessage.deleteMany({
                where: { room: { tenantId } },
            });
            await tx.superAdminChatRoom.deleteMany({ where: { tenantId } });
            await tx.notification.deleteMany({ where: { tenantId } });
            await tx.activityLog.deleteMany({ where: { tenantId } });
            await tx.document.deleteMany({ where: { tenantId } });
            await tx.invoice.deleteMany({ where: { tenantId } });
            await tx.hearing.deleteMany({ where: { tenantId } });
            await tx.task.deleteMany({ where: { tenantId } });
            await tx.case.deleteMany({ where: { tenantId } });
            await tx.client.deleteMany({ where: { tenantId } });
            await tx.user.deleteMany({ where: { tenantId } });
            await tx.tenant.delete({ where: { id: tenantId } });
        });
        await this.logAction(adminId, 'HARD_DELETE_TENANT', 'TENANT', tenantId, { warning: 'PERMANENT' });
        return { success: true };
    }

    // ═══════════════════════════════════════
    // NOTES
    // ═══════════════════════════════════════

    async addNote(tenantId: string, adminId: string, content: string, type: string = 'GENERAL') {
        return this.prisma.tenantNote.create({
            data: { tenantId, content, type: type as any, addedBy: adminId },
        });
    }

    // ═══════════════════════════════════════
    // AUDIT LOG
    // ═══════════════════════════════════════

    async getAuditLogs(filters?: { page?: number; action?: string }) {
        const { page = 1 } = filters || {};
        const where: any = {};
        if (filters?.action) where.action = filters.action;

        const [data, total] = await Promise.all([
            this.prisma.superAdminAuditLog.findMany({
                where,
                include: { user: { select: { name: true, email: true, role: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * 30,
                take: 30,
            }),
            this.prisma.superAdminAuditLog.count({ where }),
        ]);

        return { data, meta: { page, total, totalPages: Math.ceil(total / 30) } };
    }

    private async logAction(adminId: string, action: string, targetType: string, targetId: string, details: any) {
        try {
            await this.prisma.superAdminAuditLog.create({
                data: { action, targetType, targetId, details, performedBy: adminId },
            });
        } catch (e) {
            // Don't fail the main operation if logging fails
            console.error('Audit log error:', e);
        }
    }
}

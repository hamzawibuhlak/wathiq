import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SuperAdminService {
    constructor(private prisma: PrismaService) { }

    // ========== DASHBOARD KPIs ==========

    async getDashboardStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            totalTenants, activeSubs, trialSubs, suspendedSubs,
            totalUsers, totalCases, mrrData,
            newThisMonth, newLastMonth, churnedThisMonth,
        ] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
            this.prisma.subscription.count({ where: { status: 'TRIAL' } }),
            this.prisma.subscription.count({ where: { status: 'SUSPENDED' } }),
            this.prisma.user.count({ where: { isActive: true, role: { not: 'SUPER_ADMIN' } } }),
            this.prisma.case.count(),
            this.prisma.subscription.aggregate({ where: { status: 'ACTIVE', billingCycle: 'MONTHLY' }, _sum: { amount: true } }),
            this.prisma.tenant.count({ where: { createdAt: { gte: startOfMonth } } }),
            this.prisma.tenant.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
            this.prisma.subscription.count({ where: { status: 'CANCELLED', cancelledAt: { gte: startOfMonth } } }),
        ]);

        const mrr = Number(mrrData._sum.amount) || 0;
        const growthRate = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 : (newThisMonth > 0 ? 100 : 0);
        const churnRate = activeSubs > 0 ? (churnedThisMonth / activeSubs) * 100 : 0;

        return {
            tenants: { total: totalTenants, active: activeSubs, trial: trialSubs, suspended: suspendedSubs, newThisMonth, growthRate: Math.round(growthRate * 10) / 10 },
            users: { total: totalUsers },
            cases: { total: totalCases },
            revenue: { mrr, arr: mrr * 12, currency: 'SAR' },
            health: { churnRate: Math.round(churnRate * 10) / 10, churnedThisMonth },
        };
    }

    // ========== REVENUE ANALYTICS ==========

    async getRevenueAnalytics(months: number = 12) {
        const result = [];
        for (let i = months - 1; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

            const [invoices, newSubs, cancellations] = await Promise.all([
                this.prisma.subscriptionInvoice.aggregate({ where: { status: 'PAID', paidAt: { gte: start, lte: end } }, _sum: { totalAmount: true } }),
                this.prisma.subscription.count({ where: { startDate: { gte: start, lte: end } } }),
                this.prisma.subscription.count({ where: { status: 'CANCELLED', cancelledAt: { gte: start, lte: end } } }),
            ]);

            result.push({
                month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                revenue: Number(invoices._sum.totalAmount) || 0,
                newSubscriptions: newSubs,
                cancellations,
            });
        }
        return result;
    }

    // ========== TENANT MANAGEMENT ==========

    async getAllTenants(filters?: { status?: string; search?: string; page?: number; limit?: number }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const where: any = {};

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [tenants, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                include: {
                    subscription: { include: { plan: true } },
                    _count: { select: { users: true, cases: true } },
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
                subscription: { include: { plan: true, invoices: { orderBy: { createdAt: 'desc' }, take: 12 } } },
                _count: { select: { users: true, cases: true, clients: true, documents: true } },
            },
        });

        const last30 = new Date(); last30.setDate(last30.getDate() - 30);
        const [recentCases, activeUsers] = await Promise.all([
            this.prisma.case.count({ where: { tenantId, createdAt: { gte: last30 } } }),
            this.prisma.user.count({ where: { tenantId, lastLoginAt: { gte: last30 } } }),
        ]);

        return { ...tenant, activity: { recentCases, activeUsers } };
    }

    async suspendTenant(tenantId: string, adminId: string, reason: string) {
        const [tenant] = await Promise.all([
            this.prisma.tenant.update({ where: { id: tenantId }, data: { isActive: false } }),
            this.prisma.subscription.updateMany({ where: { tenantId }, data: { status: 'SUSPENDED' } }),
        ]);
        await this.logAudit(adminId, 'SUPER_ADMIN', tenantId, 'SUSPEND_TENANT', 'tenant', tenantId, null, { reason });
        return tenant;
    }

    async activateTenant(tenantId: string, adminId: string) {
        const [tenant] = await Promise.all([
            this.prisma.tenant.update({ where: { id: tenantId }, data: { isActive: true } }),
            this.prisma.subscription.updateMany({ where: { tenantId, status: 'SUSPENDED' }, data: { status: 'ACTIVE' } }),
        ]);
        await this.logAudit(adminId, 'SUPER_ADMIN', tenantId, 'ACTIVATE_TENANT', 'tenant', tenantId);
        return tenant;
    }

    async deleteTenant(tenantId: string, adminId: string) {
        await this.prisma.tenant.update({ where: { id: tenantId }, data: { isActive: false, deletedAt: new Date() } });
        await this.logAudit(adminId, 'SUPER_ADMIN', tenantId, 'DELETE_TENANT', 'tenant', tenantId);
    }

    // ========== SUBSCRIPTION MANAGEMENT ==========

    async changeTenantPlan(tenantId: string, adminId: string, newPlanId: string) {
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: newPlanId } });
        const subscription = await this.prisma.subscription.update({
            where: { tenantId },
            data: { planId: newPlanId, amount: plan!.monthlyPrice },
            include: { plan: true },
        });
        await this.logAudit(adminId, 'SUPER_ADMIN', tenantId, 'CHANGE_PLAN', 'subscription', subscription.id, null, { newPlanId });
        return subscription;
    }

    async extendTrial(tenantId: string, adminId: string, days: number) {
        const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
        const newEnd = new Date(sub!.trialEndDate || new Date());
        newEnd.setDate(newEnd.getDate() + days);
        const updated = await this.prisma.subscription.update({ where: { tenantId }, data: { trialEndDate: newEnd } });
        await this.logAudit(adminId, 'SUPER_ADMIN', tenantId, 'EXTEND_TRIAL', 'subscription', updated.id, null, { days });
        return updated;
    }

    // ========== PLANS ==========

    async getPlans() {
        return this.prisma.subscriptionPlan.findMany({ orderBy: { monthlyPrice: 'asc' }, include: { _count: { select: { subscriptions: true } } } });
    }

    async createPlan(data: any, adminId: string) {
        const plan = await this.prisma.subscriptionPlan.create({ data });
        await this.logAudit(adminId, 'SUPER_ADMIN', null, 'CREATE_PLAN', 'subscription_plan', plan.id, null, data);
        return plan;
    }

    async updatePlan(id: string, data: any, adminId: string) {
        const plan = await this.prisma.subscriptionPlan.update({ where: { id }, data });
        await this.logAudit(adminId, 'SUPER_ADMIN', null, 'UPDATE_PLAN', 'subscription_plan', plan.id, null, data);
        return plan;
    }

    // ========== FEATURE FLAGS ==========

    async getFeatureFlags() {
        return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
    }

    async toggleFeatureFlag(key: string, adminId: string, isEnabled: boolean, enabledFor?: string[]) {
        return this.prisma.featureFlag.upsert({
            where: { key },
            create: { key, name: key, isEnabled, enabledFor: enabledFor || [], updatedBy: adminId },
            update: { isEnabled, enabledFor: enabledFor || [], updatedBy: adminId },
        });
    }

    // ========== SYSTEM HEALTH ==========

    async getSystemHealth() {
        const now = new Date();
        const last24h = new Date(); last24h.setDate(last24h.getDate() - 1);

        const [totalLogs, errorCount, activeUsers, dbStats] = await Promise.all([
            this.prisma.auditLog.count({ where: { createdAt: { gte: last24h } } }),
            this.prisma.auditLog.count({ where: { createdAt: { gte: last24h }, action: { startsWith: 'ERROR' } } }),
            this.prisma.user.count({ where: { lastLoginAt: { gte: last24h } } }),
            this.prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as db_size, (SELECT count(*) FROM pg_stat_activity) as connections`,
        ]);

        return {
            status: 'healthy',
            timestamp: now,
            metrics: { last24h: { totalLogs, errorCount, errorRate: totalLogs > 0 ? ((errorCount / totalLogs) * 100).toFixed(2) : '0', activeUsers } },
            database: dbStats,
        };
    }

    // ========== ANNOUNCEMENTS ==========

    async createAnnouncement(adminId: string, data: any) {
        return this.prisma.announcement.create({ data: { ...data, createdBy: adminId } });
    }

    async getAnnouncements() {
        return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
    }

    // ========== AUDIT LOGS ==========

    async getAuditLogs(filters?: { tenantId?: string; action?: string; page?: number; limit?: number }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const where: any = {};
        if (filters?.tenantId) where.tenantId = filters.tenantId;
        if (filters?.action) where.action = { contains: filters.action };

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            this.prisma.auditLog.count({ where }),
        ]);

        return { data: logs, meta: { page, limit, total } };
    }

    // ========== HELPER ==========

    private async logAudit(actorId: string, actorRole: string, tenantId: string | null, action: string, resource: string, resourceId: string, oldValues?: any, newValues?: any) {
        await this.prisma.auditLog.create({ data: { actorId, actorRole, tenantId, action, resource, resourceId, oldValues, newValues } });
    }
}

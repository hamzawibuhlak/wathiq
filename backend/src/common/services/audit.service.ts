import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Audit Context - metadata about the request
 */
export interface AuditContext {
    userId: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Audit Service
 * سجل تفصيلي لجميع العمليات
 */
@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    /**
     * Log a CREATE action
     */
    async logCreate(
        entity: string,
        entityId: string,
        data: any,
        context: AuditContext,
    ) {
        const description = `تم إنشاء ${this.getEntityName(entity)} جديد`;

        await this.prisma.activityLog.create({
            data: {
                action: 'CREATE',
                entity,
                entityId,
                description,
                userId: context.userId,
                tenantId: context.tenantId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            },
        });
    }

    /**
     * Log an UPDATE action with diff
     */
    async logUpdate(
        entity: string,
        entityId: string,
        oldData: any,
        newData: any,
        context: AuditContext,
    ) {
        const changes = this.calculateDiff(oldData, newData);
        const changedFields = Object.keys(changes);

        if (changedFields.length === 0) {
            return; // No changes
        }

        const description = `تم تعديل ${this.getEntityName(entity)}: ${changedFields.join(', ')}`;

        await this.prisma.activityLog.create({
            data: {
                action: 'UPDATE',
                entity,
                entityId,
                description,
                userId: context.userId,
                tenantId: context.tenantId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            },
        });
    }

    /**
     * Log a DELETE action
     */
    async logDelete(
        entity: string,
        entityId: string,
        data: any,
        context: AuditContext,
    ) {
        const description = `تم حذف ${this.getEntityName(entity)}`;

        await this.prisma.activityLog.create({
            data: {
                action: 'DELETE',
                entity,
                entityId,
                description,
                userId: context.userId,
                tenantId: context.tenantId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            },
        });
    }

    /**
     * Log a VIEW action
     */
    async logView(
        entity: string,
        entityId: string,
        context: AuditContext,
    ) {
        await this.prisma.activityLog.create({
            data: {
                action: 'VIEW',
                entity,
                entityId,
                description: `تم عرض ${this.getEntityName(entity)}`,
                userId: context.userId,
                tenantId: context.tenantId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            },
        });
    }

    /**
     * Log a custom action
     */
    async logCustomAction(
        action: string,
        entity: string,
        entityId: string | null,
        description: string,
        context: AuditContext,
    ) {
        await this.prisma.activityLog.create({
            data: {
                action,
                entity,
                entityId,
                description,
                userId: context.userId,
                tenantId: context.tenantId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            },
        });
    }

    /**
     * Get entity history
     */
    async getEntityHistory(
        entity: string,
        entityId: string,
        tenantId: string,
    ) {
        return this.prisma.activityLog.findMany({
            where: {
                entity,
                entityId,
                tenantId,
            },
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    /**
     * Get user activity
     */
    async getUserActivity(
        userId: string,
        tenantId: string,
        days = 30,
    ) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return this.prisma.activityLog.findMany({
            where: {
                userId,
                tenantId,
                createdAt: { gte: startDate },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    /**
     * Get activity summary for dashboard
     */
    async getActivitySummary(tenantId: string, days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const activities = await this.prisma.activityLog.groupBy({
            by: ['action'],
            where: {
                tenantId,
                createdAt: { gte: startDate },
            },
            _count: true,
        });

        return activities.map(a => ({
            action: a.action,
            count: a._count,
        }));
    }

    /**
     * Calculate diff between old and new data
     */
    private calculateDiff(oldData: any, newData: any): Record<string, { from: any; to: any }> {
        const diff: Record<string, { from: any; to: any }> = {};
        const sensitiveFields = ['password', 'twoFactorSecret', 'smtpPass'];

        for (const key in newData) {
            if (sensitiveFields.includes(key)) continue;

            const oldValue = oldData?.[key];
            const newValue = newData[key];

            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                diff[key] = { from: oldValue, to: newValue };
            }
        }

        return diff;
    }

    /**
     * Get Arabic entity name
     */
    private getEntityName(entity: string): string {
        const names: Record<string, string> = {
            Case: 'قضية',
            Client: 'عميل',
            Invoice: 'فاتورة',
            Document: 'مستند',
            User: 'مستخدم',
            Hearing: 'جلسة',
            Task: 'مهمة',
            Tenant: 'المكتب',
        };
        return names[entity] || entity;
    }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * GDPR Compliance Service
 * خدمة الامتثال لـ GDPR (اللائحة العامة لحماية البيانات)
 */
@Injectable()
export class GdprService {
    constructor(private prisma: PrismaService) { }

    /**
     * Right to Access - حق الوصول للبيانات
     * User can request all their data
     */
    async exportUserData(userId: string) {
        const [user, cases, documents, activities] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                include: { tenant: true },
            }),
            this.prisma.case.findMany({
                where: {
                    OR: [
                        { assignedToId: userId },
                        { createdById: userId },
                    ],
                },
                include: {
                    client: { select: { name: true } },
                },
            }),
            this.prisma.document.findMany({
                where: { uploadedById: userId },
                select: {
                    id: true,
                    fileName: true,
                    documentType: true,
                    createdAt: true,
                },
            }),
            this.prisma.activityLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 500,
            }),
        ]);

        // Remove sensitive data before export
        const sanitizedUser = user ? {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt,
            tenant: user.tenant?.name,
        } : null;

        return {
            user: sanitizedUser,
            cases: cases.map(c => ({
                id: c.id,
                title: c.title,
                status: c.status,
                client: c.client?.name || 'N/A',
                createdAt: c.createdAt,
            })),
            documents,
            activities: activities.map(a => ({
                action: a.action,
                entity: a.entity,
                description: a.description,
                date: a.createdAt,
            })),
            exportedAt: new Date().toISOString(),
            gdprCompliance: true,
        };
    }

    /**
     * Right to Erasure - حق الحذف (النسيان)
     * User can request deletion of their data
     */
    async deleteUserData(userId: string, options?: { keepAudit?: boolean }) {
        if (options?.keepAudit) {
            // Anonymize user data instead of deleting
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    email: `deleted_${userId}@deleted.local`,
                    name: 'Deleted User',
                    phone: null,
                    avatar: null,
                    isActive: false,
                    password: 'DELETED',
                    twoFactorSecret: null,
                    twoFactorBackupCodes: [],
                },
            });

            return { success: true, action: 'anonymized' };
        }

        // Complete deletion (cascade will handle related records)
        await this.prisma.user.delete({
            where: { id: userId },
        });

        return { success: true, action: 'deleted' };
    }

    /**
     * Right to Rectification - حق التصحيح
     * User can update incorrect data
     */
    async rectifyUserData(userId: string, updates: {
        name?: string;
        phone?: string;
    }) {
        return this.prisma.user.update({
            where: { id: userId },
            data: updates,
            select: {
                id: true,
                name: true,
                phone: true,
                updatedAt: true,
            },
        });
    }

    /**
     * Right to Restriction - حق تقييد المعالجة
     * User can request processing restriction
     */
    async restrictProcessing(userId: string, reason: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });

        await this.prisma.activityLog.create({
            data: {
                action: 'GDPR_RESTRICTION',
                entity: 'User',
                entityId: userId,
                description: `تم تقييد معالجة البيانات: ${reason}`,
                userId,
                tenantId: (await this.prisma.user.findUnique({ where: { id: userId } }))?.tenantId || '',
            },
        });

        return { success: true, restricted: true };
    }

    /**
     * Right to Data Portability - حق نقل البيانات
     * User can export their data in portable format
     */
    async exportDataPortable(userId: string, format: 'json' | 'csv' = 'json') {
        const data = await this.exportUserData(userId);

        if (format === 'csv') {
            return {
                format: 'CSV',
                filename: `user_data_${userId}.csv`,
                data: this.convertToCSV(data),
            };
        }

        return {
            format: 'JSON',
            filename: `user_data_${userId}.json`,
            data: JSON.stringify(data, null, 2),
        };
    }

    /**
     * Consent Management - إدارة الموافقات
     */
    async updateConsent(userId: string, consents: {
        dataProcessing?: boolean;
        marketing?: boolean;
        analytics?: boolean;
    }) {
        // Store consent in user metadata or separate table
        // For now, log the consent update
        await this.prisma.activityLog.create({
            data: {
                action: 'CONSENT_UPDATE',
                entity: 'User',
                entityId: userId,
                description: `تم تحديث الموافقات: ${JSON.stringify(consents)}`,
                userId,
                tenantId: (await this.prisma.user.findUnique({ where: { id: userId } }))?.tenantId || '',
            },
        });

        return { success: true, consents };
    }

    /**
     * Convert data to CSV format
     */
    private convertToCSV(data: any): string {
        const lines: string[] = [];

        // User data
        lines.push('# User Data');
        lines.push('id,email,name,phone,role');
        if (data.user) {
            lines.push(`${data.user.id},${data.user.email},${data.user.name},${data.user.phone || ''},${data.user.role}`);
        }

        // Cases
        lines.push('');
        lines.push('# Cases');
        lines.push('id,title,status,client,createdAt');
        data.cases.forEach((c: any) => {
            lines.push(`${c.id},${c.title},${c.status},${c.client},${c.createdAt}`);
        });

        return lines.join('\n');
    }
}

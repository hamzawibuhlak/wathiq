import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        title: string;
        message: string;
        type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
        link?: string;
        userId: string;
        tenantId: string;
    }) {
        return this.prisma.notification.create({ data });
    }

    async findAll(userId: string, tenantId: string) {
        return this.prisma.notification.findMany({
            where: { userId, tenantId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async getUnreadCount(userId: string, tenantId: string) {
        return this.prisma.notification.count({
            where: { userId, tenantId, isRead: false },
        });
    }

    async markAsRead(id: string, userId: string, tenantId: string) {
        return this.prisma.notification.updateMany({
            where: { id, userId, tenantId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string, tenantId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, tenantId, isRead: false },
            data: { isRead: true },
        });
    }

    async delete(id: string, userId: string, tenantId: string) {
        return this.prisma.notification.deleteMany({
            where: { id, userId, tenantId },
        });
    }

    // Notification Settings - persisted in database
    private getDefaultSettings() {
        return {
            emailEnabled: true,
            smsEnabled: false,
            hearingReminders: true,
            caseUpdates: true,
            invoiceReminders: true,
            dailyDigest: false,
            reminderHoursBefore: 24,
        };
    }

    async getSettings(userId: string, tenantId: string) {
        const settings = await this.prisma.notificationSettings.findUnique({
            where: { userId },
        });

        if (settings) {
            return {
                emailEnabled: settings.emailEnabled,
                smsEnabled: settings.smsEnabled,
                hearingReminders: settings.hearingReminders,
                caseUpdates: settings.caseUpdates,
                invoiceReminders: settings.invoiceReminders,
                dailyDigest: settings.dailyDigest,
                reminderHoursBefore: settings.reminderHoursBefore,
            };
        }

        return this.getDefaultSettings();
    }

    async updateSettings(userId: string, tenantId: string, settings: any) {
        const current = await this.getSettings(userId, tenantId);
        const updated = { ...current, ...settings };

        await this.prisma.notificationSettings.upsert({
            where: { userId },
            update: {
                emailEnabled: updated.emailEnabled,
                smsEnabled: updated.smsEnabled,
                hearingReminders: updated.hearingReminders,
                caseUpdates: updated.caseUpdates,
                invoiceReminders: updated.invoiceReminders,
                dailyDigest: updated.dailyDigest,
                reminderHoursBefore: updated.reminderHoursBefore,
            },
            create: {
                userId,
                tenantId,
                emailEnabled: updated.emailEnabled,
                smsEnabled: updated.smsEnabled,
                hearingReminders: updated.hearingReminders,
                caseUpdates: updated.caseUpdates,
                invoiceReminders: updated.invoiceReminders,
                dailyDigest: updated.dailyDigest,
                reminderHoursBefore: updated.reminderHoursBefore,
            },
        });

        return updated;
    }


    // Helper methods for creating specific notification types
    async notifyHearingReminder(data: {
        userId: string;
        tenantId: string;
        hearingId: string;
        caseTitle: string;
        hearingDate: Date;
    }) {
        return this.create({
            title: 'تذكير بجلسة قادمة',
            message: `لديك جلسة قضائية للقضية "${data.caseTitle}" في ${new Intl.DateTimeFormat('ar-SA').format(new Date(data.hearingDate))}`,
            type: 'INFO',
            link: `/hearings/${data.hearingId}`,
            userId: data.userId,
            tenantId: data.tenantId,
        });
    }

    async notifyInvoiceOverdue(data: {
        userId: string;
        tenantId: string;
        invoiceId: string;
        invoiceNumber: string;
        clientName: string;
    }) {
        return this.create({
            title: 'فاتورة متأخرة',
            message: `الفاتورة ${data.invoiceNumber} للعميل "${data.clientName}" متأخرة عن موعد الاستحقاق`,
            type: 'WARNING',
            link: `/invoices/${data.invoiceId}`,
            userId: data.userId,
            tenantId: data.tenantId,
        });
    }

    async notifyCaseStatusChange(data: {
        userId: string;
        tenantId: string;
        caseId: string;
        caseTitle: string;
        newStatus: string;
    }) {
        return this.create({
            title: 'تحديث حالة قضية',
            message: `تم تحديث حالة القضية "${data.caseTitle}" إلى: ${data.newStatus}`,
            type: 'SUCCESS',
            link: `/cases/${data.caseId}`,
            userId: data.userId,
            tenantId: data.tenantId,
        });
    }

    async notifyNewDocument(data: {
        userId: string;
        tenantId: string;
        documentId: string;
        documentTitle: string;
        caseTitle: string;
    }) {
        return this.create({
            title: 'مستند جديد',
            message: `تم إضافة مستند "${data.documentTitle}" للقضية "${data.caseTitle}"`,
            type: 'INFO',
            link: `/documents/${data.documentId}`,
            userId: data.userId,
            tenantId: data.tenantId,
        });
    }
}

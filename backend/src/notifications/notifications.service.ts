import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

@Injectable()
export class NotificationsService {
    constructor(
        private prisma: PrismaService,
        private wsGateway: WebSocketGatewayService,
    ) { }

    async create(data: {
        title: string;
        message: string;
        type: NotificationType;
        link?: string;
        userId: string;

    }) {
        const notification = await this.prisma.notification.create({ data });
        
        // Emit real-time notification via WebSocket
        this.wsGateway.sendNotificationToUser(data.userId, notification);
        
        return notification;
    }

    async findAll(userId: string, options?: { limit?: number; onlyUnread?: boolean }) {
        return this.prisma.notification.findMany({
            where: { 
                userId, 

                ...(options?.onlyUnread ? { isRead: false } : {}) },
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 50 });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: { userId, isRead: false } });
    }

    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true } });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true } });
    }

    async delete(id: string, userId: string) {
        return this.prisma.notification.deleteMany({
            where: { id, userId } });
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
            reminderHoursBefore: 24 };
    }

    async getSettings(userId: string) {
        const settings = await this.prisma.notificationSettings.findUnique({
            where: { userId } });

        if (settings) {
            return {
                emailEnabled: settings.emailEnabled,
                smsEnabled: settings.smsEnabled,
                hearingReminders: settings.hearingReminders,
                caseUpdates: settings.caseUpdates,
                invoiceReminders: settings.invoiceReminders,
                dailyDigest: settings.dailyDigest,
                reminderHoursBefore: settings.reminderHoursBefore };
        }

        return this.getDefaultSettings();
    }

    async updateSettings(userId: string, settings: any) {
        const current = await this.getSettings(userId);
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
                reminderHoursBefore: updated.reminderHoursBefore },
            create: {
                userId,

                emailEnabled: updated.emailEnabled,
                smsEnabled: updated.smsEnabled,
                hearingReminders: updated.hearingReminders,
                caseUpdates: updated.caseUpdates,
                invoiceReminders: updated.invoiceReminders,
                dailyDigest: updated.dailyDigest,
                reminderHoursBefore: updated.reminderHoursBefore } });

        return updated;
    }

    // =====================================================
    // AUTOMATED NOTIFICATION METHODS
    // =====================================================

    // Hearing notifications
    async notifyHearingReminder(data: {
        userId: string;

        hearingId: string;
        caseTitle: string;
        hearingDate: Date;
    }) {
        return this.create({
            title: 'تذكير بجلسة قادمة',
            message: `لديك جلسة قضائية للقضية "${data.caseTitle}" في ${new Intl.DateTimeFormat('ar-SA').format(new Date(data.hearingDate))}`,
            type: 'INFO',
            link: `/hearings/${data.hearingId}`,
            userId: data.userId });
    }

    async notifyHearingScheduled(data: {
        userId: string;

        hearingId: string;
        caseTitle: string;
        hearingDate: Date;
        courtName?: string;
    }) {
        return this.create({
            title: 'جلسة جديدة',
            message: `تم تحديد موعد جلسة جديدة للقضية "${data.caseTitle}" بتاريخ ${new Intl.DateTimeFormat('ar-SA').format(new Date(data.hearingDate))}${data.courtName ? ` في ${data.courtName}` : ''}`,
            type: 'INFO',
            link: `/hearings/${data.hearingId}`,
            userId: data.userId });
    }

    // Invoice notifications
    async notifyInvoiceOverdue(data: {
        userId: string;

        invoiceId: string;
        invoiceNumber: string;
        clientName: string;
    }) {
        return this.create({
            title: 'فاتورة متأخرة',
            message: `الفاتورة ${data.invoiceNumber} للعميل "${data.clientName}" متأخرة عن موعد الاستحقاق`,
            type: 'WARNING',
            link: `/invoices/${data.invoiceId}`,
            userId: data.userId });
    }

    async notifyInvoicePaid(data: {
        userId: string;

        invoiceId: string;
        invoiceNumber: string;
        clientName: string;
        amount: string;
    }) {
        return this.create({
            title: 'تم دفع فاتورة',
            message: `تم دفع الفاتورة ${data.invoiceNumber} للعميل "${data.clientName}" بمبلغ ${data.amount} ر.س`,
            type: 'SUCCESS',
            link: `/invoices/${data.invoiceId}`,
            userId: data.userId });
    }

    // Case notifications
    async notifyCaseStatusChange(data: {
        userId: string;

        caseId: string;
        caseTitle: string;
        newStatus: string;
    }) {
        return this.create({
            title: 'تحديث حالة قضية',
            message: `تم تحديث حالة القضية "${data.caseTitle}" إلى: ${data.newStatus}`,
            type: 'SUCCESS',
            link: `/cases/${data.caseId}`,
            userId: data.userId });
    }

    async notifyCaseAssigned(data: {
        userId: string;

        caseId: string;
        caseTitle: string;
        clientName: string;
    }) {
        return this.create({
            title: 'قضية جديدة',
            message: `تم تعيينك على القضية "${data.caseTitle}" للعميل "${data.clientName}"`,
            type: 'INFO',
            link: `/cases/${data.caseId}`,
            userId: data.userId });
    }

    // Document notifications
    async notifyNewDocument(data: {
        userId: string;

        documentId: string;
        documentTitle: string;
        caseTitle: string;
    }) {
        return this.create({
            title: 'مستند جديد',
            message: `تم إضافة مستند "${data.documentTitle}" للقضية "${data.caseTitle}"`,
            type: 'INFO',
            link: `/documents/${data.documentId}`,
            userId: data.userId });
    }

    // Task notifications
    async notifyTaskAssigned(data: {
        userId: string;

        taskId: string;
        taskTitle: string;
        assignedByName: string;
        dueDate?: Date;
    }) {
        let message = `تم تكليفك بمهمة جديدة "${data.taskTitle}" من ${data.assignedByName}`;
        if (data.dueDate) {
            message += ` - موعد التسليم: ${new Intl.DateTimeFormat('ar-SA').format(new Date(data.dueDate))}`;
        }
        return this.create({
            title: 'مهمة جديدة',
            message,
            type: 'INFO',
            link: `/tasks/${data.taskId}`,
            userId: data.userId });
    }

    async notifyTaskOverdue(data: {
        userId: string;

        taskId: string;
        taskTitle: string;
    }) {
        return this.create({
            title: 'مهمة متأخرة',
            message: `المهمة "${data.taskTitle}" تجاوزت موعد التسليم`,
            type: 'WARNING',
            link: `/tasks/${data.taskId}`,
            userId: data.userId });
    }

    async notifyTaskCompleted(data: {
        userId: string;

        taskId: string;
        taskTitle: string;
        completedByName: string;
    }) {
        return this.create({
            title: 'مهمة مكتملة',
            message: `تم إكمال المهمة "${data.taskTitle}" بواسطة ${data.completedByName}`,
            type: 'SUCCESS',
            link: `/tasks/${data.taskId}`,
            userId: data.userId });
    }

    // Message notifications  
    async notifyNewMessage(data: {
        userId: string;

        messageId: string;
        senderName: string;
        subject: string;
    }) {
        return this.create({
            title: 'رسالة جديدة',
            message: `رسالة جديدة من ${data.senderName}: "${data.subject}"`,
            type: 'INFO',
            link: `/messages/${data.messageId}`,
            userId: data.userId });
    }

    // =====================================================
    // BULK NOTIFICATION HELPERS
    // =====================================================

    async notifyAllTenantUsers(data: {

        title: string;
        message: string;
        type: NotificationType;
        link?: string;
        excludeUserIds?: string[];
    }) {
        const users = await this.prisma.user.findMany({
            where: { 

                isActive: true,
                ...(data.excludeUserIds?.length ? { id: { notIn: data.excludeUserIds } } : {}) },
            select: { id: true } });

        const notifications = await Promise.all(
            users.map(user => 
                this.create({
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    link: data.link,
                    userId: user.id })
            )
        );

        return notifications;
    }
}

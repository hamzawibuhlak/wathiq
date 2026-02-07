import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ScheduledNotificationsService {
    private readonly logger = new Logger(ScheduledNotificationsService.name);

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    // Run every hour to check for hearing reminders
    @Cron(CronExpression.EVERY_HOUR)
    async sendHearingReminders() {
        this.logger.log('Checking for upcoming hearing reminders...');

        try {
            // Get all notification settings grouped by reminderHoursBefore
            const settings = await this.prisma.notificationSettings.findMany({
                where: { hearingReminders: true },
                select: { userId: true, tenantId: true, reminderHoursBefore: true },
            });

            // For each user setting, check if they have hearings coming up
            for (const setting of settings) {
                const reminderHours = setting.reminderHoursBefore || 24;
                const now = new Date();
                const reminderTime = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);
                const oneHourAfter = new Date(reminderTime.getTime() + 60 * 60 * 1000);

                // Find hearings within the reminder window
                const hearings = await this.prisma.hearing.findMany({
                    where: {
                        tenantId: setting.tenantId,
                        assignedToId: setting.userId,
                        status: 'SCHEDULED',
                        hearingDate: {
                            gte: reminderTime,
                            lt: oneHourAfter,
                        },
                    },
                    include: {
                        case: { select: { title: true } },
                    },
                });

                for (const hearing of hearings) {
                    // Check if we already sent a reminder for this hearing
                    const existingNotification = await this.prisma.notification.findFirst({
                        where: {
                            userId: setting.userId,
                            link: `/hearings/${hearing.id}`,
                            title: 'تذكير بجلسة قادمة',
                            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                        },
                    });

                    if (!existingNotification) {
                        await this.notificationsService.notifyHearingReminder({
                            userId: setting.userId,
                            tenantId: setting.tenantId,
                            hearingId: hearing.id,
                            caseTitle: hearing.case?.title || 'جلسة',
                            hearingDate: hearing.hearingDate,
                        });
                        this.logger.log(`Sent hearing reminder for hearing ${hearing.id} to user ${setting.userId}`);
                    }
                }
            }
        } catch (error) {
            this.logger.error('Error sending hearing reminders:', error);
        }
    }

    // Run every day at 9 AM to check for overdue invoices
    @Cron('0 9 * * *')
    async checkOverdueInvoices() {
        this.logger.log('Checking for overdue invoices...');

        try {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            // Find overdue invoices
            const overdueInvoices = await this.prisma.invoice.findMany({
                where: {
                    status: { in: ['PENDING', 'SENT'] },
                    dueDate: { lt: now },
                },
                include: {
                    client: { select: { name: true } },
                    createdBy: { select: { id: true } },
                    tenant: { select: { id: true } },
                },
            });

            // Update status to OVERDUE and notify
            for (const invoice of overdueInvoices) {
                await this.prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { status: 'OVERDUE' },
                });

                // Get users with invoice reminder settings enabled
                const usersToNotify = await this.prisma.notificationSettings.findMany({
                    where: {
                        tenantId: invoice.tenantId,
                        invoiceReminders: true,
                    },
                    select: { userId: true },
                });

                // Also notify the invoice creator
                const userIds = [...new Set([
                    invoice.createdById,
                    ...usersToNotify.map(u => u.userId),
                ])];

                for (const userId of userIds) {
                    await this.notificationsService.notifyInvoiceOverdue({
                        userId,
                        tenantId: invoice.tenantId,
                        invoiceId: invoice.id,
                        invoiceNumber: invoice.invoiceNumber,
                        clientName: invoice.client.name,
                    });
                }

                this.logger.log(`Marked invoice ${invoice.invoiceNumber} as overdue and notified users`);
            }
        } catch (error) {
            this.logger.error('Error checking overdue invoices:', error);
        }
    }

    // Run every day at 8 AM to check for overdue tasks
    @Cron('0 8 * * *')
    async checkOverdueTasks() {
        this.logger.log('Checking for overdue tasks...');

        try {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            // Find overdue tasks that are not completed or cancelled
            const overdueTasks = await this.prisma.task.findMany({
                where: {
                    status: { notIn: ['COMPLETED', 'CANCELLED'] },
                    dueDate: { lt: now },
                },
                include: {
                    assignedTo: { select: { id: true } },
                    tenant: { select: { id: true } },
                },
            });

            for (const task of overdueTasks) {
                // Check if we already sent a notification today
                const existingNotification = await this.prisma.notification.findFirst({
                    where: {
                        userId: task.assignedToId,
                        link: `/tasks/${task.id}`,
                        title: 'مهمة متأخرة',
                        createdAt: { gte: now },
                    },
                });

                if (!existingNotification) {
                    await this.notificationsService.notifyTaskOverdue({
                        userId: task.assignedToId,
                        tenantId: task.tenantId,
                        taskId: task.id,
                        taskTitle: task.title,
                    });
                    this.logger.log(`Sent overdue task notification for task ${task.id}`);
                }
            }
        } catch (error) {
            this.logger.error('Error checking overdue tasks:', error);
        }
    }

    // Run every day at 6 AM to send daily digest
    @Cron('0 6 * * *')
    async sendDailyDigest() {
        this.logger.log('Preparing daily digests...');

        try {
            // Get users who want daily digest
            const usersWithDigest = await this.prisma.notificationSettings.findMany({
                where: { dailyDigest: true },
                select: { userId: true, tenantId: true },
            });

            for (const setting of usersWithDigest) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                // Get today's hearings
                const todayHearings = await this.prisma.hearing.count({
                    where: {
                        tenantId: setting.tenantId,
                        assignedToId: setting.userId,
                        status: 'SCHEDULED',
                        hearingDate: { gte: today, lt: tomorrow },
                    },
                });

                // Get pending tasks due today
                const tasksDueToday = await this.prisma.task.count({
                    where: {
                        tenantId: setting.tenantId,
                        assignedToId: setting.userId,
                        status: { notIn: ['COMPLETED', 'CANCELLED'] },
                        dueDate: { gte: today, lt: tomorrow },
                    },
                });

                // Get unread notifications count
                const unreadNotifications = await this.prisma.notification.count({
                    where: {
                        userId: setting.userId,
                        tenantId: setting.tenantId,
                        isRead: false,
                    },
                });

                if (todayHearings > 0 || tasksDueToday > 0 || unreadNotifications > 0) {
                    const parts = [];
                    if (todayHearings > 0) parts.push(`${todayHearings} جلسة اليوم`);
                    if (tasksDueToday > 0) parts.push(`${tasksDueToday} مهمة مستحقة`);
                    if (unreadNotifications > 0) parts.push(`${unreadNotifications} إشعار غير مقروء`);

                    await this.notificationsService.create({
                        title: 'ملخص اليوم',
                        message: parts.join(' | '),
                        type: 'INFO',
                        link: '/dashboard',
                        userId: setting.userId,
                        tenantId: setting.tenantId,
                    });

                    this.logger.log(`Sent daily digest to user ${setting.userId}`);
                }
            }
        } catch (error) {
            this.logger.error('Error sending daily digest:', error);
        }
    }

    // Clean up old notifications (older than 30 days and read)
    @Cron('0 3 * * 0') // Every Sunday at 3 AM
    async cleanupOldNotifications() {
        this.logger.log('Cleaning up old notifications...');

        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await this.prisma.notification.deleteMany({
                where: {
                    isRead: true,
                    createdAt: { lt: thirtyDaysAgo },
                },
            });

            this.logger.log(`Deleted ${result.count} old notifications`);
        } catch (error) {
            this.logger.error('Error cleaning up old notifications:', error);
        }
    }
}

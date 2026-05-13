import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

export interface CreateMessageDto {
    subject: string;
    content: string;
    receiverId: string;
}

@Injectable()
export class MessagesService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async send(dto: CreateMessageDto, senderId: string) {
        // Verify receiver exists in same tenant
        const receiver = await this.prisma.user.findFirst({
            where: { id: dto.receiverId, isActive: true } });

        if (!receiver) {
            throw new NotFoundException('المستلم غير موجود');
        }

        const sender = await this.prisma.user.findUnique({
            where: { id: senderId },
            select: { name: true } });

        const message = await this.prisma.message.create({
            data: {
                subject: dto.subject,
                content: dto.content,
                senderId,
                receiverId: dto.receiverId },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } } } });

        // Send notification to receiver
        await this.notificationsService.notifyNewMessage({
            userId: dto.receiverId,

            messageId: message.id,
            senderName: sender?.name || 'مستخدم',
            subject: dto.subject });

        return message;
    }

    async getInbox(userId: string, options?: { limit?: number; offset?: number }) {
        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: {
                    receiverId: userId,

                    deletedByReceiver: false },
                include: {
                    sender: { select: { id: true, name: true, avatar: true } } },
                orderBy: { createdAt: 'desc' },
                take: options?.limit || 50,
                skip: options?.offset || 0 }),
            this.prisma.message.count({
                where: {
                    receiverId: userId,

                    deletedByReceiver: false } }),
        ]);

        return { data: messages, total };
    }

    async getSent(userId: string, options?: { limit?: number; offset?: number }) {
        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: {
                    senderId: userId,

                    deletedBySender: false },
                include: {
                    receiver: { select: { id: true, name: true, avatar: true } } },
                orderBy: { createdAt: 'desc' },
                take: options?.limit || 50,
                skip: options?.offset || 0 }),
            this.prisma.message.count({
                where: {
                    senderId: userId,

                    deletedBySender: false } }),
        ]);

        return { data: messages, total };
    }

    async findOne(id: string, userId: string) {
        const message = await this.prisma.message.findFirst({
            where: {
                id,

                OR: [
                    { senderId: userId, deletedBySender: false },
                    { receiverId: userId, deletedByReceiver: false },
                ] },
            include: {
                sender: { select: { id: true, name: true, avatar: true, email: true } },
                receiver: { select: { id: true, name: true, avatar: true, email: true } } } });

        if (!message) {
            throw new NotFoundException('الرسالة غير موجودة');
        }

        // Mark as read if user is receiver
        if (message.receiverId === userId && !message.isRead) {
            await this.prisma.message.update({
                where: { id },
                data: { isRead: true } });
        }

        return message;
    }

    async getUnreadCount(userId: string) {
        return this.prisma.message.count({
            where: {
                receiverId: userId,

                isRead: false,
                deletedByReceiver: false } });
    }

    async markAsRead(id: string, userId: string) {
        const message = await this.prisma.message.findFirst({
            where: { id, receiverId: userId } });

        if (!message) {
            throw new NotFoundException('الرسالة غير موجودة');
        }

        return this.prisma.message.update({
            where: { id },
            data: { isRead: true } });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.message.updateMany({
            where: {
                receiverId: userId,

                isRead: false,
                deletedByReceiver: false },
            data: { isRead: true } });
    }

    async delete(id: string, userId: string) {
        const message = await this.prisma.message.findFirst({
            where: {
                id,

                OR: [{ senderId: userId }, { receiverId: userId }] } });

        if (!message) {
            throw new NotFoundException('الرسالة غير موجودة');
        }

        // Soft delete based on user role
        if (message.senderId === userId) {
            await this.prisma.message.update({
                where: { id },
                data: { deletedBySender: true } });
        }

        if (message.receiverId === userId) {
            await this.prisma.message.update({
                where: { id },
                data: { deletedByReceiver: true } });
        }

        // Hard delete if both deleted
        const updated = await this.prisma.message.findUnique({ where: { id } });
        if (updated?.deletedBySender && updated?.deletedByReceiver) {
            await this.prisma.message.delete({ where: { id } });
        }

        return { success: true };
    }

    // Get users that can receive messages (same tenant)
    async getRecipients(userId: string) {
        const users = await this.prisma.user.findMany({
            where: {
                isActive: true,
                id: { not: userId } },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true },
            orderBy: { name: 'asc' } });

        return users;
    }
}

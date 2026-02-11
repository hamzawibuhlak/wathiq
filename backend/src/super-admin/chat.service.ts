import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SuperAdminChatService {
    constructor(private prisma: PrismaService) { }

    async getOrCreateRoom(tenantId: string) {
        return this.prisma.superAdminChatRoom.upsert({
            where: { tenantId },
            create: { tenantId },
            update: {},
            include: {
                tenant: { select: { name: true, slug: true } },
                messages: { orderBy: { createdAt: 'asc' }, take: 50 },
            },
        });
    }

    async getAllRooms() {
        return this.prisma.superAdminChatRoom.findMany({
            include: {
                tenant: { select: { id: true, name: true, slug: true } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
            orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        });
    }

    async sendFromAdmin(roomId: string, adminId: string, adminName: string, content: string) {
        const room = await this.prisma.superAdminChatRoom.findUnique({ where: { id: roomId } });
        if (!room) throw new NotFoundException('المحادثة غير موجودة');

        const message = await this.prisma.superAdminChatMessage.create({
            data: {
                roomId,
                content,
                senderType: 'ADMIN',
                senderId: adminId,
                senderName: adminName,
            },
        });

        await this.prisma.superAdminChatRoom.update({
            where: { id: roomId },
            data: {
                lastMessage: content,
                lastMessageAt: new Date(),
                status: 'IN_PROGRESS',
            },
        });

        return message;
    }

    async sendFromTenant(tenantId: string, userId: string, userName: string, content: string) {
        const room = await this.getOrCreateRoom(tenantId);

        const message = await this.prisma.superAdminChatMessage.create({
            data: {
                roomId: room.id,
                content,
                senderType: 'TENANT',
                senderId: userId,
                senderName: userName,
            },
        });

        await this.prisma.superAdminChatRoom.update({
            where: { id: room.id },
            data: {
                lastMessage: content,
                lastMessageAt: new Date(),
                unreadCount: { increment: 1 },
                status: 'OPEN',
            },
        });

        return message;
    }

    async getRoomMessages(roomId: string, page = 1, limit = 50) {
        const messages = await this.prisma.superAdminChatMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return messages;
    }

    async markAsRead(roomId: string) {
        await this.prisma.superAdminChatMessage.updateMany({
            where: { roomId, senderType: 'TENANT', isRead: false },
            data: { isRead: true },
        });
        await this.prisma.superAdminChatRoom.update({
            where: { id: roomId },
            data: { unreadCount: 0 },
        });
        return { success: true };
    }

    async resolveRoom(roomId: string) {
        return this.prisma.superAdminChatRoom.update({
            where: { id: roomId },
            data: { status: 'RESOLVED' },
        });
    }
}

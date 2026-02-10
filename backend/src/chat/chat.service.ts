import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(private prisma: PrismaService) { }

    // =============================================
    // CONVERSATIONS
    // =============================================

    async getOrCreateDM(userId1: string, userId2: string, tenantId: string) {
        // Find existing DM between these two users
        const existing = await this.prisma.chatConversation.findFirst({
            where: {
                tenantId,
                type: 'DIRECT',
                AND: [
                    { members: { some: { userId: userId1, leftAt: null } } },
                    { members: { some: { userId: userId2, leftAt: null } } },
                ],
            },
            include: {
                members: {
                    where: { leftAt: null },
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true, role: true },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    where: { isDeleted: false },
                },
            },
        });

        if (existing && existing.members.length === 2) {
            return existing;
        }

        // Create new DM
        return this.prisma.chatConversation.create({
            data: {
                type: 'DIRECT',
                creator: { connect: { id: userId1 } },
                tenant: { connect: { id: tenantId } },
                members: {
                    create: [
                        { userId: userId1 },
                        { userId: userId2 },
                    ],
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true, role: true },
                        },
                    },
                },
            },
        });
    }

    async createGroup(
        creatorId: string,
        tenantId: string,
        data: { name: string; description?: string; memberIds: string[] },
    ) {
        const users = await this.prisma.user.findMany({
            where: { id: { in: data.memberIds }, tenantId },
        });

        if (users.length !== data.memberIds.length) {
            throw new BadRequestException('بعض المستخدمين غير موجودين');
        }

        const allMemberIds = [creatorId, ...data.memberIds.filter(id => id !== creatorId)];

        return this.prisma.chatConversation.create({
            data: {
                type: 'GROUP',
                name: data.name,
                description: data.description,
                creator: { connect: { id: creatorId } },
                tenant: { connect: { id: tenantId } },
                members: {
                    create: allMemberIds.map(userId => ({
                        userId,
                        role: userId === creatorId ? 'ADMIN' : 'MEMBER',
                        isAdmin: userId === creatorId,
                    })),
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true, role: true },
                        },
                    },
                },
            },
        });
    }

    async getUserConversations(userId: string, tenantId: string) {
        const conversations = await this.prisma.chatConversation.findMany({
            where: {
                tenantId,
                isActive: true,
                members: { some: { userId, leftAt: null } },
            },
            include: {
                members: {
                    where: { leftAt: null },
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true, role: true },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    where: { isDeleted: false },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        const withUnread = await Promise.all(
            conversations.map(async conv => {
                const member = conv.members.find(m => m.userId === userId);
                const unreadCount = member?.lastReadAt
                    ? await this.prisma.chatMessage.count({
                        where: {
                            conversationId: conv.id,
                            createdAt: { gt: member.lastReadAt },
                            senderId: { not: userId },
                            isDeleted: false,
                        },
                    })
                    : await this.prisma.chatMessage.count({
                        where: {
                            conversationId: conv.id,
                            senderId: { not: userId },
                            isDeleted: false,
                        },
                    });

                return { ...conv, unreadCount };
            }),
        );

        return withUnread;
    }

    // =============================================
    // MESSAGES
    // =============================================

    async sendMessage(
        conversationId: string,
        senderId: string,
        tenantId: string,
        data: {
            content?: string;
            type?: 'TEXT' | 'FILE' | 'IMAGE' | 'VOICE';
            replyToId?: string;
            fileUrl?: string;
            fileName?: string;
            fileSize?: number;
            fileMimeType?: string;
            audioDuration?: number;
        },
    ) {
        const member = await this.prisma.chatConversationMember.findUnique({
            where: {
                conversationId_userId: { conversationId, userId: senderId },
            },
        });

        if (!member || member.leftAt) {
            throw new BadRequestException('لست عضواً في هذه المحادثة');
        }

        const message = await this.prisma.chatMessage.create({
            data: {
                conversation: { connect: { id: conversationId } },
                sender: { connect: { id: senderId } },
                content: data.content,
                type: data.type || 'TEXT',
                replyTo: data.replyToId ? { connect: { id: data.replyToId } } : undefined,
                fileUrl: data.fileUrl,
                fileName: data.fileName,
                fileSize: data.fileSize,
                fileMimeType: data.fileMimeType,
                audioDuration: data.audioDuration,
                tenant: { connect: { id: tenantId } },
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true, role: true },
                },
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { name: true } },
                    },
                },
            },
        });

        await this.prisma.chatConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        return message;
    }

    async getMessages(
        conversationId: string,
        userId: string,
        tenantId: string,
        options?: { cursor?: string; limit?: number },
    ) {
        const limit = options?.limit || 50;

        const whereClause: any = {
            conversationId,
            tenantId,
            isDeleted: false,
        };

        if (options?.cursor) {
            const cursorDate = await this.getMessageDate(options.cursor);
            whereClause.createdAt = { lt: cursorDate };
        }

        const messages = await this.prisma.chatMessage.findMany({
            where: whereClause,
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true, role: true },
                },
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        type: true,
                        sender: { select: { name: true } },
                    },
                },
                reactions: {
                    include: {
                        user: { select: { id: true, name: true } },
                    },
                },
                receipts: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        await this.markAsRead(conversationId, userId, tenantId);

        return messages.reverse();
    }

    async markAsRead(conversationId: string, userId: string, tenantId: string) {
        const unreadMessages = await this.prisma.chatMessage.findMany({
            where: {
                conversationId,
                tenantId,
                senderId: { not: userId },
                isDeleted: false,
                receipts: { none: { userId } },
            },
            select: { id: true },
        });

        if (unreadMessages.length > 0) {
            await this.prisma.chatMessageReceipt.createMany({
                data: unreadMessages.map(msg => ({
                    messageId: msg.id,
                    userId,
                })),
                skipDuplicates: true,
            });
        }

        await this.prisma.chatConversationMember.update({
            where: {
                conversationId_userId: { conversationId, userId },
            },
            data: { lastReadAt: new Date() },
        });

        return { marked: unreadMessages.length };
    }

    async editMessage(messageId: string, userId: string, tenantId: string, newContent: string) {
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
        });

        if (!message || message.tenantId !== tenantId) {
            throw new BadRequestException('الرسالة غير موجودة');
        }

        if (message.senderId !== userId) {
            throw new BadRequestException('لا يمكنك تعديل رسالة شخص آخر');
        }

        return this.prisma.chatMessage.update({
            where: { id: messageId },
            data: {
                content: newContent,
                isEdited: true,
                editedAt: new Date(),
            },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
            },
        });
    }

    async deleteMessage(messageId: string, userId: string, tenantId: string) {
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
        });

        if (!message || message.tenantId !== tenantId) {
            throw new BadRequestException('الرسالة غير موجودة');
        }

        if (message.senderId !== userId) {
            throw new BadRequestException('لا يمكنك حذف رسالة شخص آخر');
        }

        return this.prisma.chatMessage.update({
            where: { id: messageId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                content: null,
                fileUrl: null,
            },
        });
    }

    async toggleReaction(messageId: string, userId: string, emoji: string) {
        const existing = await this.prisma.chatMessageReaction.findUnique({
            where: {
                messageId_userId_emoji: { messageId, userId, emoji },
            },
        });

        if (existing) {
            await this.prisma.chatMessageReaction.delete({
                where: { id: existing.id },
            });
            return { action: 'removed', emoji };
        }

        await this.prisma.chatMessageReaction.create({
            data: { messageId, userId, emoji },
        });

        return { action: 'added', emoji };
    }

    async searchMessages(query: string, userId: string, tenantId: string) {
        return this.prisma.chatMessage.findMany({
            where: {
                tenantId,
                isDeleted: false,
                content: { contains: query, mode: 'insensitive' },
                conversation: {
                    members: { some: { userId, leftAt: null } },
                },
            },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                conversation: { select: { id: true, name: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }

    async getOnlineMembers(conversationId: string) {
        const members = await this.prisma.chatConversationMember.findMany({
            where: { conversationId, leftAt: null },
            select: { userId: true },
        });
        return members.map(m => m.userId);
    }

    private async getMessageDate(messageId: string): Promise<Date> {
        const msg = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
            select: { createdAt: true },
        });
        return msg?.createdAt || new Date();
    }
}

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(private prisma: PrismaService) { }

    // =============================================
    // CONVERSATIONS
    // =============================================

    async getOrCreateDM(userId1: string, userId2: string) {
        // Find existing DM between these two users
        const existing = await this.prisma.chatConversation.findFirst({
            where: {
                type: 'DIRECT',
                AND: [
                    { members: { some: { userId: userId1, leftAt: null } } },
                    { members: { some: { userId: userId2, leftAt: null } } },
                ] },
            include: {
                members: {
                    where: { leftAt: null },
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true, role: true } } } },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    where: { isDeleted: false } } } });

        if (existing && existing.members.length === 2) {
            return existing;
        }

        // Create new DM
        return this.prisma.chatConversation.create({
            data: {
                type: 'DIRECT',
                creator: { connect: { id: userId1 } },

                members: {
                    create: [
                        { userId: userId1 },
                        { userId: userId2 },
                    ] } },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, avatar: true, role: true } } } } } });
    }

    async createGroup(
        creatorId: string,
        data: { name: string; description?: string; memberIds: string[] },
    ) {
        const users = await this.prisma.user.findMany({
            where: { id: { in: data.memberIds } } });

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

                members: {
                    create: allMemberIds.map(userId => ({
                        userId,
                        role: userId === creatorId ? 'ADMIN' : 'MEMBER',
                        isAdmin: userId === creatorId })) } },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true, role: true } } } } } });
    }

    async getUserConversations(userId: string) {
        const conversations = await this.prisma.chatConversation.findMany({
            where: {
                isActive: true,
                members: { some: { userId, leftAt: null } } },
            include: {
                members: {
                    where: { leftAt: null },
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true, role: true } } } },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    where: { isDeleted: false } } },
            orderBy: { updatedAt: 'desc' } });

        const withUnread = await Promise.all(
            conversations.map(async conv => {
                const member = conv.members.find(m => m.userId === userId);
                const unreadCount = member?.lastReadAt
                    ? await this.prisma.chatMessage.count({
                        where: {
                            conversationId: conv.id,
                            createdAt: { gt: member.lastReadAt },
                            senderId: { not: userId },
                            isDeleted: false } })
                    : await this.prisma.chatMessage.count({
                        where: {
                            conversationId: conv.id,
                            senderId: { not: userId },
                            isDeleted: false } });

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
                conversationId_userId: { conversationId, userId: senderId } } });

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
                audioDuration: data.audioDuration },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true, role: true } },
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        sender: { select: { name: true } } } } } });

        await this.prisma.chatConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() } });

        return message;
    }

    async getMessages(
        conversationId: string,
        userId: string,
        options?: { cursor?: string; limit?: number },
    ) {
        const limit = options?.limit || 50;

        const whereClause: any = {
            conversationId,

            isDeleted: false };

        if (options?.cursor) {
            const cursorDate = await this.getMessageDate(options.cursor);
            whereClause.createdAt = { lt: cursorDate };
        }

        const messages = await this.prisma.chatMessage.findMany({
            where: whereClause,
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true, role: true } },
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        type: true,
                        sender: { select: { name: true } } } },
                reactions: {
                    include: {
                        user: { select: { id: true, name: true } } } },
                receipts: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } } } } },
            orderBy: { createdAt: 'desc' },
            take: limit });

        await this.markAsRead(conversationId, userId);

        return messages.reverse();
    }

    async markAsRead(conversationId: string, userId: string) {
        const unreadMessages = await this.prisma.chatMessage.findMany({
            where: {
                conversationId,

                senderId: { not: userId },
                isDeleted: false,
                receipts: { none: { userId } } },
            select: { id: true } });

        if (unreadMessages.length > 0) {
            await this.prisma.chatMessageReceipt.createMany({
                data: unreadMessages.map(msg => ({
                    messageId: msg.id,
                    userId })),
                skipDuplicates: true });
        }

        await this.prisma.chatConversationMember.update({
            where: {
                conversationId_userId: { conversationId, userId } },
            data: { lastReadAt: new Date() } });

        return { marked: unreadMessages.length };
    }

    async editMessage(messageId: string, userId: string, newContent: string) {
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId } });

        if (!message) {
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
                editedAt: new Date() },
            include: {
                sender: { select: { id: true, name: true, avatar: true } } } });
    }

    async deleteMessage(messageId: string, userId: string) {
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId } });

        if (!message) {
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
                fileUrl: null } });
    }

    async toggleReaction(messageId: string, userId: string, emoji: string) {
        const existing = await this.prisma.chatMessageReaction.findUnique({
            where: {
                messageId_userId_emoji: { messageId, userId, emoji } } });

        if (existing) {
            await this.prisma.chatMessageReaction.delete({
                where: { id: existing.id } });
            return { action: 'removed', emoji };
        }

        await this.prisma.chatMessageReaction.create({
            data: { messageId, userId, emoji } });

        return { action: 'added', emoji };
    }

    async searchMessages(query: string, userId: string) {
        return this.prisma.chatMessage.findMany({
            where: {
                isDeleted: false,
                content: { contains: query, mode: 'insensitive' },
                conversation: {
                    members: { some: { userId, leftAt: null } } } },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                conversation: { select: { id: true, name: true, type: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20 });
    }

    async getOnlineMembers(conversationId: string) {
        const members = await this.prisma.chatConversationMember.findMany({
            where: { conversationId, leftAt: null },
            select: { userId: true } });
        return members.map(m => m.userId);
    }

    private async getMessageDate(messageId: string): Promise<Date> {
        const msg = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
            select: { createdAt: true } });
        return msg?.createdAt || new Date();
    }

    async deleteConversation(conversationId: string, userId: string, tenantId: string) {
        const conv = await this.prisma.chatConversation.findFirst({
            where: { id: conversationId, tenantId },
            include: { members: { where: { leftAt: null } } },
        });

        if (!conv) throw new BadRequestException('المحادثة غير موجودة');

        const member = conv.members.find(m => m.userId === userId);
        if (!member) throw new BadRequestException('لست عضواً في هذه المحادثة');

        if (conv.type === 'DIRECT') {
            // For DM: mark user as left (soft delete for this user)
            await this.prisma.chatConversationMember.update({
                where: { conversationId_userId: { conversationId, userId } },
                data: { leftAt: new Date() },
            });
        } else {
            // For GROUP: only admin can deactivate the whole group
            if (!member.isAdmin) {
                // Non-admin: just leave the group
                await this.prisma.chatConversationMember.update({
                    where: { conversationId_userId: { conversationId, userId } },
                    data: { leftAt: new Date() },
                });
            } else {
                // Admin: deactivate the whole group
                await this.prisma.chatConversation.update({
                    where: { id: conversationId },
                    data: { isActive: false },
                });
            }
        }

        return { success: true };
    }

    async forwardMessage(
        messageId: string,
        targetConversationId: string,
        senderId: string,
        tenantId: string,
    ) {
        const originalMsg = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
            include: { sender: { select: { name: true } } },
        });

        if (!originalMsg || originalMsg.isDeleted) {
            throw new BadRequestException('الرسالة غير موجودة');
        }

        // Build forwarded content
        const prefix = `↪️ *محوّلة من ${originalMsg.sender.name}:*`;
        const forwardedContent = originalMsg.content
            ? `${prefix}\n${originalMsg.content}`
            : `${prefix} (ملف)`;

        return this.sendMessage(targetConversationId, senderId, tenantId, {
            content: forwardedContent,
            type: originalMsg.type as any,
            fileUrl: originalMsg.fileUrl ?? undefined,
            fileName: originalMsg.fileName ?? undefined,
            fileSize: originalMsg.fileSize ?? undefined,
            fileMimeType: originalMsg.fileMimeType ?? undefined,
        });
    }

    // =============================================
    // GROUP MANAGEMENT
    // =============================================

    async updateGroup(conversationId: string, actorId: string, tenantId: string, data: { name?: string; description?: string }) {
        const member = await this.prisma.chatConversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId: actorId } },
        });
        if (!member?.isAdmin) throw new BadRequestException('\u0641\u0642\u0637 \u0627\u0644\u0645\u0634\u0631\u0641 \u064a\u0645\u0643\u0646\u0647 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629');
        return this.prisma.chatConversation.update({
            where: { id: conversationId },
            data: { name: data.name, description: data.description },
            include: {
                members: {
                    where: { leftAt: null },
                    include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
                },
            },
        });
    }

    async addMember(conversationId: string, actorId: string, tenantId: string, userId: string) {
        const actor = await this.prisma.chatConversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId: actorId } },
        });
        if (!actor?.isAdmin) throw new BadRequestException('\u0641\u0642\u0637 \u0627\u0644\u0645\u0634\u0631\u0641 \u064a\u0645\u0643\u0646\u0647 \u0625\u0636\u0627\u0641\u0629 \u0623\u0639\u0636\u0627\u0621');
        const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
        if (!user) throw new BadRequestException('\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f');
        return this.prisma.chatConversationMember.upsert({
            where: { conversationId_userId: { conversationId, userId } },
            update: { leftAt: null },
            create: { conversationId, userId, role: 'MEMBER', isAdmin: false },
        });
    }

    async removeMember(conversationId: string, actorId: string, tenantId: string, userId: string) {
        const actor = await this.prisma.chatConversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId: actorId } },
        });
        if (!actor?.isAdmin && actorId !== userId) {
            throw new BadRequestException('\u0641\u0642\u0637 \u0627\u0644\u0645\u0634\u0631\u0641 \u064a\u0645\u0643\u0646\u0647 \u0625\u0632\u0627\u0644\u0629 \u0623\u0639\u0636\u0627\u0621');
        }
        await this.prisma.chatConversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { leftAt: new Date() },
        });
        return { success: true };
    }

    async toggleAdmin(conversationId: string, actorId: string, tenantId: string, userId: string) {
        const actor = await this.prisma.chatConversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId: actorId } },
        });
        if (!actor?.isAdmin) throw new BadRequestException('\u0641\u0642\u0637 \u0627\u0644\u0645\u0634\u0631\u0641 \u064a\u0645\u0643\u0646\u0647 \u062a\u0639\u064a\u064a\u0646 \u0645\u0634\u0631\u0641\u064a\u0646');
        const target = await this.prisma.chatConversationMember.findUnique({
            where: { conversationId_userId: { conversationId, userId } },
        });
        if (!target) throw new BadRequestException('\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0644\u064a\u0633 \u0639\u0636\u0648\u0627\u064b');
        const newIsAdmin = !target.isAdmin;
        return this.prisma.chatConversationMember.update({
            where: { conversationId_userId: { conversationId, userId } },
            data: { isAdmin: newIsAdmin, role: newIsAdmin ? 'ADMIN' : 'MEMBER' },
            include: { user: { select: { id: true, name: true, avatar: true } } },
        });
    }
}

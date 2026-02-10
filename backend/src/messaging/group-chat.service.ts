import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class GroupChatService {
    private readonly logger = new Logger(GroupChatService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Create group chat
     */
    async createGroup(
        tenantId: string,
        createdById: string,
        data: {
            name: string;
            description?: string;
            memberIds: string[];
        },
    ) {
        const group = await this.prisma.groupChat.create({
            data: {
                name: data.name,
                description: data.description,
                tenantId,
                createdById,
                members: {
                    create: [
                        // Creator as admin
                        { userId: createdById, role: 'ADMIN' },
                        // Other members
                        ...data.memberIds
                            .filter(id => id !== createdById)
                            .map(userId => ({
                                userId,
                                role: 'MEMBER' as const,
                            })),
                    ],
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });

        this.logger.log(`Group created: ${group.id} by user ${createdById}`);
        return group;
    }

    /**
     * Add members to group
     */
    async addMembers(
        groupId: string,
        userId: string,
        memberIds: string[],
    ) {
        // Check if user is admin
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });

        if (member?.role !== 'ADMIN') {
            throw new ForbiddenException('فقط المشرفون يمكنهم إضافة أعضاء');
        }

        return this.prisma.groupMember.createMany({
            data: memberIds.map(memberId => ({
                groupId,
                userId: memberId,
                role: 'MEMBER' as const,
            })),
            skipDuplicates: true,
        });
    }

    /**
     * Remove member from group
     */
    async removeMember(
        groupId: string,
        userId: string,
        memberIdToRemove: string,
    ) {
        // Check if user is admin or removing themselves
        if (userId !== memberIdToRemove) {
            const member = await this.prisma.groupMember.findUnique({
                where: {
                    groupId_userId: { groupId, userId },
                },
            });

            if (member?.role !== 'ADMIN') {
                throw new ForbiddenException('فقط المشرفون يمكنهم إزالة أعضاء');
            }
        }

        return this.prisma.groupMember.delete({
            where: {
                groupId_userId: { groupId, userId: memberIdToRemove },
            },
        });
    }

    /**
     * Get user's groups
     */
    async getUserGroups(userId: string) {
        return this.prisma.groupChat.findMany({
            where: {
                members: {
                    some: { userId },
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        messages: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    /**
     * Get single group
     */
    async getGroup(groupId: string, userId: string) {
        const group = await this.prisma.groupChat.findFirst({
            where: {
                id: groupId,
                members: {
                    some: { userId },
                },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });

        if (!group) {
            throw new NotFoundException('المجموعة غير موجودة');
        }

        return group;
    }

    /**
     * Send group message
     */
    async sendGroupMessage(
        senderId: string,
        groupId: string,
        content: string,
        attachments?: string[],
    ) {
        // Verify user is member
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId: senderId },
            },
        });

        if (!member) {
            throw new ForbiddenException('لست عضواً في هذه المجموعة');
        }

        const message = await this.prisma.groupMessage.create({
            data: {
                senderId,
                groupId,
                content,
                attachments: attachments || [],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        // Update group's updatedAt
        await this.prisma.groupChat.update({
            where: { id: groupId },
            data: { updatedAt: new Date() },
        });

        return message;
    }

    /**
     * Get group messages
     */
    async getGroupMessages(groupId: string, userId: string, limit = 50, before?: string) {
        // Verify user is member
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });

        if (!member) {
            throw new ForbiddenException('لست عضواً في هذه المجموعة');
        }

        const where: any = { groupId };

        if (before) {
            const beforeMessage = await this.prisma.groupMessage.findUnique({
                where: { id: before },
                select: { createdAt: true },
            });
            if (beforeMessage) {
                where.createdAt = { lt: beforeMessage.createdAt };
            }
        }

        const messages = await this.prisma.groupMessage.findMany({
            where,
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return messages.reverse();
    }

    /**
     * Update group info
     */
    async updateGroup(
        groupId: string,
        userId: string,
        data: { name?: string; description?: string; avatar?: string },
    ) {
        // Check if user is admin
        const member = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: { groupId, userId },
            },
        });

        if (member?.role !== 'ADMIN') {
            throw new ForbiddenException('فقط المشرفون يمكنهم تعديل المجموعة');
        }

        return this.prisma.groupChat.update({
            where: { id: groupId },
            data,
        });
    }

    /**
     * Delete group
     */
    async deleteGroup(groupId: string, userId: string) {
        const group = await this.prisma.groupChat.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('المجموعة غير موجودة');
        }

        if (group.createdById !== userId) {
            throw new ForbiddenException('فقط منشئ المجموعة يمكنه حذفها');
        }

        await this.prisma.groupChat.delete({
            where: { id: groupId },
        });

        return { success: true };
    }
}

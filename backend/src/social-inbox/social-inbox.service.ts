import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SocialPlatform } from '@prisma/client';

@Injectable()
export class SocialInboxService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string, userRole: string, platform?: SocialPlatform) {
    const where: any = {};

    if (platform) {
      where.platform = platform;
    }

    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      where.OR = [
        { assignedToId: userId },
        { assignedToId: null },
      ];
    }

    return this.prisma.socialConversation.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { messages: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(conversationId: string) {
    const conv = await this.prisma.socialConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    return this.prisma.socialMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  }

  async assignConversation(conversationId: string, assigneeId: string) {
    const conv = await this.prisma.socialConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    return this.prisma.socialConversation.update({
      where: { id: conversationId },
      data: {
        assignedToId: assigneeId,
        status: 'ASSIGNED',
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const conv = await this.prisma.socialConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    const message = await this.prisma.socialMessage.create({
      data: {
        conversationId,
        direction: 'OUTBOUND',
        content,
        senderId,
        status: 'SENT',
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Touch conversation so it sorts to top
    await this.prisma.socialConversation.update({
      where: { id: conversationId },
      data: { status: conv.status },
    });

    return message;
  }
}

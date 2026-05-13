import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SocialPlatform, SocialConversationStatus } from '@prisma/client';

@Injectable()
export class SocialInboxService {
  constructor(private prisma: PrismaService) {}

  async getConversations(tenantId: string, userId: string, userRole: string, platform?: SocialPlatform) {
    const where: any = { tenantId };

    if (platform) {
      where.platform = platform;
    }

    // Role-based visibility
    if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'SUPER_ADMIN') {
      where.OR = [
        { assignedToId: userId },
        { assignedToId: null } // Allow seeing unassigned conversations to assign themselves
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
        // Include latest message
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(tenantId: string, conversationId: string) {
    // Verify conversation exists and belongs to tenant
    const conv = await this.prisma.socialConversation.findUnique({
      where: { id: conversationId, tenantId },
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

  async assignConversation(tenantId: string, conversationId: string, assigneeId: string) {
    // Verify constraints
    const conv = await this.prisma.socialConversation.findUnique({
      where: { id: conversationId, tenantId },
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
      }
    });
  }

  async sendMessage(tenantId: string, conversationId: string, senderId: string, content: string) {
    const conv = await this.prisma.socialConversation.findUnique({
      where: { id: conversationId, tenantId },
    });

    if (!conv) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    // Create the outbound message, storing the senderId
    const message = await this.prisma.socialMessage.create({
      data: {
        conversationId,
        tenantId,
        direction: 'OUTBOUND',
        content,
        senderId, // The real employee replying
        status: 'SENT',
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Update conversation updatedAt
    await this.prisma.socialConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return message;
  }
}

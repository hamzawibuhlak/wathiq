import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
    entity: string;
    entityId?: string;
    description: string;
    userId: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.activityLog.create({ data });
  }

  async findAll(params: {
    tenantId: string;
    userId?: string;
    entity?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      tenantId,
      userId,
      entity,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    const where: any = { tenantId };
    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(tenantId: string) {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, last24hCount, last7dCount, byEntity, byAction, byUser] =
      await Promise.all([
        this.prisma.activityLog.count({ where: { tenantId } }),
        this.prisma.activityLog.count({
          where: { tenantId, createdAt: { gte: last24h } },
        }),
        this.prisma.activityLog.count({
          where: { tenantId, createdAt: { gte: last7d } },
        }),
        this.prisma.activityLog.groupBy({
          by: ['entity'],
          where: { tenantId },
          _count: true,
          orderBy: { _count: { entity: 'desc' } },
          take: 5,
        }),
        this.prisma.activityLog.groupBy({
          by: ['action'],
          where: { tenantId },
          _count: true,
        }),
        this.prisma.activityLog.groupBy({
          by: ['userId'],
          where: { tenantId, createdAt: { gte: last7d } },
          _count: true,
          orderBy: { _count: { userId: 'desc' } },
          take: 5,
        }),
      ]);

    // Get user names for top users
    const userIds = byUser.map(u => u.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map(u => [u.id, u.name]));

    return {
      total,
      last24h: last24hCount,
      last7d: last7dCount,
      byEntity: byEntity.map(e => ({
        entity: e.entity,
        count: e._count,
      })),
      byAction: byAction.map(a => ({
        action: a.action,
        count: a._count,
      })),
      topUsers: byUser.map(u => ({
        userId: u.userId,
        userName: userMap.get(u.userId) || 'Unknown',
        count: u._count,
      })),
    };
  }

  async getRecentByEntity(
    tenantId: string,
    entity: string,
    entityId: string,
    limit = 10,
  ) {
    return this.prisma.activityLog.findMany({
      where: { tenantId, entity, entityId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

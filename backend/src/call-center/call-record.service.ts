import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CallRecordService {
    constructor(private prisma: PrismaService) { }

    async logCall(tenantId: string, agentId: string, data: {
        callId: string;
        direction: 'INBOUND' | 'OUTBOUND';
        fromNumber: string;
        toNumber: string;
        status: string;
    }) {
        // ابحث تلقائياً هل الرقم موجود كعميل
        const client = await this.prisma.client.findFirst({
            where: {
                tenantId,
                OR: [
                    { phone: data.fromNumber },
                    { phone: data.toNumber },
                ],
            },
        });

        return this.prisma.callRecord.create({
            data: {
                callId: data.callId,
                direction: data.direction as any,
                status: data.status as any,
                fromNumber: data.fromNumber,
                toNumber: data.toNumber,
                agentId,
                tenantId,
                clientId: client?.id || null,
            },
        });
    }

    async updateCallStatus(callId: string, tenantId: string, data: {
        status: string;
        answeredAt?: Date;
        endedAt?: Date;
        duration?: number;
    }) {
        return this.prisma.callRecord.updateMany({
            where: { callId, tenantId },
            data: {
                status: data.status as any,
                answeredAt: data.answeredAt,
                endedAt: data.endedAt,
                duration: data.duration,
            },
        });
    }

    async addNotes(callId: string, tenantId: string, notes: string, caseId?: string) {
        return this.prisma.callRecord.updateMany({
            where: { callId, tenantId },
            data: { notes, caseId },
        });
    }

    async getCallHistory(tenantId: string, filters?: {
        agentId?: string;
        clientId?: string;
        direction?: string;
        from?: Date;
        to?: Date;
        page?: number;
    }) {
        const { page = 1 } = filters || {};
        const where: any = { tenantId };
        if (filters?.agentId) where.agentId = filters.agentId;
        if (filters?.clientId) where.clientId = filters.clientId;
        if (filters?.direction) where.direction = filters.direction;
        if (filters?.from || filters?.to) {
            where.startedAt = {};
            if (filters.from) where.startedAt.gte = filters.from;
            if (filters.to) where.startedAt.lte = filters.to;
        }

        const [calls, total] = await Promise.all([
            this.prisma.callRecord.findMany({
                where,
                include: {
                    agent: { select: { id: true, name: true, avatar: true } },
                    client: { select: { id: true, name: true, phone: true } },
                    case: { select: { id: true, title: true, caseNumber: true } },
                },
                orderBy: { startedAt: 'desc' },
                skip: (page - 1) * 20,
                take: 20,
            }),
            this.prisma.callRecord.count({ where }),
        ]);

        return {
            data: calls,
            meta: { page, total, totalPages: Math.ceil(total / 20) },
        };
    }

    async getStats(tenantId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [total, answered, missed, inbound, outbound] = await Promise.all([
            this.prisma.callRecord.count({
                where: { tenantId, startedAt: { gte: today } },
            }),
            this.prisma.callRecord.count({
                where: { tenantId, status: 'ANSWERED', startedAt: { gte: today } },
            }),
            this.prisma.callRecord.count({
                where: { tenantId, status: { in: ['NO_ANSWER', 'BUSY'] }, startedAt: { gte: today } },
            }),
            this.prisma.callRecord.count({
                where: { tenantId, direction: 'INBOUND', startedAt: { gte: today } },
            }),
            this.prisma.callRecord.count({
                where: { tenantId, direction: 'OUTBOUND', startedAt: { gte: today } },
            }),
        ]);

        const avgDuration = await this.prisma.callRecord.aggregate({
            where: { tenantId, status: 'ANSWERED', startedAt: { gte: today } },
            _avg: { duration: true },
        });

        return {
            today: { total, answered, missed, inbound, outbound },
            avgDuration: Math.round(avgDuration._avg.duration || 0),
            answerRate: total > 0 ? Math.round((answered / total) * 100) : 0,
        };
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class MarketingService {
    constructor(private prisma: PrismaService) { }

    // ═══════════════════════════════════════
    // LEADS
    // ═══════════════════════════════════════

    async getLeads(tenantId: string, filters?: any) {
        const { page = 1, limit = 20, status, source, assignedTo, search } = filters || {};
        const where: any = { tenantId };
        if (status) where.status = status;
        if (source) where.source = source;
        if (assignedTo) where.assignedTo = assignedTo;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                include: {
                    assignee: { select: { id: true, name: true, avatarUrl: true } },
                    campaign: { select: { id: true, name: true, type: true } },
                    affiliate: { select: { id: true, name: true, referralCode: true } },
                    activities: { orderBy: { createdAt: 'desc' }, take: 1 },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.lead.count({ where }),
        ]);

        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async getLeadsKanban(tenantId: string) {
        const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST', 'NURTURING'];
        const results = await Promise.all(
            statuses.map(status =>
                this.prisma.lead.findMany({
                    where: { tenantId, status: status as any },
                    include: { assignee: { select: { id: true, name: true } } },
                    orderBy: { updatedAt: 'desc' },
                    take: 50,
                })
            )
        );
        return statuses.reduce((acc, status, i) => {
            acc[status] = results[i];
            return acc;
        }, {} as Record<string, any[]>);
    }

    async createLead(tenantId: string, userId: string, data: any) {
        const score = this.calculateLeadScore(data);
        return this.prisma.lead.create({
            data: { ...data, score, tenantId, createdBy: userId },
        });
    }

    async updateLead(id: string, tenantId: string, data: any) {
        await this.ensureLeadExists(id, tenantId);
        return this.prisma.lead.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    }

    async deleteLead(id: string, tenantId: string) {
        await this.ensureLeadExists(id, tenantId);
        return this.prisma.lead.delete({ where: { id } });
    }

    async getLeadById(id: string, tenantId: string) {
        const lead = await this.prisma.lead.findUnique({
            where: { id },
            include: {
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                campaign: { select: { id: true, name: true } },
                affiliate: { select: { id: true, name: true, referralCode: true } },
                activities: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                callLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });
        if (!lead || lead.tenantId !== tenantId) throw new NotFoundException('العميل المحتمل غير موجود');
        return lead;
    }

    async updateLeadStatus(id: string, tenantId: string, userId: string, status: string, notes?: string) {
        await this.ensureLeadExists(id, tenantId);
        await this.prisma.leadActivity.create({
            data: {
                leadId: id,
                type: 'STATUS_CHANGE',
                notes: notes || `تغيير الحالة إلى ${status}`,
                createdBy: userId,
                tenantId,
            },
        });
        if (status === 'WON') await this.convertLeadToClient(id, tenantId, userId);
        return this.prisma.lead.update({
            where: { id },
            data: { status: status as any, updatedAt: new Date() },
        });
    }

    async logLeadActivity(leadId: string, tenantId: string, userId: string, data: any) {
        await this.prisma.lead.update({
            where: { id: leadId },
            data: { lastContactAt: new Date() },
        });
        if (data.type === 'CALL') {
            await this.prisma.lead.update({
                where: { id: leadId },
                data: { callAttempts: { increment: 1 } },
            });
        }
        return this.prisma.leadActivity.create({
            data: {
                leadId, type: data.type as any,
                notes: data.notes, duration: data.duration, outcome: data.outcome,
                createdBy: userId, tenantId,
            },
        });
    }

    async getLeadStats(tenantId: string) {
        const [total, newToday, byStatus, bySource, avgScore] = await Promise.all([
            this.prisma.lead.count({ where: { tenantId } }),
            this.prisma.lead.count({
                where: { tenantId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
            }),
            this.prisma.lead.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
            this.prisma.lead.groupBy({
                by: ['source'], where: { tenantId }, _count: true,
                orderBy: { _count: { source: 'desc' } },
            }),
            this.prisma.lead.aggregate({ where: { tenantId }, _avg: { score: true } }),
        ]);
        const [totalAll, won] = await Promise.all([
            this.prisma.lead.count({ where: { tenantId } }),
            this.prisma.lead.count({ where: { tenantId, status: 'WON' } }),
        ]);
        const conversionRate = totalAll > 0 ? Math.round((won / totalAll) * 100) : 0;
        return { total, newToday, byStatus, bySource, conversionRate, avgScore: avgScore._avg.score || 0 };
    }

    private async convertLeadToClient(leadId: string, tenantId: string, userId: string) {
        const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) return;
        await this.prisma.client.create({
            data: { name: lead.name, phone: lead.phone, email: lead.email, tenantId, createdBy: userId },
        });
        if (lead.affiliateId) {
            const affiliate = await this.prisma.affiliate.findUnique({ where: { id: lead.affiliateId } });
            if (affiliate) {
                const amount = affiliate.commissionType === 'FIXED' ? affiliate.commissionValue : 0;
                await this.prisma.affiliateCommission.create({
                    data: { affiliateId: lead.affiliateId, leadId, amount, tenantId },
                });
                await this.prisma.affiliate.update({
                    where: { id: lead.affiliateId },
                    data: { totalEarned: { increment: amount } },
                });
            }
        }
    }

    private calculateLeadScore(data: any): number {
        let score = 0;
        if (data.phone) score += 20;
        if (data.email) score += 15;
        if (data.source === 'REFERRAL') score += 30;
        if (data.source === 'GOOGLE_ADS') score += 20;
        if (data.notes) score += 10;
        return Math.min(score, 100);
    }

    private async ensureLeadExists(id: string, tenantId: string) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });
        if (!lead || lead.tenantId !== tenantId) throw new NotFoundException('العميل المحتمل غير موجود');
        return lead;
    }

    // ═══════════════════════════════════════
    // AFFILIATES
    // ═══════════════════════════════════════

    async getAffiliates(tenantId: string) {
        return this.prisma.affiliate.findMany({
            where: { tenantId },
            include: {
                _count: { select: { leads: true, commissions: true } },
            },
            orderBy: { totalEarned: 'desc' },
        });
    }

    async createAffiliate(tenantId: string, data: any) {
        const code = await this.generateUniqueCode(data.name);
        return this.prisma.affiliate.create({
            data: { ...data, referralCode: code, tenantId },
        });
    }

    async updateAffiliate(id: string, tenantId: string, data: any) {
        return this.prisma.affiliate.update({ where: { id }, data });
    }

    async getAffiliateCommissions(affiliateId: string, tenantId: string) {
        return this.prisma.affiliateCommission.findMany({
            where: { affiliateId, tenantId },
            include: { lead: { select: { name: true, phone: true, status: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getAllCommissions(tenantId: string, status?: string) {
        const where: any = { tenantId };
        if (status) where.status = status;
        return this.prisma.affiliateCommission.findMany({
            where,
            include: {
                affiliate: { select: { id: true, name: true, referralCode: true } },
                lead: { select: { name: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async approveCommission(id: string, tenantId: string) {
        return this.prisma.affiliateCommission.update({
            where: { id }, data: { status: 'APPROVED' },
        });
    }

    async payCommission(id: string, tenantId: string) {
        const commission = await this.prisma.affiliateCommission.update({
            where: { id }, data: { status: 'PAID', paidAt: new Date() },
        });
        await this.prisma.affiliate.update({
            where: { id: commission.affiliateId },
            data: { totalPaid: { increment: commission.amount } },
        });
        return commission;
    }

    async getAffiliateStats(tenantId: string) {
        const [totalAffiliates, pending, totalPaid] = await Promise.all([
            this.prisma.affiliate.count({ where: { tenantId, status: 'ACTIVE' } }),
            this.prisma.affiliateCommission.aggregate({
                where: { tenantId, status: 'PENDING' },
                _sum: { amount: true }, _count: true,
            }),
            this.prisma.affiliateCommission.aggregate({
                where: { tenantId, status: 'PAID' },
                _sum: { amount: true },
            }),
        ]);
        return {
            totalAffiliates,
            pendingAmount: pending._sum.amount || 0,
            pendingCount: pending._count,
            totalPaid: totalPaid._sum.amount || 0,
        };
    }

    private async generateUniqueCode(name: string): Promise<string> {
        const base = name.replace(/\s/g, '').substring(0, 4).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${base}-${random}`;
    }

    // ═══════════════════════════════════════
    // CAMPAIGNS
    // ═══════════════════════════════════════

    async getCampaigns(tenantId: string, filters?: any) {
        const where: any = { tenantId };
        if (filters?.type) where.type = filters.type;
        if (filters?.status) where.status = filters.status;
        return this.prisma.campaign.findMany({
            where,
            include: { _count: { select: { leads: true, contents: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createCampaign(tenantId: string, userId: string, data: any) {
        return this.prisma.campaign.create({
            data: { ...data, tenantId, createdBy: userId },
        });
    }

    async updateCampaign(id: string, tenantId: string, data: any) {
        return this.prisma.campaign.update({ where: { id }, data });
    }

    async getCampaignById(id: string, tenantId: string) {
        return this.prisma.campaign.findUnique({
            where: { id },
            include: {
                leads: { take: 20, orderBy: { createdAt: 'desc' } },
                contents: { orderBy: { createdAt: 'desc' } },
                metrics: { orderBy: { date: 'desc' }, take: 30 },
                _count: { select: { leads: true } },
            },
        });
    }

    // ═══════════════════════════════════════
    // ADS ANALYTICS
    // ═══════════════════════════════════════

    async getAdsConnections(tenantId: string) {
        return this.prisma.adsConnection.findMany({
            where: { tenantId },
            select: { id: true, platform: true, accountId: true, accountName: true, isActive: true, lastSyncAt: true },
        });
    }

    async connectAdsPlatform(tenantId: string, data: any) {
        return this.prisma.adsConnection.upsert({
            where: { tenantId_platform: { tenantId, platform: data.platform } },
            create: { ...data, tenantId },
            update: { accessToken: data.accessToken, refreshToken: data.refreshToken, isActive: true },
        });
    }

    async getAdsDashboard(tenantId: string, from: Date, to: Date) {
        const metrics = await this.prisma.adsMetric.findMany({
            where: { tenantId, date: { gte: from, lte: to } },
            orderBy: { date: 'asc' },
        });

        const byPlatform = metrics.reduce((acc: any, m: any) => {
            if (!acc[m.platform]) acc[m.platform] = { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
            acc[m.platform].impressions += m.impressions;
            acc[m.platform].clicks += m.clicks;
            acc[m.platform].spend += m.spend;
            acc[m.platform].conversions += m.conversions;
            return acc;
        }, {});

        const dailyTrend = metrics.reduce((acc: any, m: any) => {
            const d = m.date.toISOString().split('T')[0];
            if (!acc[d]) acc[d] = { date: d, spend: 0, clicks: 0, conversions: 0 };
            acc[d].spend += m.spend;
            acc[d].clicks += m.clicks;
            acc[d].conversions += m.conversions;
            return acc;
        }, {});

        const totals = metrics.reduce(
            (acc: any, m: any) => ({
                totalSpend: acc.totalSpend + m.spend,
                totalClicks: acc.totalClicks + m.clicks,
                totalImpressions: acc.totalImpressions + m.impressions,
                totalConversions: acc.totalConversions + m.conversions,
            }),
            { totalSpend: 0, totalClicks: 0, totalImpressions: 0, totalConversions: 0 },
        );

        return {
            totals: {
                ...totals,
                avgCpc: totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : 0,
                avgCpl: totals.totalConversions > 0 ? totals.totalSpend / totals.totalConversions : 0,
                ctr: totals.totalImpressions > 0 ? (totals.totalClicks / totals.totalImpressions) * 100 : 0,
            },
            byPlatform,
            dailyTrend: Object.values(dailyTrend),
        };
    }

    // ═══════════════════════════════════════
    // TELEMARKETING
    // ═══════════════════════════════════════

    async getCallQueue(tenantId: string) {
        return this.prisma.lead.findMany({
            where: {
                tenantId,
                status: { in: ['NEW', 'CONTACTED', 'NURTURING'] },
                OR: [
                    { nextFollowUp: { lte: new Date() } },
                    { nextFollowUp: null, callAttempts: { lt: 3 } },
                ],
            },
            include: { assignee: { select: { id: true, name: true } } },
            orderBy: [{ nextFollowUp: 'asc' }, { createdAt: 'asc' }],
            take: 50,
        });
    }

    async logCall(tenantId: string, userId: string, data: any) {
        return this.prisma.callLog.create({
            data: { ...data, callerUserId: userId, tenantId },
        });
    }

    async getCallScripts(tenantId: string) {
        return this.prisma.callScript.findMany({
            where: { tenantId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createCallScript(tenantId: string, data: any) {
        return this.prisma.callScript.create({ data: { ...data, tenantId } });
    }

    async getCallStats(tenantId: string) {
        const today = new Date(new Date().setHours(0, 0, 0, 0));
        const [todayCalls, answered, avgDuration] = await Promise.all([
            this.prisma.callLog.count({ where: { tenantId, createdAt: { gte: today } } }),
            this.prisma.callLog.count({ where: { tenantId, createdAt: { gte: today }, status: 'ANSWERED' } }),
            this.prisma.callLog.aggregate({
                where: { tenantId, createdAt: { gte: today }, duration: { not: null } },
                _avg: { duration: true },
            }),
        ]);
        return {
            todayCalls,
            answered,
            answerRate: todayCalls > 0 ? Math.round((answered / todayCalls) * 100) : 0,
            avgDuration: Math.round(avgDuration._avg.duration || 0),
        };
    }

    // ═══════════════════════════════════════
    // MESSAGE CAMPAIGNS
    // ═══════════════════════════════════════

    async getMessageCampaigns(tenantId: string, type?: string) {
        const where: any = { tenantId };
        if (type) where.type = type;
        return this.prisma.messageCampaign.findMany({
            where,
            include: { _count: { select: { recipients: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createMessageCampaign(tenantId: string, userId: string, data: any) {
        return this.prisma.messageCampaign.create({
            data: { ...data, tenantId, createdBy: userId },
        });
    }

    async getMessageCampaignById(id: string, tenantId: string) {
        return this.prisma.messageCampaign.findUnique({
            where: { id },
            include: { recipients: { orderBy: { sentAt: 'desc' } } },
        });
    }

    // ═══════════════════════════════════════
    // CONTENT CALENDAR
    // ═══════════════════════════════════════

    async getContentCalendar(tenantId: string, month: number, year: number) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        return this.prisma.contentCalendarItem.findMany({
            where: { tenantId, scheduledAt: { gte: start, lte: end } },
            include: { assignee: { select: { id: true, name: true } } },
            orderBy: { scheduledAt: 'asc' },
        });
    }

    async createContentItem(tenantId: string, data: any) {
        return this.prisma.contentCalendarItem.create({
            data: { ...data, tenantId },
        });
    }

    async updateContentItem(id: string, tenantId: string, data: any) {
        return this.prisma.contentCalendarItem.update({ where: { id }, data });
    }

    async deleteContentItem(id: string, tenantId: string) {
        return this.prisma.contentCalendarItem.delete({ where: { id } });
    }
}

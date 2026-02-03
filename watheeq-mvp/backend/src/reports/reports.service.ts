import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { HearingStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get comprehensive dashboard statistics
     */
    async getDashboardStats(tenantId: string) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Execute all queries in parallel
        const [
            totalCases,
            activeCases,
            closedCases,
            totalClients,
            activeClients,
            totalHearings,
            upcomingHearings,
            hearingsThisWeek,
            hearingsToday,
            totalInvoices,
            paidInvoices,
            pendingInvoices,
            overdueInvoices,
            totalRevenue,
            pendingRevenue,
            casesByStatus,
            casesByType,
            monthlyRevenue,
            recentCases,
            recentHearings,
        ] = await Promise.all([
            // Cases stats
            this.prisma.case.count({ where: { tenantId } }),
            this.prisma.case.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            this.prisma.case.count({ where: { tenantId, status: 'CLOSED' } }),

            // Clients stats
            this.prisma.client.count({ where: { tenantId } }),
            this.prisma.client.count({ where: { tenantId, isActive: true } }),

            // Hearings stats
            this.prisma.hearing.count({ where: { tenantId } }),
            this.prisma.hearing.count({
                where: {
                    tenantId,
                    hearingDate: { gte: now },
                    status: { in: [HearingStatus.SCHEDULED, HearingStatus.POSTPONED] },
                },
            }),
            this.prisma.hearing.count({
                where: {
                    tenantId,
                    hearingDate: { gte: startOfWeek, lt: endOfWeek },
                    status: { not: HearingStatus.CANCELLED },
                },
            }),
            this.prisma.hearing.count({
                where: {
                    tenantId,
                    hearingDate: {
                        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                        lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
                    },
                    status: { not: HearingStatus.CANCELLED },
                },
            }),

            // Invoices stats
            this.prisma.invoice.count({ where: { tenantId } }),
            this.prisma.invoice.count({ where: { tenantId, status: InvoiceStatus.PAID } }),
            this.prisma.invoice.count({ where: { tenantId, status: InvoiceStatus.PENDING } }),
            this.prisma.invoice.count({ where: { tenantId, status: InvoiceStatus.OVERDUE } }),

            // Revenue
            this.prisma.invoice.aggregate({
                where: { tenantId, status: InvoiceStatus.PAID },
                _sum: { totalAmount: true },
            }),
            this.prisma.invoice.aggregate({
                where: { tenantId, status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] } },
                _sum: { totalAmount: true },
            }),

            // Cases by status
            this.prisma.case.groupBy({
                by: ['status'],
                where: { tenantId },
                _count: true,
            }),

            // Cases by type
            this.prisma.case.groupBy({
                by: ['caseType'],
                where: { tenantId },
                _count: true,
            }),

            // Monthly revenue (last 6 months)
            this.getMonthlyRevenue(tenantId, 6),

            // Recent cases (last 5)
            this.prisma.case.findMany({
                where: { tenantId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    caseNumber: true,
                    title: true,
                    status: true,
                    createdAt: true,
                    client: { select: { name: true } },
                },
            }),

            // Recent hearings (next 5)
            this.prisma.hearing.findMany({
                where: {
                    tenantId,
                    hearingDate: { gte: now },
                    status: { not: HearingStatus.CANCELLED },
                },
                take: 5,
                orderBy: { hearingDate: 'asc' },
                select: {
                    id: true,
                    hearingDate: true,
                    courtName: true,
                    status: true,
                    case: { select: { id: true, title: true, caseNumber: true } },
                },
            }),
        ]);

        return {
            data: {
                overview: {
                    cases: {
                        total: totalCases,
                        active: activeCases,
                        closed: closedCases,
                    },
                    clients: {
                        total: totalClients,
                        active: activeClients,
                    },
                    hearings: {
                        total: totalHearings,
                        upcoming: upcomingHearings,
                        thisWeek: hearingsThisWeek,
                        today: hearingsToday,
                    },
                    invoices: {
                        total: totalInvoices,
                        paid: paidInvoices,
                        pending: pendingInvoices,
                        overdue: overdueInvoices,
                        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
                        pendingRevenue: Number(pendingRevenue._sum.totalAmount || 0),
                    },
                },
                casesByStatus: casesByStatus.map(item => ({
                    status: item.status,
                    count: item._count,
                })),
                casesByType: casesByType.map(item => ({
                    type: item.caseType,
                    count: item._count,
                })),
                monthlyRevenue,
                recentCases,
                recentHearings,
            },
        };
    }

    /**
     * Get monthly revenue for the last N months
     */
    private async getMonthlyRevenue(tenantId: string, months: number) {
        const result = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const revenue = await this.prisma.invoice.aggregate({
                where: {
                    tenantId,
                    status: InvoiceStatus.PAID,
                    paidAt: { gte: start, lte: end },
                },
                _sum: { totalAmount: true },
                _count: true,
            });

            result.push({
                month: start.toISOString(),
                monthName: start.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
                total: Number(revenue._sum.totalAmount || 0),
                count: revenue._count,
            });
        }

        return result;
    }

    /**
     * Get financial report with date range
     */
    async getFinancialReport(tenantId: string, startDate?: string, endDate?: string) {
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const [totalStats, paidStats, pendingStats, overdueStats] = await Promise.all([
            this.prisma.invoice.aggregate({
                where: { tenantId, createdAt: { gte: start, lte: end } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            this.prisma.invoice.aggregate({
                where: { tenantId, status: InvoiceStatus.PAID, createdAt: { gte: start, lte: end } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            this.prisma.invoice.aggregate({
                where: { tenantId, status: InvoiceStatus.PENDING, createdAt: { gte: start, lte: end } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            this.prisma.invoice.aggregate({
                where: { tenantId, status: InvoiceStatus.OVERDUE, createdAt: { gte: start, lte: end } },
                _sum: { totalAmount: true },
                _count: true,
            }),
        ]);

        // Top clients by revenue
        const topClients = await this.prisma.invoice.groupBy({
            by: ['clientId'],
            where: { tenantId, status: InvoiceStatus.PAID, createdAt: { gte: start, lte: end } },
            _sum: { totalAmount: true },
            _count: true,
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: 10,
        });

        // Get client names
        const clientIds = topClients.map(c => c.clientId);
        const clients = await this.prisma.client.findMany({
            where: { id: { in: clientIds } },
            select: { id: true, name: true },
        });

        const topClientsWithNames = topClients.map(tc => ({
            clientId: tc.clientId,
            clientName: clients.find(c => c.id === tc.clientId)?.name || 'غير معروف',
            revenue: Number(tc._sum.totalAmount || 0),
            invoiceCount: tc._count,
        }));

        return {
            data: {
                period: { start, end },
                summary: {
                    total: Number(totalStats._sum.totalAmount || 0),
                    totalCount: totalStats._count,
                    paid: Number(paidStats._sum.totalAmount || 0),
                    paidCount: paidStats._count,
                    pending: Number(pendingStats._sum.totalAmount || 0),
                    pendingCount: pendingStats._count,
                    overdue: Number(overdueStats._sum.totalAmount || 0),
                    overdueCount: overdueStats._count,
                },
                topClients: topClientsWithNames,
            },
        };
    }

    /**
     * Get cases report by period
     */
    async getCasesReport(tenantId: string, period: string = 'month') {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
                break;
            default: // month
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        }

        const [newCases, closedCases, casesByLawyer, casesByType] = await Promise.all([
            this.prisma.case.count({
                where: { tenantId, createdAt: { gte: startDate } },
            }),
            this.prisma.case.count({
                where: { tenantId, status: 'CLOSED', updatedAt: { gte: startDate } },
            }),
            this.prisma.case.groupBy({
                by: ['assignedToId'],
                where: { tenantId, createdAt: { gte: startDate } },
                _count: true,
            }),
            this.prisma.case.groupBy({
                by: ['caseType'],
                where: { tenantId, createdAt: { gte: startDate } },
                _count: true,
            }),
        ]);

        // Get lawyer names
        const lawyerIds = casesByLawyer.map(c => c.assignedToId).filter(Boolean) as string[];
        const lawyers = await this.prisma.user.findMany({
            where: { id: { in: lawyerIds } },
            select: { id: true, name: true },
        });

        const casesByLawyerWithNames = casesByLawyer.map(cl => ({
            lawyerId: cl.assignedToId,
            lawyerName: lawyers.find(l => l.id === cl.assignedToId)?.name || 'غير مسند',
            count: cl._count,
        }));

        return {
            data: {
                period,
                startDate,
                endDate: now,
                summary: {
                    newCases,
                    closedCases,
                    netChange: newCases - closedCases,
                },
                casesByLawyer: casesByLawyerWithNames,
                casesByType: casesByType.map(ct => ({
                    type: ct.caseType,
                    count: ct._count,
                })),
            },
        };
    }

    /**
     * Get lawyer performance report
     */
    async getPerformanceReport(tenantId: string) {
        const lawyers = await this.prisma.user.findMany({
            where: {
                tenantId,
                role: { in: ['LAWYER', 'ADMIN', 'OWNER'] },
                isActive: true,
            },
            select: { id: true, name: true, email: true, role: true },
        });

        const performance = await Promise.all(
            lawyers.map(async (lawyer) => {
                const [totalCases, activeCases, closedCases, totalHearings, completedHearings] = await Promise.all([
                    this.prisma.case.count({ where: { tenantId, assignedToId: lawyer.id } }),
                    this.prisma.case.count({ where: { tenantId, assignedToId: lawyer.id, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
                    this.prisma.case.count({ where: { tenantId, assignedToId: lawyer.id, status: 'CLOSED' } }),
                    this.prisma.hearing.count({ where: { tenantId, case: { assignedToId: lawyer.id } } }),
                    this.prisma.hearing.count({ where: { tenantId, case: { assignedToId: lawyer.id }, status: HearingStatus.COMPLETED } }),
                ]);

                return {
                    lawyer: {
                        id: lawyer.id,
                        name: lawyer.name,
                        email: lawyer.email,
                        role: lawyer.role,
                    },
                    stats: {
                        totalCases,
                        activeCases,
                        closedCases,
                        totalHearings,
                        completedHearings,
                        successRate: totalCases > 0 ? ((closedCases / totalCases) * 100).toFixed(1) : '0',
                    },
                };
            }),
        );

        return { data: performance };
    }
}

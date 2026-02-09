import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CaseStatus, CaseType, InvoiceStatus, HearingStatus, UserRole } from '@prisma/client';

// Stats interfaces
interface CaseStats {
    total: number;
    active: number;
    closed: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
}

interface HearingStats {
    total: number;
    today: number;
    tomorrow: number;
    thisWeek: number;
    upcoming: number;
}

interface ClientStats {
    total: number;
    active: number;
    withCases: number;
}

interface InvoiceStats {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalRevenue: number;
    pendingAmount: number;
}

export interface DashboardStats {
    cases: CaseStats;
    hearings: HearingStats;
    clients: ClientStats;
    invoices: InvoiceStats;
}

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get comprehensive dashboard statistics
     * - OWNER/ADMIN: see all statistics
     * - LAWYER: see only their assigned cases/hearings/clients
     * - Invoice stats (pending, revenue) only for OWNER/ADMIN/ACCOUNTANT
     */
    async getStats(tenantId: string, userId?: string, userRole?: UserRole) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
        const endOfTomorrow = new Date(startOfTomorrow);
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
        const endOfWeek = new Date(startOfToday);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        // Determine permissions
        const canSeeAll = userRole === UserRole.OWNER || userRole === UserRole.ADMIN;
        const canSeeFinancials = userRole === UserRole.OWNER || userRole === UserRole.ADMIN;

        // Filters based on role
        const hearingFilter = canSeeAll ? { tenantId } : { tenantId, assignedToId: userId };
        const caseFilter = canSeeAll ? { tenantId } : { tenantId, assignedToId: userId };
        // For clients: LAWYER sees only clients from their assigned cases
        const clientFilter = canSeeAll ? { tenantId } : { tenantId, cases: { some: { assignedToId: userId } } };

        // Execute all queries in parallel
        const [
            // Cases
            totalCases,
            activeCases,
            closedCases,
            casesByType,
            casesByStatus,
            // Hearings
            totalHearings,
            todayHearings,
            tomorrowHearings,
            weekHearings,
            upcomingHearings,
            // Clients
            totalClients,
            activeClients,
            clientsWithCases,
            // Invoices
            totalInvoices,
            paidInvoices,
            pendingInvoices,
            overdueInvoices,
            revenueSum,
            pendingSum,
        ] = await Promise.all([
            // Cases queries - filtered by role
            this.prisma.case.count({ where: caseFilter }),
            this.prisma.case.count({ where: { ...caseFilter, status: { in: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS, CaseStatus.SUSPENDED] } } }),
            this.prisma.case.count({ where: { ...caseFilter, status: { in: [CaseStatus.CLOSED, CaseStatus.ARCHIVED] } } }),
            this.prisma.case.groupBy({
                by: ['caseType'],
                where: caseFilter,
                _count: true,
            }),
            this.prisma.case.groupBy({
                by: ['status'],
                where: caseFilter,
                _count: true,
            }),
            // Hearings queries - filtered by role
            this.prisma.hearing.count({ where: hearingFilter }),
            this.prisma.hearing.count({
                where: {
                    ...hearingFilter,
                    hearingDate: { gte: startOfToday, lt: startOfTomorrow },
                },
            }),
            this.prisma.hearing.count({
                where: {
                    ...hearingFilter,
                    hearingDate: { gte: startOfTomorrow, lt: endOfTomorrow },
                },
            }),
            this.prisma.hearing.count({
                where: {
                    ...hearingFilter,
                    hearingDate: { gte: startOfToday, lte: endOfWeek },
                },
            }),
            this.prisma.hearing.count({
                where: {
                    ...hearingFilter,
                    hearingDate: { gte: now },
                    status: { in: [HearingStatus.SCHEDULED, HearingStatus.POSTPONED] },
                },
            }),
            // Clients queries - filtered by role
            this.prisma.client.count({ where: clientFilter }),
            this.prisma.client.count({ where: { ...clientFilter, isActive: true } }),
            this.prisma.client.count({
                where: { ...clientFilter, cases: { some: {} } },
            }),
            // Invoices queries
            this.prisma.invoice.count({ where: { tenantId } }),
            this.prisma.invoice.count({ where: { tenantId, status: InvoiceStatus.PAID } }),
            this.prisma.invoice.count({ where: { tenantId, status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT] } } }),
            this.prisma.invoice.count({ where: { tenantId, status: InvoiceStatus.OVERDUE } }),
            this.prisma.invoice.aggregate({
                where: { tenantId, status: InvoiceStatus.PAID },
                _sum: { totalAmount: true },
            }),
            this.prisma.invoice.aggregate({
                where: { tenantId, status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.OVERDUE] } },
                _sum: { totalAmount: true },
            }),
        ]);

        // Transform casesByType to object
        const byType: Record<string, number> = {};
        for (const item of casesByType) {
            byType[item.caseType] = item._count;
        }

        // Transform casesByStatus to object
        const byStatus: Record<string, number> = {};
        for (const item of casesByStatus) {
            byStatus[item.status] = item._count;
        }

        const stats: DashboardStats = {
            cases: {
                total: totalCases,
                active: activeCases,
                closed: closedCases,
                byType,
                byStatus,
            },
            hearings: {
                total: totalHearings,
                today: todayHearings,
                tomorrow: tomorrowHearings,
                thisWeek: weekHearings,
                upcoming: upcomingHearings,
            },
            clients: {
                total: totalClients,
                active: activeClients,
                withCases: clientsWithCases,
            },
            invoices: {
                total: canSeeFinancials ? totalInvoices : 0,
                paid: canSeeFinancials ? paidInvoices : 0,
                pending: canSeeFinancials ? pendingInvoices : 0,
                overdue: canSeeFinancials ? overdueInvoices : 0,
                totalRevenue: canSeeFinancials ? (Number(revenueSum._sum.totalAmount) || 0) : 0,
                pendingAmount: canSeeFinancials ? (Number(pendingSum._sum.totalAmount) || 0) : 0,
            },
        };

        return { data: stats };
    }

    /**
     * Get upcoming hearings
     * - OWNER/ADMIN: see all upcoming hearings
     * - LAWYER: see only their assigned hearings
     */
    async getUpcomingHearings(tenantId: string, days: number = 7, userId?: string, userRole?: UserRole) {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + days);

        // Determine if user can see all hearings or only their assigned ones
        const canSeeAllHearings = userRole === UserRole.OWNER || userRole === UserRole.ADMIN;

        // Build where clause
        const whereClause: any = {
            tenantId,
            hearingDate: { gte: now, lte: endDate },
            status: { in: [HearingStatus.SCHEDULED, HearingStatus.POSTPONED] },
        };

        // Filter by assignedToId for LAWYER role
        if (!canSeeAllHearings && userId) {
            whereClause.assignedToId = userId;
        }

        const hearings = await this.prisma.hearing.findMany({
            where: whereClause,
            include: {
                case: {
                    select: {
                        id: true,
                        caseNumber: true,
                        title: true,
                        client: { select: { id: true, name: true, phone: true } },
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { hearingDate: 'asc' },
            take: 10,
        });

        // Group by day
        const today = new Date();
        const grouped = {
            today: hearings.filter(h => h.hearingDate.toDateString() === today.toDateString()),
            tomorrow: hearings.filter(h => {
                const tomorrow = new Date();
                tomorrow.setDate(today.getDate() + 1);
                return h.hearingDate.toDateString() === tomorrow.toDateString();
            }),
            later: hearings.filter(h => {
                const dayAfterTomorrow = new Date();
                dayAfterTomorrow.setDate(today.getDate() + 2);
                return h.hearingDate >= dayAfterTomorrow;
            }),
        };

        return {
            data: {
                all: hearings,
                ...grouped,
                count: hearings.length,
            },
        };
    }

    /**
     * Get recent cases
     */
    async getRecentCases(tenantId: string, limit: number = 5) {
        const cases = await this.prisma.case.findMany({
            where: { tenantId },
            include: {
                client: { select: { id: true, name: true } },
                assignedTo: { select: { id: true, name: true } },
                _count: { select: { hearings: true, documents: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return { data: cases };
    }

    /**
     * Get recent activity across all entities
     * - OWNER/ADMIN: see all activities
     * - LAWYER/SECRETARY: see only their own activities
     */
    async getRecentActivity(tenantId: string, userId: string, userRole: UserRole) {
        // Determine if user can see all or only their own
        const canSeeAll = userRole === UserRole.OWNER || userRole === UserRole.ADMIN;

        // Build where clause for filtering by user
        const userFilter = canSeeAll ? {} : { createdById: userId };
        const uploadedByFilter = canSeeAll ? {} : { uploadedById: userId };

        const [recentCases, recentHearings, recentInvoices, recentDocuments] = await Promise.all([
            this.prisma.case.findMany({
                where: { tenantId, ...userFilter },
                select: {
                    id: true,
                    title: true,
                    caseNumber: true,
                    createdAt: true,
                    status: true,
                    createdBy: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            this.prisma.hearing.findMany({
                where: { tenantId, ...(canSeeAll ? {} : { createdById: userId }) },
                select: {
                    id: true,
                    hearingDate: true,
                    courtName: true,
                    createdAt: true,
                    case: { select: { caseNumber: true, title: true } },
                    createdBy: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            this.prisma.invoice.findMany({
                where: { tenantId, ...userFilter },
                select: {
                    id: true,
                    invoiceNumber: true,
                    totalAmount: true,
                    status: true,
                    createdAt: true,
                    client: { select: { name: true } },
                    createdBy: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
            this.prisma.document.findMany({
                where: { tenantId, ...uploadedByFilter },
                select: {
                    id: true,
                    title: true,
                    fileName: true,
                    createdAt: true,
                    case: { select: { caseNumber: true } },
                    uploadedBy: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);

        // Format date and time
        const formatDateTime = (date: Date) => {
            return {
                date: date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }),
                time: date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            };
        };

        // Combine and sort by createdAt
        const activities = [
            ...recentCases.map(c => {
                const dt = formatDateTime(c.createdAt);
                return {
                    type: 'case' as const,
                    id: c.id,
                    title: `قضية جديدة: ${c.caseNumber}`,
                    description: c.title,
                    createdAt: c.createdAt,
                    date: dt.date,
                    time: dt.time,
                    user: c.createdBy?.name || 'غير معروف',
                    userId: c.createdBy?.id,
                    userAvatar: c.createdBy?.avatar || null,
                };
            }),
            ...recentHearings.map(h => {
                const dt = formatDateTime(h.createdAt);
                return {
                    type: 'hearing' as const,
                    id: h.id,
                    title: `جلسة: ${h.case?.title || h.courtName || 'جلسة'}`,
                    description: `${h.case?.caseNumber || ''}`,
                    createdAt: h.createdAt,
                    date: dt.date,
                    time: dt.time,
                    user: h.createdBy?.name || 'غير معروف',
                    userId: h.createdBy?.id,
                    userAvatar: h.createdBy?.avatar || null,
                };
            }),
            ...recentInvoices.map(i => {
                const dt = formatDateTime(i.createdAt);
                return {
                    type: 'invoice' as const,
                    id: i.id,
                    title: `فاتورة: ${i.invoiceNumber}`,
                    description: `${i.client?.name} - ${i.totalAmount} ر.س`,
                    createdAt: i.createdAt,
                    date: dt.date,
                    time: dt.time,
                    user: i.createdBy?.name || 'غير معروف',
                    userId: i.createdBy?.id,
                    userAvatar: i.createdBy?.avatar || null,
                };
            }),
            ...recentDocuments.map(d => {
                const dt = formatDateTime(d.createdAt);
                return {
                    type: 'document' as const,
                    id: d.id,
                    title: `مستند: ${d.title}`,
                    description: d.case?.caseNumber || '',
                    createdAt: d.createdAt,
                    date: dt.date,
                    time: dt.time,
                    user: d.uploadedBy?.name || 'غير معروف',
                    userId: d.uploadedBy?.id,
                    userAvatar: d.uploadedBy?.avatar || null,
                };
            }),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

        return { data: activities };
    }

    // ============ ANALYTICS CHARTS ============

    /**
     * Get cases trend for last 12 months
     */
    async getCasesTrend(tenantId: string) {
        const months = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const [created, closed] = await Promise.all([
                this.prisma.case.count({
                    where: {
                        tenantId,
                        createdAt: { gte: date, lt: nextMonth },
                    },
                }),
                this.prisma.case.count({
                    where: {
                        tenantId,
                        status: { in: [CaseStatus.CLOSED, CaseStatus.ARCHIVED] },
                        updatedAt: { gte: date, lt: nextMonth },
                    },
                }),
            ]);

            months.push({
                month: date.toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'short'
                }),
                monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                created,
                closed,
            });
        }

        return { data: months };
    }

    /**
     * Get revenue trend for last 12 months
     */
    async getRevenueTrend(tenantId: string) {
        const months = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const revenue = await this.prisma.invoice.aggregate({
                where: {
                    tenantId,
                    status: InvoiceStatus.PAID,
                    paidAt: { gte: date, lt: nextMonth },
                },
                _sum: { totalAmount: true },
            });

            months.push({
                month: date.toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'short'
                }),
                monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                revenue: Number(revenue._sum.totalAmount) || 0,
            });
        }

        return { data: months };
    }

    /**
     * Get cases distribution by type for pie chart
     */
    async getCasesByTypeChart(tenantId: string) {
        const casesByType = await this.prisma.case.groupBy({
            by: ['caseType'],
            where: { tenantId },
            _count: true,
        });

        const typeLabels: Record<string, string> = {
            CRIMINAL: 'جنائي',
            CIVIL: 'مدني',
            COMMERCIAL: 'تجاري',
            LABOR: 'عمالي',
            FAMILY: 'أسري',
            ADMINISTRATIVE: 'إداري',
            REAL_ESTATE: 'عقاري',
            OTHER: 'أخرى',
        };

        const data = casesByType.map(item => ({
            type: item.caseType,
            label: typeLabels[item.caseType] || item.caseType,
            count: item._count,
        }));

        return { data };
    }

    /**
     * Get top clients by cases count
     */
    async getTopClients(tenantId: string, limit = 5) {
        const clients = await this.prisma.client.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                _count: {
                    select: { cases: true, invoices: true },
                },
            },
            orderBy: {
                cases: { _count: 'desc' },
            },
            take: limit,
        });

        const data = clients.map(client => ({
            id: client.id,
            name: client.name,
            casesCount: client._count.cases,
            invoicesCount: client._count.invoices,
        }));

        return { data };
    }

    /**
     * Get lawyer performance metrics
     */
    async getLawyerPerformance(tenantId: string) {
        const lawyers = await this.prisma.user.findMany({
            where: {
                tenantId,
                role: { in: ['LAWYER', 'OWNER', 'ADMIN'] },
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                avatar: true,
            },
        });

        const performance = await Promise.all(
            lawyers.map(async (lawyer) => {
                const [openCases, closedCases, completedTasks, totalTasks] = await Promise.all([
                    this.prisma.case.count({
                        where: {
                            tenantId,
                            assignedToId: lawyer.id,
                            status: { in: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS] },
                        },
                    }),
                    this.prisma.case.count({
                        where: {
                            tenantId,
                            assignedToId: lawyer.id,
                            status: { in: [CaseStatus.CLOSED, CaseStatus.ARCHIVED] },
                        },
                    }),
                    this.prisma.task.count({
                        where: {
                            tenantId,
                            assignedToId: lawyer.id,
                            status: 'COMPLETED',
                        },
                    }),
                    this.prisma.task.count({
                        where: {
                            tenantId,
                            assignedToId: lawyer.id,
                        },
                    }),
                ]);

                return {
                    lawyer: {
                        id: lawyer.id,
                        name: lawyer.name,
                        avatar: lawyer.avatar,
                    },
                    openCases,
                    closedCases,
                    totalCases: openCases + closedCases,
                    completedTasks,
                    totalTasks,
                    taskCompletionRate: totalTasks > 0
                        ? Math.round((completedTasks / totalTasks) * 100)
                        : 0,
                };
            })
        );

        // Sort by total cases (desc)
        const sortedPerformance = performance.sort((a, b) => b.totalCases - a.totalCases);

        return { data: sortedPerformance };
    }

    /**
     * Get overdue tasks for dashboard
     */
    async getOverdueTasks(tenantId: string, limit = 5) {
        const now = new Date();

        const tasks = await this.prisma.task.findMany({
            where: {
                tenantId,
                status: { not: 'COMPLETED' },
                dueDate: { lt: now },
            },
            include: {
                case: {
                    select: { id: true, caseNumber: true, title: true },
                },
                assignedTo: {
                    select: { id: true, name: true, avatar: true },
                },
            },
            orderBy: { dueDate: 'asc' },
            take: limit,
        });

        return { data: tasks };
    }
}


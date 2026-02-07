import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { HearingStatus, InvoiceStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Dashboard Overview
  async getDashboardAnalytics(tenantId: string, period: 'week' | 'month' | 'year' = 'month') {
    const { startDate, endDate } = this.getPeriodDates(period);

    const [
      casesStats,
      hearingsStats,
      financialStats,
      clientsStats,
      trendsData,
      topClients,
      topInvoices,
      documentsStats,
      tasksStats,
      upcomingHearings,
    ] = await Promise.all([
      this.getCasesStats(tenantId, startDate, endDate),
      this.getHearingsStats(tenantId, startDate, endDate),
      this.getFinancialStats(tenantId, startDate, endDate),
      this.getClientsStats(tenantId, startDate, endDate),
      this.getTrendsData(tenantId, period),
      this.getTopClients(tenantId, 5),
      this.getTopInvoices(tenantId, 5),
      this.getDocumentsStats(tenantId),
      this.getTasksStats(tenantId, startDate, endDate),
      this.getUpcomingHearings(tenantId, 10),
    ]);

    return {
      period,
      startDate,
      endDate,
      cases: casesStats,
      hearings: hearingsStats,
      financial: financialStats,
      clients: clientsStats,
      trends: trendsData,
      topClients,
      topInvoices,
      documents: documentsStats,
      tasks: tasksStats,
      upcomingHearings,
    };
  }

  // Cases Statistics
  private async getCasesStats(tenantId: string, startDate: Date, endDate: Date) {
    const [total, byStatus, byType, byPriority, recentlyClosed, closedCasesForDuration] = await Promise.all([
      // Total cases in period
      this.prisma.case.count({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),

      // By status
      this.prisma.case.groupBy({
        by: ['status'],
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),

      // By type
      this.prisma.case.groupBy({
        by: ['caseType'],
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),

      // By priority
      this.prisma.case.groupBy({
        by: ['priority'],
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),

      // Recently closed
      this.prisma.case.count({
        where: {
          tenantId,
          status: 'CLOSED',
          updatedAt: { gte: startDate, lte: endDate },
        },
      }),

      // Closed cases for duration calculation
      this.prisma.case.findMany({
        where: {
          tenantId,
          status: 'CLOSED',
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
        take: 100, // Limit for performance
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // Calculate average case duration (in days)
    let avgCaseDuration = 0;
    if (closedCasesForDuration.length > 0) {
      const totalDays = closedCasesForDuration.reduce((sum, c) => {
        const days = Math.floor(
          (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgCaseDuration = Math.round(totalDays / closedCasesForDuration.length);
    }

    // Calculate closure rate
    const totalAllCases = await this.prisma.case.count({ where: { tenantId } });
    const totalClosedCases = await this.prisma.case.count({ where: { tenantId, status: 'CLOSED' } });
    const closureRate = totalAllCases > 0 ? Math.round((totalClosedCases / totalAllCases) * 100) : 0;

    // Calculate growth compared to previous period
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousPeriodStart = new Date(startDate.getTime() - periodLength);
    
    const previousTotal = await this.prisma.case.count({
      where: {
        tenantId,
        createdAt: { gte: previousPeriodStart, lt: startDate },
      },
    });

    const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

    return {
      total,
      growth: Math.round(growth * 10) / 10,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      byType: byType.map(t => ({ type: t.caseType, count: t._count })),
      byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
      recentlyClosed,
      avgCaseDuration, // Average case duration in days
      closureRate, // Case closure rate percentage
      totalAllCases,
      totalClosedCases,
    };
  }

  // Hearings Statistics
  private async getHearingsStats(tenantId: string, startDate: Date, endDate: Date) {
    const now = new Date();

    const [total, upcoming, past, byStatus, todayCount, thisWeekCount] = await Promise.all([
      this.prisma.hearing.count({
        where: {
          tenantId,
          hearingDate: { gte: startDate, lte: endDate },
        },
      }),

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
          hearingDate: { lt: now },
          status: HearingStatus.COMPLETED,
        },
      }),

      this.prisma.hearing.groupBy({
        by: ['status'],
        where: {
          tenantId,
          hearingDate: { gte: startDate, lte: endDate },
        },
        _count: true,
      }),

      // Today's hearings
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

      // This week's hearings
      this.prisma.hearing.count({
        where: {
          tenantId,
          hearingDate: {
            gte: this.getStartOfWeek(now),
            lt: this.getEndOfWeek(now),
          },
          status: { not: HearingStatus.CANCELLED },
        },
      }),
    ]);

    // Calculate attendance rate
    const cancelledCount = byStatus.find(s => s.status === HearingStatus.CANCELLED)?._count || 0;
    const attendanceRate = past > 0 ? Math.round((past / (past + cancelledCount)) * 100) : 0;

    return {
      total,
      upcoming,
      past,
      today: todayCount,
      thisWeek: thisWeekCount,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      attendanceRate,
    };
  }

  // Financial Statistics
  private async getFinancialStats(tenantId: string, startDate: Date, endDate: Date) {
    const invoices = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    const totalRevenue = invoices
      .filter(i => i.status === InvoiceStatus.PAID)
      .reduce((sum, i) => sum + Number(i._sum.totalAmount || 0), 0);

    const pending = invoices
      .filter(i => i.status === InvoiceStatus.PENDING)
      .reduce((sum, i) => sum + Number(i._sum.totalAmount || 0), 0);

    const overdue = invoices
      .filter(i => i.status === InvoiceStatus.OVERDUE)
      .reduce((sum, i) => sum + Number(i._sum.totalAmount || 0), 0);

    const totalInvoices = invoices.reduce((sum, i) => sum + i._count, 0);

    // Calculate revenue growth
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousPeriodStart = new Date(startDate.getTime() - periodLength);

    const previousRevenue = await this.prisma.invoice.aggregate({
      where: {
        tenantId,
        status: InvoiceStatus.PAID,
        createdAt: { gte: previousPeriodStart, lt: startDate },
      },
      _sum: { totalAmount: true },
    });

    const prevTotal = Number(previousRevenue._sum.totalAmount || 0);
    const revenueGrowth = prevTotal > 0 ? ((totalRevenue - prevTotal) / prevTotal) * 100 : 0;

    return {
      totalRevenue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      pending,
      overdue,
      totalInvoices,
      byStatus: invoices.map(i => ({
        status: i.status,
        amount: Number(i._sum.totalAmount || 0),
        count: i._count,
      })),
    };
  }

  // Clients Statistics
  private async getClientsStats(tenantId: string, startDate: Date, endDate: Date) {
    const [total, newClients, activeClients, individuals, companies] = await Promise.all([
      this.prisma.client.count({ where: { tenantId } }),

      this.prisma.client.count({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),

      this.prisma.client.count({
        where: {
          tenantId,
          cases: {
            some: {
              updatedAt: { gte: startDate, lte: endDate },
            },
          },
        },
      }),

      // Count individuals (no companyName)
      this.prisma.client.count({
        where: { tenantId, companyName: null },
      }),

      // Count companies (has companyName)
      this.prisma.client.count({
        where: { tenantId, companyName: { not: null } },
      }),
    ]);

    return {
      total,
      newClients,
      activeClients,
      byType: [
        { type: 'فرد', count: individuals },
        { type: 'شركة', count: companies },
      ],
    };
  }

  // Trends Data (for charts)
  private async getTrendsData(tenantId: string, period: 'week' | 'month' | 'year') {
    const intervals = period === 'week' ? 7 : period === 'month' ? 30 : 12;
    const now = new Date();

    const casesData: { date: string; value: number }[] = [];
    const hearingsData: { date: string; value: number }[] = [];
    const revenueData: { date: string; value: number }[] = [];

    for (let i = intervals - 1; i >= 0; i--) {
      let startDate: Date;
      let periodEnd: Date;
      let label: string;

      if (period === 'year') {
        // Monthly intervals for year
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        label = startDate.toLocaleDateString('ar-SA', { month: 'short' });
      } else {
        // Daily intervals for week/month
        startDate = new Date(now);
        startDate.setDate(now.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        
        periodEnd = new Date(startDate);
        periodEnd.setHours(23, 59, 59, 999);
        
        label = startDate.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
      }

      const [casesCount, hearingsCount, revenue] = await Promise.all([
        this.prisma.case.count({
          where: {
            tenantId,
            createdAt: { gte: startDate, lte: periodEnd },
          },
        }),

        this.prisma.hearing.count({
          where: {
            tenantId,
            hearingDate: { gte: startDate, lte: periodEnd },
          },
        }),

        this.prisma.invoice.aggregate({
          where: {
            tenantId,
            status: InvoiceStatus.PAID,
            paidAt: { gte: startDate, lte: periodEnd },
          },
          _sum: { totalAmount: true },
        }),
      ]);

      casesData.push({ date: label, value: casesCount });
      hearingsData.push({ date: label, value: hearingsCount });
      revenueData.push({ date: label, value: Number(revenue._sum.totalAmount || 0) });
    }

    return {
      cases: casesData,
      hearings: hearingsData,
      revenue: revenueData,
    };
  }

  // Lawyer Performance
  async getLawyerPerformance(tenantId: string, startDate?: Date, endDate?: Date) {
    const dateFilter = startDate && endDate
      ? { createdAt: { gte: startDate, lte: endDate } }
      : {};

    const lawyers = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ['ADMIN', 'LAWYER', 'OWNER'] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedCases: {
          where: dateFilter,
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        assignedHearings: {
          where: startDate && endDate ? {
            hearingDate: { gte: startDate, lte: endDate }
          } : {},
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return lawyers.map(lawyer => {
      const cases = lawyer.assignedCases;
      const hearings = lawyer.assignedHearings;
      const closed = cases.filter(c => c.status === 'CLOSED').length;
      const active = cases.filter(c => ['OPEN', 'IN_PROGRESS'].includes(c.status)).length;
      const completedHearings = hearings.filter(h => h.status === HearingStatus.COMPLETED).length;
      
      const avgResolutionTime = this.calculateAvgResolutionTime(
        cases.filter(c => c.status === 'CLOSED'),
      );

      return {
        lawyerId: lawyer.id,
        lawyerName: lawyer.name,
        email: lawyer.email,
        role: lawyer.role,
        totalCases: cases.length,
        activeCases: active,
        closedCases: closed,
        totalHearings: hearings.length,
        completedHearings,
        successRate: cases.length > 0 ? Math.round((closed / cases.length) * 100) : 0,
        avgResolutionDays: avgResolutionTime,
      };
    });
  }

  // Helper: Calculate average resolution time
  private calculateAvgResolutionTime(cases: { createdAt: Date; updatedAt: Date }[]): number {
    if (cases.length === 0) return 0;

    const totalDays = cases.reduce((sum, c) => {
      const days = Math.floor(
        (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      return sum + days;
    }, 0);

    return Math.round(totalDays / cases.length);
  }

  // Top Clients by Cases
  private async getTopClients(tenantId: string, limit: number = 5) {
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

    return clients.map(c => ({
      clientId: c.id,
      clientName: c.name,
      casesCount: c._count.cases,
      invoicesCount: c._count.invoices,
    }));
  }

  // Top Invoices
  private async getTopInvoices(tenantId: string, limit: number = 5) {
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        client: {
          select: { name: true },
        },
        case: {
          select: { title: true },
        },
      },
      orderBy: { totalAmount: 'desc' },
      take: limit,
    });

    return invoices.map(inv => ({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.totalAmount),
      status: inv.status,
      clientName: inv.client.name,
      caseTitle: inv.case?.title || null,
      createdAt: inv.createdAt,
    }));
  }

  // Documents Statistics
  private async getDocumentsStats(tenantId: string) {
    const [total, byType, recentDocs, totalSize] = await Promise.all([
      // Total documents
      this.prisma.document.count({ where: { tenantId } }),

      // By type (file extension)
      this.prisma.document.groupBy({
        by: ['mimeType'],
        where: { tenantId },
        _count: true,
      }),

      // Recent documents
      this.prisma.document.findMany({
        where: { tenantId },
        select: {
          id: true,
          title: true,
          mimeType: true,
          fileSize: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Total size
      this.prisma.document.aggregate({
        where: { tenantId },
        _sum: { fileSize: true },
      }),
    ]);

    // Group by document category
    const typeCategories: Record<string, number> = {};
    byType.forEach(t => {
      let category = 'أخرى';
      if (t.mimeType?.includes('pdf')) category = 'PDF';
      else if (t.mimeType?.includes('word') || t.mimeType?.includes('document')) category = 'Word';
      else if (t.mimeType?.includes('excel') || t.mimeType?.includes('spreadsheet')) category = 'Excel';
      else if (t.mimeType?.includes('image')) category = 'صور';
      
      typeCategories[category] = (typeCategories[category] || 0) + t._count;
    });

    return {
      total,
      totalSizeBytes: Number(totalSize._sum?.fileSize || 0),
      totalSizeMB: Math.round(Number(totalSize._sum?.fileSize || 0) / (1024 * 1024) * 100) / 100,
      byType: Object.entries(typeCategories).map(([type, count]) => ({ type, count })),
      recentDocs: recentDocs.map(d => ({
        id: d.id,
        name: d.title,
        mimeType: d.mimeType,
        sizeMB: Math.round((d.fileSize || 0) / (1024 * 1024) * 100) / 100,
        createdAt: d.createdAt,
      })),
    };
  }

  // Tasks Statistics
  private async getTasksStats(tenantId: string, startDate: Date, endDate: Date) {
    const [total, byStatus, byUser, overdueTasks, recentTasks] = await Promise.all([
      // Total tasks
      this.prisma.task.count({ where: { tenantId } }),

      // By status
      this.prisma.task.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),

      // By assigned user
      this.prisma.task.groupBy({
        by: ['assignedToId'],
        where: { tenantId, assignedToId: { not: undefined } },
        _count: true,
      }),

      // Overdue tasks
      this.prisma.task.count({
        where: {
          tenantId,
          dueDate: { lt: new Date() },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
      }),

      // Recent tasks
      this.prisma.task.findMany({
        where: { tenantId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Get user names for byUser
    const userIds = byUser.map(u => u.assignedToId).filter(Boolean) as string[];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    // Calculate completion rate
    const completed = byStatus.find(s => s.status === TaskStatus.COMPLETED)?._count || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Tasks created in period
    const tasksInPeriod = await this.prisma.task.count({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    return {
      total,
      tasksInPeriod,
      completionRate,
      overdueTasks,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
        label: this.translateTaskStatus(s.status),
      })),
      byUser: byUser.map(u => ({
        userId: u.assignedToId,
        userName: users.find(usr => usr.id === u.assignedToId)?.name || 'غير محدد',
        count: u._count,
      })),
      recentTasks: recentTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        statusLabel: this.translateTaskStatus(t.status),
        priority: t.priority,
        dueDate: t.dueDate,
        assignedTo: t.assignedTo?.name || null,
      })),
    };
  }

  private translateTaskStatus(status: TaskStatus): string {
    const map: Record<string, string> = {
      TODO: 'للتنفيذ',
      IN_PROGRESS: 'قيد التنفيذ',
      DONE: 'مكتملة',
      CANCELLED: 'ملغية',
    };
    return map[status] || status;
  }

  // Helper: Get period dates
  private getPeriodDates(period: 'week' | 'month' | 'year') {
    const now = new Date();

    switch (period) {
      case 'week':
        return { 
          startDate: this.getStartOfWeek(now), 
          endDate: this.getEndOfWeek(now) 
        };
      case 'month':
        return { 
          startDate: new Date(now.getFullYear(), now.getMonth(), 1), 
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) 
        };
      case 'year':
        return { 
          startDate: new Date(now.getFullYear(), 0, 1), 
          endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59) 
        };
    }
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
  }

  private getEndOfWeek(date: Date): Date {
    const start = this.getStartOfWeek(date);
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  }

  // Upcoming Hearings for Timeline
  private async getUpcomingHearings(tenantId: string, limit: number = 10) {
    const now = new Date();
    
    const hearings = await this.prisma.hearing.findMany({
      where: {
        tenantId,
        hearingDate: { gte: now },
        status: { in: [HearingStatus.SCHEDULED, HearingStatus.POSTPONED] },
      },
      select: {
        id: true,
        hearingDate: true,
        courtName: true,
        courtroom: true,
        status: true,
        notes: true,
        case: {
          select: { 
            id: true,
            title: true, 
            caseNumber: true,
          },
        },
        client: {
          select: { name: true },
        },
        assignedTo: {
          select: { name: true },
        },
      },
      orderBy: { hearingDate: 'asc' },
      take: limit,
    });

    return hearings.map(h => ({
      id: h.id,
      hearingDate: h.hearingDate,
      courtName: h.courtName,
      courtroom: h.courtroom,
      status: h.status,
      notes: h.notes,
      caseId: h.case?.id,
      caseTitle: h.case?.title,
      caseNumber: h.case?.caseNumber,
      clientName: h.client?.name,
      lawyerName: h.assignedTo?.name,
    }));
  }
}

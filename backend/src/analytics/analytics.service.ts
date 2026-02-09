import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface DateRange {
  start: Date;
  end: Date;
}

interface AnalyticsFilters {
  dateRange?: DateRange;
  caseType?: string;
  lawyer?: string;
  client?: string;
  status?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Get comprehensive analytics overview
   */
  async getOverview(tenantId: string, filters: AnalyticsFilters = {}) {
    const dateRange = filters.dateRange || this.getDefaultDateRange();

    const [
      casesAnalytics,
      financialAnalytics,
      clientAnalytics,
      performanceAnalytics,
      trendsAnalytics,
    ] = await Promise.all([
      this.getCasesAnalytics(tenantId, filters),
      this.getFinancialAnalytics(tenantId, filters),
      this.getClientAnalytics(tenantId, filters),
      this.getPerformanceAnalytics(tenantId, filters),
      this.getTrendsAnalytics(tenantId, filters),
    ]);

    return {
      period: {
        start: dateRange.start,
        end: dateRange.end,
      },
      cases: casesAnalytics,
      financial: financialAnalytics,
      clients: clientAnalytics,
      performance: performanceAnalytics,
      trends: trendsAnalytics,
    };
  }

  /**
   * Cases Analytics
   */
  private async getCasesAnalytics(tenantId: string, filters: AnalyticsFilters) {
    const where: any = { tenantId };

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    if (filters.caseType) where.caseType = filters.caseType;
    if (filters.status) where.status = filters.status;
    if (filters.lawyer) where.assignedToId = filters.lawyer;

    const [
      total,
      byStatus,
      byType,
      byPriority,
      avgDuration,
      closureRate,
    ] = await Promise.all([
      this.prisma.case.count({ where }),
      this.prisma.case.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.case.groupBy({
        by: ['caseType'],
        where,
        _count: true,
      }),
      this.prisma.case.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      this.calculateAverageCaseDuration(tenantId, filters),
      this.calculateClosureRate(tenantId, filters),
    ]);

    return {
      total,
      byStatus: this.formatGroupByResult(byStatus, 'status'),
      byType: this.formatGroupByResult(byType, 'caseType'),
      byPriority: this.formatGroupByResult(byPriority, 'priority'),
      averageDuration: avgDuration,
      closureRate,
    };
  }

  /**
   * Financial Analytics
   */
  private async getFinancialAnalytics(tenantId: string, filters: AnalyticsFilters) {
    const where: any = { tenantId };

    if (filters.dateRange) {
      where.issueDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const [
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      overdueRevenue,
      revenueByMonth,
      topClients,
      averageInvoiceValue,
      paymentSuccessRate,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where,
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: {
          ...where,
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.getRevenueByMonth(tenantId, filters),
      this.getTopPayingClients(tenantId, filters, 10),
      this.calculateAverageInvoiceValue(tenantId),
      this.calculatePaymentSuccessRate(tenantId),
    ]);

    return {
      total: {
        amount: totalRevenue._sum.totalAmount || 0,
        count: totalRevenue._count,
      },
      paid: {
        amount: paidRevenue._sum.totalAmount || 0,
        count: paidRevenue._count,
      },
      pending: {
        amount: pendingRevenue._sum.totalAmount || 0,
        count: pendingRevenue._count,
      },
      overdue: {
        amount: overdueRevenue._sum.totalAmount || 0,
        count: overdueRevenue._count,
      },
      revenueByMonth,
      topClients,
      averageInvoiceValue,
      paymentSuccessRate,
    };
  }

  /**
   * Client Analytics
   */
  private async getClientAnalytics(tenantId: string, filters: AnalyticsFilters) {
    const where: any = { tenantId };

    const [
      totalClients,
      activeClients,
      newClients,
      topClients,
      clientRetentionRate,
      averageCasesPerClient,
      averageRevenuePerClient,
    ] = await Promise.all([
      this.prisma.client.count({ where }),
      this.getActiveClientsCount(tenantId),
      this.prisma.client.count({
        where: {
          ...where,
          ...(filters.dateRange && {
            createdAt: {
              gte: filters.dateRange.start,
              lte: filters.dateRange.end,
            },
          }),
        },
      }),
      this.getTopClientsByCases(tenantId, 10),
      this.calculateClientRetentionRate(tenantId),
      this.calculateAverageCasesPerClient(tenantId),
      this.calculateAverageRevenuePerClient(tenantId),
    ]);

    return {
      total: totalClients,
      active: activeClients,
      new: newClients,
      byType: [], // Client type grouping not available in current schema
      topClients,
      retentionRate: clientRetentionRate,
      averageCasesPerClient,
      averageRevenuePerClient,
    };
  }

  /**
   * Performance Analytics (Team & Lawyer)
   */
  private async getPerformanceAnalytics(tenantId: string, filters: AnalyticsFilters) {
    const lawyers = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: 'LAWYER',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    const lawyerPerformance = await Promise.all(
      lawyers.map(async (lawyer) => {
        const [
          totalCases,
          activeCases,
          closedCases,
          avgCaseDuration,
          successRate,
          revenue,
        ] = await Promise.all([
          this.prisma.case.count({
            where: { tenantId, assignedToId: lawyer.id },
          }),
          this.prisma.case.count({
            where: { tenantId, assignedToId: lawyer.id, status: 'OPEN' },
          }),
          this.prisma.case.count({
            where: { tenantId, assignedToId: lawyer.id, status: 'CLOSED' },
          }),
          this.calculateAverageCaseDuration(tenantId, {
            ...filters,
            lawyer: lawyer.id,
          }),
          this.calculateLawyerSuccessRate(tenantId, lawyer.id),
          this.calculateLawyerRevenue(tenantId, lawyer.id),
        ]);

        return {
          lawyer: {
            id: lawyer.id,
            name: lawyer.name,
            email: lawyer.email,
            avatar: lawyer.avatar,
          },
          metrics: {
            totalCases,
            activeCases,
            closedCases,
            avgCaseDuration,
            successRate,
            revenue,
          },
        };
      })
    );

    lawyerPerformance.sort((a, b) => b.metrics.successRate - a.metrics.successRate);

    const avgCasesPerLawyer = lawyers.length > 0
      ? lawyerPerformance.reduce((sum, l) => sum + l.metrics.totalCases, 0) / lawyers.length
      : 0;
    const avgSuccessRate = lawyers.length > 0
      ? lawyerPerformance.reduce((sum, l) => sum + l.metrics.successRate, 0) / lawyers.length
      : 0;
    const avgRevenuePerLawyer = lawyers.length > 0
      ? lawyerPerformance.reduce((sum, l) => sum + l.metrics.revenue, 0) / lawyers.length
      : 0;

    return {
      lawyers: lawyerPerformance,
      topPerformer: lawyerPerformance[0] || null,
      averages: {
        casesPerLawyer: avgCasesPerLawyer,
        successRate: avgSuccessRate,
        revenuePerLawyer: avgRevenuePerLawyer,
      },
    };
  }

  /**
   * Trends Analytics
   */
  private async getTrendsAnalytics(tenantId: string, filters: AnalyticsFilters) {
    const months = 12;

    const [casesGrowth, revenueGrowth, clientsGrowth] = await Promise.all([
      this.getCasesGrowthTrend(tenantId, months),
      this.getRevenueGrowthTrend(tenantId, months),
      this.getClientsGrowthTrend(tenantId, months),
    ]);

    return {
      cases: casesGrowth,
      revenue: revenueGrowth,
      clients: clientsGrowth,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getDefaultDateRange(): DateRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }

  private formatGroupByResult(data: any[], key: string) {
    return data.map(item => ({
      [key]: item[key],
      count: item._count,
    }));
  }

  private async calculateAverageCaseDuration(tenantId: string, filters: AnalyticsFilters): Promise<number> {
    const closedCases = await this.prisma.case.findMany({
      where: {
        tenantId,
        status: 'CLOSED',
        ...(filters.lawyer && { assignedToId: filters.lawyer }),
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    if (closedCases.length === 0) return 0;

    const totalDays = closedCases.reduce((sum, c) => {
      const days = Math.floor((c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / closedCases.length);
  }

  private async calculateClosureRate(tenantId: string, filters: AnalyticsFilters): Promise<number> {
    const where: any = { tenantId };
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const [total, closed] = await Promise.all([
      this.prisma.case.count({ where }),
      this.prisma.case.count({ where: { ...where, status: 'CLOSED' } }),
    ]);

    return total > 0 ? Math.round((closed / total) * 100) : 0;
  }

  private async getRevenueByMonth(tenantId: string, filters: AnalyticsFilters) {
    const months = 12;
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const result = await this.prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          paidAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: { totalAmount: true },
        _count: true,
      });

      data.push({
        month: monthStart.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        revenue: Number(result._sum.totalAmount) || 0,
        count: result._count,
      });
    }

    return data;
  }

  private async getTopPayingClients(tenantId: string, filters: AnalyticsFilters, limit: number) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
      },
      select: {
        clientId: true,
        totalAmount: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const clientRevenue = new Map<string, { client: any; revenue: number; count: number }>();

    invoices.forEach(inv => {
      const existing = clientRevenue.get(inv.clientId);
      if (existing) {
        existing.revenue += Number(inv.totalAmount);
        existing.count += 1;
      } else {
        clientRevenue.set(inv.clientId, {
          client: inv.client,
          revenue: Number(inv.totalAmount),
          count: 1,
        });
      }
    });

    return Array.from(clientRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  private async calculateAverageInvoiceValue(tenantId: string): Promise<number> {
    const result = await this.prisma.invoice.aggregate({
      where: { tenantId },
      _avg: { totalAmount: true },
    });

    return Math.round(Number(result._avg.totalAmount) || 0);
  }

  private async calculatePaymentSuccessRate(tenantId: string): Promise<number> {
    const [total, paid] = await Promise.all([
      this.prisma.invoice.count({ where: { tenantId } }),
      this.prisma.invoice.count({ where: { tenantId, status: 'PAID' } }),
    ]);

    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }

  private async getActiveClientsCount(tenantId: string): Promise<number> {
    const result = await this.prisma.case.findMany({
      where: {
        tenantId,
        status: 'OPEN',
      },
      select: {
        clientId: true,
      },
      distinct: ['clientId'],
    });

    return result.length;
  }

  private async getTopClientsByCases(tenantId: string, limit: number) {
    const clients = await this.prisma.client.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { cases: true },
        },
      },
      orderBy: {
        cases: { _count: 'desc' },
      },
      take: limit,
    });

    return clients.map(c => ({
      client: {
        id: c.id,
        name: c.name,
        email: c.email,
      },
      casesCount: c._count.cases,
    }));
  }

  private async calculateClientRetentionRate(tenantId: string): Promise<number> {
    const lastYear = new Date();
    lastYear.setMonth(lastYear.getMonth() - 12);

    const clientsLastYear = await this.prisma.client.count({
      where: {
        tenantId,
        createdAt: { lt: lastYear },
      },
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const activeClients = await this.prisma.case.findMany({
      where: {
        tenantId,
        createdAt: { gte: sixMonthsAgo },
        client: {
          createdAt: { lt: lastYear },
        },
      },
      select: { clientId: true },
      distinct: ['clientId'],
    });

    return clientsLastYear > 0
      ? Math.round((activeClients.length / clientsLastYear) * 100)
      : 0;
  }

  private async calculateAverageCasesPerClient(tenantId: string): Promise<number> {
    const [totalCases, totalClients] = await Promise.all([
      this.prisma.case.count({ where: { tenantId } }),
      this.prisma.client.count({ where: { tenantId } }),
    ]);

    return totalClients > 0 ? Math.round((totalCases / totalClients) * 10) / 10 : 0;
  }

  private async calculateAverageRevenuePerClient(tenantId: string): Promise<number> {
    const [totalRevenue, totalClients] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { tenantId, status: 'PAID' },
        _sum: { totalAmount: true },
      }),
      this.prisma.client.count({ where: { tenantId } }),
    ]);

    const revenue = Number(totalRevenue._sum.totalAmount) || 0;
    return totalClients > 0 ? Math.round(revenue / totalClients) : 0;
  }

  private async calculateLawyerSuccessRate(tenantId: string, lawyerId: string): Promise<number> {
    const [total, closed] = await Promise.all([
      this.prisma.case.count({
        where: { tenantId, assignedToId: lawyerId },
      }),
      this.prisma.case.count({
        where: { tenantId, assignedToId: lawyerId, status: 'CLOSED' },
      }),
    ]);

    return total > 0 ? Math.round((closed / total) * 100) : 0;
  }

  private async calculateLawyerRevenue(tenantId: string, lawyerId: string): Promise<number> {
    const cases = await this.prisma.case.findMany({
      where: { tenantId, assignedToId: lawyerId },
      select: { id: true },
    });

    const caseIds = cases.map(c => c.id);

    if (caseIds.length === 0) return 0;

    const result = await this.prisma.invoice.aggregate({
      where: {
        tenantId,
        caseId: { in: caseIds },
        status: 'PAID',
      },
      _sum: { totalAmount: true },
    });

    return Math.round(Number(result._sum.totalAmount) || 0);
  }

  private async getCasesGrowthTrend(tenantId: string, months: number) {
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const count = await this.prisma.case.count({
        where: {
          tenantId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      data.push({
        month: monthStart.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        count,
      });
    }

    return data;
  }

  private async getRevenueGrowthTrend(tenantId: string, months: number) {
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const result = await this.prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          paidAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: { totalAmount: true },
      });

      data.push({
        month: monthStart.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        revenue: Number(result._sum.totalAmount) || 0,
      });
    }

    return data;
  }

  private async getClientsGrowthTrend(tenantId: string, months: number) {
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const count = await this.prisma.client.count({
        where: {
          tenantId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      data.push({
        month: monthStart.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        count,
      });
    }

    return data;
  }
}

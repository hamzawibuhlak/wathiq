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
  async getOverview(filters: AnalyticsFilters = {}) {
    const dateRange = filters.dateRange || this.getDefaultDateRange();

    const [
      casesAnalytics,
      financialAnalytics,
      clientAnalytics,
      performanceAnalytics,
      trendsAnalytics,
    ] = await Promise.all([
      this.getCasesAnalytics(filters),
      this.getFinancialAnalytics(filters),
      this.getClientAnalytics(filters),
      this.getPerformanceAnalytics(filters),
      this.getTrendsAnalytics(filters),
    ]);

    return {
      period: {
        start: dateRange.start,
        end: dateRange.end },
      cases: casesAnalytics,
      financial: financialAnalytics,
      clients: clientAnalytics,
      performance: performanceAnalytics,
      trends: trendsAnalytics };
  }

  /**
   * Cases Analytics
   */
  private async getCasesAnalytics(filters: AnalyticsFilters) {
    const where: any = {};

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end };
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
        _count: true }),
      this.prisma.case.groupBy({
        by: ['caseType'],
        where,
        _count: true }),
      this.prisma.case.groupBy({
        by: ['priority'],
        where,
        _count: true }),
      this.calculateAverageCaseDuration(filters),
      this.calculateClosureRate(filters),
    ]);

    return {
      total,
      byStatus: this.formatGroupByResult(byStatus, 'status'),
      byType: this.formatGroupByResult(byType, 'caseType'),
      byPriority: this.formatGroupByResult(byPriority, 'priority'),
      averageDuration: avgDuration,
      closureRate };
  }

  /**
   * Financial Analytics
   */
  private async getFinancialAnalytics(filters: AnalyticsFilters) {
    const where: any = {};

    if (filters.dateRange) {
      where.issueDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end };
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
        _count: true }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { totalAmount: true },
        _count: true }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { totalAmount: true },
        _count: true }),
      this.prisma.invoice.aggregate({
        where: {
          ...where,
          status: 'PENDING',
          dueDate: { lt: new Date() } },
        _sum: { totalAmount: true },
        _count: true }),
      this.getRevenueByMonth(filters),
      this.getTopPayingClients(filters, 10),
      this.calculateAverageInvoiceValue(),
      this.calculatePaymentSuccessRate(),
    ]);

    return {
      total: {
        amount: totalRevenue._sum.totalAmount || 0,
        count: totalRevenue._count },
      paid: {
        amount: paidRevenue._sum.totalAmount || 0,
        count: paidRevenue._count },
      pending: {
        amount: pendingRevenue._sum.totalAmount || 0,
        count: pendingRevenue._count },
      overdue: {
        amount: overdueRevenue._sum.totalAmount || 0,
        count: overdueRevenue._count },
      revenueByMonth,
      topClients,
      averageInvoiceValue,
      paymentSuccessRate };
  }

  /**
   * Client Analytics
   */
  private async getClientAnalytics(filters: AnalyticsFilters) {
    const where: any = {};

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
      this.getActiveClientsCount(),
      this.prisma.client.count({
        where: {
          ...where,
          ...(filters.dateRange && {
            createdAt: {
              gte: filters.dateRange.start,
              lte: filters.dateRange.end } }) } }),
      this.getTopClientsByCases(10),
      this.calculateClientRetentionRate(),
      this.calculateAverageCasesPerClient(),
      this.calculateAverageRevenuePerClient(),
    ]);

    return {
      total: totalClients,
      active: activeClients,
      new: newClients,
      byType: [], // Client type grouping not available in current schema
      topClients,
      retentionRate: clientRetentionRate,
      averageCasesPerClient,
      averageRevenuePerClient };
  }

  /**
   * Performance Analytics (Team & Lawyer)
   */
  private async getPerformanceAnalytics(filters: AnalyticsFilters) {
    const lawyers = await this.prisma.user.findMany({
      where: {
        role: 'LAWYER',
        isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true } });

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
            where: { assignedToId: lawyer.id } }),
          this.prisma.case.count({
            where: { assignedToId: lawyer.id, status: 'OPEN' } }),
          this.prisma.case.count({
            where: { assignedToId: lawyer.id, status: 'CLOSED' } }),
          this.calculateAverageCaseDuration({
            ...filters,
            lawyer: lawyer.id }),
          this.calculateLawyerSuccessRate(lawyer.id),
          this.calculateLawyerRevenue(lawyer.id),
        ]);

        return {
          lawyer: {
            id: lawyer.id,
            name: lawyer.name,
            email: lawyer.email,
            avatar: lawyer.avatar },
          metrics: {
            totalCases,
            activeCases,
            closedCases,
            avgCaseDuration,
            successRate,
            revenue } };
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
        revenuePerLawyer: avgRevenuePerLawyer } };
  }

  /**
   * Trends Analytics
   */
  private async getTrendsAnalytics(filters: AnalyticsFilters) {
    const months = 12;

    const [casesGrowth, revenueGrowth, clientsGrowth] = await Promise.all([
      this.getCasesGrowthTrend(months),
      this.getRevenueGrowthTrend(months),
      this.getClientsGrowthTrend(months),
    ]);

    return {
      cases: casesGrowth,
      revenue: revenueGrowth,
      clients: clientsGrowth };
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
      count: item._count }));
  }

  private async calculateAverageCaseDuration(filters: AnalyticsFilters): Promise<number> {
    const closedCases = await this.prisma.case.findMany({
      where: {
        status: 'CLOSED',
        ...(filters.lawyer && { assignedToId: filters.lawyer }) },
      select: {
        createdAt: true,
        updatedAt: true } });

    if (closedCases.length === 0) return 0;

    const totalDays = closedCases.reduce((sum, c) => {
      const days = Math.floor((c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / closedCases.length);
  }

  private async calculateClosureRate(filters: AnalyticsFilters): Promise<number> {
    const where: any = {};
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end };
    }

    const [total, closed] = await Promise.all([
      this.prisma.case.count({ where }),
      this.prisma.case.count({ where: { ...where, status: 'CLOSED' } }),
    ]);

    return total > 0 ? Math.round((closed / total) * 100) : 0;
  }

  private async getRevenueByMonth(filters: AnalyticsFilters) {
    const months = 12;
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const result = await this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: monthStart,
            lte: monthEnd } },
        _sum: { totalAmount: true },
        _count: true });

      data.push({
        month: monthStart.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        revenue: Number(result._sum.totalAmount) || 0,
        count: result._count });
    }

    return data;
  }

  private async getTopPayingClients(filters: AnalyticsFilters, limit: number) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: 'PAID' },
      select: {
        clientId: true,
        totalAmount: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true } } } });

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
          count: 1 });
      }
    });

    return Array.from(clientRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  private async calculateAverageInvoiceValue(): Promise<number> {
    const result = await this.prisma.invoice.aggregate({
      where: {},
      _avg: { totalAmount: true } });

    return Math.round(Number(result._avg.totalAmount) || 0);
  }

  private async calculatePaymentSuccessRate(): Promise<number> {
    const [total, paid] = await Promise.all([
      this.prisma.invoice.count({ where: {} }),
      this.prisma.invoice.count({ where: { status: 'PAID' } }),
    ]);

    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }

  private async getActiveClientsCount(): Promise<number> {
    const result = await this.prisma.case.findMany({
      where: {
        status: 'OPEN' },
      select: {
        clientId: true },
      distinct: ['clientId'] });

    return result.length;
  }

  private async getTopClientsByCases(limit: number) {
    const clients = await this.prisma.client.findMany({
      where: {},
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { cases: true } } },
      orderBy: {
        cases: { _count: 'desc' } },
      take: limit });

    return clients.map(c => ({
      client: {
        id: c.id,
        name: c.name,
        email: c.email },
      casesCount: c._count.cases }));
  }

  private async calculateClientRetentionRate(): Promise<number> {
    const lastYear = new Date();
    lastYear.setMonth(lastYear.getMonth() - 12);

    const clientsLastYear = await this.prisma.client.count({
      where: {
        createdAt: { lt: lastYear } } });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const activeClients = await this.prisma.case.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        client: {
          createdAt: { lt: lastYear } } },
      select: { clientId: true },
      distinct: ['clientId'] });

    return clientsLastYear > 0
      ? Math.round((activeClients.length / clientsLastYear) * 100)
      : 0;
  }

  private async calculateAverageCasesPerClient(): Promise<number> {
    const [totalCases, totalClients] = await Promise.all([
      this.prisma.case.count({ where: {} }),
      this.prisma.client.count({ where: {} }),
    ]);

    return totalClients > 0 ? Math.round((totalCases / totalClients) * 10) / 10 : 0;
  }

  private async calculateAverageRevenuePerClient(): Promise<number> {
    const [totalRevenue, totalClients] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true } }),
      this.prisma.client.count({ where: {} }),
    ]);

    const revenue = Number(totalRevenue._sum.totalAmount) || 0;
    return totalClients > 0 ? Math.round(revenue / totalClients) : 0;
  }

  private async calculateLawyerSuccessRate(lawyerId: string): Promise<number> {
    const [total, closed] = await Promise.all([
      this.prisma.case.count({
        where: { assignedToId: lawyerId } }),
      this.prisma.case.count({
        where: { assignedToId: lawyerId, status: 'CLOSED' } }),
    ]);

    return total > 0 ? Math.round((closed / total) * 100) : 0;
  }

  private async calculateLawyerRevenue(lawyerId: string): Promise<number> {
    const cases = await this.prisma.case.findMany({
      where: { assignedToId: lawyerId },
      select: { id: true } });

    const caseIds = cases.map(c => c.id);

    if (caseIds.length === 0) return 0;

    const result = await this.prisma.invoice.aggregate({
      where: {
        caseId: { in: caseIds },
        status: 'PAID' },
      _sum: { totalAmount: true } });

    return Math.round(Number(result._sum.totalAmount) || 0);
  }

  private async getCasesGrowthTrend(months: number) {
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const count = await this.prisma.case.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd } } });

      data.push({
        month: monthStart.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        count });
    }

    return data;
  }

  private async getRevenueGrowthTrend(months: number) {
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const result = await this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: monthStart,
            lte: monthEnd } },
        _sum: { totalAmount: true } });

      data.push({
        month: monthStart.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        revenue: Number(result._sum.totalAmount) || 0 });
    }

    return data;
  }

  private async getClientsGrowthTrend(months: number) {
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const count = await this.prisma.client.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd } } });

      data.push({
        month: monthStart.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
        count });
    }

    return data;
  }
}

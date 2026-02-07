import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ExportsService } from '../exports/exports.service';
import { CreateReportDto, UpdateReportDto, ExecuteReportDto } from './dto';
import { HearingStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly exportsService: ExportsService,
    ) { }

    // ========== CRUD Operations ==========

    async create(dto: CreateReportDto, userId: string, tenantId: string) {
        return this.prisma.report.create({
            data: {
                name: dto.name,
                description: dto.description,
                reportType: dto.reportType as any,
                config: dto.config,
                createdById: userId,
                tenantId,
            },
            include: {
                creator: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async findAllReports(tenantId: string) {
        return this.prisma.report.findMany({
            where: { tenantId },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                _count: { select: { executions: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOneReport(id: string, tenantId: string) {
        const report = await this.prisma.report.findFirst({
            where: { id, tenantId },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                executions: {
                    take: 10,
                    orderBy: { startedAt: 'desc' },
                    include: { executor: { select: { id: true, name: true } } },
                },
            },
        });

        if (!report) throw new NotFoundException('التقرير غير موجود');
        return report;
    }

    async updateReport(id: string, dto: UpdateReportDto, tenantId: string) {
        await this.findOneReport(id, tenantId);
        return this.prisma.report.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                reportType: dto.reportType as any,
                config: dto.config,
            },
        });
    }

    async removeReport(id: string, tenantId: string) {
        await this.findOneReport(id, tenantId);
        return this.prisma.report.delete({ where: { id } });
    }

    // ========== Execute Report ==========

    async execute(reportId: string, dto: ExecuteReportDto, userId: string, tenantId: string) {
        const report = await this.findOneReport(reportId, tenantId);

        const execution = await this.prisma.reportExecution.create({
            data: {
                reportId,
                format: dto.format as any,
                status: 'PROCESSING',
                executedById: userId,
                tenantId,
            },
        });

        this.processReportExecution(execution.id, report, dto).catch(async error => {
            this.logger.error(`Report execution failed: ${error.message}`, error.stack);
            await this.prisma.reportExecution.update({
                where: { id: execution.id },
                data: { status: 'FAILED', error: error.message, completedAt: new Date() },
            });
        });

        return execution;
    }

    async getExecution(executionId: string, tenantId: string) {
        const execution = await this.prisma.reportExecution.findFirst({
            where: { id: executionId, tenantId },
            include: {
                report: { select: { name: true, reportType: true } },
                executor: { select: { name: true } },
            },
        });

        if (!execution) throw new NotFoundException('تنفيذ التقرير غير موجود');
        return execution;
    }

    // ========== Dashboard Stats ==========

    async getDashboardStats(tenantId: string) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const [
            totalCases, activeCases, closedCases, totalClients, activeClients,
            totalHearings, upcomingHearings, hearingsThisWeek, hearingsToday,
            totalInvoices, paidInvoices, pendingInvoices, overdueInvoices,
            totalRevenue, pendingRevenue, casesByStatus, casesByType,
            monthlyRevenue, recentCases, recentHearings,
        ] = await Promise.all([
            this.prisma.case.count({ where: { tenantId } }),
            this.prisma.case.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            this.prisma.case.count({ where: { tenantId, status: 'CLOSED' } }),
            this.prisma.client.count({ where: { tenantId } }),
            this.prisma.client.count({ where: { tenantId, isActive: true } }),
            this.prisma.hearing.count({ where: { tenantId } }),
            this.prisma.hearing.count({
                where: { tenantId, hearingDate: { gte: now }, status: { in: [HearingStatus.SCHEDULED, HearingStatus.POSTPONED] } },
            }),
            this.prisma.hearing.count({
                where: { tenantId, hearingDate: { gte: startOfWeek, lt: endOfWeek }, status: { not: HearingStatus.CANCELLED } },
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
            this.prisma.invoice.count({ where: { tenantId } }),
            this.prisma.invoice.count({ where: { tenantId, status: InvoiceStatus.PAID } }),
            this.prisma.invoice.count({ where: { tenantId, status: InvoiceStatus.PENDING } }),
            this.prisma.invoice.count({ where: { tenantId, status: InvoiceStatus.OVERDUE } }),
            this.prisma.invoice.aggregate({ where: { tenantId, status: InvoiceStatus.PAID }, _sum: { totalAmount: true } }),
            this.prisma.invoice.aggregate({ where: { tenantId, status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] } }, _sum: { totalAmount: true } }),
            this.prisma.case.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
            this.prisma.case.groupBy({ by: ['caseType'], where: { tenantId }, _count: true }),
            this.getMonthlyRevenue(tenantId, 6),
            this.prisma.case.findMany({
                where: { tenantId }, take: 5, orderBy: { createdAt: 'desc' },
                select: { id: true, caseNumber: true, title: true, status: true, createdAt: true, client: { select: { name: true } } },
            }),
            this.prisma.hearing.findMany({
                where: { tenantId, hearingDate: { gte: now }, status: { not: HearingStatus.CANCELLED } },
                take: 5, orderBy: { hearingDate: 'asc' },
                select: { id: true, hearingDate: true, courtName: true, status: true, case: { select: { id: true, title: true, caseNumber: true } } },
            }),
        ]);

        return {
            data: {
                overview: {
                    cases: { total: totalCases, active: activeCases, closed: closedCases },
                    clients: { total: totalClients, active: activeClients },
                    hearings: { total: totalHearings, upcoming: upcomingHearings, thisWeek: hearingsThisWeek, today: hearingsToday },
                    invoices: {
                        total: totalInvoices, paid: paidInvoices, pending: pendingInvoices, overdue: overdueInvoices,
                        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
                        pendingRevenue: Number(pendingRevenue._sum.totalAmount || 0),
                    },
                },
                casesByStatus: casesByStatus.map(item => ({ status: item.status, count: item._count })),
                casesByType: casesByType.map(item => ({ type: item.caseType, count: item._count })),
                monthlyRevenue, recentCases, recentHearings,
            },
        };
    }

    private async getMonthlyRevenue(tenantId: string, months: number) {
        const result = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const revenue = await this.prisma.invoice.aggregate({
                where: { tenantId, status: InvoiceStatus.PAID, paidAt: { gte: start, lte: end } },
                _sum: { totalAmount: true }, _count: true,
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

    async getFinancialReport(tenantId: string, startDate?: string, endDate?: string) {
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const [totalStats, paidStats, pendingStats, overdueStats] = await Promise.all([
            this.prisma.invoice.aggregate({ where: { tenantId, createdAt: { gte: start, lte: end } }, _sum: { totalAmount: true }, _count: true }),
            this.prisma.invoice.aggregate({ where: { tenantId, status: InvoiceStatus.PAID, createdAt: { gte: start, lte: end } }, _sum: { totalAmount: true }, _count: true }),
            this.prisma.invoice.aggregate({ where: { tenantId, status: InvoiceStatus.PENDING, createdAt: { gte: start, lte: end } }, _sum: { totalAmount: true }, _count: true }),
            this.prisma.invoice.aggregate({ where: { tenantId, status: InvoiceStatus.OVERDUE, createdAt: { gte: start, lte: end } }, _sum: { totalAmount: true }, _count: true }),
        ]);

        const topClients = await this.prisma.invoice.groupBy({
            by: ['clientId'], where: { tenantId, status: InvoiceStatus.PAID, createdAt: { gte: start, lte: end } },
            _sum: { totalAmount: true }, _count: true, orderBy: { _sum: { totalAmount: 'desc' } }, take: 10,
        });

        const clientIds = topClients.map(c => c.clientId);
        const clients = await this.prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } });

        return {
            data: {
                period: { start, end },
                summary: {
                    total: Number(totalStats._sum.totalAmount || 0), totalCount: totalStats._count,
                    paid: Number(paidStats._sum.totalAmount || 0), paidCount: paidStats._count,
                    pending: Number(pendingStats._sum.totalAmount || 0), pendingCount: pendingStats._count,
                    overdue: Number(overdueStats._sum.totalAmount || 0), overdueCount: overdueStats._count,
                },
                topClients: topClients.map(tc => ({
                    clientId: tc.clientId,
                    clientName: clients.find(c => c.id === tc.clientId)?.name || 'غير معروف',
                    revenue: Number(tc._sum.totalAmount || 0),
                    invoiceCount: tc._count,
                })),
            },
        };
    }

    async getCasesReport(tenantId: string, period: string = 'month') {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case 'quarter': startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
            case 'year': startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1); break;
            default: startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        }

        const [newCases, closedCases, casesByLawyer, casesByType] = await Promise.all([
            this.prisma.case.count({ where: { tenantId, createdAt: { gte: startDate } } }),
            this.prisma.case.count({ where: { tenantId, status: 'CLOSED', updatedAt: { gte: startDate } } }),
            this.prisma.case.groupBy({ by: ['assignedToId'], where: { tenantId, createdAt: { gte: startDate } }, _count: true }),
            this.prisma.case.groupBy({ by: ['caseType'], where: { tenantId, createdAt: { gte: startDate } }, _count: true }),
        ]);

        const lawyerIds = casesByLawyer.map(c => c.assignedToId).filter(Boolean) as string[];
        const lawyers = await this.prisma.user.findMany({ where: { id: { in: lawyerIds } }, select: { id: true, name: true } });

        return {
            data: {
                period, startDate, endDate: now,
                summary: { newCases, closedCases, netChange: newCases - closedCases },
                casesByLawyer: casesByLawyer.map(cl => ({
                    lawyerId: cl.assignedToId,
                    lawyerName: lawyers.find(l => l.id === cl.assignedToId)?.name || 'غير مسند',
                    count: cl._count,
                })),
                casesByType: casesByType.map(ct => ({ type: ct.caseType, count: ct._count })),
            },
        };
    }

    async getPerformanceReport(tenantId: string) {
        const lawyers = await this.prisma.user.findMany({
            where: { tenantId, role: { in: ['LAWYER', 'ADMIN', 'OWNER'] }, isActive: true },
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
                    lawyer: { id: lawyer.id, name: lawyer.name, email: lawyer.email, role: lawyer.role },
                    stats: {
                        totalCases, activeCases, closedCases, totalHearings, completedHearings,
                        successRate: totalCases > 0 ? ((closedCases / totalCases) * 100).toFixed(1) : '0',
                    },
                };
            }),
        );

        return { data: performance };
    }

    // ========== Private Methods ==========

    private async processReportExecution(executionId: string, report: any, dto: ExecuteReportDto) {
        try {
            const data = await this.generateReportData(report);
            const { filePath, fileSize } = await this.exportReport(data, dto.format, report.name);

            await this.prisma.reportExecution.update({
                where: { id: executionId },
                data: { status: 'COMPLETED', filePath, fileSize, completedAt: new Date() },
            });

            this.logger.log(`Report execution completed: ${executionId}`);
        } catch (error) {
            throw error;
        }
    }

    private async generateReportData(report: any) {
        const config = report.config as any;
        const tenantId = report.tenantId;

        switch (report.reportType) {
            case 'CASES_SUMMARY': return this.generateCasesSummaryData(tenantId, config);
            case 'CASES_DETAILED': return this.generateCasesSummaryData(tenantId, config);
            case 'HEARINGS_SCHEDULE': return this.generateHearingsScheduleData(tenantId, config);
            case 'FINANCIAL_SUMMARY': return this.generateFinancialSummaryData(tenantId, config);
            case 'CLIENT_ACTIVITY': return this.generateClientActivityData(tenantId, config);
            case 'LAWYER_PERFORMANCE': return this.generateLawyerPerformanceData(tenantId, config);
            case 'INVOICES_AGING': return this.generateInvoicesAgingData(tenantId, config);
            default: throw new Error('نوع التقرير غير معروف');
        }
    }

    private async generateCasesSummaryData(tenantId: string, config: any) {
        const where: any = { tenantId };
        if (config.dateFrom) where.createdAt = { ...where.createdAt, gte: new Date(config.dateFrom) };
        if (config.dateTo) where.createdAt = { ...where.createdAt, lte: new Date(config.dateTo) };
        if (config.status) where.status = config.status;

        const cases = await this.prisma.case.findMany({
            where,
            include: { client: { select: { name: true } }, assignedTo: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return {
            title: 'ملخص القضايا', generatedAt: new Date(),
            columns: [
                { header: 'رقم القضية', key: 'caseNumber' },
                { header: 'العنوان', key: 'title' },
                { header: 'العميل', key: 'client' },
                { header: 'المحامي', key: 'lawyer' },
                { header: 'الحالة', key: 'status' },
                { header: 'تاريخ الإنشاء', key: 'createdAt' },
            ],
            data: cases.map(c => ({
                caseNumber: c.caseNumber, title: c.title, client: c.client.name,
                lawyer: c.assignedTo?.name || 'غير محدد',
                status: this.translateStatus(c.status),
                createdAt: new Date(c.createdAt).toLocaleDateString('ar-SA'),
            })),
        };
    }

    private async generateHearingsScheduleData(tenantId: string, config: any) {
        const where: any = { tenantId };
        if (config.dateFrom) where.hearingDate = { ...where.hearingDate, gte: new Date(config.dateFrom) };
        if (config.dateTo) where.hearingDate = { ...where.hearingDate, lte: new Date(config.dateTo) };

        const hearings = await this.prisma.hearing.findMany({
            where,
            include: { case: { select: { title: true } }, client: { select: { name: true } }, assignedTo: { select: { name: true } } },
            orderBy: { hearingDate: 'asc' },
        });

        return {
            title: 'جدول الجلسات', generatedAt: new Date(),
            columns: [
                { header: 'القضية', key: 'case' },
                { header: 'العميل', key: 'client' },
                { header: 'التاريخ', key: 'date' },
                { header: 'المحكمة', key: 'court' },
                { header: 'الحالة', key: 'status' },
            ],
            data: hearings.map(h => ({
                case: h.case?.title || 'غير محدد', client: h.client?.name || 'غير محدد',
                date: new Date(h.hearingDate).toLocaleString('ar-SA'),
                court: h.courtName || 'غير محدد',
                status: this.translateHearingStatus(h.status),
            })),
        };
    }

    private async generateFinancialSummaryData(tenantId: string, config: any) {
        const where: any = { tenantId };
        if (config.dateFrom) where.createdAt = { ...where.createdAt, gte: new Date(config.dateFrom) };
        if (config.dateTo) where.createdAt = { ...where.createdAt, lte: new Date(config.dateTo) };

        const invoices = await this.prisma.invoice.findMany({
            where,
            include: { client: { select: { name: true } }, case: { select: { title: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return {
            title: 'الملخص المالي', generatedAt: new Date(),
            columns: [
                { header: 'رقم الفاتورة', key: 'invoiceNumber' },
                { header: 'العميل', key: 'client' },
                { header: 'المبلغ', key: 'amount' },
                { header: 'الحالة', key: 'status' },
                { header: 'التاريخ', key: 'createdAt' },
            ],
            data: invoices.map(inv => ({
                invoiceNumber: inv.invoiceNumber, client: inv.client.name,
                amount: `${Number(inv.totalAmount).toLocaleString('ar-SA')} ر.س`,
                status: this.translateInvoiceStatus(inv.status),
                createdAt: new Date(inv.createdAt).toLocaleDateString('ar-SA'),
            })),
        };
    }

    private async generateClientActivityData(tenantId: string, _config: any) {
        const clients = await this.prisma.client.findMany({
            where: { tenantId },
            include: { _count: { select: { cases: true, invoices: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return {
            title: 'نشاط العملاء', generatedAt: new Date(),
            columns: [
                { header: 'الاسم', key: 'name' },
                { header: 'الهاتف', key: 'phone' },
                { header: 'عدد القضايا', key: 'casesCount' },
                { header: 'تاريخ التسجيل', key: 'createdAt' },
            ],
            data: clients.map(c => ({
                name: c.name, phone: c.phone, casesCount: c._count.cases,
                createdAt: new Date(c.createdAt).toLocaleDateString('ar-SA'),
            })),
        };
    }

    private async generateLawyerPerformanceData(tenantId: string, _config: any) {
        const result = await this.getPerformanceReport(tenantId);
        return {
            title: 'أداء المحامين', generatedAt: new Date(),
            columns: [
                { header: 'الاسم', key: 'name' },
                { header: 'إجمالي القضايا', key: 'totalCases' },
                { header: 'القضايا المغلقة', key: 'closedCases' },
                { header: 'معدل النجاح', key: 'successRate' },
            ],
            data: result.data.map(p => ({
                name: p.lawyer.name, totalCases: p.stats.totalCases,
                closedCases: p.stats.closedCases, successRate: `${p.stats.successRate}%`,
            })),
        };
    }

    private async generateInvoicesAgingData(tenantId: string, _config: any) {
        const now = new Date();
        const invoices = await this.prisma.invoice.findMany({
            where: { tenantId, status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] } },
            include: { client: { select: { name: true } } },
            orderBy: { dueDate: 'asc' },
        });

        return {
            title: 'أعمار الفواتير المستحقة', generatedAt: new Date(),
            columns: [
                { header: 'رقم الفاتورة', key: 'invoiceNumber' },
                { header: 'العميل', key: 'client' },
                { header: 'المبلغ', key: 'amount' },
                { header: 'أيام التأخير', key: 'daysOverdue' },
            ],
            data: invoices.map(inv => {
                const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
                return {
                    invoiceNumber: inv.invoiceNumber, client: inv.client.name,
                    amount: `${Number(inv.totalAmount).toLocaleString('ar-SA')} ر.س`,
                    daysOverdue,
                };
            }),
        };
    }

    private async exportReport(data: any, format: string, name: string) {
        const filename = `${name.replace(/\s+/g, '_')}-${Date.now()}`;
        return this.exportsService.exportReportData(data, format as any, filename);
    }

    private translateStatus(status: string): string {
        const map: Record<string, string> = { OPEN: 'مفتوحة', IN_PROGRESS: 'جارية', SUSPENDED: 'معلقة', CLOSED: 'مغلقة', ARCHIVED: 'مؤرشفة' };
        return map[status] || status;
    }

    private translateHearingStatus(status: string): string {
        const map: Record<string, string> = { SCHEDULED: 'مجدولة', COMPLETED: 'منتهية', POSTPONED: 'مؤجلة', CANCELLED: 'ملغية' };
        return map[status] || status;
    }

    private translateInvoiceStatus(status: string): string {
        const map: Record<string, string> = { DRAFT: 'مسودة', PENDING: 'مستحقة', SENT: 'مرسلة', PAID: 'مدفوعة', OVERDUE: 'متأخرة', CANCELLED: 'ملغية' };
        return map[status] || status;
    }
}

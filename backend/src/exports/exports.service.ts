import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async exportCases(tenantId: string, filters?: any) {
    const { ids, ...otherFilters } = filters || {};
    const whereClause: any = { tenantId, ...otherFilters };
    if (ids && ids.length > 0) {
      whereClause.id = { in: ids };
    }

    const cases = await this.prisma.case.findMany({
      where: whereClause,
      include: {
        client: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Watheeq';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('القضايا', {
      views: [{ rightToLeft: true }],
    });

    // Headers
    worksheet.columns = [
      { header: 'رقم القضية', key: 'caseNumber', width: 20 },
      { header: 'العنوان', key: 'title', width: 30 },
      { header: 'النوع', key: 'caseType', width: 15 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'الأولوية', key: 'priority', width: 12 },
      { header: 'العميل', key: 'client', width: 25 },
      { header: 'المحامي', key: 'lawyer', width: 25 },
      { header: 'المحكمة', key: 'courtName', width: 25 },
      { header: 'تاريخ الإنشاء', key: 'createdAt', width: 20 },
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.alignment = { horizontal: 'center' };

    // Case type & status translations
    const caseTypes: Record<string, string> = {
      CRIMINAL: 'جنائي',
      CIVIL: 'مدني',
      COMMERCIAL: 'تجاري',
      LABOR: 'عمالي',
      FAMILY: 'أحوال شخصية',
      ADMINISTRATIVE: 'إداري',
      REAL_ESTATE: 'عقاري',
      OTHER: 'أخرى',
    };

    const caseStatuses: Record<string, string> = {
      OPEN: 'مفتوحة',
      IN_PROGRESS: 'جارية',
      SUSPENDED: 'معلقة',
      CLOSED: 'مغلقة',
      ARCHIVED: 'مؤرشفة',
    };

    const priorities: Record<string, string> = {
      HIGH: 'عالية',
      MEDIUM: 'متوسطة',
      LOW: 'منخفضة',
    };

    // Add data
    cases.forEach(c => {
      worksheet.addRow({
        caseNumber: c.caseNumber,
        title: c.title,
        caseType: caseTypes[c.caseType] || c.caseType,
        status: caseStatuses[c.status] || c.status,
        priority: priorities[c.priority] || c.priority,
        client: c.client?.name || '-',
        lawyer: c.assignedTo?.name || '-',
        courtName: c.courtName || '-',
        createdAt: new Date(c.createdAt).toLocaleDateString('ar-SA'),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async exportInvoices(tenantId: string, filters?: any) {
    const { ids, ...otherFilters } = filters || {};
    const whereClause: any = { tenantId, ...otherFilters };
    if (ids && ids.length > 0) {
      whereClause.id = { in: ids };
    }

    const invoices = await this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        case: { select: { caseNumber: true, title: true } },
        client: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Watheeq';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('الفواتير', {
      views: [{ rightToLeft: true }],
    });

    worksheet.columns = [
      { header: 'رقم الفاتورة', key: 'invoiceNumber', width: 20 },
      { header: 'العميل', key: 'client', width: 25 },
      { header: 'القضية', key: 'case', width: 25 },
      { header: 'المبلغ', key: 'amount', width: 15 },
      { header: 'الضريبة', key: 'taxAmount', width: 15 },
      { header: 'الإجمالي', key: 'totalAmount', width: 15 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'تاريخ الاستحقاق', key: 'dueDate', width: 20 },
      { header: 'تاريخ الإنشاء', key: 'createdAt', width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };
    headerRow.alignment = { horizontal: 'center' };

    const invoiceStatuses: Record<string, string> = {
      DRAFT: 'مسودة',
      PENDING: 'مستحق',
      SENT: 'مرسل',
      PAID: 'مدفوع',
      OVERDUE: 'متأخر',
      CANCELLED: 'ملغي',
    };

    invoices.forEach(inv => {
      worksheet.addRow({
        invoiceNumber: inv.invoiceNumber,
        client: inv.client?.name || '-',
        case: inv.case?.title || '-',
        amount: Number(inv.amount),
        taxAmount: Number(inv.taxAmount),
        totalAmount: Number(inv.totalAmount),
        status: invoiceStatuses[inv.status] || inv.status,
        dueDate: inv.dueDate
          ? new Date(inv.dueDate).toLocaleDateString('ar-SA')
          : '-',
        createdAt: new Date(inv.createdAt).toLocaleDateString('ar-SA'),
      });
    });

    // Format currency columns
    worksheet.getColumn('amount').numFmt = '#,##0.00 "ر.س"';
    worksheet.getColumn('taxAmount').numFmt = '#,##0.00 "ر.س"';
    worksheet.getColumn('totalAmount').numFmt = '#,##0.00 "ر.س"';

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async exportClients(tenantId: string, filters?: any) {
    const { ids } = filters || {};
    const whereClause: any = { tenantId };
    if (ids && ids.length > 0) {
      whereClause.id = { in: ids };
    }

    const clients = await this.prisma.client.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { cases: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Watheeq';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('العملاء', {
      views: [{ rightToLeft: true }],
    });

    worksheet.columns = [
      { header: 'الاسم', key: 'name', width: 30 },
      { header: 'البريد الإلكتروني', key: 'email', width: 30 },
      { header: 'رقم الهاتف', key: 'phone', width: 20 },
      { header: 'رقم الهوية', key: 'nationalId', width: 20 },
      { header: 'اسم الشركة', key: 'companyName', width: 25 },
      { header: 'المدينة', key: 'city', width: 15 },
      { header: 'عدد القضايا', key: 'casesCount', width: 15 },
      { header: 'تاريخ التسجيل', key: 'createdAt', width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B5CF6' },
    };
    headerRow.alignment = { horizontal: 'center' };

    clients.forEach(client => {
      worksheet.addRow({
        name: client.name,
        email: client.email || '-',
        phone: client.phone || '-',
        nationalId: client.nationalId || '-',
        companyName: client.companyName || '-',
        city: client.city || '-',
        casesCount: client._count.cases,
        createdAt: new Date(client.createdAt).toLocaleDateString('ar-SA'),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async exportHearings(tenantId: string, filters?: any) {
    const { ids, ...otherFilters } = filters || {};
    const whereClause: any = { tenantId, ...otherFilters };
    if (ids && ids.length > 0) {
      whereClause.id = { in: ids };
    }

    const hearings = await this.prisma.hearing.findMany({
      where: whereClause,
      include: {
        case: { select: { caseNumber: true, title: true } },
        client: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { hearingDate: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Watheeq';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('الجلسات', {
      views: [{ rightToLeft: true }],
    });

    worksheet.columns = [
      { header: 'القضية', key: 'case', width: 30 },
      { header: 'العميل', key: 'client', width: 25 },
      { header: 'تاريخ الجلسة', key: 'hearingDate', width: 20 },
      { header: 'المحكمة', key: 'courtName', width: 25 },
      { header: 'القاعة', key: 'courtroom', width: 15 },
      { header: 'المحامي', key: 'lawyer', width: 25 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'ملاحظات', key: 'notes', width: 30 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF59E0B' },
    };
    headerRow.alignment = { horizontal: 'center' };

    const hearingStatuses: Record<string, string> = {
      SCHEDULED: 'مجدولة',
      COMPLETED: 'منتهية',
      POSTPONED: 'مؤجلة',
      CANCELLED: 'ملغية',
    };

    hearings.forEach(h => {
      worksheet.addRow({
        case: h.case?.title || '-',
        client: h.client?.name || '-',
        hearingDate: new Date(h.hearingDate).toLocaleString('ar-SA'),
        courtName: h.courtName || '-',
        courtroom: h.courtroom || '-',
        lawyer: h.assignedTo?.name || '-',
        status: hearingStatuses[h.status] || h.status,
        notes: h.notes || '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async exportFinancialReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Validate and fix dates
    const now = new Date();
    let validEndDate = endDate;
    let validStartDate = startDate;
    
    if (!endDate || isNaN(endDate.getTime())) {
      validEndDate = now;
    }
    if (!startDate || isNaN(startDate.getTime())) {
      validStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: validStartDate,
          lte: validEndDate,
        },
      },
      include: {
        client: { select: { name: true } },
        case: { select: { title: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Watheeq';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('التقرير المالي', {
      views: [{ rightToLeft: true }],
    });

    // Summary Section
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0,
    );
    const paidAmount = invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const pendingAmount = invoices
      .filter(inv => ['PENDING', 'SENT'].includes(inv.status))
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const overdueAmount = invoices
      .filter(inv => inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // Title
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'التقرير المالي';
    titleCell.font = { bold: true, size: 18 };
    titleCell.alignment = { horizontal: 'center' };

    // Date range
    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `من ${startDate.toLocaleDateString('ar-SA')} إلى ${endDate.toLocaleDateString('ar-SA')}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // Summary
    worksheet.addRow(['ملخص', '', '', '', '']);
    worksheet.addRow(['إجمالي الإيرادات', totalAmount, 'ر.س', '', '']);
    worksheet.addRow(['المدفوع', paidAmount, 'ر.س', '', '']);
    worksheet.addRow(['المعلق', pendingAmount, 'ر.س', '', '']);
    worksheet.addRow(['المتأخر', overdueAmount, 'ر.س', '', '']);

    worksheet.addRow([]);
    worksheet.addRow([]);

    // Details header
    const detailsHeaderRow = worksheet.addRow([
      'رقم الفاتورة',
      'العميل',
      'القضية',
      'المبلغ',
      'الحالة',
      'التاريخ',
    ]);
    detailsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };

    const invoiceStatuses: Record<string, string> = {
      DRAFT: 'مسودة',
      PENDING: 'مستحق',
      SENT: 'مرسل',
      PAID: 'مدفوع',
      OVERDUE: 'متأخر',
      CANCELLED: 'ملغي',
    };

    invoices.forEach(inv => {
      worksheet.addRow([
        inv.invoiceNumber,
        inv.client?.name || '-',
        inv.case?.title || '-',
        Number(inv.totalAmount),
        invoiceStatuses[inv.status] || inv.status,
        new Date(inv.createdAt).toLocaleDateString('ar-SA'),
      ]);
    });

    // Set column widths
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 25;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

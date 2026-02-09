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

  // ========== Documents Export ==========
  async exportDocuments(tenantId: string, filters?: any) {
    const whereClause: any = { tenantId };
    
    if (filters?.caseId) {
      whereClause.caseId = filters.caseId;
    }
    if (filters?.documentType) {
      whereClause.documentType = filters.documentType;
    }
    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }

    const documents = await this.prisma.document.findMany({
      where: whereClause,
      include: {
        case: { select: { caseNumber: true, title: true } },
        uploadedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Watheeq';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('المستندات', {
      views: [{ rightToLeft: true }],
    });

    worksheet.columns = [
      { header: 'عنوان المستند', key: 'title', width: 30 },
      { header: 'اسم الملف', key: 'fileName', width: 30 },
      { header: 'النوع', key: 'documentType', width: 15 },
      { header: 'الحجم (MB)', key: 'fileSize', width: 12 },
      { header: 'القضية', key: 'case', width: 25 },
      { header: 'رفع بواسطة', key: 'uploadedBy', width: 20 },
      { header: 'تاريخ الرفع', key: 'createdAt', width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6366F1' }, // Indigo
    };
    headerRow.alignment = { horizontal: 'center' };

    const documentTypes: Record<string, string> = {
      CONTRACT: 'عقد',
      POWER_OF_ATTORNEY: 'توكيل',
      COURT_DOCUMENT: 'مستند محكمة',
      EVIDENCE: 'دليل',
      CORRESPONDENCE: 'مراسلة',
      ID_DOCUMENT: 'وثيقة هوية',
      FINANCIAL: 'مستند مالي',
      OTHER: 'أخرى',
    };

    documents.forEach(doc => {
      worksheet.addRow({
        title: doc.title,
        fileName: doc.fileName,
        documentType: documentTypes[doc.documentType] || doc.documentType,
        fileSize: (doc.fileSize / (1024 * 1024)).toFixed(2),
        case: doc.case ? `${doc.case.caseNumber} - ${doc.case.title}` : '-',
        uploadedBy: doc.uploadedBy?.name || '-',
        createdAt: new Date(doc.createdAt).toLocaleDateString('ar-SA'),
      });
    });

    // Summary row
    worksheet.addRow([]);
    const totalSize = documents.reduce((sum, d) => sum + d.fileSize, 0);
    worksheet.addRow([
      `إجمالي المستندات: ${documents.length}`,
      '',
      '',
      `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
      '',
      '',
      '',
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  // ========== Tasks Export ==========
  async exportTasks(tenantId: string, filters?: any) {
    const whereClause: any = { tenantId };
    
    if (filters?.status) {
      whereClause.status = filters.status;
    }
    if (filters?.assignedToId) {
      whereClause.assignedToId = filters.assignedToId;
    }
    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      include: {
        case: { select: { caseNumber: true, title: true } },
        assignedTo: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Watheeq';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('المهام', {
      views: [{ rightToLeft: true }],
    });

    worksheet.columns = [
      { header: 'عنوان المهمة', key: 'title', width: 35 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'الأولوية', key: 'priority', width: 12 },
      { header: 'المسند إليه', key: 'assignedTo', width: 20 },
      { header: 'القضية', key: 'case', width: 25 },
      { header: 'تاريخ الاستحقاق', key: 'dueDate', width: 18 },
      { header: 'تاريخ الإنشاء', key: 'createdAt', width: 18 },
      { header: 'أنشئت بواسطة', key: 'createdBy', width: 18 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF22C55E' }, // Green
    };
    headerRow.alignment = { horizontal: 'center' };

    const taskStatuses: Record<string, string> = {
      TODO: 'للتنفيذ',
      IN_PROGRESS: 'قيد التنفيذ',
      REVIEW: 'قيد المراجعة',
      BLOCKED: 'معلقة',
      COMPLETED: 'مكتملة',
      CANCELLED: 'ملغية',
    };

    const taskPriorities: Record<string, string> = {
      LOW: 'منخفضة',
      MEDIUM: 'متوسطة',
      HIGH: 'عالية',
      URGENT: 'عاجلة',
    };

    tasks.forEach(task => {
      worksheet.addRow({
        title: task.title,
        status: taskStatuses[task.status] || task.status,
        priority: taskPriorities[task.priority] || task.priority,
        assignedTo: task.assignedTo?.name || '-',
        case: task.case ? `${task.case.caseNumber} - ${task.case.title}` : '-',
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString('ar-SA') : '-',
        createdAt: new Date(task.createdAt).toLocaleDateString('ar-SA'),
        createdBy: task.createdBy?.name || '-',
      });
    });

    // Summary section
    worksheet.addRow([]);
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length;
    
    worksheet.addRow([`إجمالي المهام: ${tasks.length}`, '', '', '', '', '', '', '']);
    worksheet.addRow([`المكتملة: ${completed}`, `قيد التنفيذ: ${inProgress}`, `المتأخرة: ${overdue}`, '', '', '', '', '']);

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  // ========== Generic Report Export ==========

  async exportReportData(
    data: { title: string; columns: { header: string; key: string }[]; data: any[]; generatedAt: Date },
    format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON',
    filename: string,
  ): Promise<{ filePath: string; fileSize: number }> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const exportsDir = path.join(process.cwd(), 'uploads', 'exports');
    
    // Ensure exports directory exists
    await fs.mkdir(exportsDir, { recursive: true }).catch(() => {});

    switch (format) {
      case 'EXCEL':
        return this.exportReportToExcel(data, filename, exportsDir);
      case 'CSV':
        return this.exportReportToCSV(data, filename, exportsDir);
      case 'JSON':
        return this.exportReportToJSON(data, filename, exportsDir);
      case 'PDF':
        return this.exportReportToHTML(data, filename, exportsDir); // HTML for now, can be converted to PDF
      default:
        throw new Error('Unsupported export format');
    }
  }

  private async exportReportToExcel(
    data: any,
    filename: string,
    exportsDir: string,
  ): Promise<{ filePath: string; fileSize: number }> {
    const path = await import('path');
    const fs = await import('fs/promises');
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Watheeq';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(data.title || 'التقرير', {
      views: [{ rightToLeft: true }],
    });

    // Title Row
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = data.title;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Date Row
    worksheet.addRow([`تاريخ التقرير: ${new Date(data.generatedAt).toLocaleDateString('ar-SA')}`]);
    worksheet.addRow([]);

    // Headers
    const headerRow = worksheet.addRow(data.columns.map((col: any) => col.header));
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.alignment = { horizontal: 'center' };

    // Data Rows
    data.data.forEach((item: any) => {
      const row = data.columns.map((col: any) => item[col.key] ?? '');
      worksheet.addRow(row);
    });

    // Auto-fit columns
    data.columns.forEach((_col: any, index: number) => {
      worksheet.getColumn(index + 1).width = 20;
    });

    const filePath = path.join(exportsDir, `${filename}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    const stats = await fs.stat(filePath);
    return { filePath, fileSize: stats.size };
  }

  private async exportReportToCSV(
    data: any,
    filename: string,
    exportsDir: string,
  ): Promise<{ filePath: string; fileSize: number }> {
    const path = await import('path');
    const fs = await import('fs/promises');

    const BOM = '\uFEFF';
    const headers = data.columns.map((col: any) => `"${col.header}"`).join(',');
    
    const rows = data.data.map((item: any) => {
      return data.columns.map((col: any) => {
        const value = item[col.key] ?? '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csv = BOM + [headers, ...rows].join('\n');
    const filePath = path.join(exportsDir, `${filename}.csv`);
    
    await fs.writeFile(filePath, csv, 'utf8');
    const stats = await fs.stat(filePath);
    
    return { filePath, fileSize: stats.size };
  }

  private async exportReportToJSON(
    data: any,
    filename: string,
    exportsDir: string,
  ): Promise<{ filePath: string; fileSize: number }> {
    const path = await import('path');
    const fs = await import('fs/promises');

    const jsonData = {
      title: data.title,
      generatedAt: data.generatedAt,
      columns: data.columns.map((col: any) => col.header),
      data: data.data,
      totalRecords: data.data.length,
    };

    const filePath = path.join(exportsDir, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    
    const stats = await fs.stat(filePath);
    return { filePath, fileSize: stats.size };
  }

  private async exportReportToHTML(
    data: any,
    filename: string,
    exportsDir: string,
  ): Promise<{ filePath: string; fileSize: number }> {
    const path = await import('path');
    const fs = await import('fs/promises');

    const headerCells = data.columns.map((col: any) => `<th>${col.header}</th>`).join('');
    const tableRows = data.data.map((item: any, index: number) => {
      const cells = data.columns.map((col: any) => `<td>${item[col.key] ?? ''}</td>`).join('');
      return `<tr class="${index % 2 === 0 ? 'even' : 'odd'}">${cells}</tr>`;
    }).join('\n');

    // Calculate summary stats if numeric columns exist
    const numericStats = data.columns
      .filter((col: any) => typeof data.data[0]?.[col.key] === 'number')
      .map((col: any) => {
        const values = data.data.map((item: any) => Number(item[col.key]) || 0);
        const sum = values.reduce((a: number, b: number) => a + b, 0);
        const avg = values.length > 0 ? sum / values.length : 0;
        return { header: col.header, sum, avg: Math.round(avg * 100) / 100 };
      });

    const summarySection = numericStats.length > 0 ? `
    <div class="summary">
      <h3>ملخص إحصائي</h3>
      <div class="summary-grid">
        ${numericStats.map((stat: any) => `
          <div class="stat-card">
            <div class="stat-label">${stat.header}</div>
            <div class="stat-value">${stat.sum.toLocaleString('ar-SA')}</div>
            <div class="stat-avg">المتوسط: ${stat.avg.toLocaleString('ar-SA')}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : '';

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body { 
      font-family: 'Cairo', 'Segoe UI', sans-serif; 
      direction: rtl; 
      padding: 20px; 
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
    }
    
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 16px; 
      padding: 40px; 
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); 
    }
    
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
      padding-bottom: 30px; 
      border-bottom: 3px solid #2563eb; 
    }
    
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 32px;
      font-weight: 700;
    }
    
    .header h1 { 
      color: #1e40af; 
      margin: 0 0 10px 0; 
      font-size: 28px;
      font-weight: 700;
    }
    
    .header .subtitle {
      color: #64748b;
      font-size: 16px;
      margin-bottom: 15px;
    }
    
    .header .date { 
      color: #94a3b8; 
      font-size: 14px;
      display: inline-block;
      padding: 8px 16px;
      background: #f1f5f9;
      border-radius: 8px;
    }
    
    .summary {
      margin-bottom: 30px;
      padding: 24px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    
    .summary h3 {
      color: #475569;
      font-size: 16px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }
    
    .stat-card {
      background: white;
      padding: 16px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #2563eb;
    }
    
    .stat-avg {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
    }
    
    .table-container {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse;
    }
    
    th { 
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white; 
      padding: 16px 20px; 
      text-align: right; 
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
    }
    
    td { 
      padding: 14px 20px; 
      border-bottom: 1px solid #f1f5f9; 
      text-align: right;
      font-size: 14px;
    }
    
    tr.even { background: #fafafa; }
    tr.odd { background: white; }
    tr:hover { background: #f0f9ff; }
    
    .footer { 
      margin-top: 40px; 
      padding-top: 30px; 
      border-top: 2px solid #e2e8f0; 
      text-align: center; 
      color: #94a3b8; 
      font-size: 12px;
    }
    
    .footer .brand {
      color: #2563eb;
      font-weight: 600;
    }
    
    .record-count {
      display: inline-block;
      padding: 8px 16px;
      background: #dbeafe;
      color: #1d4ed8;
      border-radius: 8px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    
    /* Print Styles */
    @media print { 
      body { 
        background: white; 
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .container { 
        box-shadow: none;
        padding: 20px;
        border-radius: 0;
      }
      .summary {
        break-inside: avoid;
      }
      table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      th {
        background: #2563eb !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none;
      }
    }
    
    @page {
      size: A4 landscape;
      margin: 1cm;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">و</div>
      <h1>${data.title}</h1>
      <p class="subtitle">نظام وثيق لإدارة مكاتب المحاماة</p>
      <div class="date">تاريخ التقرير: ${new Date(data.generatedAt).toLocaleDateString('ar-SA', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</div>
    </div>
    
    ${summarySection}
    
    <div class="table-container">
      <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    
    <div class="footer">
      <div class="record-count">إجمالي السجلات: ${data.data.length}</div>
      <p>تم إنشاء هذا التقرير بواسطة <span class="brand">نظام وثيق</span></p>
      <p style="margin-top: 5px;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
    </div>
  </div>
  
  <script class="no-print">
    // Auto-print option
    // window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

    const filePath = path.join(exportsDir, `${filename}.html`);
    await fs.writeFile(filePath, html, 'utf8');
    
    const stats = await fs.stat(filePath);
    return { filePath, fileSize: stats.size };
  }
}

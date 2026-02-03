import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { FilterInvoicesDto } from './dto/filter-invoices.dto';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

// Response interfaces
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface InvoiceStats {
    totalInvoices: number;
    pendingInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
}

@Injectable()
export class InvoicesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
        private readonly smsService: SmsService,
    ) { }

    /**
     * Get all invoices with pagination and filters
     */
    async findAll(tenantId: string, filterDto: FilterInvoicesDto): Promise<PaginatedResponse<unknown>> {
        const {
            page = 1,
            limit = 10,
            status,
            clientId,
            caseId,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filterDto;

        // Build where clause
        const where: Prisma.InvoiceWhereInput = { tenantId };

        // Status filter
        if (status) {
            where.status = status;
        }

        // Client filter
        if (clientId) {
            where.clientId = clientId;
        }

        // Case filter
        if (caseId) {
            where.caseId = caseId;
        }

        // Date range filter
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        // Calculate skip
        const skip = (page - 1) * limit;

        // Build orderBy
        const orderBy: Prisma.InvoiceOrderByWithRelationInput = {};
        const validSortFields = ['createdAt', 'dueDate', 'totalAmount', 'invoiceNumber'];
        if (validSortFields.includes(sortBy)) {
            orderBy[sortBy as keyof Prisma.InvoiceOrderByWithRelationInput] = sortOrder;
        } else {
            orderBy.createdAt = 'desc';
        }

        // Execute queries in parallel
        const [invoices, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                include: {
                    client: { select: { id: true, name: true, phone: true } },
                    case: { select: { id: true, caseNumber: true, title: true } },
                    items: true,
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.invoice.count({ where }),
        ]);

        return {
            data: invoices,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get invoice statistics
     */
    async getStats(tenantId: string) {
        // Get all invoices for stats calculation
        const invoices = await this.prisma.invoice.findMany({
            where: { tenantId },
            select: {
                status: true,
                totalAmount: true,
            },
        });

        const stats: InvoiceStats = {
            totalInvoices: invoices.length,
            pendingInvoices: 0,
            paidInvoices: 0,
            overdueInvoices: 0,
            totalAmount: 0,
            totalPaid: 0,
            totalPending: 0,
            totalOverdue: 0,
        };

        for (const invoice of invoices) {
            const amount = Number(invoice.totalAmount);
            stats.totalAmount += amount;

            switch (invoice.status) {
                case InvoiceStatus.DRAFT:
                case InvoiceStatus.SENT:
                    stats.pendingInvoices++;
                    stats.totalPending += amount;
                    break;
                case InvoiceStatus.PAID:
                    stats.paidInvoices++;
                    stats.totalPaid += amount;
                    break;
                case InvoiceStatus.OVERDUE:
                    stats.overdueInvoices++;
                    stats.totalOverdue += amount;
                    break;
                case InvoiceStatus.CANCELLED:
                    // Don't count cancelled
                    break;
            }
        }

        // Monthly stats for current year
        const currentYear = new Date().getFullYear();
        const monthlyStats = await this.prisma.$queryRaw<Array<{ month: number; total: number; count: number }>>`
      SELECT 
        EXTRACT(MONTH FROM "createdAt")::integer as month,
        SUM("totalAmount")::float as total,
        COUNT(*)::integer as count
      FROM "Invoice"
      WHERE "tenantId" = ${tenantId}
        AND EXTRACT(YEAR FROM "createdAt") = ${currentYear}
      GROUP BY EXTRACT(MONTH FROM "createdAt")
      ORDER BY month
    `;

        return {
            data: {
                ...stats,
                collectionRate: stats.totalInvoices > 0
                    ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100)
                    : 0,
                monthlyStats,
            },
        };
    }

    /**
     * Get invoice by ID
     */
    async findOne(id: string, tenantId: string) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, tenantId },
            include: {
                client: true,
                case: { select: { id: true, caseNumber: true, title: true } },
                createdBy: { select: { id: true, name: true } },
                items: true,
            },
        });

        if (!invoice) {
            throw new NotFoundException('الفاتورة غير موجودة');
        }

        return { data: invoice };
    }

    /**
     * Create new invoice with auto-generated number
     */
    async create(dto: CreateInvoiceDto, tenantId: string, userId: string) {
        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber(tenantId);

        // Verify client exists
        if (dto.clientId) {
            const client = await this.prisma.client.findFirst({
                where: { id: dto.clientId, tenantId },
            });
            if (!client) {
                throw new NotFoundException('العميل غير موجود');
            }
        }

        // Verify case exists
        if (dto.caseId) {
            const caseExists = await this.prisma.case.findFirst({
                where: { id: dto.caseId, tenantId },
            });
            if (!caseExists) {
                throw new NotFoundException('القضية غير موجودة');
            }
        }

        // Calculate amount from items if provided
        let amount = Number(dto.amount) || 0;
        if (dto.items && dto.items.length > 0) {
            amount = dto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        }

        // Calculate VAT (use custom taxRate or default 15% for Saudi Arabia)
        const taxRate = dto.taxRate ?? 15;
        const taxAmount = amount * (taxRate / 100);
        const totalAmount = amount + taxAmount;

        // Prepare data for creation (exclude items and taxRate)
        const { items, taxRate: _, ...invoiceData } = dto;

        const invoice = await this.prisma.invoice.create({
            data: {
                ...invoiceData,
                amount,
                invoiceNumber,
                taxAmount,
                totalAmount,
                dueDate: new Date(dto.dueDate),
                tenantId,
                createdById: userId,
                // Create invoice items if provided
                items: items && items.length > 0 ? {
                    create: items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    })),
                } : undefined,
            },
            include: {
                client: { select: { id: true, name: true } },
                case: { select: { id: true, caseNumber: true, title: true } },
                items: true,
            },
        });

        return {
            data: invoice,
            message: 'تم إنشاء الفاتورة بنجاح',
        };
    }

    /**
     * Update invoice
     */
    async update(id: string, dto: UpdateInvoiceDto, tenantId: string) {
        await this.findOne(id, tenantId);

        // Extract items, taxRate, and dueDate from dto
        const { items, taxRate, dueDate, ...restDto } = dto;
        const updateData: Prisma.InvoiceUpdateInput = { ...restDto };

        // Convert dueDate string to Date object
        if (dueDate) {
            updateData.dueDate = new Date(dueDate);
        }

        // Recalculate amounts if items provided
        if (items && items.length > 0) {
            const amount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            const calculatedTaxRate = taxRate ?? 15;
            const taxAmount = amount * (calculatedTaxRate / 100);
            updateData.amount = amount;
            updateData.taxAmount = taxAmount;
            updateData.totalAmount = amount + taxAmount;

            // Delete existing items and create new ones
            await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
            await this.prisma.invoiceItem.createMany({
                data: items.map(item => ({
                    invoiceId: id,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.quantity * item.unitPrice,
                })),
            });
        } else if (dto.amount) {
            // Recalculate VAT if only amount changed
            const amount = Number(dto.amount);
            const calculatedTaxRate = taxRate ?? 15;
            updateData.amount = amount;
            updateData.taxAmount = amount * (calculatedTaxRate / 100);
            updateData.totalAmount = amount + (amount * (calculatedTaxRate / 100));
        }

        // Set paidAt if status changed to PAID
        if (dto.status === InvoiceStatus.PAID) {
            updateData.paidAt = new Date();
        }

        const invoice = await this.prisma.invoice.update({
            where: { id },
            data: updateData,
            include: {
                client: { select: { id: true, name: true } },
                case: { select: { id: true, caseNumber: true, title: true } },
                items: true,
            },
        });

        return {
            data: invoice,
            message: 'تم تحديث الفاتورة بنجاح',
        };
    }

    /**
     * Delete invoice
     */
    async remove(id: string, tenantId: string) {
        const invoice = await this.findOne(id, tenantId);

        // Don't allow deletion of paid invoices
        if (invoice.data.status === InvoiceStatus.PAID) {
            throw new NotFoundException('لا يمكن حذف فاتورة مدفوعة');
        }

        await this.prisma.invoice.delete({ where: { id } });

        return { message: 'تم حذف الفاتورة بنجاح' };
    }

    /**
     * Generate unique invoice number (INV-YYYY-NNNN)
     */
    private async generateInvoiceNumber(tenantId: string): Promise<string> {
        const year = new Date().getFullYear();

        const count = await this.prisma.invoice.count({
            where: {
                tenantId,
                createdAt: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                },
            },
        });

        const number = (count + 1).toString().padStart(4, '0');
        return `INV-${year}-${number}`;
    }

    /**
     * Send invoice via email
     */
    async sendEmail(id: string, tenantId: string) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, tenantId },
            include: {
                client: { select: { name: true, email: true } },
                case: { select: { title: true, caseNumber: true } },
            },
        });

        if (!invoice) {
            throw new NotFoundException('الفاتورة غير موجودة');
        }

        if (!invoice.client?.email) {
            throw new BadRequestException('العميل لا يملك بريد إلكتروني');
        }

        // Get tenant info for the email
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true },
        });

        const result = await this.emailService.sendInvoice({
            to: invoice.client.email,
            clientName: invoice.client.name,
            invoiceNumber: invoice.invoiceNumber,
            amount: Number(invoice.totalAmount),
            dueDate: invoice.dueDate,
            firmName: tenant?.name || 'مكتب المحاماة',
            caseTitle: invoice.case?.title,
        });

        if (!result.success) {
            throw new InternalServerErrorException('فشل إرسال البريد الإلكتروني: ' + result.error);
        }

        return {
            message: 'تم إرسال الفاتورة بنجاح',
            data: { sentTo: invoice.client.email },
        };
    }

    /**
     * Send invoice SMS to client
     */
    async sendSms(id: string, tenantId: string) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, tenantId },
            include: {
                client: { select: { name: true, phone: true } },
            },
        });

        if (!invoice) {
            throw new NotFoundException('الفاتورة غير موجودة');
        }

        if (!invoice.client?.phone) {
            throw new BadRequestException('العميل لا يملك رقم هاتف');
        }

        // Get tenant info
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true },
        });

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('ar-SA', {
                style: 'currency',
                currency: 'SAR',
            }).format(amount);
        };

        const message = `السلام عليكم ${invoice.client.name}،
فاتورة رقم: ${invoice.invoiceNumber}
المبلغ: ${formatCurrency(Number(invoice.totalAmount))}
${invoice.dueDate ? `تاريخ الاستحقاق: ${invoice.dueDate.toLocaleDateString('ar-SA')}` : ''}
${tenant?.name || 'مكتب المحاماة'}`;

        const result = await this.smsService.sendSMS({
            to: invoice.client.phone,
            message,
            tenantId,
        });

        if (!result.success) {
            throw new InternalServerErrorException('فشل إرسال الرسالة النصية: ' + result.error);
        }

        return {
            message: 'تم إرسال الرسالة بنجاح',
            data: { sentTo: invoice.client.phone },
        };
    }
}

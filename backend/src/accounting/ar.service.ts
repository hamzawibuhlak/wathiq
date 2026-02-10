import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ARService {
    constructor(private prisma: PrismaService) { }

    async createFromInvoice(tenantId: string, invoiceId: string) {
        const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
        if (!invoice) throw new BadRequestException('الفاتورة غير موجودة');

        const existing = await this.prisma.accountsReceivable.findUnique({ where: { invoiceId } });
        if (existing) return existing;

        return this.prisma.accountsReceivable.create({
            data: {
                invoiceId, clientId: invoice.clientId, amount: invoice.totalAmount,
                balance: invoice.totalAmount, dueDate: invoice.dueDate, tenantId,
            },
        });
    }

    async recordPayment(tenantId: string, arId: string, dto: {
        amount: number; paymentDate: Date; paymentMethod: any; reference?: string; notes?: string;
    }) {
        const ar = await this.prisma.accountsReceivable.findFirst({ where: { id: arId, tenantId } });
        if (!ar) throw new BadRequestException('الذمة المدينة غير موجودة');

        const newPaid = Number(ar.paidAmount) + dto.amount;
        const newBalance = Number(ar.amount) - newPaid;
        if (newBalance < -0.01) throw new BadRequestException('المبلغ يتجاوز المستحق');

        const payNum = await this.generatePaymentNumber(tenantId);

        const [payment] = await this.prisma.$transaction([
            this.prisma.aRPayment.create({
                data: { arId, paymentNumber: payNum, amount: new Prisma.Decimal(dto.amount), paymentDate: dto.paymentDate, paymentMethod: dto.paymentMethod, reference: dto.reference, notes: dto.notes, tenantId },
            }),
            this.prisma.accountsReceivable.update({
                where: { id: arId },
                data: {
                    paidAmount: new Prisma.Decimal(newPaid),
                    balance: new Prisma.Decimal(Math.max(0, newBalance)),
                    status: newBalance <= 0.01 ? 'PAID' : 'PARTIAL',
                },
            }),
        ]);
        return payment;
    }

    async getAgingReport(tenantId: string) {
        const items = await this.prisma.accountsReceivable.findMany({
            where: { tenantId, status: { in: ['OUTSTANDING', 'PARTIAL', 'OVERDUE'] } },
            include: { client: { select: { id: true, name: true } }, invoice: { select: { invoiceNumber: true } } },
        });

        const now = new Date();
        const aging = { current: [] as any[], days30: [] as any[], days60: [] as any[], days90: [] as any[], over90: [] as any[] };

        items.forEach(item => {
            const days = Math.floor((now.getTime() - item.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const entry = { ...item, agingDays: Math.max(0, days) };
            if (days <= 0) aging.current.push(entry);
            else if (days <= 30) aging.days30.push(entry);
            else if (days <= 60) aging.days60.push(entry);
            else if (days <= 90) aging.days90.push(entry);
            else aging.over90.push(entry);
        });

        return {
            aging,
            summary: {
                current: aging.current.reduce((s, i) => s + Number(i.balance), 0),
                days30: aging.days30.reduce((s, i) => s + Number(i.balance), 0),
                days60: aging.days60.reduce((s, i) => s + Number(i.balance), 0),
                days90: aging.days90.reduce((s, i) => s + Number(i.balance), 0),
                over90: aging.over90.reduce((s, i) => s + Number(i.balance), 0),
            },
            totalOutstanding: items.reduce((s, i) => s + Number(i.balance), 0),
        };
    }

    async findAll(tenantId: string) {
        return this.prisma.accountsReceivable.findMany({
            where: { tenantId },
            include: { client: { select: { id: true, name: true } }, invoice: { select: { invoiceNumber: true } }, payments: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    private async generatePaymentNumber(tenantId: string) {
        const year = new Date().getFullYear();
        const count = await this.prisma.aRPayment.count({ where: { tenantId, paymentNumber: { startsWith: `PAY-${year}` } } });
        return `PAY-${year}-${String(count + 1).padStart(4, '0')}`;
    }
}

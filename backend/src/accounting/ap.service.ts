import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class APService {
    constructor(private prisma: PrismaService) { }

    // ---- Vendors ----
    async createVendor(tenantId: string, dto: { name: string; email?: string; phone?: string; address?: string; vatNumber?: string; notes?: string }) {
        const vendorNumber = await this.generateVendorNumber(tenantId);
        return this.prisma.vendor.create({ data: { vendorNumber, ...dto, tenantId } });
    }

    async getVendors(tenantId: string) {
        return this.prisma.vendor.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' } });
    }

    async updateVendor(tenantId: string, id: string, dto: Partial<{ name: string; email: string; phone: string; address: string; vatNumber: string; notes: string; isActive: boolean }>) {
        return this.prisma.vendor.update({ where: { id }, data: dto });
    }

    // ---- Bills (AP) ----
    async createBill(tenantId: string, dto: { vendorId: string; amount: number; billDate: Date; dueDate: Date; description: string; reference?: string }) {
        const billNumber = await this.generateBillNumber(tenantId);
        return this.prisma.accountsPayable.create({
            data: { billNumber, vendorId: dto.vendorId, amount: new Prisma.Decimal(dto.amount), balance: new Prisma.Decimal(dto.amount), billDate: dto.billDate, dueDate: dto.dueDate, description: dto.description, reference: dto.reference, tenantId },
        });
    }

    async recordPayment(tenantId: string, apId: string, dto: { amount: number; paymentDate: Date; paymentMethod: any; reference?: string; notes?: string }) {
        const ap = await this.prisma.accountsPayable.findFirst({ where: { id: apId, tenantId } });
        if (!ap) throw new BadRequestException('الفاتورة غير موجودة');

        const newPaid = Number(ap.paidAmount) + dto.amount;
        const newBal = Number(ap.amount) - newPaid;
        if (newBal < -0.01) throw new BadRequestException('المبلغ يتجاوز المستحق');

        const payNum = await this.generatePayBillNumber(tenantId);
        const [payment] = await this.prisma.$transaction([
            this.prisma.aPPayment.create({
                data: { apId, paymentNumber: payNum, amount: new Prisma.Decimal(dto.amount), paymentDate: dto.paymentDate, paymentMethod: dto.paymentMethod, reference: dto.reference, notes: dto.notes, tenantId },
            }),
            this.prisma.accountsPayable.update({
                where: { id: apId },
                data: { paidAmount: new Prisma.Decimal(newPaid), balance: new Prisma.Decimal(Math.max(0, newBal)), status: newBal <= 0.01 ? 'AP_PAID' : 'AP_PARTIAL' },
            }),
        ]);
        return payment;
    }

    async findAllBills(tenantId: string) {
        return this.prisma.accountsPayable.findMany({
            where: { tenantId }, include: { vendor: true, payments: true }, orderBy: { createdAt: 'desc' },
        });
    }

    async getAgingReport(tenantId: string) {
        const items = await this.prisma.accountsPayable.findMany({
            where: { tenantId, status: { in: ['AP_OUTSTANDING', 'AP_PARTIAL', 'AP_OVERDUE'] } },
            include: { vendor: { select: { id: true, name: true } } },
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
            totalOutstanding: items.reduce((s, i) => s + Number(i.balance), 0),
        };
    }

    private async generateVendorNumber(tenantId: string) {
        const count = await this.prisma.vendor.count({ where: { tenantId } });
        return `VEN-${String(count + 1).padStart(4, '0')}`;
    }
    private async generateBillNumber(tenantId: string) {
        const year = new Date().getFullYear();
        const count = await this.prisma.accountsPayable.count({ where: { tenantId, billNumber: { startsWith: `BILL-${year}` } } });
        return `BILL-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    private async generatePayBillNumber(tenantId: string) {
        const year = new Date().getFullYear();
        const count = await this.prisma.aPPayment.count({ where: { tenantId, paymentNumber: { startsWith: `PAYBILL-${year}` } } });
        return `PAYBILL-${year}-${String(count + 1).padStart(4, '0')}`;
    }
}

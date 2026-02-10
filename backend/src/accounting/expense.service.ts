import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpenseService {
    constructor(private prisma: PrismaService) { }

    async createCategory(tenantId: string, dto: { name: string; accountId: string; description?: string }) {
        return this.prisma.expenseCategory.create({ data: { ...dto, tenantId } });
    }

    async getCategories(tenantId: string) {
        return this.prisma.expenseCategory.findMany({ where: { tenantId }, include: { account: true } });
    }

    async submit(tenantId: string, userId: string, dto: {
        date: Date; amount: number; expenseCategoryId: string; description: string;
        reference?: string; paymentMethod: any; vendorId?: string; costCenterId?: string;
        attachments?: string[]; notes?: string;
    }) {
        const expenseNumber = await this.generateNumber(tenantId);
        return this.prisma.expense.create({
            data: {
                expenseNumber, date: dto.date, amount: new Prisma.Decimal(dto.amount),
                expenseCategoryId: dto.expenseCategoryId, description: dto.description,
                reference: dto.reference, paymentMethod: dto.paymentMethod,
                vendorId: dto.vendorId, costCenterId: dto.costCenterId,
                attachments: dto.attachments || [], notes: dto.notes,
                submittedBy: userId, tenantId,
            },
            include: { expenseCategory: true, vendor: true, costCenter: true },
        });
    }

    async approve(tenantId: string, expenseId: string, userId: string) {
        const expense = await this.prisma.expense.findFirst({ where: { id: expenseId, tenantId } });
        if (!expense) throw new BadRequestException('المصروف غير موجود');
        if (expense.status !== 'EXP_PENDING') throw new BadRequestException('لا يمكن الموافقة');

        return this.prisma.expense.update({
            where: { id: expenseId },
            data: { status: 'EXP_APPROVED', approvedBy: userId, approvedAt: new Date() },
        });
    }

    async reject(tenantId: string, expenseId: string, userId: string) {
        return this.prisma.expense.update({
            where: { id: expenseId },
            data: { status: 'EXP_REJECTED', approvedBy: userId, approvedAt: new Date() },
        });
    }

    async findAll(tenantId: string, filters?: { status?: string; startDate?: Date; endDate?: Date }) {
        const where: any = { tenantId };
        if (filters?.status) where.status = filters.status;
        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = filters.startDate;
            if (filters.endDate) where.date.lte = filters.endDate;
        }
        return this.prisma.expense.findMany({
            where, include: { expenseCategory: true, vendor: true, costCenter: true, submitter: { select: { id: true, name: true } } },
            orderBy: { date: 'desc' },
        });
    }

    async getByCategory(tenantId: string, startDate: Date, endDate: Date) {
        const expenses = await this.prisma.expense.findMany({
            where: { tenantId, status: { in: ['EXP_APPROVED', 'EXP_PAID'] }, date: { gte: startDate, lte: endDate } },
            include: { expenseCategory: true },
        });

        const byCategory: Record<string, { name: string; total: number; count: number }> = {};
        expenses.forEach(e => {
            const cat = e.expenseCategory.name;
            if (!byCategory[cat]) byCategory[cat] = { name: cat, total: 0, count: 0 };
            byCategory[cat].total += Number(e.amount);
            byCategory[cat].count++;
        });
        return Object.values(byCategory);
    }

    private async generateNumber(tenantId: string) {
        const year = new Date().getFullYear();
        const count = await this.prisma.expense.count({ where: { tenantId, expenseNumber: { startsWith: `EXP-${year}` } } });
        return `EXP-${year}-${String(count + 1).padStart(4, '0')}`;
    }
}

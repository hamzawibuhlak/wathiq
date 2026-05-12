import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BudgetService {
    constructor(private prisma: PrismaService) { }

    // ---- Cost Centers ----
    async createCostCenter(dto: { code: string; name: string; description?: string }) {
        return this.prisma.costCenter.create({ data: { ...dto } });
    }

    async getCostCenters() {
        return this.prisma.costCenter.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });
    }

    // ---- Budgets ----
    async createBudget(dto: {
        name: string; fiscalYear: number; accountId: string; costCenterId?: string;
        amount: number; period?: any; startDate: Date; endDate: Date;
    }) {
        return this.prisma.budget.create({
            data: {
                name: dto.name, fiscalYear: dto.fiscalYear, accountId: dto.accountId,
                costCenterId: dto.costCenterId, amount: new Prisma.Decimal(dto.amount),
                remaining: new Prisma.Decimal(dto.amount), period: dto.period || 'ANNUAL',
                startDate: dto.startDate, endDate: dto.endDate } });
    }

    async getBudgets(fiscalYear?: number) {
        const where: any = {};
        if (fiscalYear) where.fiscalYear = fiscalYear;
        return this.prisma.budget.findMany({
            where, include: { account: true, costCenter: true }, orderBy: { name: 'asc' } });
    }

    async getBudgetVsActual(fiscalYear: number) {
        const budgets = await this.prisma.budget.findMany({
            where: { fiscalYear },
            include: { account: true, costCenter: true } });

        return Promise.all(budgets.map(async b => {
            const lines = await this.prisma.journalEntryLine.findMany({
                where: {
                    accountId: b.accountId,
                    journalEntry: { isPosted: true, date: { gte: b.startDate, lte: b.endDate } },
                    ...(b.costCenterId ? { costCenterId: b.costCenterId } : {}) } });
            const actual = lines.reduce((s, l) => s + Number(l.debit) - Number(l.credit), 0);
            const variance = Number(b.amount) - actual;
            const utilization = Number(b.amount) > 0 ? (actual / Number(b.amount)) * 100 : 0;

            return {
                id: b.id, name: b.name, accountName: b.account.nameAr,
                costCenter: b.costCenter?.name, budgeted: Number(b.amount),
                actual, variance, utilization: +utilization.toFixed(1),
                status: utilization > 100 ? 'EXCEEDED' : utilization > 80 ? 'WARNING' : 'OK' };
        }));
    }

    // ---- Fiscal Year ----
    async createFiscalYear(year: number) {
        return this.prisma.fiscalYear.create({
            data: { year, startDate: new Date(year, 0, 1), endDate: new Date(year, 11, 31) } });
    }

    async getFiscalYears() {
        return this.prisma.fiscalYear.findMany({ where: {}, orderBy: { year: 'desc' } });
    }
}

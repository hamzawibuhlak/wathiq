import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BankService {
    constructor(private prisma: PrismaService) { }

    async createBankAccount(dto: {
        accountName: string; bankName: string; accountNumber: string; iban?: string;
        swiftCode?: string; currency?: string; balance: number; accountId: string;
    }) {
        return this.prisma.bankAccount.create({
            data: { ...dto, balance: new Prisma.Decimal(dto.balance), currency: dto.currency || 'SAR' } });
    }

    async getBankAccounts() {
        return this.prisma.bankAccount.findMany({
            where: { isActive: true }, include: { account: true }, orderBy: { bankName: 'asc' } });
    }

    async addTransaction(bankAccountId: string, dto: {
        date: Date; description: string; reference?: string; debit?: number; credit?: number; balance: number;
    }) {
        return this.prisma.bankTransaction.create({
            data: {
                bankAccountId, date: dto.date, description: dto.description, reference: dto.reference,
                debit: new Prisma.Decimal(dto.debit || 0), credit: new Prisma.Decimal(dto.credit || 0),
                balance: new Prisma.Decimal(dto.balance) } });
    }

    async getTransactions(bankAccountId: string, startDate?: Date, endDate?: Date) {
        const where: any = { bankAccountId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = startDate;
            if (endDate) where.date.lte = endDate;
        }
        return this.prisma.bankTransaction.findMany({ where, orderBy: { date: 'desc' } });
    }

    async reconcile(bankAccountId: string, dto: {
        statementDate: Date; statementBalance: number; userId: string; notes?: string;
    }) {
        // Get book balance (from journal entries)
        const bank = await this.prisma.bankAccount.findFirst({ where: { id: bankAccountId } });
        if (!bank) throw new BadRequestException('الحساب البنكي غير موجود');

        const bookBalance = Number(bank.balance);
        const diff = dto.statementBalance - bookBalance;

        return this.prisma.bankReconciliation.create({
            data: {
                bankAccountId, statementDate: dto.statementDate,
                statementBalance: new Prisma.Decimal(dto.statementBalance),
                bookBalance: new Prisma.Decimal(bookBalance),
                difference: new Prisma.Decimal(diff),
                status: Math.abs(diff) < 0.01 ? 'RECONCILED' : 'DISCREPANCY',
                reconciledBy: dto.userId, reconciledAt: new Date(),
                notes: dto.notes } });
    }

    async getReconciliations(bankAccountId: string) {
        return this.prisma.bankReconciliation.findMany({
            where: { bankAccountId }, orderBy: { statementDate: 'desc' } });
    }
}

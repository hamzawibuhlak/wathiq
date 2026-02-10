import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class JournalEntryService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create journal entry with double-entry validation
     */
    async create(tenantId: string, userId: string, dto: {
        date: Date; description: string; reference?: string;
        type: any; lines: Array<{ accountId: string; description?: string; debit?: number; credit?: number; costCenterId?: string }>;
        notes?: string;
    }) {
        const totalDebit = dto.lines.reduce((s, l) => s + (l.debit || 0), 0);
        const totalCredit = dto.lines.reduce((s, l) => s + (l.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new BadRequestException(`القيد غير متوازن: المدين ${totalDebit} لا يساوي الدائن ${totalCredit}`);
        }

        for (const [i, line] of dto.lines.entries()) {
            if ((line.debit || 0) > 0 && (line.credit || 0) > 0) {
                throw new BadRequestException(`السطر ${i + 1}: لا يمكن مدين ودائن معاً`);
            }
            if ((line.debit || 0) === 0 && (line.credit || 0) === 0) {
                throw new BadRequestException(`السطر ${i + 1}: يجب مدين أو دائن`);
            }
        }

        const entryNumber = await this.generateEntryNumber(tenantId);

        return this.prisma.journalEntry.create({
            data: {
                entryNumber, date: dto.date, description: dto.description,
                reference: dto.reference, type: dto.type, status: 'DRAFT',
                isPosted: false, createdBy: userId, notes: dto.notes, tenantId,
                lines: {
                    create: dto.lines.map(l => ({
                        accountId: l.accountId, description: l.description,
                        debit: new Prisma.Decimal(l.debit || 0),
                        credit: new Prisma.Decimal(l.credit || 0),
                        costCenterId: l.costCenterId,
                    })),
                },
            },
            include: { lines: { include: { account: true, costCenter: true } } },
        });
    }

    async findAll(tenantId: string, filters?: { status?: string; startDate?: Date; endDate?: Date; page?: number; limit?: number }) {
        const where: any = { tenantId };
        if (filters?.status) where.status = filters.status;
        if (filters?.startDate || filters?.endDate) {
            where.date = {};
            if (filters.startDate) where.date.gte = filters.startDate;
            if (filters.endDate) where.date.lte = filters.endDate;
        }
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;

        const [entries, total] = await Promise.all([
            this.prisma.journalEntry.findMany({
                where, include: { lines: { include: { account: true } }, creator: { select: { id: true, name: true } } },
                orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit,
            }),
            this.prisma.journalEntry.count({ where }),
        ]);
        return { entries, total, page, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: string, tenantId: string) {
        return this.prisma.journalEntry.findFirst({
            where: { id, tenantId },
            include: { lines: { include: { account: true, costCenter: true } }, creator: { select: { id: true, name: true } } },
        });
    }

    async approve(id: string, userId: string, tenantId: string) {
        const entry = await this.prisma.journalEntry.findFirst({ where: { id, tenantId } });
        if (!entry) throw new BadRequestException('القيد غير موجود');
        if (entry.status !== 'DRAFT' && entry.status !== 'PENDING_APPROVAL') throw new BadRequestException('لا يمكن الموافقة على هذا القيد');

        return this.prisma.journalEntry.update({
            where: { id }, data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
        });
    }

    async post(id: string, userId: string, tenantId: string) {
        const entry = await this.prisma.journalEntry.findFirst({ where: { id, tenantId } });
        if (!entry) throw new BadRequestException('القيد غير موجود');
        if (entry.isPosted) throw new BadRequestException('القيد مرحل بالفعل');

        return this.prisma.journalEntry.update({
            where: { id },
            data: { isPosted: true, postedAt: new Date(), postedBy: userId, status: 'POSTED' },
            include: { lines: { include: { account: true } } },
        });
    }

    async reverse(id: string, userId: string, tenantId: string, reason: string) {
        const original = await this.prisma.journalEntry.findFirst({
            where: { id, tenantId }, include: { lines: true },
        });
        if (!original) throw new BadRequestException('القيد غير موجود');
        if (!original.isPosted) throw new BadRequestException('لا يمكن عكس قيد غير مرحل');

        const reversalEntry = await this.create(tenantId, userId, {
            date: new Date(),
            description: `عكس قيد ${original.entryNumber}: ${reason}`,
            reference: original.entryNumber, type: original.type,
            lines: original.lines.map(l => ({
                accountId: l.accountId, description: `عكس: ${l.description || ''}`,
                debit: Number(l.credit), credit: Number(l.debit), costCenterId: l.costCenterId || undefined,
            })),
            notes: reason,
        });

        await this.prisma.journalEntry.update({ where: { id: reversalEntry.id }, data: { status: 'APPROVED' } });
        await this.post(reversalEntry.id, userId, tenantId);
        await this.prisma.journalEntry.update({ where: { id }, data: { status: 'REVERSED' } });
        return reversalEntry;
    }

    /**
     * General Ledger for an account
     */
    async getGeneralLedger(tenantId: string, accountId: string, startDate?: Date, endDate?: Date) {
        const where: any = { accountId, journalEntry: { tenantId, isPosted: true } };
        if (startDate || endDate) {
            where.journalEntry.date = {};
            if (startDate) where.journalEntry.date.gte = startDate;
            if (endDate) where.journalEntry.date.lte = endDate;
        }

        const lines = await this.prisma.journalEntryLine.findMany({
            where,
            include: { journalEntry: { select: { entryNumber: true, date: true, description: true, reference: true } }, account: true },
            orderBy: { journalEntry: { date: 'asc' } },
        });

        let balance = 0;
        const ledger = lines.map(l => {
            const debit = Number(l.debit);
            const credit = Number(l.credit);
            balance += ['ASSET', 'EXPENSE'].includes(l.account.accountType) ? debit - credit : credit - debit;
            return { date: l.journalEntry.date, entryNumber: l.journalEntry.entryNumber, description: l.description || l.journalEntry.description, reference: l.journalEntry.reference, debit, credit, balance };
        });

        const account = await this.prisma.account.findUnique({ where: { id: accountId } });
        return { account, ledger, closingBalance: balance };
    }

    /**
     * Trial Balance
     */
    async getTrialBalance(tenantId: string, date: Date) {
        const accounts = await this.prisma.account.findMany({ where: { tenantId, isActive: true }, orderBy: { accountNumber: 'asc' } });
        const balances = await Promise.all(
            accounts.map(async account => {
                const lines = await this.prisma.journalEntryLine.findMany({
                    where: { accountId: account.id, journalEntry: { isPosted: true, date: { lte: date } } },
                });
                const totalDebit = lines.reduce((s, l) => s + Number(l.debit), 0);
                const totalCredit = lines.reduce((s, l) => s + Number(l.credit), 0);
                let balance = ['ASSET', 'EXPENSE'].includes(account.accountType) ? totalDebit - totalCredit : totalCredit - totalDebit;
                return {
                    accountNumber: account.accountNumber, accountName: account.nameAr, accountType: account.accountType,
                    debit: balance > 0 && ['ASSET', 'EXPENSE'].includes(account.accountType) ? balance : (balance < 0 && ['LIABILITY', 'EQUITY', 'REVENUE'].includes(account.accountType) ? Math.abs(balance) : 0),
                    credit: balance > 0 && ['LIABILITY', 'EQUITY', 'REVENUE'].includes(account.accountType) ? balance : (balance < 0 && ['ASSET', 'EXPENSE'].includes(account.accountType) ? Math.abs(balance) : 0),
                };
            })
        );
        const totalDebit = balances.reduce((s, b) => s + b.debit, 0);
        const totalCredit = balances.reduce((s, b) => s + b.credit, 0);
        return { date, accounts: balances.filter(b => b.debit !== 0 || b.credit !== 0), totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 };
    }

    /**
     * Create automatic JE from invoice
     */
    async createFromInvoice(invoiceId: string, tenantId: string) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, include: { client: true } });
        if (!invoice || invoice.tenantId !== tenantId) throw new BadRequestException('الفاتورة غير موجودة');

        const [arAcc, revAcc, vatAcc] = await Promise.all([
            this.prisma.account.findUnique({ where: { tenantId_accountNumber: { tenantId, accountNumber: '1140' } } }),
            this.prisma.account.findUnique({ where: { tenantId_accountNumber: { tenantId, accountNumber: '4100' } } }),
            this.prisma.account.findUnique({ where: { tenantId_accountNumber: { tenantId, accountNumber: '2130' } } }),
        ]);
        if (!arAcc || !revAcc || !vatAcc) throw new BadRequestException('الحسابات الأساسية غير موجودة');

        const subtotal = Number(invoice.amount); const vat = Number(invoice.taxAmount); const total = Number(invoice.totalAmount);
        const lines: any[] = [{ accountId: arAcc.id, description: 'ذمم مدينة', debit: total, credit: 0 }];
        if (subtotal > 0) lines.push({ accountId: revAcc.id, description: 'إيرادات', debit: 0, credit: subtotal });
        if (vat > 0) lines.push({ accountId: vatAcc.id, description: 'ضريبة قيمة مضافة', debit: 0, credit: vat });

        const entry = await this.create(tenantId, 'system', {
            date: invoice.issueDate, description: `فاتورة ${invoice.invoiceNumber} - ${invoice.client.name}`,
            reference: invoice.invoiceNumber, type: 'INVOICE', lines,
        });
        await this.prisma.journalEntry.update({ where: { id: entry.id }, data: { status: 'APPROVED' } });
        await this.post(entry.id, 'system', tenantId);
        return entry;
    }

    private async generateEntryNumber(tenantId: string): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.prisma.journalEntry.count({
            where: { tenantId, entryNumber: { startsWith: `JE-${year}` } },
        });
        return `JE-${year}-${String(count + 1).padStart(4, '0')}`;
    }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class FinancialStatementsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Income Statement (قائمة الدخل)
     */
    async getIncomeStatement(tenantId: string, startDate: Date, endDate: Date) {
        const accounts = await this.prisma.account.findMany({
            where: { tenantId, accountType: { in: ['REVENUE', 'EXPENSE'] }, isActive: true },
            orderBy: { accountNumber: 'asc' },
        });

        const totals = await Promise.all(accounts.map(async a => {
            const lines = await this.prisma.journalEntryLine.findMany({
                where: { accountId: a.id, journalEntry: { isPosted: true, date: { gte: startDate, lte: endDate } } },
            });
            const debit = lines.reduce((s, l) => s + Number(l.debit), 0);
            const credit = lines.reduce((s, l) => s + Number(l.credit), 0);
            const amount = a.accountType === 'REVENUE' ? credit - debit : debit - credit;
            return { accountNumber: a.accountNumber, accountName: a.nameAr, accountType: a.accountType, category: a.category, amount };
        }));

        const revenues = totals.filter(t => t.accountType === 'REVENUE' && t.amount !== 0);
        const expenses = totals.filter(t => t.accountType === 'EXPENSE' && t.amount !== 0);
        const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
        const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
        const netIncome = totalRevenue - totalExpenses;

        return {
            period: { startDate, endDate }, revenues, totalRevenue, expenses, totalExpenses, netIncome,
            netIncomePercentage: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0,
        };
    }

    /**
     * Balance Sheet (الميزانية العمومية)
     */
    async getBalanceSheet(tenantId: string, date: Date) {
        const accounts = await this.prisma.account.findMany({
            where: { tenantId, accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY'] }, isActive: true },
            orderBy: { accountNumber: 'asc' },
        });

        const balances = await Promise.all(accounts.map(async a => {
            const lines = await this.prisma.journalEntryLine.findMany({
                where: { accountId: a.id, journalEntry: { isPosted: true, date: { lte: date } } },
            });
            const debit = lines.reduce((s, l) => s + Number(l.debit), 0);
            const credit = lines.reduce((s, l) => s + Number(l.credit), 0);
            const balance = a.accountType === 'ASSET' ? debit - credit : credit - debit;
            return { accountNumber: a.accountNumber, accountName: a.nameAr, accountType: a.accountType, category: a.category, balance };
        }));

        const assets = balances.filter(b => b.accountType === 'ASSET');
        const liabilities = balances.filter(b => b.accountType === 'LIABILITY');
        const equity = balances.filter(b => b.accountType === 'EQUITY');

        const currentAssets = assets.filter(a => a.category === 'CURRENT_ASSET');
        const fixedAssets = assets.filter(a => a.category === 'FIXED_ASSET');
        const currentLiabilities = liabilities.filter(l => l.category === 'CURRENT_LIABILITY');
        const longTermLiabilities = liabilities.filter(l => l.category === 'LONG_TERM_LIABILITY');

        const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
        const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);
        const totalEquity = equity.reduce((s, e) => s + e.balance, 0);

        return {
            asOfDate: date,
            assets: {
                currentAssets: currentAssets.filter(a => a.balance !== 0),
                totalCurrentAssets: currentAssets.reduce((s, a) => s + a.balance, 0),
                fixedAssets: fixedAssets.filter(a => a.balance !== 0),
                totalFixedAssets: fixedAssets.reduce((s, a) => s + a.balance, 0),
                totalAssets,
            },
            liabilities: {
                currentLiabilities: currentLiabilities.filter(l => l.balance !== 0),
                totalCurrentLiabilities: currentLiabilities.reduce((s, l) => s + l.balance, 0),
                longTermLiabilities: longTermLiabilities.filter(l => l.balance !== 0),
                totalLongTermLiabilities: longTermLiabilities.reduce((s, l) => s + l.balance, 0),
                totalLiabilities,
            },
            equity: { items: equity.filter(e => e.balance !== 0), totalEquity },
            totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
            isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        };
    }

    /**
     * Cash Flow Statement (قائمة التدفقات النقدية)
     */
    async getCashFlowStatement(tenantId: string, startDate: Date, endDate: Date) {
        const cashAccounts = await this.prisma.account.findMany({
            where: { tenantId, accountNumber: { in: ['1110', '1120', '1130'] } },
        });
        const cashIds = cashAccounts.map(a => a.id);

        const cashLines = await this.prisma.journalEntryLine.findMany({
            where: {
                accountId: { in: cashIds },
                journalEntry: { isPosted: true, date: { gte: startDate, lte: endDate } },
            },
            include: { journalEntry: { include: { lines: { include: { account: true } } } } },
        });

        const operating: any[] = []; const investing: any[] = []; const financing: any[] = [];

        cashLines.forEach(line => {
            const other = line.journalEntry.lines.find(l => l.id !== line.id);
            if (!other) return;
            const flow = { date: line.journalEntry.date, description: line.journalEntry.description, amount: Number(line.debit) - Number(line.credit) };
            const num = other.account.accountNumber;
            if (num.startsWith('4') || num.startsWith('5') || num.startsWith('1') && num < '1200') operating.push(flow);
            else if (num >= '1200' && num < '2000') investing.push(flow);
            else if (num >= '2200' || num.startsWith('3')) financing.push(flow);
            else operating.push(flow);
        });

        const netOp = operating.reduce((s, a) => s + a.amount, 0);
        const netInv = investing.reduce((s, a) => s + a.amount, 0);
        const netFin = financing.reduce((s, a) => s + a.amount, 0);

        const openingBalance = await this.getCashBalance(tenantId, startDate);

        return {
            period: { startDate, endDate },
            operatingActivities: operating, netOperatingCash: netOp,
            investingActivities: investing, netInvestingCash: netInv,
            financingActivities: financing, netFinancingCash: netFin,
            netCashChange: netOp + netInv + netFin,
            openingCashBalance: openingBalance,
            closingCashBalance: openingBalance + netOp + netInv + netFin,
        };
    }

    /**
     * Financial Ratios (النسب المالية)
     */
    async getFinancialRatios(tenantId: string, date: Date) {
        const bs = await this.getBalanceSheet(tenantId, date);
        const is = await this.getIncomeStatement(tenantId, new Date(date.getFullYear(), 0, 1), date);

        const ca = bs.assets.totalCurrentAssets;
        const cl = bs.liabilities.totalCurrentLiabilities;
        const ta = bs.assets.totalAssets;
        const tl = bs.liabilities.totalLiabilities;
        const te = bs.equity.totalEquity;
        const rev = is.totalRevenue;
        const ni = is.netIncome;

        return {
            currentRatio: cl > 0 ? +(ca / cl).toFixed(2) : 0,
            profitMargin: rev > 0 ? +((ni / rev) * 100).toFixed(2) : 0,
            returnOnAssets: ta > 0 ? +((ni / ta) * 100).toFixed(2) : 0,
            returnOnEquity: te > 0 ? +((ni / te) * 100).toFixed(2) : 0,
            debtToEquity: te > 0 ? +(tl / te).toFixed(2) : 0,
            debtToAssets: ta > 0 ? +((tl / ta) * 100).toFixed(2) : 0,
            equityRatio: ta > 0 ? +((te / ta) * 100).toFixed(2) : 0,
        };
    }

    /**
     * VAT Report (تقرير الضريبة)
     */
    async getVATReport(tenantId: string, startDate: Date, endDate: Date) {
        const [inputAcc, outputAcc] = await Promise.all([
            this.prisma.account.findUnique({ where: { tenantId_accountNumber: { tenantId, accountNumber: '1160' } } }),
            this.prisma.account.findUnique({ where: { tenantId_accountNumber: { tenantId, accountNumber: '2130' } } }),
        ]);

        let vatInput = 0, vatOutput = 0;

        if (inputAcc) {
            const lines = await this.prisma.journalEntryLine.findMany({
                where: { accountId: inputAcc.id, journalEntry: { isPosted: true, date: { gte: startDate, lte: endDate } } },
            });
            vatInput = lines.reduce((s, l) => s + Number(l.debit) - Number(l.credit), 0);
        }

        if (outputAcc) {
            const lines = await this.prisma.journalEntryLine.findMany({
                where: { accountId: outputAcc.id, journalEntry: { isPosted: true, date: { gte: startDate, lte: endDate } } },
            });
            vatOutput = lines.reduce((s, l) => s + Number(l.credit) - Number(l.debit), 0);
        }

        return {
            period: { startDate, endDate },
            vatRate: 15,
            vatInput, vatOutput,
            netVAT: vatOutput - vatInput,
            vatPayable: Math.max(0, vatOutput - vatInput),
            vatRefundable: Math.max(0, vatInput - vatOutput),
        };
    }

    private async getCashBalance(tenantId: string, date: Date): Promise<number> {
        const cashAccounts = await this.prisma.account.findMany({
            where: { tenantId, accountNumber: { in: ['1110', '1120', '1130'] } },
        });
        const balances = await Promise.all(cashAccounts.map(async a => {
            const lines = await this.prisma.journalEntryLine.findMany({
                where: { accountId: a.id, journalEntry: { isPosted: true, date: { lt: date } } },
            });
            return lines.reduce((s, l) => s + Number(l.debit) - Number(l.credit), 0);
        }));
        return balances.reduce((s, b) => s + b, 0);
    }
}

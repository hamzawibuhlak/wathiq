import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AccountService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create account
     */
    async create(tenantId: string, dto: {
        accountNumber: string;
        nameEn: string;
        nameAr: string;
        accountType: any;
        category: any;
        parentAccountId?: string;
        level?: number;
        description?: string;
    }) {
        const exists = await this.prisma.account.findUnique({
            where: { tenantId_accountNumber: { tenantId, accountNumber: dto.accountNumber } },
        });
        if (exists) throw new BadRequestException(`الحساب ${dto.accountNumber} موجود مسبقاً`);

        return this.prisma.account.create({
            data: { ...dto, tenantId },
        });
    }

    /**
     * Get all accounts for tenant (with hierarchy)
     */
    async findAll(tenantId: string, filters?: { type?: string; isActive?: boolean }) {
        const where: any = { tenantId };
        if (filters?.type) where.accountType = filters.type;
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;

        return this.prisma.account.findMany({
            where,
            include: { childAccounts: true, parentAccount: true },
            orderBy: { accountNumber: 'asc' },
        });
    }

    /**
     * Get account by number
     */
    async findByNumber(tenantId: string, accountNumber: string) {
        const account = await this.prisma.account.findUnique({
            where: { tenantId_accountNumber: { tenantId, accountNumber } },
            include: { childAccounts: true },
        });
        if (!account) throw new NotFoundException(`الحساب ${accountNumber} غير موجود`);
        return account;
    }

    /**
     * Update account
     */
    async update(tenantId: string, accountId: string, dto: Partial<{
        nameEn: string; nameAr: string; description: string; isActive: boolean;
    }>) {
        return this.prisma.account.update({
            where: { id: accountId },
            data: dto,
        });
    }

    /**
     * Get account hierarchy (tree structure)
     */
    async getHierarchy(tenantId: string) {
        const accounts = await this.prisma.account.findMany({
            where: { tenantId, parentAccountId: null },
            include: {
                childAccounts: {
                    include: {
                        childAccounts: true,
                    },
                },
            },
            orderBy: { accountNumber: 'asc' },
        });
        return accounts;
    }

    /**
     * Seed default Saudi Chart of Accounts
     */
    async seedDefaultAccounts(tenantId: string) {
        const existing = await this.prisma.account.count({ where: { tenantId } });
        if (existing > 0) return { message: 'الحسابات موجودة مسبقاً', count: existing };

        const defaultAccounts = [
            // ASSETS - أصول متداولة
            { accountNumber: '1100', nameEn: 'Current Assets', nameAr: 'أصول متداولة', accountType: 'ASSET' as const, category: 'CURRENT_ASSET' as const, level: 1 },
            { accountNumber: '1110', nameEn: 'Cash', nameAr: 'النقدية', accountType: 'ASSET' as const, category: 'CURRENT_ASSET' as const, level: 2 },
            { accountNumber: '1120', nameEn: 'Petty Cash', nameAr: 'نقدية صغيرة', accountType: 'ASSET' as const, category: 'CURRENT_ASSET' as const, level: 2 },
            { accountNumber: '1130', nameEn: 'Bank Accounts', nameAr: 'الحسابات البنكية', accountType: 'ASSET' as const, category: 'CURRENT_ASSET' as const, level: 2 },
            { accountNumber: '1140', nameEn: 'Accounts Receivable', nameAr: 'ذمم مدينة', accountType: 'ASSET' as const, category: 'CURRENT_ASSET' as const, level: 2 },
            { accountNumber: '1150', nameEn: 'Prepaid Expenses', nameAr: 'مصروفات مدفوعة مقدماً', accountType: 'ASSET' as const, category: 'CURRENT_ASSET' as const, level: 2 },
            { accountNumber: '1160', nameEn: 'VAT Input', nameAr: 'ضريبة القيمة المضافة - مدخلات', accountType: 'ASSET' as const, category: 'CURRENT_ASSET' as const, level: 2 },
            // ASSETS - أصول ثابتة
            { accountNumber: '1200', nameEn: 'Fixed Assets', nameAr: 'أصول ثابتة', accountType: 'ASSET' as const, category: 'FIXED_ASSET' as const, level: 1 },
            { accountNumber: '1210', nameEn: 'Land', nameAr: 'أراضي', accountType: 'ASSET' as const, category: 'FIXED_ASSET' as const, level: 2 },
            { accountNumber: '1220', nameEn: 'Buildings', nameAr: 'مباني', accountType: 'ASSET' as const, category: 'FIXED_ASSET' as const, level: 2 },
            { accountNumber: '1230', nameEn: 'Furniture & Fixtures', nameAr: 'أثاث وتجهيزات', accountType: 'ASSET' as const, category: 'FIXED_ASSET' as const, level: 2 },
            { accountNumber: '1240', nameEn: 'Equipment', nameAr: 'معدات', accountType: 'ASSET' as const, category: 'FIXED_ASSET' as const, level: 2 },
            { accountNumber: '1250', nameEn: 'Vehicles', nameAr: 'مركبات', accountType: 'ASSET' as const, category: 'FIXED_ASSET' as const, level: 2 },
            { accountNumber: '1260', nameEn: 'Accumulated Depreciation', nameAr: 'مجمع الإهلاك', accountType: 'ASSET' as const, category: 'FIXED_ASSET' as const, level: 2 },
            // LIABILITIES - خصوم متداولة
            { accountNumber: '2100', nameEn: 'Current Liabilities', nameAr: 'خصوم متداولة', accountType: 'LIABILITY' as const, category: 'CURRENT_LIABILITY' as const, level: 1 },
            { accountNumber: '2110', nameEn: 'Accounts Payable', nameAr: 'ذمم دائنة', accountType: 'LIABILITY' as const, category: 'CURRENT_LIABILITY' as const, level: 2 },
            { accountNumber: '2120', nameEn: 'Accrued Expenses', nameAr: 'مصروفات مستحقة', accountType: 'LIABILITY' as const, category: 'CURRENT_LIABILITY' as const, level: 2 },
            { accountNumber: '2130', nameEn: 'VAT Output', nameAr: 'ضريبة القيمة المضافة - مخرجات', accountType: 'LIABILITY' as const, category: 'CURRENT_LIABILITY' as const, level: 2 },
            { accountNumber: '2140', nameEn: 'GOSI Payable', nameAr: 'تأمينات اجتماعية مستحقة', accountType: 'LIABILITY' as const, category: 'CURRENT_LIABILITY' as const, level: 2 },
            { accountNumber: '2150', nameEn: 'Salaries Payable', nameAr: 'رواتب مستحقة', accountType: 'LIABILITY' as const, category: 'CURRENT_LIABILITY' as const, level: 2 },
            // LIABILITIES - خصوم طويلة الأجل
            { accountNumber: '2200', nameEn: 'Long-term Liabilities', nameAr: 'خصوم طويلة الأجل', accountType: 'LIABILITY' as const, category: 'LONG_TERM_LIABILITY' as const, level: 1 },
            { accountNumber: '2210', nameEn: 'Bank Loans', nameAr: 'قروض بنكية', accountType: 'LIABILITY' as const, category: 'LONG_TERM_LIABILITY' as const, level: 2 },
            { accountNumber: '2220', nameEn: 'Notes Payable', nameAr: 'أوراق دفع', accountType: 'LIABILITY' as const, category: 'LONG_TERM_LIABILITY' as const, level: 2 },
            // EQUITY
            { accountNumber: '3100', nameEn: "Owner's Capital", nameAr: 'رأس مال المالك', accountType: 'EQUITY' as const, category: 'CAPITAL' as const, level: 1 },
            { accountNumber: '3200', nameEn: 'Retained Earnings', nameAr: 'أرباح محتجزة', accountType: 'EQUITY' as const, category: 'RETAINED_EARNINGS' as const, level: 1 },
            { accountNumber: '3300', nameEn: 'Current Year P/L', nameAr: 'ربح/خسارة السنة الحالية', accountType: 'EQUITY' as const, category: 'RETAINED_EARNINGS' as const, level: 1 },
            { accountNumber: '3400', nameEn: 'Drawings', nameAr: 'مسحوبات', accountType: 'EQUITY' as const, category: 'DRAWINGS' as const, level: 1 },
            // REVENUE
            { accountNumber: '4100', nameEn: 'Legal Fees Revenue', nameAr: 'إيرادات الأتعاب القانونية', accountType: 'REVENUE' as const, category: 'OPERATING_REVENUE' as const, level: 1 },
            { accountNumber: '4200', nameEn: 'Consultation Fees', nameAr: 'إيرادات الاستشارات', accountType: 'REVENUE' as const, category: 'OPERATING_REVENUE' as const, level: 1 },
            { accountNumber: '4300', nameEn: 'Document Preparation Fees', nameAr: 'إيرادات إعداد المستندات', accountType: 'REVENUE' as const, category: 'OPERATING_REVENUE' as const, level: 1 },
            { accountNumber: '4400', nameEn: 'Court Representation Fees', nameAr: 'إيرادات التمثيل القانوني', accountType: 'REVENUE' as const, category: 'OPERATING_REVENUE' as const, level: 1 },
            { accountNumber: '4900', nameEn: 'Other Revenue', nameAr: 'إيرادات أخرى', accountType: 'REVENUE' as const, category: 'NON_OPERATING_REVENUE' as const, level: 1 },
            // EXPENSES
            { accountNumber: '5100', nameEn: 'Salaries & Wages', nameAr: 'رواتب وأجور', accountType: 'EXPENSE' as const, category: 'OPERATING_EXPENSE' as const, level: 1 },
            { accountNumber: '5200', nameEn: 'Rent', nameAr: 'إيجار', accountType: 'EXPENSE' as const, category: 'OPERATING_EXPENSE' as const, level: 1 },
            { accountNumber: '5300', nameEn: 'Utilities', nameAr: 'مرافق', accountType: 'EXPENSE' as const, category: 'OPERATING_EXPENSE' as const, level: 1 },
            { accountNumber: '5400', nameEn: 'Office Supplies', nameAr: 'مستلزمات مكتبية', accountType: 'EXPENSE' as const, category: 'OPERATING_EXPENSE' as const, level: 1 },
            { accountNumber: '5500', nameEn: 'Marketing & Advertising', nameAr: 'تسويق وإعلان', accountType: 'EXPENSE' as const, category: 'OPERATING_EXPENSE' as const, level: 1 },
            { accountNumber: '5600', nameEn: 'Professional Fees', nameAr: 'أتعاب مهنية', accountType: 'EXPENSE' as const, category: 'OPERATING_EXPENSE' as const, level: 1 },
            { accountNumber: '5700', nameEn: 'Insurance', nameAr: 'تأمين', accountType: 'EXPENSE' as const, category: 'OPERATING_EXPENSE' as const, level: 1 },
            { accountNumber: '5800', nameEn: 'Depreciation', nameAr: 'إهلاك', accountType: 'EXPENSE' as const, category: 'OPERATING_EXPENSE' as const, level: 1 },
            { accountNumber: '5900', nameEn: 'Other Expenses', nameAr: 'مصروفات أخرى', accountType: 'EXPENSE' as const, category: 'NON_OPERATING_EXPENSE' as const, level: 1 },
        ];

        // Set parent relationships
        const parentMap: Record<string, string> = {};
        const createdAccounts: any[] = [];

        // First pass: create parent accounts (level 1)
        for (const acc of defaultAccounts.filter(a => a.level === 1)) {
            const created = await this.prisma.account.create({
                data: { ...acc, tenantId },
            });
            parentMap[acc.accountNumber] = created.id;
            createdAccounts.push(created);
        }

        // Second pass: create child accounts (level 2)
        for (const acc of defaultAccounts.filter(a => a.level === 2)) {
            // Find parent by checking first 2 digits + '00'
            const parentPrefix = acc.accountNumber.substring(0, 2) + '00';
            const parentId = parentMap[parentPrefix];

            const created = await this.prisma.account.create({
                data: { ...acc, tenantId, parentAccountId: parentId || undefined },
            });
            createdAccounts.push(created);
        }

        return { message: `تم إنشاء ${createdAccounts.length} حساب`, count: createdAccounts.length };
    }

    /**
     * Get account balance
     */
    async getBalance(tenantId: string, accountId: string, endDate?: Date) {
        const where: any = {
            accountId,
            journalEntry: { tenantId, isPosted: true },
        };
        if (endDate) {
            where.journalEntry.date = { lte: endDate };
        }

        const lines = await this.prisma.journalEntryLine.findMany({ where });
        const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
        const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);

        const account = await this.prisma.account.findUnique({ where: { id: accountId } });
        if (!account) throw new NotFoundException('الحساب غير موجود');

        const balance = ['ASSET', 'EXPENSE'].includes(account.accountType)
            ? totalDebit - totalCredit
            : totalCredit - totalDebit;

        return { accountId, balance, totalDebit, totalCredit };
    }
}

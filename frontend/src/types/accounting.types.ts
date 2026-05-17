// ═══════════════════════════════════════════════════════════════════
// Accounting Module — Shared Types
// ═══════════════════════════════════════════════════════════════════

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type JournalEntryStatus =
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'POSTED'
    | 'REVERSED';

export type JournalEntryType =
    | 'MANUAL'
    | 'INVOICE'
    | 'PAYMENT'
    | 'RECEIPT'
    | 'ADJUSTMENT'
    | 'OPENING_BALANCE'
    | 'CLOSING'
    | 'DEPRECIATION';

export type ExpenseStatus = 'EXP_PENDING' | 'EXP_APPROVED' | 'EXP_REJECTED' | 'EXP_PAID';

export type PaymentMethod =
    | 'CASH'
    | 'BANK_TRANSFER'
    | 'CHECK'
    | 'CREDIT_CARD'
    | 'DEBIT_CARD';

// ─── Account (Chart of Accounts) ───
export interface Account {
    id: string;
    accountNumber: string;
    nameEn: string;
    nameAr: string;
    accountType: AccountType;
    category: string;
    isActive: boolean;
    level: number;
    parentId?: string | null;
    childAccounts?: Account[];
}

// ─── Journal Entry ───
export interface JournalEntryLine {
    id?: string;
    accountId: string;
    account?: Account;
    description?: string;
    debit: number;
    credit: number;
}

export interface JournalEntry {
    id: string;
    entryNumber: string;
    date: string;
    description: string;
    type: JournalEntryType;
    status: JournalEntryStatus;
    lines: JournalEntryLine[];
    totalDebit: number;
    totalCredit: number;
    createdById?: string;
    approvedById?: string | null;
    postedById?: string | null;
    createdAt: string;
}

export interface JournalEntriesResponse {
    entries: JournalEntry[];
    total: number;
    page: number;
    totalPages: number;
}

export interface CreateJournalEntryDto {
    date: string;
    description: string;
    type: JournalEntryType;
    lines: Array<{ accountId: string; description?: string; debit: number; credit: number }>;
}

// ─── Expense ───
export interface ExpenseCategory {
    id: string;
    name: string;
    accountId?: string;
}

export interface Expense {
    id: string;
    expenseNumber: string;
    date: string;
    amount: number;
    description: string;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes?: string;
    status: ExpenseStatus;
    expenseCategoryId: string;
    expenseCategory?: ExpenseCategory;
    createdAt: string;
}

export interface CreateExpenseDto {
    date: string;
    amount: number;
    expenseCategoryId: string;
    description: string;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes?: string;
}

// ─── Financial Statements ───
export interface IncomeStatement {
    startDate: string;
    endDate: string;
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    netIncome: number;
    revenue?: Array<{ accountName: string; amount: number }>;
    expenses?: Array<{ accountName: string; amount: number }>;
}

export interface BalanceSheet {
    date: string;
    assets: { totalAssets: number; currentAssets?: number; fixedAssets?: number; items?: any[] };
    liabilities: { totalLiabilities: number; currentLiabilities?: number; longTermLiabilities?: number; items?: any[] };
    equity: { totalEquity: number; items?: any[] };
}

export interface FinancialRatios {
    date: string;
    currentRatio: number;
    quickRatio: number;
    profitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
    debtToEquity: number;
}

export interface VATReport {
    startDate: string;
    endDate: string;
    vatOutput: number;
    vatInput: number;
    netVAT: number;
}

// ─── Aging Reports ───
export interface AgingSummary {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
}

export interface AgingReport {
    summary: AgingSummary;
    totalOutstanding: number;
    items?: any[];
}

// ─── Display Maps ───
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    ASSET: 'أصول',
    LIABILITY: 'خصوم',
    EQUITY: 'حقوق ملكية',
    REVENUE: 'إيرادات',
    EXPENSE: 'مصروفات',
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
    ASSET: 'bg-blue-100 text-blue-700',
    LIABILITY: 'bg-red-100 text-red-700',
    EQUITY: 'bg-purple-100 text-purple-700',
    REVENUE: 'bg-green-100 text-green-700',
    EXPENSE: 'bg-orange-100 text-orange-700',
};

export const JOURNAL_STATUS_LABELS: Record<JournalEntryStatus, string> = {
    DRAFT: 'مسودة',
    PENDING_APPROVAL: 'بانتظار الموافقة',
    APPROVED: 'موافق عليه',
    POSTED: 'مرحل',
    REVERSED: 'ملغي',
};

export const JOURNAL_STATUS_COLORS: Record<JournalEntryStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    POSTED: 'bg-green-100 text-green-700',
    REVERSED: 'bg-red-100 text-red-700',
};

export const JOURNAL_TYPE_LABELS: Record<JournalEntryType, string> = {
    MANUAL: 'يدوي',
    INVOICE: 'فاتورة',
    PAYMENT: 'دفعة',
    RECEIPT: 'إيصال',
    ADJUSTMENT: 'تعديل',
    OPENING_BALANCE: 'رصيد افتتاحي',
    CLOSING: 'إقفال',
    DEPRECIATION: 'إهلاك',
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, { label: string; color: string }> = {
    EXP_PENDING: { label: 'بانتظار الموافقة', color: 'bg-yellow-100 text-yellow-700' },
    EXP_APPROVED: { label: 'موافق عليه', color: 'bg-green-100 text-green-700' },
    EXP_REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-700' },
    EXP_PAID: { label: 'مدفوع', color: 'bg-blue-100 text-blue-700' },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: 'نقداً',
    BANK_TRANSFER: 'تحويل بنكي',
    CHECK: 'شيك',
    CREDIT_CARD: 'بطاقة ائتمان',
    DEBIT_CARD: 'بطاقة سحب',
};

import { apiGet, apiPost, apiPatch } from './client';
import type {
    Account,
    JournalEntry,
    JournalEntriesResponse,
    CreateJournalEntryDto,
    Expense,
    ExpenseCategory,
    CreateExpenseDto,
    IncomeStatement,
    BalanceSheet,
    FinancialRatios,
    VATReport,
    AgingReport,
    JournalEntryStatus,
    ExpenseStatus,
    AccountType,
} from '@/types/accounting.types';

const BASE = '/accounting';

// ═══════════════════════════════════════════════════════════════════
// Accounts (Chart of Accounts)
// ═══════════════════════════════════════════════════════════════════
export const accountingApi = {
    // ─── Accounts ───
    getAccounts: (type?: AccountType) =>
        apiGet<Account[]>(`${BASE}/accounts`, type ? { type } : undefined),

    getAccountsHierarchy: () =>
        apiGet<Account[]>(`${BASE}/accounts/hierarchy`),

    getAccountBalance: (id: string) =>
        apiGet<{ balance: number; debits: number; credits: number }>(`${BASE}/accounts/${id}/balance`),

    createAccount: (data: Partial<Account>) =>
        apiPost<Account>(`${BASE}/accounts`, data),

    updateAccount: (id: string, data: Partial<Account>) =>
        apiPatch<Account>(`${BASE}/accounts/${id}`, data),

    seedAccounts: () =>
        apiPost<{ message: string; count: number }>(`${BASE}/accounts/seed`, {}),

    // ─── Journal Entries ───
    getJournalEntries: (params?: { page?: number; status?: JournalEntryStatus; limit?: number }) =>
        apiGet<JournalEntriesResponse>(`${BASE}/journal-entries`, params),

    getJournalEntry: (id: string) =>
        apiGet<JournalEntry>(`${BASE}/journal-entries/${id}`),

    createJournalEntry: (data: CreateJournalEntryDto) =>
        apiPost<JournalEntry>(`${BASE}/journal-entries`, data),

    approveJournalEntry: (id: string) =>
        apiPost<JournalEntry>(`${BASE}/journal-entries/${id}/approve`, {}),

    postJournalEntry: (id: string) =>
        apiPost<JournalEntry>(`${BASE}/journal-entries/${id}/post`, {}),

    reverseJournalEntry: (id: string) =>
        apiPost<JournalEntry>(`${BASE}/journal-entries/${id}/reverse`, {}),

    // ─── Financial Statements ───
    getIncomeStatement: (startDate: string, endDate: string) =>
        apiGet<IncomeStatement>(`${BASE}/statements/income`, { startDate, endDate }),

    getBalanceSheet: (date: string) =>
        apiGet<BalanceSheet>(`${BASE}/statements/balance-sheet`, { date }),

    getCashFlow: (startDate: string, endDate: string) =>
        apiGet<any>(`${BASE}/statements/cash-flow`, { startDate, endDate }),

    getFinancialRatios: (date: string) =>
        apiGet<FinancialRatios>(`${BASE}/statements/ratios`, { date }),

    getVATReport: (startDate: string, endDate: string) =>
        apiGet<VATReport>(`${BASE}/statements/vat`, { startDate, endDate }),

    getTrialBalance: (date?: string) =>
        apiGet<any>(`${BASE}/trial-balance`, date ? { date } : undefined),

    getLedger: (accountId: string, startDate?: string, endDate?: string) =>
        apiGet<any>(`${BASE}/ledger/${accountId}`, { startDate, endDate }),

    // ─── AR (Accounts Receivable) ───
    getAR: () =>
        apiGet<any>(`${BASE}/ar`),

    getARAging: () =>
        apiGet<AgingReport>(`${BASE}/ar/aging`),

    recordARPayment: (id: string, data: { amount: number; date: string; method: string; reference?: string }) =>
        apiPost<any>(`${BASE}/ar/${id}/payment`, data),

    // ─── AP (Accounts Payable) ───
    getAP: () =>
        apiGet<any>(`${BASE}/ap`),

    getAPAging: () =>
        apiGet<AgingReport>(`${BASE}/ap/aging`),

    recordAPPayment: (id: string, data: { amount: number; date: string; method: string; reference?: string }) =>
        apiPost<any>(`${BASE}/ap/${id}/payment`, data),

    // ─── Vendors ───
    getVendors: () =>
        apiGet<any[]>(`${BASE}/vendors`),

    createVendor: (data: any) =>
        apiPost<any>(`${BASE}/vendors`, data),

    updateVendor: (id: string, data: any) =>
        apiPatch<any>(`${BASE}/vendors/${id}`, data),

    // ─── Expenses ───
    getExpenses: (status?: ExpenseStatus) =>
        apiGet<Expense[]>(`${BASE}/expenses`, status ? { status } : undefined),

    createExpense: (data: CreateExpenseDto) =>
        apiPost<Expense>(`${BASE}/expenses`, data),

    approveExpense: (id: string) =>
        apiPost<Expense>(`${BASE}/expenses/${id}/approve`, {}),

    rejectExpense: (id: string) =>
        apiPost<Expense>(`${BASE}/expenses/${id}/reject`, {}),

    getExpensesByCategory: () =>
        apiGet<any>(`${BASE}/expenses/by-category`),

    // ─── Expense Categories ───
    getExpenseCategories: () =>
        apiGet<ExpenseCategory[]>(`${BASE}/expense-categories`),

    createExpenseCategory: (data: { name: string; accountId?: string }) =>
        apiPost<ExpenseCategory>(`${BASE}/expense-categories`, data),

    // ─── Bank Accounts ───
    getBankAccounts: () =>
        apiGet<any[]>(`${BASE}/bank-accounts`),
};

export default accountingApi;

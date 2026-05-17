import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { accountingApi } from '@/api/accounting.api';
import type {
    AccountType,
    JournalEntryStatus,
    ExpenseStatus,
    CreateJournalEntryDto,
    CreateExpenseDto,
} from '@/types/accounting.types';

// ═══════════════════════════════════════════════════════════════════
// Query Keys
// ═══════════════════════════════════════════════════════════════════
export const accountingKeys = {
    all: ['accounting'] as const,
    accounts: () => [...accountingKeys.all, 'accounts'] as const,
    accountsHierarchy: () => [...accountingKeys.all, 'accounts', 'hierarchy'] as const,
    accountBalance: (id: string) => [...accountingKeys.all, 'accounts', id, 'balance'] as const,
    journalEntries: (params?: any) => [...accountingKeys.all, 'journal-entries', params] as const,
    journalEntry: (id: string) => [...accountingKeys.all, 'journal-entries', id] as const,
    expenses: (status?: ExpenseStatus) => [...accountingKeys.all, 'expenses', status] as const,
    expenseCategories: () => [...accountingKeys.all, 'expense-categories'] as const,
    incomeStatement: (startDate: string, endDate: string) =>
        [...accountingKeys.all, 'statements', 'income', startDate, endDate] as const,
    balanceSheet: (date: string) => [...accountingKeys.all, 'statements', 'balance-sheet', date] as const,
    ratios: (date: string) => [...accountingKeys.all, 'statements', 'ratios', date] as const,
    vat: (startDate: string, endDate: string) =>
        [...accountingKeys.all, 'statements', 'vat', startDate, endDate] as const,
    arAging: () => [...accountingKeys.all, 'ar', 'aging'] as const,
    apAging: () => [...accountingKeys.all, 'ap', 'aging'] as const,
};

// ═══════════════════════════════════════════════════════════════════
// Chart of Accounts
// ═══════════════════════════════════════════════════════════════════
export function useAccounts(type?: AccountType) {
    return useQuery({
        queryKey: [...accountingKeys.accounts(), type],
        queryFn: () => accountingApi.getAccounts(type),
    });
}

export function useAccountsHierarchy() {
    return useQuery({
        queryKey: accountingKeys.accountsHierarchy(),
        queryFn: () => accountingApi.getAccountsHierarchy(),
    });
}

export function useSeedAccounts() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => accountingApi.seedAccounts(),
        onSuccess: (res) => {
            toast.success(res.message || 'تم إنشاء الحسابات الافتراضية');
            qc.invalidateQueries({ queryKey: accountingKeys.accounts() });
        },
        onError: () => toast.error('فشل في إنشاء الحسابات'),
    });
}

// ═══════════════════════════════════════════════════════════════════
// Journal Entries
// ═══════════════════════════════════════════════════════════════════
export function useJournalEntries(params?: { page?: number; status?: JournalEntryStatus; limit?: number }) {
    return useQuery({
        queryKey: accountingKeys.journalEntries(params),
        queryFn: () => accountingApi.getJournalEntries(params),
    });
}

export function useCreateJournalEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateJournalEntryDto) => accountingApi.createJournalEntry(data),
        onSuccess: () => {
            toast.success('تم إنشاء القيد');
            qc.invalidateQueries({ queryKey: [...accountingKeys.all, 'journal-entries'] });
        },
        onError: () => toast.error('فشل في إنشاء القيد'),
    });
}

export function useApproveJournalEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => accountingApi.approveJournalEntry(id),
        onSuccess: () => {
            toast.success('تم الموافقة على القيد');
            qc.invalidateQueries({ queryKey: [...accountingKeys.all, 'journal-entries'] });
        },
        onError: () => toast.error('فشل في الموافقة'),
    });
}

export function usePostJournalEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => accountingApi.postJournalEntry(id),
        onSuccess: () => {
            toast.success('تم ترحيل القيد');
            qc.invalidateQueries({ queryKey: [...accountingKeys.all, 'journal-entries'] });
        },
        onError: () => toast.error('فشل في الترحيل'),
    });
}

// ═══════════════════════════════════════════════════════════════════
// Expenses
// ═══════════════════════════════════════════════════════════════════
export function useExpenses(status?: ExpenseStatus) {
    return useQuery({
        queryKey: accountingKeys.expenses(status),
        queryFn: () => accountingApi.getExpenses(status),
    });
}

export function useExpenseCategories() {
    return useQuery({
        queryKey: accountingKeys.expenseCategories(),
        queryFn: () => accountingApi.getExpenseCategories(),
        staleTime: 5 * 60 * 1000, // 5 min — categories rarely change
    });
}

export function useCreateExpense() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateExpenseDto) => accountingApi.createExpense(data),
        onSuccess: () => {
            toast.success('تم إضافة المصروف');
            qc.invalidateQueries({ queryKey: [...accountingKeys.all, 'expenses'] });
        },
        onError: () => toast.error('فشل في إضافة المصروف'),
    });
}

export function useApproveExpense() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => accountingApi.approveExpense(id),
        onSuccess: () => {
            toast.success('تم الموافقة');
            qc.invalidateQueries({ queryKey: [...accountingKeys.all, 'expenses'] });
        },
        onError: () => toast.error('فشل في الموافقة'),
    });
}

export function useRejectExpense() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => accountingApi.rejectExpense(id),
        onSuccess: () => {
            toast.success('تم الرفض');
            qc.invalidateQueries({ queryKey: [...accountingKeys.all, 'expenses'] });
        },
        onError: () => toast.error('فشل في الرفض'),
    });
}

// ═══════════════════════════════════════════════════════════════════
// Financial Statements
// ═══════════════════════════════════════════════════════════════════
export function useIncomeStatement(startDate: string, endDate: string) {
    return useQuery({
        queryKey: accountingKeys.incomeStatement(startDate, endDate),
        queryFn: () => accountingApi.getIncomeStatement(startDate, endDate),
        enabled: !!(startDate && endDate),
    });
}

export function useBalanceSheet(date: string) {
    return useQuery({
        queryKey: accountingKeys.balanceSheet(date),
        queryFn: () => accountingApi.getBalanceSheet(date),
        enabled: !!date,
    });
}

export function useFinancialRatios(date: string) {
    return useQuery({
        queryKey: accountingKeys.ratios(date),
        queryFn: () => accountingApi.getFinancialRatios(date),
        enabled: !!date,
    });
}

export function useVATReport(startDate: string, endDate: string) {
    return useQuery({
        queryKey: accountingKeys.vat(startDate, endDate),
        queryFn: () => accountingApi.getVATReport(startDate, endDate),
        enabled: !!(startDate && endDate),
    });
}

export function useARAging() {
    return useQuery({
        queryKey: accountingKeys.arAging(),
        queryFn: () => accountingApi.getARAging(),
    });
}

export function useAPAging() {
    return useQuery({
        queryKey: accountingKeys.apAging(),
        queryFn: () => accountingApi.getAPAging(),
    });
}

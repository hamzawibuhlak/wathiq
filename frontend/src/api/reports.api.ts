import api from './client';
import type { ApiResponse } from '@/types';

export interface DashboardStats {
    overview: {
        cases: { total: number; active: number; closed: number };
        clients: { total: number; active: number };
        hearings: { total: number; upcoming: number; thisWeek: number; today: number };
        invoices: {
            total: number;
            paid: number;
            pending: number;
            overdue: number;
            totalRevenue: number;
            pendingRevenue: number;
        };
    };
    casesByStatus: { status: string; count: number }[];
    casesByType: { type: string; count: number }[];
    monthlyRevenue: { month: string; monthName: string; total: number; count: number }[];
    recentCases: any[];
    recentHearings: any[];
}

export interface FinancialReport {
    period: { start: string; end: string };
    summary: {
        total: number;
        totalCount: number;
        paid: number;
        paidCount: number;
        pending: number;
        pendingCount: number;
        overdue: number;
        overdueCount: number;
    };
    topClients: { clientId: string; clientName: string; revenue: number; invoiceCount: number }[];
}

export interface CasesReport {
    period: string;
    startDate: string;
    endDate: string;
    summary: { newCases: number; closedCases: number; netChange: number };
    casesByLawyer: { lawyerId: string | null; lawyerName: string; count: number }[];
    casesByType: { type: string; count: number }[];
}

export interface PerformanceData {
    lawyer: { id: string; name: string; email: string; role: string };
    stats: {
        totalCases: number;
        activeCases: number;
        closedCases: number;
        totalHearings: number;
        completedHearings: number;
        successRate: string;
    };
}

export const reportsApi = {
    getDashboardStats: () =>
        api.get<ApiResponse<DashboardStats>>('/reports/dashboard').then((res) => res.data),

    getFinancialReport: (startDate?: string, endDate?: string) =>
        api.get<ApiResponse<FinancialReport>>('/reports/financial', {
            params: { startDate, endDate },
        }).then((res) => res.data),

    getCasesReport: (period: string = 'month') =>
        api.get<ApiResponse<CasesReport>>('/reports/cases', { params: { period } }).then((res) => res.data),

    getPerformanceReport: () =>
        api.get<ApiResponse<PerformanceData[]>>('/reports/performance').then((res) => res.data),
};

export default reportsApi;

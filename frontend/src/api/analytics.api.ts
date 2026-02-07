import api from './client';
import type { ApiResponse } from '@/types';

// Analytics Dashboard Types
export interface AnalyticsDashboard {
    period: 'week' | 'month' | 'year';
    startDate: string;
    endDate: string;
    cases: {
        total: number;
        growth: number;
        byStatus: { status: string; count: number }[];
        byType: { type: string; count: number }[];
        byPriority: { priority: string; count: number }[];
        recentlyClosed: number;
        avgCaseDuration: number;
        closureRate: number;
        totalAllCases: number;
        totalClosedCases: number;
    };
    hearings: {
        total: number;
        upcoming: number;
        past: number;
        today: number;
        thisWeek: number;
        byStatus: { status: string; count: number }[];
        attendanceRate: number;
    };
    financial: {
        totalRevenue: number;
        revenueGrowth: number;
        pending: number;
        overdue: number;
        totalInvoices: number;
        byStatus: { status: string; amount: number; count: number }[];
    };
    clients: {
        total: number;
        newClients: number;
        activeClients: number;
        byType: { type: string; count: number }[];
    };
    trends: {
        cases: { date: string; value: number }[];
        hearings: { date: string; value: number }[];
        revenue: { date: string; value: number }[];
    };
    topClients: {
        clientId: string;
        clientName: string;
        casesCount: number;
        invoicesCount: number;
    }[];
    topInvoices: {
        invoiceId: string;
        invoiceNumber: string;
        amount: number;
        status: string;
        clientName: string;
        caseTitle: string | null;
        createdAt: string;
    }[];
    documents: {
        total: number;
        totalSizeBytes: number;
        totalSizeMB: number;
        byType: { type: string; count: number }[];
        recentDocs: {
            id: string;
            name: string;
            mimeType: string;
            sizeMB: number;
            createdAt: string;
        }[];
    };
    tasks: {
        total: number;
        tasksInPeriod: number;
        completionRate: number;
        overdueTasks: number;
        byStatus: { status: string; count: number; label: string }[];
        byUser: { userId: string; userName: string; count: number }[];
        recentTasks: {
            id: string;
            title: string;
            status: string;
            statusLabel: string;
            priority: string;
            dueDate: string | null;
            assignedTo: string | null;
        }[];
    };
}

export interface LawyerPerformance {
    lawyerId: string;
    lawyerName: string;
    email: string;
    role: string;
    totalCases: number;
    activeCases: number;
    closedCases: number;
    totalHearings: number;
    completedHearings: number;
    successRate: number;
    avgResolutionDays: number;
}

export const analyticsApi = {
    // Get dashboard analytics with optional period filter
    getDashboard: (period: 'week' | 'month' | 'year' = 'month') =>
        api.get<ApiResponse<AnalyticsDashboard>>('/analytics/dashboard', {
            params: { period },
        }).then((res) => res.data),

    // Get lawyer performance metrics
    getLawyerPerformance: (startDate?: string, endDate?: string) =>
        api.get<ApiResponse<LawyerPerformance[]>>('/analytics/lawyers/performance', {
            params: { startDate, endDate },
        }).then((res) => res.data),
};

export default analyticsApi;

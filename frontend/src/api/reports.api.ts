import api from './client';
import type { ApiResponse } from '@/types';

// Existing interfaces (keep backward compatibility)
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

// New Report Template Types
export type ReportType =
    | 'CASES_SUMMARY'
    | 'CASES_DETAILED'
    | 'HEARINGS_SCHEDULE'
    | 'FINANCIAL_SUMMARY'
    | 'CLIENT_ACTIVITY'
    | 'LAWYER_PERFORMANCE'
    | 'INVOICES_AGING';

export type ExportFormat = 'EXCEL' | 'CSV' | 'JSON' | 'PDF';

export interface ReportTemplate {
    id: string;
    name: string;
    description?: string;
    reportType: ReportType;
    config: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface ReportExecution {
    id: string;
    reportId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    format: ExportFormat;
    filePath?: string;
    error?: string;
    createdAt: string;
    completedAt?: string;
}

export interface CreateReportDto {
    name: string;
    description?: string;
    reportType: ReportType;
    config?: Record<string, any>;
}

export interface ExecuteReportDto {
    format: ExportFormat;
}

export const reportsApi = {
    // === Legacy endpoints (backward compatibility) ===
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

    // === New Report Templates CRUD ===
    
    // Create a new report template
    createTemplate: (data: CreateReportDto) =>
        api.post<ApiResponse<ReportTemplate>>('/reports', data).then((res) => res.data),

    // Get all report templates
    getTemplates: () =>
        api.get<ApiResponse<ReportTemplate[]>>('/reports/templates').then((res) => res.data),

    // Get single report template
    getTemplate: (id: string) =>
        api.get<ApiResponse<ReportTemplate>>(`/reports/templates/${id}`).then((res) => res.data),

    // Update report template
    updateTemplate: (id: string, data: Partial<CreateReportDto>) =>
        api.patch<ApiResponse<ReportTemplate>>(`/reports/templates/${id}`, data).then((res) => res.data),

    // Delete report template
    deleteTemplate: (id: string) =>
        api.delete<ApiResponse<void>>(`/reports/templates/${id}`).then((res) => res.data),

    // === Report Execution ===
    
    // Execute a report template (generate file)
    executeReport: (id: string, format: ExportFormat) =>
        api.post<ApiResponse<ReportExecution>>(`/reports/templates/${id}/execute`, { format }).then((res) => res.data),

    // Get execution status
    getExecution: (id: string) =>
        api.get<ApiResponse<ReportExecution>>(`/reports/executions/${id}`).then((res) => res.data),

    // Download executed report
    downloadExecution: (id: string) =>
        api.get(`/reports/executions/${id}/download`, { responseType: 'blob' }),
};

export default reportsApi;

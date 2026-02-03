import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports.api';

export function useReportsStats() {
    return useQuery({
        queryKey: ['reports', 'dashboard'],
        queryFn: () => reportsApi.getDashboardStats(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useFinancialReport(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['reports', 'financial', startDate, endDate],
        queryFn: () => reportsApi.getFinancialReport(startDate, endDate),
        staleTime: 1000 * 60 * 5,
    });
}

export function useCasesReport(period: string = 'month') {
    return useQuery({
        queryKey: ['reports', 'cases', period],
        queryFn: () => reportsApi.getCasesReport(period),
        staleTime: 1000 * 60 * 5,
    });
}

export function usePerformanceReport() {
    return useQuery({
        queryKey: ['reports', 'performance'],
        queryFn: () => reportsApi.getPerformanceReport(),
        staleTime: 1000 * 60 * 5,
    });
}

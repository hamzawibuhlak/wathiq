import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics.api';

export function useAnalyticsDashboard(period: 'week' | 'month' | 'year' = 'month') {
    return useQuery({
        queryKey: ['analytics', 'dashboard', period],
        queryFn: () => analyticsApi.getDashboard(period),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useLawyerPerformance(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['analytics', 'lawyers', 'performance', startDate, endDate],
        queryFn: () => analyticsApi.getLawyerPerformance(startDate, endDate),
        staleTime: 1000 * 60 * 5,
    });
}

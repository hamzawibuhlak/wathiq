import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard.api';

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => dashboardApi.getStats(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useUpcomingHearings(days: number = 7) {
    return useQuery({
        queryKey: ['dashboard', 'upcoming-hearings', days],
        queryFn: () => dashboardApi.getUpcomingHearings(days),
        staleTime: 1000 * 60 * 5,
    });
}

export function useRecentCases(limit: number = 5) {
    return useQuery({
        queryKey: ['dashboard', 'recent-cases', limit],
        queryFn: () => dashboardApi.getRecentCases(limit),
        staleTime: 1000 * 60 * 5,
    });
}

export function useRecentActivity() {
    return useQuery({
        queryKey: ['dashboard', 'recent-activity'],
        queryFn: () => dashboardApi.getRecentActivity(),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

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

// ============ ANALYTICS CHARTS HOOKS ============

export function useCasesTrend() {
    return useQuery({
        queryKey: ['dashboard', 'cases-trend'],
        queryFn: () => dashboardApi.getCasesTrend(),
        staleTime: 1000 * 60 * 15, // 15 minutes
    });
}

export function useRevenueTrend() {
    return useQuery({
        queryKey: ['dashboard', 'revenue-trend'],
        queryFn: () => dashboardApi.getRevenueTrend(),
        staleTime: 1000 * 60 * 15,
    });
}

export function useCasesByType() {
    return useQuery({
        queryKey: ['dashboard', 'cases-by-type'],
        queryFn: () => dashboardApi.getCasesByType(),
        staleTime: 1000 * 60 * 15,
    });
}

export function useTopClients(limit: number = 5) {
    return useQuery({
        queryKey: ['dashboard', 'top-clients', limit],
        queryFn: () => dashboardApi.getTopClients(limit),
        staleTime: 1000 * 60 * 15,
    });
}

export function useLawyerPerformance() {
    return useQuery({
        queryKey: ['dashboard', 'lawyer-performance'],
        queryFn: () => dashboardApi.getLawyerPerformance(),
        staleTime: 1000 * 60 * 15,
    });
}

export function useOverdueTasks(limit: number = 5) {
    return useQuery({
        queryKey: ['dashboard', 'overdue-tasks', limit],
        queryFn: () => dashboardApi.getOverdueTasks(limit),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

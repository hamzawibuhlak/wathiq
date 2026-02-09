import api from './client';
import type { ApiResponse, DashboardStats } from '@/types';

// Dashboard API endpoints
export const dashboardApi = {
    getStats: () =>
        api.get<ApiResponse<DashboardStats>>('/dashboard/stats').then((res) => res.data),

    getUpcomingHearings: (days: number = 7) =>
        api.get(`/dashboard/upcoming-hearings?days=${days}`).then((res) => res.data),

    getRecentCases: (limit: number = 5) =>
        api.get(`/dashboard/recent-cases?limit=${limit}`).then((res) => res.data),

    getRecentActivity: () =>
        api.get('/dashboard/recent-activity').then((res) => res.data),

    // Analytics Charts
    getCasesTrend: () =>
        api.get('/dashboard/cases-trend').then((res) => res.data),

    getRevenueTrend: () =>
        api.get('/dashboard/revenue-trend').then((res) => res.data),

    getCasesByType: () =>
        api.get('/dashboard/cases-by-type').then((res) => res.data),

    getTopClients: (limit: number = 5) =>
        api.get(`/dashboard/top-clients?limit=${limit}`).then((res) => res.data),

    getLawyerPerformance: () =>
        api.get('/dashboard/lawyer-performance').then((res) => res.data),

    getOverdueTasks: (limit: number = 5) =>
        api.get(`/dashboard/overdue-tasks?limit=${limit}`).then((res) => res.data),
};

export default dashboardApi;

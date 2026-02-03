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
};

export default dashboardApi;

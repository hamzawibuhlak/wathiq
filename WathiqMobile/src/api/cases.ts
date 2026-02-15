import apiService from '../services/api.service';
import { Case, DashboardStats } from '../types/models.types';

export const casesApi = {
    getAll: (params?: { status?: string; search?: string; page?: number }) =>
        apiService.get<{ data: Case[]; total: number }>('/cases', params),

    getById: (id: string) => apiService.get<Case>(`/cases/${id}`),

    create: (data: Partial<Case>) => apiService.post<Case>('/cases', data),

    update: (id: string, data: Partial<Case>) =>
        apiService.patch<Case>(`/cases/${id}`, data),

    delete: (id: string) => apiService.delete(`/cases/${id}`),

    getTimeline: (id: string) =>
        apiService.get<any[]>(`/cases/${id}/timeline`),

    getMemos: (id: string) =>
        apiService.get<any[]>(`/cases/${id}/memos`),

    addMemo: (id: string, data: { content: string }) =>
        apiService.post(`/cases/${id}/memos`, data),

    getTasks: (id: string) =>
        apiService.get<any[]>(`/cases/${id}/tasks`),
};

export const dashboardApi = {
    getStats: () => apiService.get<DashboardStats>('/dashboard/stats'),
};

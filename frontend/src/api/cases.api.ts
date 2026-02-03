import api from './client';
import type { Case, PaginatedResponse, ApiResponse } from '@/types';

export interface CasesFilters {
    search?: string;
    status?: string;
    caseType?: string;
    priority?: string;
    clientId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CreateCaseData {
    title: string;
    description?: string;
    caseType: string;
    status?: string;
    priority?: string;
    clientId: string;
    courtName?: string;
    caseNumber?: string;
    filingDate?: string;
    opposingParty?: string;
}

export interface UpdateCaseData extends Partial<CreateCaseData> { }

export const casesApi = {
    getAll: (filters?: CasesFilters) =>
        api.get<PaginatedResponse<Case>>('/cases', { params: filters }).then((res) => res.data),

    getById: (id: string) =>
        api.get<ApiResponse<Case>>(`/cases/${id}`).then((res) => res.data),

    create: (data: CreateCaseData) =>
        api.post<ApiResponse<Case>>('/cases', data).then((res) => res.data),

    update: (id: string, data: UpdateCaseData) =>
        api.patch<ApiResponse<Case>>(`/cases/${id}`, data).then((res) => res.data),

    delete: (id: string) =>
        api.delete<ApiResponse<void>>(`/cases/${id}`).then((res) => res.data),

    getStats: () =>
        api.get('/cases/stats').then((res) => res.data),

    bulkUpdateStatus: (ids: string[], status: string) =>
        api.patch<ApiResponse<{ count: number }>>('/cases/bulk/status', { ids, status }).then((res) => res.data),

    bulkDelete: (ids: string[]) =>
        api.delete<ApiResponse<{ count: number }>>('/cases/bulk/delete', { data: { ids } }).then((res) => res.data),
};

export default casesApi;

import apiService from '../services/api.service';
import { Hearing } from '../types/models.types';

export const hearingsApi = {
    getAll: (params?: { caseId?: string; status?: string; from?: string; to?: string }) =>
        apiService.get<Hearing[]>('/hearings', params),

    getById: (id: string) => apiService.get<Hearing>(`/hearings/${id}`),

    create: (data: Partial<Hearing>) => apiService.post<Hearing>('/hearings', data),

    update: (id: string, data: Partial<Hearing>) =>
        apiService.patch<Hearing>(`/hearings/${id}`, data),

    delete: (id: string) => apiService.delete(`/hearings/${id}`),

    getUpcoming: (limit = 5) =>
        apiService.get<Hearing[]>('/hearings/upcoming', { limit }),
};

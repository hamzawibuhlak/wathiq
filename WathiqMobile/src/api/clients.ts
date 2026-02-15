import apiService from '../services/api.service';
import { Client } from '../types/models.types';

export const clientsApi = {
    getAll: (params?: { search?: string; page?: number; limit?: number }) =>
        apiService.get<{ data: Client[]; total: number }>('/clients', params),

    getById: (id: string) => apiService.get<Client>(`/clients/${id}`),

    create: (data: Partial<Client>) => apiService.post<Client>('/clients', data),

    update: (id: string, data: Partial<Client>) =>
        apiService.patch<Client>(`/clients/${id}`, data),

    delete: (id: string) => apiService.delete(`/clients/${id}`),
};

import api from './client';
import type { Client, PaginatedResponse, ApiResponse, CreateClientRequest } from '@/types';

export interface ClientsFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

export const clientsApi = {
    getAll: (filters?: ClientsFilters) =>
        api.get<PaginatedResponse<Client>>('/clients', { params: filters }).then((res) => res.data),

    getById: (id: string) =>
        api.get<ApiResponse<Client>>(`/clients/${id}`).then((res) => res.data),

    create: (data: CreateClientRequest) =>
        api.post<ApiResponse<Client>>('/clients', data).then((res) => res.data),

    update: (id: string, data: Partial<CreateClientRequest>) =>
        api.patch<ApiResponse<Client>>(`/clients/${id}`, data).then((res) => res.data),

    delete: (id: string) =>
        api.delete<ApiResponse<void>>(`/clients/${id}`).then((res) => res.data),
};

export default clientsApi;

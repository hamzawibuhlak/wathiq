import apiService from '../services/api.service';
import { Invoice } from '../types/models.types';

export const invoicesApi = {
    getAll: (params?: { status?: string; clientId?: string; page?: number }) =>
        apiService.get<{ data: Invoice[]; total: number }>('/invoices', params),

    getById: (id: string) => apiService.get<Invoice>(`/invoices/${id}`),

    create: (data: Partial<Invoice>) => apiService.post<Invoice>('/invoices', data),

    update: (id: string, data: Partial<Invoice>) =>
        apiService.patch<Invoice>(`/invoices/${id}`, data),

    delete: (id: string) => apiService.delete(`/invoices/${id}`),

    markPaid: (id: string) => apiService.patch(`/invoices/${id}/pay`),
};

import api from './client';
import type { Invoice, PaginatedResponse, ApiResponse } from '@/types';

export interface InvoicesFilters {
    search?: string;
    status?: string;
    clientId?: string;
    caseId?: string;
    page?: number;
    limit?: number;
}

export interface CreateInvoiceData {
    description?: string;
    amount: number;
    taxRate?: number;
    dueDate?: string;
    clientId: string;
    caseId?: string;
    items?: InvoiceItem[];
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
    status?: string;
}

export const invoicesApi = {
    getAll: (filters?: InvoicesFilters) =>
        api.get<PaginatedResponse<Invoice>>('/invoices', { params: filters }).then((res) => res.data),

    getById: (id: string) =>
        api.get<ApiResponse<Invoice>>(`/invoices/${id}`).then((res) => res.data),

    create: (data: CreateInvoiceData) =>
        api.post<ApiResponse<Invoice>>('/invoices', data).then((res) => res.data),

    update: (id: string, data: UpdateInvoiceData) =>
        api.patch<ApiResponse<Invoice>>(`/invoices/${id}`, data).then((res) => res.data),

    delete: (id: string) =>
        api.delete<ApiResponse<void>>(`/invoices/${id}`).then((res) => res.data),

    markAsPaid: (id: string) =>
        api.patch<ApiResponse<Invoice>>(`/invoices/${id}/pay`).then((res) => res.data),

    getStats: () =>
        api.get('/invoices/stats').then((res) => res.data),

    sendEmail: (id: string) =>
        api.post<ApiResponse<{ sentTo: string }>>(`/invoices/${id}/send-email`).then((res) => res.data),

    sendSms: (id: string) =>
        api.post<ApiResponse<{ sentTo: string }>>(`/invoices/${id}/send-sms`).then((res) => res.data),
};

export default invoicesApi;

import api from './client';
import type { Document, PaginatedResponse, ApiResponse } from '@/types';

export interface DocumentsFilters {
    search?: string;
    caseId?: string;
    documentType?: string;
    page?: number;
    limit?: number;
}

export interface UploadDocumentData {
    file: File;
    title: string;
    description?: string;
    documentType: string;
    caseId?: string;
}

export const documentsApi = {
    getAll: (filters?: DocumentsFilters) =>
        api.get<PaginatedResponse<Document>>('/documents', { params: filters }).then((res) => res.data),

    getById: (id: string) =>
        api.get<ApiResponse<Document>>(`/documents/${id}`).then((res) => res.data),

    upload: (data: UploadDocumentData) => {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        formData.append('documentType', data.documentType);
        if (data.caseId) formData.append('caseId', data.caseId);

        return api.post<ApiResponse<Document>>('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((res) => res.data);
    },

    delete: (id: string) =>
        api.delete<ApiResponse<void>>(`/documents/${id}`).then((res) => res.data),

    download: (id: string) =>
        api.get(`/documents/${id}/download`, { responseType: 'blob' }).then((res) => res.data),
};

export default documentsApi;

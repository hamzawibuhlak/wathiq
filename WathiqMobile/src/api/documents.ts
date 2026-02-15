import apiService from '../services/api.service';
import { Document } from '../types/models.types';

export const documentsApi = {
    getAll: (params?: { caseId?: string; category?: string; search?: string }) =>
        apiService.get<Document[]>('/documents', params),

    getById: (id: string) => apiService.get<Document>(`/documents/${id}`),

    upload: (formData: FormData) => apiService.upload<Document>('/documents', formData),

    delete: (id: string) => apiService.delete(`/documents/${id}`),

    getByCase: (caseId: string) =>
        apiService.get<Document[]>(`/cases/${caseId}/documents`),
};

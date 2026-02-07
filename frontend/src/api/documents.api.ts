import api from './client';
import type { Document, ApiResponse } from '@/types';

export interface DocumentsFilters {
    search?: string;
    caseId?: string;
    documentType?: string;
    tags?: string[];
    fromDate?: string;
    toDate?: string;
    onlyLatest?: boolean;
    page?: number;
    limit?: number;
}

export interface UploadDocumentData {
    file: File;
    title?: string;
    description?: string;
    documentType?: string;
    caseId?: string;
    tags?: string[];
}

export interface DocumentTemplate {
    id: string;
    name: string;
    description?: string;
    category: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    isActive: boolean;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
}

export interface DocumentStats {
    total: number;
    byType: { type: string; count: number }[];
    totalSize: number;
    recentUploads: number;
    ocrStats: { status: string; count: number }[];
}

export interface OcrStats {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    notApplicable: number;
}

export const documentsApi = {
    // Main document endpoints
    getAll: (filters?: DocumentsFilters) =>
        api.get<{ data: Document[]; meta: any }>('/documents', { params: filters }).then((res) => res.data),

    getById: (id: string) =>
        api.get<ApiResponse<Document>>(`/documents/${id}`).then((res) => res.data),

    getStats: () =>
        api.get<{ data: DocumentStats }>('/documents/stats').then((res) => res.data),

    upload: (data: UploadDocumentData) => {
        const formData = new FormData();
        formData.append('file', data.file);
        if (data.title) formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        if (data.documentType) formData.append('documentType', data.documentType);
        if (data.caseId) formData.append('caseId', data.caseId);
        if (data.tags && data.tags.length > 0) {
            formData.append('tags', JSON.stringify(data.tags));
        }

        return api.post<ApiResponse<Document>>('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((res) => res.data);
    },

    update: (id: string, data: Partial<UploadDocumentData>) =>
        api.patch<ApiResponse<Document>>(`/documents/${id}`, data).then((res) => res.data),

    delete: (id: string) =>
        api.delete<ApiResponse<void>>(`/documents/${id}`).then((res) => res.data),

    bulkDelete: (ids: string[]) =>
        api.delete<{ deleted: number; message: string }>('/documents', { data: { ids } }).then((res) => res.data),

    download: (id: string) => {
        // Get token from zustand persisted state
        const authData = localStorage.getItem('watheeq-auth');
        let token = null;
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                token = parsed?.state?.token;
            } catch (e) {
                console.error('Failed to parse auth data', e);
            }
        }
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        window.open(`${baseUrl}/documents/${id}/download?token=${token}`, '_blank');
    },

    getPreviewUrl: (id: string) => {
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        return `${baseUrl}/documents/${id}/preview`;
    },

    // Version endpoints
    createNewVersion: (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        return api.post<ApiResponse<Document>>(`/documents/${id}/new-version`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((res) => res.data);
    },

    getVersionHistory: (id: string) =>
        api.get<{ data: Document[] }>(`/documents/${id}/versions`).then((res) => res.data),

    restoreVersion: (id: string) =>
        api.post<ApiResponse<Document>>(`/documents/${id}/restore`).then((res) => res.data),

    // Template endpoints
    getTemplates: (category?: string) =>
        api.get<{ data: DocumentTemplate[] }>('/documents/templates/list', { params: { category } }).then((res) => res.data),

    createTemplate: (data: { file: File; name: string; description?: string; category: string }) => {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        formData.append('category', data.category);

        return api.post<ApiResponse<DocumentTemplate>>('/documents/templates', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((res) => res.data);
    },

    downloadTemplate: (id: string) => {
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        window.open(`${baseUrl}/documents/templates/${id}/download`, '_blank');
    },

    createDocumentFromTemplate: (templateId: string, caseId?: string) =>
        api.post<ApiResponse<Document>>(`/documents/templates/${templateId}/create-document`, { caseId }).then((res) => res.data),

    deleteTemplate: (id: string) =>
        api.delete<{ message: string }>(`/documents/templates/${id}`).then((res) => res.data),

    // OCR endpoints
    processOcr: (documentId: string) =>
        api.post<{ message: string; data: any }>(`/ocr/process/${documentId}`).then((res) => res.data),

    getOcrStats: () =>
        api.get<{ data: OcrStats }>('/ocr/stats').then((res) => res.data),

    searchInOcrText: (query: string, limit?: number) =>
        api.get<{ data: any[] }>('/ocr/search', { params: { q: query, limit } }).then((res) => res.data),

    retryFailedOcr: () =>
        api.post<{ message: string; data: any }>('/ocr/retry-failed').then((res) => res.data),
};

export default documentsApi;

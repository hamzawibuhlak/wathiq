import { apiGet, apiPost, apiPatch, apiDelete } from './client';

const BASE = '/legal-documents';

export const legalDocumentsApi = {
    // CRUD
    getAll: (params?: { type?: string; status?: string; caseId?: string; search?: string; page?: number }) =>
        apiGet<any>(BASE, params),

    getById: (id: string) =>
        apiGet<any>(`${BASE}/${id}`),

    create: (data: { title: string; type: string; content?: string; caseId?: string; clientId?: string; templateId?: string }) =>
        apiPost<any>(BASE, data),

    update: (id: string, data: any) =>
        apiPatch<any>(`${BASE}/${id}`, data),

    delete: (id: string) =>
        apiDelete<any>(`${BASE}/${id}`),

    duplicate: (id: string) =>
        apiPost<any>(`${BASE}/${id}/duplicate`),

    // Version History
    restoreVersion: (docId: string, versionId: string) =>
        apiPost<any>(`${BASE}/${docId}/restore/${versionId}`),

    // Export
    getExportHtml: (id: string) =>
        `${import.meta.env.VITE_API_URL || ''}${BASE}/${id}/export/html`,

    // Templates
    getTemplates: (type?: string) =>
        apiGet<any[]>(`${BASE}/templates/list`, type ? { type } : undefined),

    createTemplate: (data: any) =>
        apiPost<any>(`${BASE}/templates`, data),

    // AI
    generateWithAI: (data: { type: string; prompt: string; caseContext?: string; clientName?: string }) =>
        apiPost<any>(`${BASE}/ai/generate`, data),

    // Search
    search: (q: string) =>
        apiGet<any[]>(`${BASE}/search/query`, { q }),
};

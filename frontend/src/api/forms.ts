import api from './client';

// ══════════════════════════════════════════════════════════
// FORMS API
// ══════════════════════════════════════════════════════════

export const formsApi = {
    // Protected endpoints
    getAll: (params?: any) =>
        api.get('/forms', { params }).then((r: any) => r.data),

    getById: (id: string) =>
        api.get(`/forms/${id}`).then((r: any) => r.data),

    create: (data: any) =>
        api.post('/forms', data).then((r: any) => r.data),

    update: (id: string, data: any) =>
        api.put(`/forms/${id}`, data).then((r: any) => r.data),

    delete: (id: string) =>
        api.delete(`/forms/${id}`).then((r: any) => r.data),

    getSubmissions: (formId: string, params?: any) =>
        api.get(`/forms/${formId}/submissions`, { params }).then((r: any) => r.data),

    updateSubmissionStatus: (submissionId: string, data: any) =>
        api.put(`/forms/submissions/${submissionId}/status`, data).then((r: any) => r.data),

    // Public endpoints (no auth)
    getBySlug: (slug: string) =>
        api.get(`/public/forms/${slug}`).then((r: any) => r.data),

    submitPublic: (slug: string, data: any) =>
        api.post(`/public/forms/${slug}/submit`, data).then((r: any) => r.data),
};

import api from './client';

// ══════════════════════════════════════════════════════════
// FORMS API
// ══════════════════════════════════════════════════════════

export const formsApi = {
    // ─── Forms CRUD ───
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

    // ─── Access control ───
    manageAccess: (id: string, data: { add?: string[]; remove?: string[] }) =>
        api.put(`/forms/${id}/access`, data).then((r: any) => r.data),

    setAnswerVisibility: (answerId: string, userIds: string[]) =>
        api.put(`/forms/answers/${answerId}/visibility`, { userIds }).then((r: any) => r.data),

    // ─── OTP ───
    generateOtp: (
        id: string,
        data: { recipientEmail?: string; recipientPhone?: string; deliveryMethod?: string },
    ) => api.post(`/forms/${id}/otp`, data).then((r: any) => r.data),

    verifyOtpPublic: (slug: string, code: string) =>
        api.post(`/public/forms/${slug}/verify-otp`, { code }).then((r: any) => r.data),

    // ─── Submissions ───
    getSubmissions: (formId: string, params?: any) =>
        api.get(`/forms/${formId}/submissions`, { params }).then((r: any) => r.data),

    updateSubmissionStatus: (submissionId: string, data: any) =>
        api.put(`/forms/submissions/${submissionId}/status`, data).then((r: any) => r.data),

    linkSubmission: (
        submissionId: string,
        data: { clientId?: string | null; caseId?: string | null; hearingId?: string | null },
    ) => api.put(`/forms/submissions/${submissionId}/link`, data).then((r: any) => r.data),

    convertToClient: (submissionId: string) =>
        api.post(`/forms/submissions/${submissionId}/convert-client`).then((r: any) => r.data),

    convertToCase: (submissionId: string, data: { clientId?: string } = {}) =>
        api.post(`/forms/submissions/${submissionId}/convert-case`, data).then((r: any) => r.data),

    // ─── Answer notes ───
    listAnswerNotes: (answerId: string) =>
        api.get(`/forms/answers/${answerId}/notes`).then((r: any) => r.data),

    addAnswerNote: (answerId: string, content: string) =>
        api.post(`/forms/answers/${answerId}/notes`, { content }).then((r: any) => r.data),

    deleteAnswerNote: (answerId: string, noteId: string) =>
        api.delete(`/forms/answers/${answerId}/notes/${noteId}`).then((r: any) => r.data),

    // ─── Discussions ───
    startDiscussion: (
        answerId: string,
        data: { inviteeIds?: string[]; message?: string },
    ) => api.post(`/forms/answers/${answerId}/discussion`, data).then((r: any) => r.data),

    getDiscussion: (id: string) =>
        api.get(`/forms/discussions/${id}`).then((r: any) => r.data),

    addDiscussionMessage: (id: string, content: string) =>
        api.post(`/forms/discussions/${id}/messages`, { content }).then((r: any) => r.data),

    inviteToDiscussion: (id: string, userIds: string[]) =>
        api.post(`/forms/discussions/${id}/invite`, { userIds }).then((r: any) => r.data),

    // ─── Editor integration ───
    getEditorAnswers: (params: { caseId?: string; clientId?: string }) =>
        api.get('/forms/editor/answers', { params }).then((r: any) => r.data),

    // ─── Public endpoints (no auth) ───
    getBySlug: (slug: string) =>
        api.get(`/public/forms/${slug}`).then((r: any) => r.data),

    submitPublic: (slug: string, data: any) =>
        api.post(`/public/forms/${slug}/submit`, data).then((r: any) => r.data),
};

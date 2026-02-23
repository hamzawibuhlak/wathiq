import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export const ownerApi = {
    // Dashboard
    getDashboard: () => apiGet<any>('/owner/dashboard'),

    // Company Profile
    getCompanyProfile: () => apiGet<any>('/owner/company'),
    updateCompanyProfile: (data: any) => apiPatch<any>('/owner/company', data),

    // Users
    getUsers: () => apiGet<any[]>('/owner/users'),
    inviteUser: (data: { name: string; email: string; role: string }) =>
        apiPost<any>('/owner/users/invite', data),
    changeRole: (userId: string, role: string) =>
        apiPatch<any>(`/owner/users/${userId}/role`, { role }),
    toggleUserStatus: (userId: string) =>
        apiPatch<any>(`/owner/users/${userId}/toggle`, {}),
    deleteUser: (userId: string) =>
        apiDelete<any>(`/owner/users/${userId}`),
    updateUser: (userId: string, data: any) =>
        apiPatch<any>(`/users/${userId}`, data),

    // Integrations
    getIntegrations: () => apiGet<any[]>('/owner/integrations'),
    saveIntegration: (type: string, config: any) =>
        apiPost<any>(`/owner/integrations/${type}`, config),
    testIntegration: (type: string) =>
        apiPost<any>(`/owner/integrations/${type}/test`, {}),
    toggleIntegration: (type: string) =>
        apiPatch<any>(`/owner/integrations/${type}/toggle`, {}),

    // Workflows
    getWorkflows: () => apiGet<any[]>('/owner/workflows'),
    createWorkflow: (data: any) => apiPost<any>('/owner/workflows', data),
    toggleWorkflow: (id: string) => apiPatch<any>(`/owner/workflows/${id}/toggle`, {}),
    deleteWorkflow: (id: string) => apiDelete<any>(`/owner/workflows/${id}`),

    // Billing & Usage
    getBilling: () => apiGet<any>('/owner/billing'),
    getUsage: () => apiGet<any>('/owner/usage'),
};

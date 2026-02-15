import apiService from '../services/api.service';

export const legalApi = {
    // Keyword search
    keywordSearch: (query: string, params?: { systemId?: string; page?: number }) =>
        apiService.get<any>('/legal-library/search', { query, ...params }),

    // AI search
    askAI: (question: string) =>
        apiService.post<any>('/legal-library/ask-ai', { question }),

    // Get systems list
    getSystems: () => apiService.get<any[]>('/legal-library/systems'),

    // Get articles
    getArticles: (systemId: string, params?: { page?: number }) =>
        apiService.get<any>(`/legal-library/systems/${systemId}/articles`, params),
};

import api from '@/api/client';

export const analyticsApi = {
    getOverview: (params?: {
        startDate?: string;
        endDate?: string;
        caseType?: string;
        lawyer?: string;
    }) => {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.caseType) queryParams.append('caseType', params.caseType);
        if (params?.lawyer) queryParams.append('lawyer', params.lawyer);
        return api.get(`/analytics/overview?${queryParams.toString()}`);
    },

    getCasesAnalytics: (params?: { startDate?: string; endDate?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        return api.get(`/analytics/cases?${queryParams.toString()}`);
    },

    getFinancialAnalytics: (params?: { startDate?: string; endDate?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        return api.get(`/analytics/financial?${queryParams.toString()}`);
    },

    getClientsAnalytics: () => api.get('/analytics/clients'),

    getPerformanceAnalytics: () => api.get('/analytics/performance'),

    getTrendsAnalytics: () => api.get('/analytics/trends'),

    getKPISummary: () => api.get('/analytics/kpi'),
};

export default analyticsApi;

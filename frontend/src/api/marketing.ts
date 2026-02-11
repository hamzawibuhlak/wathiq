import api from './api';

export const marketingApi = {
    // ═══ LEADS ═══
    getLeads: (params: any) => api.get('/api/marketing/leads', { params }).then(r => r.data),
    getLeadsKanban: () => api.get('/api/marketing/leads/kanban').then(r => r.data),
    getLeadStats: () => api.get('/api/marketing/leads/stats').then(r => r.data),
    createLead: (data: any) => api.post('/api/marketing/leads', data).then(r => r.data),
    getLeadById: (id: string) => api.get(`/api/marketing/leads/${id}`).then(r => r.data),
    updateLead: (id: string, data: any) => api.put(`/api/marketing/leads/${id}`, data).then(r => r.data),
    deleteLead: (id: string) => api.delete(`/api/marketing/leads/${id}`).then(r => r.data),
    updateLeadStatus: (id: string, data: any) => api.patch(`/api/marketing/leads/${id}/status`, data).then(r => r.data),
    logLeadActivity: (id: string, data: any) => api.post(`/api/marketing/leads/${id}/activities`, data).then(r => r.data),

    // ═══ AFFILIATES ═══
    getAffiliates: () => api.get('/api/marketing/affiliates').then(r => r.data),
    createAffiliate: (data: any) => api.post('/api/marketing/affiliates', data).then(r => r.data),
    updateAffiliate: (id: string, data: any) => api.put(`/api/marketing/affiliates/${id}`, data).then(r => r.data),
    getAffiliateCommissions: (id: string) => api.get(`/api/marketing/affiliates/${id}/commissions`).then(r => r.data),
    getAffiliateStats: () => api.get('/api/marketing/affiliates/stats').then(r => r.data),
    getAllCommissions: (status?: string) => api.get('/api/marketing/commissions', { params: { status } }).then(r => r.data),
    approveCommission: (id: string) => api.patch(`/api/marketing/commissions/${id}/approve`).then(r => r.data),
    payCommission: (id: string) => api.patch(`/api/marketing/commissions/${id}/pay`).then(r => r.data),

    // ═══ CAMPAIGNS ═══
    getCampaigns: (params?: any) => api.get('/api/marketing/campaigns', { params }).then(r => r.data),
    createCampaign: (data: any) => api.post('/api/marketing/campaigns', data).then(r => r.data),
    getCampaignById: (id: string) => api.get(`/api/marketing/campaigns/${id}`).then(r => r.data),
    updateCampaign: (id: string, data: any) => api.put(`/api/marketing/campaigns/${id}`, data).then(r => r.data),

    // ═══ ADS ANALYTICS ═══
    getAdsConnections: () => api.get('/api/marketing/ads/connections').then(r => r.data),
    connectAdsPlatform: (data: any) => api.post('/api/marketing/ads/connect', data).then(r => r.data),
    getAdsDashboard: (params: { from: Date; to: Date }) =>
        api.get('/api/marketing/ads/dashboard', {
            params: { from: params.from.toISOString(), to: params.to.toISOString() },
        }).then(r => r.data),
    syncAdsMetrics: () => api.post('/api/marketing/ads/sync').then(r => r.data),

    // ═══ TELEMARKETING ═══
    getCallQueue: () => api.get('/api/marketing/telemarketing/queue').then(r => r.data),
    logCall: (data: any) => api.post('/api/marketing/telemarketing/calls', data).then(r => r.data),
    getCallScripts: () => api.get('/api/marketing/telemarketing/scripts').then(r => r.data),
    createCallScript: (data: any) => api.post('/api/marketing/telemarketing/scripts', data).then(r => r.data),
    getCallStats: () => api.get('/api/marketing/telemarketing/stats').then(r => r.data),

    // ═══ MESSAGE CAMPAIGNS ═══
    getMessageCampaigns: (type?: string) => api.get('/api/marketing/messages', { params: { type } }).then(r => r.data),
    createMessageCampaign: (data: any) => api.post('/api/marketing/messages', data).then(r => r.data),
    getMessageCampaignById: (id: string) => api.get(`/api/marketing/messages/${id}`).then(r => r.data),

    // ═══ CONTENT CALENDAR ═══
    getContentCalendar: (month: number, year: number) =>
        api.get('/api/marketing/calendar', { params: { month, year } }).then(r => r.data),
    createContentItem: (data: any) => api.post('/api/marketing/calendar', data).then(r => r.data),
    updateContentItem: (id: string, data: any) => api.put(`/api/marketing/calendar/${id}`, data).then(r => r.data),
    deleteContentItem: (id: string) => api.delete(`/api/marketing/calendar/${id}`).then(r => r.data),
};

import api from './client';

export const marketingApi = {
    // ═══ LEADS ═══
    getLeads: (params: any) => api.get('/marketing/leads', { params }).then((r: any) => r.data),
    getLeadsKanban: () => api.get('/marketing/leads/kanban').then((r: any) => r.data),
    getLeadStats: () => api.get('/marketing/leads/stats').then((r: any) => r.data),
    createLead: (data: any) => api.post('/marketing/leads', data).then((r: any) => r.data),
    getLeadById: (id: string) => api.get(`/marketing/leads/${id}`).then((r: any) => r.data),
    updateLead: (id: string, data: any) => api.put(`/marketing/leads/${id}`, data).then((r: any) => r.data),
    deleteLead: (id: string) => api.delete(`/marketing/leads/${id}`).then((r: any) => r.data),
    updateLeadStatus: (id: string, data: any) => api.patch(`/marketing/leads/${id}/status`, data).then((r: any) => r.data),
    logLeadActivity: (id: string, data: any) => api.post(`/marketing/leads/${id}/activities`, data).then((r: any) => r.data),

    // ═══ AFFILIATES ═══
    getAffiliates: () => api.get('/marketing/affiliates').then((r: any) => r.data),
    createAffiliate: (data: any) => api.post('/marketing/affiliates', data).then((r: any) => r.data),
    updateAffiliate: (id: string, data: any) => api.put(`/marketing/affiliates/${id}`, data).then((r: any) => r.data),
    getAffiliateCommissions: (id: string) => api.get(`/marketing/affiliates/${id}/commissions`).then((r: any) => r.data),
    getAffiliateStats: () => api.get('/marketing/affiliates/stats').then((r: any) => r.data),
    getAllCommissions: (status?: string) => api.get('/marketing/commissions', { params: { status } }).then((r: any) => r.data),
    approveCommission: (id: string) => api.patch(`/marketing/commissions/${id}/approve`).then((r: any) => r.data),
    payCommission: (id: string) => api.patch(`/marketing/commissions/${id}/pay`).then((r: any) => r.data),

    // ═══ CAMPAIGNS ═══
    getCampaigns: (params?: any) => api.get('/marketing/campaigns', { params }).then((r: any) => r.data),
    createCampaign: (data: any) => api.post('/marketing/campaigns', data).then((r: any) => r.data),
    getCampaignById: (id: string) => api.get(`/marketing/campaigns/${id}`).then((r: any) => r.data),
    updateCampaign: (id: string, data: any) => api.put(`/marketing/campaigns/${id}`, data).then((r: any) => r.data),

    // ═══ ADS ANALYTICS ═══
    getAdsConnections: () => api.get('/marketing/ads/connections').then((r: any) => r.data),
    connectAdsPlatform: (data: any) => api.post('/marketing/ads/connect', data).then((r: any) => r.data),
    getAdsDashboard: (params: { from: Date; to: Date }) =>
        api.get('/marketing/ads/dashboard', {
            params: { from: params.from.toISOString(), to: params.to.toISOString() },
        }).then((r: any) => r.data),
    syncAdsMetrics: () => api.post('/marketing/ads/sync').then((r: any) => r.data),

    // ═══ TELEMARKETING ═══
    getCallQueue: () => api.get('/marketing/telemarketing/queue').then((r: any) => r.data),
    logCall: (data: any) => api.post('/marketing/telemarketing/calls', data).then((r: any) => r.data),
    getCallScripts: () => api.get('/marketing/telemarketing/scripts').then((r: any) => r.data),
    createCallScript: (data: any) => api.post('/marketing/telemarketing/scripts', data).then((r: any) => r.data),
    getCallStats: () => api.get('/marketing/telemarketing/stats').then((r: any) => r.data),

    // ═══ MESSAGE CAMPAIGNS ═══
    getMessageCampaigns: (type?: string) => api.get('/marketing/messages', { params: { type } }).then((r: any) => r.data),
    createMessageCampaign: (data: any) => api.post('/marketing/messages', data).then((r: any) => r.data),
    getMessageCampaignById: (id: string) => api.get(`/marketing/messages/${id}`).then((r: any) => r.data),

    // ═══ CONTENT CALENDAR ═══
    getContentCalendar: (month: number, year: number) =>
        api.get('/marketing/calendar', { params: { month, year } }).then((r: any) => r.data),
    createContentItem: (data: any) => api.post('/marketing/calendar', data).then((r: any) => r.data),
    updateContentItem: (id: string, data: any) => api.put(`/marketing/calendar/${id}`, data).then((r: any) => r.data),
    deleteContentItem: (id: string) => api.delete(`/marketing/calendar/${id}`).then((r: any) => r.data),
};

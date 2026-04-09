import api from './client';

export const legalLibraryApi = {
    // Stats
    getStats: () => api.get('/legal-library/stats').then((r: any) => r.data),

    // Global Search
    globalSearch: (q: string) => api.get('/legal-library/search', { params: { q } }).then((r: any) => r.data),

    // AI Search (enhanced with Claude)
    aiSearch: (query: string) => api.post('/legal-library/ai-search', { query }).then((r: any) => r.data),

    // AI Usage Stats
    getAIUsage: () => api.get('/legal-library/ai-usage').then((r: any) => r.data),

    // Regulations
    getRegulations: (params?: any) => api.get('/legal-library/regulations', { params }).then((r: any) => r.data),
    getRegulationById: (id: string) => api.get(`/legal-library/regulations/${id}`).then((r: any) => r.data),
    createRegulation: (data: any) => api.post('/legal-library/regulations', data).then((r: any) => r.data),
    deleteRegulation: (id: string) => api.delete(`/legal-library/regulations/${id}`).then((r: any) => r.data),

    // Precedents
    getPrecedents: (params?: any) => api.get('/legal-library/precedents', { params }).then((r: any) => r.data),
    getPrecedentById: (id: string) => api.get(`/legal-library/precedents/${id}`).then((r: any) => r.data),

    // Terms (Glossary)
    getTerms: (params?: any) => api.get('/legal-library/terms', { params }).then((r: any) => r.data),
    getTermById: (id: string) => api.get(`/legal-library/terms/${id}`).then((r: any) => r.data),

    // Article Notes
    getArticleNotes: (articleId: string) => api.get(`/legal-library/articles/${articleId}/notes`).then((r: any) => r.data),
    createArticleNote: (articleId: string, data: any) => api.post(`/legal-library/articles/${articleId}/notes`, data).then((r: any) => r.data),
    deleteArticleNote: (noteId: string) => api.delete(`/legal-library/notes/${noteId}`).then((r: any) => r.data),

    // Bookmarks
    getBookmarks: (params?: { folderId?: string; tag?: string }) => api.get('/legal-library/bookmarks', { params }).then((r: any) => r.data),
    addBookmark: (data: any) => api.post('/legal-library/bookmarks', data).then((r: any) => r.data),
    updateBookmark: (id: string, data: any) => api.patch(`/legal-library/bookmarks/${id}`, data).then((r: any) => r.data),
    removeBookmark: (id: string) => api.delete(`/legal-library/bookmarks/${id}`).then((r: any) => r.data),

    // Folders
    getFolders: () => api.get('/legal-library/folders').then((r: any) => r.data),
    createFolder: (data: any) => api.post('/legal-library/folders', data).then((r: any) => r.data),
    updateFolder: (id: string, data: any) => api.patch(`/legal-library/folders/${id}`, data).then((r: any) => r.data),
    deleteFolder: (id: string) => api.delete(`/legal-library/folders/${id}`).then((r: any) => r.data),

    // Folder Comments
    getFolderComments: (folderId: string) => api.get(`/legal-library/folders/${folderId}/comments`).then((r: any) => r.data),
    addFolderComment: (folderId: string, content: string) => api.post(`/legal-library/folders/${folderId}/comments`, { content }).then((r: any) => r.data),
    deleteFolderComment: (id: string) => api.delete(`/legal-library/folders/comments/${id}`).then((r: any) => r.data),

    // Case References
    linkToCase: (caseId: string, data: any) => api.post(`/legal-library/cases/${caseId}/references`, data).then((r: any) => r.data),
    getCaseReferences: (caseId: string) => api.get(`/legal-library/cases/${caseId}/references`).then((r: any) => r.data),
};


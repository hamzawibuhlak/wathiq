import api from './client';
import type { ApiResponse } from '@/types';

export interface SearchResults {
    cases: any[];
    clients: any[];
    hearings: any[];
    documents: any[];
    invoices: any[];
    total: number;
}

export interface SearchSuggestion {
    text: string;
    type: string;
    subtext?: string;
}

export const searchApi = {
    globalSearch: (query: string, type: string = 'all', limit: number = 5) =>
        api.get<ApiResponse<SearchResults>>('/search', {
            params: { q: query, type, limit },
        }).then((res) => res.data),

    getSuggestions: (query: string) =>
        api.get<ApiResponse<SearchSuggestion[]>>('/search/suggestions', {
            params: { q: query },
        }).then((res) => res.data),
};

export default searchApi;

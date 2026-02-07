import api from './client';
import type { Hearing, PaginatedResponse, ApiResponse } from '@/types';

export interface HearingsFilters {
    search?: string;
    status?: string;
    caseId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export interface CalendarFilters {
    month: number;
    year: number;
}

export interface CreateHearingData {
    hearingNumber: string;
    hearingDate: string;
    clientId?: string;
    caseId?: string;
    assignedToId: string;
    opponentName?: string;
    courtName?: string;
    judgeName?: string;
    notes?: string;
    status?: string;
}

export interface UpdateHearingData extends Partial<CreateHearingData> { }

export const hearingsApi = {
    getAll: (filters?: HearingsFilters) =>
        api.get<PaginatedResponse<Hearing>>('/hearings', { params: filters }).then((res) => res.data),

    getById: (id: string) =>
        api.get<ApiResponse<Hearing>>(`/hearings/${id}`).then((res) => res.data),

    getCalendar: (filters: CalendarFilters) =>
        api.get('/hearings/calendar', { params: filters }).then((res) => res.data),

    getUpcoming: (days: number = 7) =>
        api.get(`/hearings/upcoming?days=${days}`).then((res) => res.data),

    create: (data: CreateHearingData) =>
        api.post<ApiResponse<Hearing>>('/hearings', data).then((res) => res.data),

    update: (id: string, data: UpdateHearingData) =>
        api.patch<ApiResponse<Hearing>>(`/hearings/${id}`, data).then((res) => res.data),

    delete: (id: string) =>
        api.delete<ApiResponse<void>>(`/hearings/${id}`).then((res) => res.data),

    sendReminder: (id: string) =>
        api.post<ApiResponse<{ sentTo: string }>>(`/hearings/${id}/send-reminder`).then((res) => res.data),

    bulkUpdateStatus: (ids: string[], status: string) =>
        api.patch<ApiResponse<{ count: number }>>('/hearings/bulk/status', { ids, status }).then((res) => res.data),

    bulkDelete: (ids: string[]) =>
        api.delete<ApiResponse<{ count: number }>>('/hearings/bulk/delete', { data: { ids } }).then((res) => res.data),
};

export default hearingsApi;


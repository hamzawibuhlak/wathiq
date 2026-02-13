import api from './client';
import type { ApiResponse } from '@/types';

// ── Types ───────────────────────────────────────

export interface SipExtension {
    id: string;
    extension: string;
    displayName: string;
    ucmHost: string;
    ucmPort: number;
    isActive: boolean;
    userId: string;
    tenantId: string;
    sipPassword?: string; // decrypted — only returned for the current user
}

export interface CallRecordItem {
    id: string;
    callId: string;
    direction: 'INBOUND' | 'OUTBOUND';
    status: 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'REJECTED' | 'FAILED';
    fromNumber: string;
    toNumber: string;
    duration?: number;
    startedAt: string;
    answeredAt?: string;
    endedAt?: string;
    recordingUrl?: string;
    notes?: string;
    clientId?: string;
    agentId: string;
    tenantId: string;
    client?: { id: string; name: string; phone: string };
}

export interface AssignExtensionDto {
    userId: string;
    extension: string;
    displayName: string;
    password: string;
    ucmHost: string;
    ucmPort?: number;
}

export interface LogCallDto {
    callId: string;
    direction: 'INBOUND' | 'OUTBOUND';
    fromNumber: string;
    toNumber: string;
    status: string;
}

export interface CallStats {
    total: number;
    inbound: number;
    outbound: number;
    missed: number;
    totalDuration: number;
}

export interface CallCenterSettingsData {
    id: string;
    tenantId: string;
    ucmHost: string;
    ucmPort: number;
    ucmWebsocketPath: string;
    gdmsApiKey: string;
    gdmsApiSecret: string;
    gdmsUsername: string;
    gdmsPassword: string;
    gdmsDeviceId: string | null;
    gdmsAccountId: string | null;
    extensionPrefix: string;
    extensionStart: number;
    extensionEnd: number;
    defaultPassword: string;
    enableRecording: boolean;
    recordingFormat: string;
    recordingPath: string;
    autoDeleteDays: number | null;
    stunServer: string;
    enableNat: boolean;
    rtpPortStart: number;
    rtpPortEnd: number;
    isConnected: boolean;
    lastSync: string | null;
    lastError: string | null;
    syncAttempts: number;
}

// ── API ─────────────────────────────────────────

export const callCenterApi = {
    // SIP Extensions
    getMyExtension: () =>
        api.get<ApiResponse<SipExtension>>('/call-center/extension').then((r) => r.data),

    assignExtension: (data: AssignExtensionDto) =>
        api.post<ApiResponse<SipExtension>>('/call-center/extension', data).then((r) => r.data),

    updateExtension: (id: string, data: Partial<AssignExtensionDto>) =>
        api.patch<ApiResponse<SipExtension>>(`/call-center/extension/${id}`, data).then((r) => r.data),

    deleteExtension: (id: string) =>
        api.delete<ApiResponse<null>>(`/call-center/extension/${id}`).then((r) => r.data),

    listExtensions: () =>
        api.get<ApiResponse<SipExtension[]>>('/call-center/extensions').then((r) => r.data),

    // Call Records
    logCall: (data: LogCallDto) =>
        api.post<ApiResponse<CallRecordItem>>('/call-center/calls', data).then((r) => r.data),

    updateCallStatus: (id: string, status: string, extra?: Record<string, any>) =>
        api.patch<ApiResponse<CallRecordItem>>(`/call-center/calls/${id}`, { status, ...extra }).then((r) => r.data),

    getCallHistory: (params?: { page?: number; limit?: number }) =>
        api.get<ApiResponse<CallRecordItem[]>>('/call-center/calls', { params }).then((r) => r.data),

    getCallStats: () =>
        api.get<ApiResponse<CallStats>>('/call-center/calls/stats').then((r) => r.data),

    // ── Settings (Phase 36) ──────────────────────
    getSettings: () =>
        api.get<ApiResponse<CallCenterSettingsData>>('/call-center/settings').then((r) => r.data),

    updateSettings: (data: Partial<CallCenterSettingsData>) =>
        api.put<ApiResponse<CallCenterSettingsData>>('/call-center/settings', data).then((r) => r.data),

    testConnection: () =>
        api.post<ApiResponse<{ success: boolean; message: string; deviceInfo?: any }>>('/call-center/settings/test-connection').then((r) => r.data),

    autoAssignExtension: () =>
        api.post<ApiResponse<SipExtension>>('/call-center/settings/auto-assign-extension').then((r) => r.data),

    syncCallLogs: () =>
        api.post<ApiResponse<{ success: boolean; syncedCount?: number }>>('/call-center/settings/sync-call-logs').then((r) => r.data),
};

export default callCenterApi;


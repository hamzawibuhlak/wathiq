import api from './client';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface WhatsAppMessage {
    id: string;
    phone: string;
    message: string;
    templateName?: string;
    templateParams?: Record<string, string>;
    direction: 'OUTBOUND' | 'INBOUND';
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
    errorMessage?: string;
    clientId?: string;
    caseId?: string;
    hearingId?: string;
    invoiceId?: string;
    sentAt?: string;
    deliveredAt?: string;
    readAt?: string;
    createdAt: string;
    client?: {
        id: string;
        name: string;
        phone: string;
    };
}

export interface WhatsAppTemplate {
    id: string;
    name: string;
    language: string;
    status: string;
    category: string;
    components: Record<string, unknown>;
}

export interface WhatsAppStats {
    totalMessages: number;
    sentMessages: number;
    deliveredMessages: number;
    failedMessages: number;
}

export interface SendMessageDto {
    phone: string;
    message: string;
    clientId?: string;
    caseId?: string;
}

export interface SendTemplateDto {
    phone: string;
    templateName: string;
    templateParams: Record<string, string>;
    clientId?: string;
    caseId?: string;
}

export interface WhatsAppSettings {
    whatsappAccessToken: string;
    whatsappPhoneNumberId: string;
    whatsappBusinessId: string;
    whatsappWebhookToken: string;
    whatsappEnabled: boolean;
    isConfigured: boolean;
}

export interface UpdateWhatsAppSettingsDto {
    whatsappAccessToken?: string;
    whatsappPhoneNumberId?: string;
    whatsappBusinessId?: string;
    whatsappWebhookToken?: string;
    whatsappEnabled?: boolean;
}

export interface TestConnectionResult {
    success: boolean;
    message: string;
    phoneNumber?: string;
    verifiedName?: string;
    error?: any;
}

export interface MessagesFilters {
    direction?: 'OUTBOUND' | 'INBOUND';
    status?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export const whatsappApi = {
    // Send text message
    sendMessage: (data: SendMessageDto) =>
        api.post<ApiResponse<WhatsAppMessage>>('/whatsapp/send', data).then((res) => res.data),

    // Send template message
    sendTemplate: (data: SendTemplateDto) =>
        api.post<ApiResponse<WhatsAppMessage>>('/whatsapp/send-template', data).then((res) => res.data),

    // Send hearing reminder
    sendHearingReminder: (hearingId: string) =>
        api.post<ApiResponse<WhatsAppMessage>>(`/whatsapp/send-hearing-reminder/${hearingId}`).then((res) => res.data),

    // Send invoice reminder
    sendInvoiceReminder: (invoiceId: string) =>
        api.post<ApiResponse<WhatsAppMessage>>(`/whatsapp/send-invoice-reminder/${invoiceId}`).then((res) => res.data),

    // Get message history
    getMessages: (filters?: MessagesFilters) =>
        api.get<PaginatedResponse<WhatsAppMessage>>('/whatsapp/messages', { params: filters }).then((res) => res.data),

    // Get message by ID
    getMessageById: (id: string) =>
        api.get<ApiResponse<WhatsAppMessage>>(`/whatsapp/messages/${id}`).then((res) => res.data),

    // Get stats
    getStats: () =>
        api.get<ApiResponse<WhatsAppStats>>('/whatsapp/stats').then((res) => res.data),

    // Get templates
    getTemplates: () =>
        api.get<ApiResponse<WhatsAppTemplate[]>>('/whatsapp/templates').then((res) => res.data),

    // Settings
    getSettings: () =>
        api.get<ApiResponse<WhatsAppSettings>>('/whatsapp/settings').then((res) => res.data),

    updateSettings: (data: UpdateWhatsAppSettingsDto) =>
        api.patch<ApiResponse<WhatsAppSettings>>('/whatsapp/settings', data).then((res) => res.data),

    testConnection: () =>
        api.post<TestConnectionResult>('/whatsapp/test-connection').then((res) => res.data),

    // QR Code (Baileys)
    qrConnect: () =>
        api.post<any>('/whatsapp/qr/connect').then((res) => res.data),

    qrDisconnect: () =>
        api.post<any>('/whatsapp/qr/disconnect').then((res) => res.data),

    getQrStatus: () =>
        api.get<any>('/whatsapp/qr/status').then((res) => res.data),
};

export default whatsappApi;

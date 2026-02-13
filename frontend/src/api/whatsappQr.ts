import api from './client';
import type { ApiResponse } from '@/types';

// ── Types ───────────────────────────────────────

export interface WhatsAppQrStatus {
    status: 'DISCONNECTED' | 'QR_PENDING' | 'CONNECTED' | 'RECONNECTING';
    phone?: string;
    connectedAt?: string;
    isLive: boolean;
}

export interface WaBaileysMsg {
    id: string;
    waMessageId?: string;
    direction: 'INBOUND' | 'OUTBOUND';
    status: string;
    phone: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    sentAt?: string;
    clientId?: string;
    agentId?: string;
    client?: { id: string; name: string; phone: string };
}

// ── API ─────────────────────────────────────────

export const whatsappQrApi = {
    /** بدء اتصال QR (يبدأ بإرسال QR عبر WebSocket) */
    connect: () =>
        api.post<ApiResponse<{ status: string }>>('/whatsapp/qr/connect').then((r) => r.data),

    /** قطع الاتصال وحذف Session */
    disconnect: () =>
        api.post<ApiResponse<{ success: boolean }>>('/whatsapp/qr/disconnect').then((r) => r.data),

    /** حالة الجلسة */
    getStatus: () =>
        api.get<ApiResponse<WhatsAppQrStatus>>('/whatsapp/qr/status').then((r) => r.data),

    /** إرسال رسالة */
    sendMessage: (phone: string, message: string) =>
        api.post<ApiResponse<{ success: boolean }>>('/whatsapp/qr/send', { phone, message }).then((r) => r.data),

    /** سجل الرسائل */
    getMessages: (params?: { phone?: string; clientId?: string; page?: number }) =>
        api.get<{ data: WaBaileysMsg[]; meta: { page: number; total: number; totalPages: number } }>(
            '/whatsapp/qr/messages',
            { params },
        ).then((r) => r.data),
};

export default whatsappQrApi;

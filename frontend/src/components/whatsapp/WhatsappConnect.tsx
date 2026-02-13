import React, { useState, useEffect, useCallback } from 'react';
import { whatsappQrApi, type WhatsAppQrStatus } from '@/api/whatsappQr';
import { getSocket, connectWebSocket } from '@/lib/websocket';

/**
 * WhatsApp QR Connect component.
 * Displays QR code for scanning, connection status, and messaging interface.
 * Subscribes directly to the global WebSocket for reliable event reception.
 */

export const WhatsappConnect: React.FC = () => {
    const [status, setStatus] = useState<WhatsAppQrStatus | null>(null);
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ── Load initial status ──────────────────────────
    useEffect(() => {
        loadStatus();
    }, []);

    const handleQR = useCallback((data: { qr: string }) => {
        console.log('[WhatsappConnect] QR received via WebSocket', data.qr?.substring(0, 30));
        setQrImage(data.qr);
        setStatus((prev) => prev ? { ...prev, status: 'QR_PENDING' } : { status: 'QR_PENDING', isLive: false });
    }, []);

    const handleStatus = useCallback((data: { status: string; phone?: string }) => {
        console.log('[WhatsappConnect] Status received via WebSocket', data);
        setStatus((prev) => ({
            ...prev,
            status: data.status as WhatsAppQrStatus['status'],
            phone: data.phone,
            isLive: data.status === 'CONNECTED',
        }));
        if (data.status === 'CONNECTED') {
            setQrImage(null);
        }
    }, []);

    // ── Direct socket subscription (reliable) ────────
    useEffect(() => {
        let socket = getSocket() || connectWebSocket();
        let interval: ReturnType<typeof setInterval> | null = null;

        const attach = () => {
            socket = getSocket();
            if (!socket) return false;
            socket.off('whatsapp:qr', handleQR);
            socket.off('whatsapp:status', handleStatus);
            socket.on('whatsapp:qr', handleQR);
            socket.on('whatsapp:status', handleStatus);
            console.log('[WhatsappConnect] Subscribed to whatsapp:qr and whatsapp:status');
            return true;
        };

        // Try immediately
        if (!attach()) {
            // Retry every 500ms until socket is available
            interval = setInterval(() => {
                if (attach() && interval) {
                    clearInterval(interval);
                    interval = null;
                }
            }, 500);
        }

        return () => {
            if (interval) clearInterval(interval);
            const s = getSocket();
            if (s) {
                s.off('whatsapp:qr', handleQR);
                s.off('whatsapp:status', handleStatus);
            }
        };
    }, [handleQR, handleStatus]);

    const loadStatus = async () => {
        try {
            const res = await whatsappQrApi.getStatus();
            setStatus(res.data);
        } catch {
            // No session yet
        }
    };

    const handleConnect = async () => {
        try {
            setLoading(true);
            setError('');
            setQrImage(null);
            await whatsappQrApi.connect();
            // QR will arrive via WebSocket
        } catch (err: any) {
            setError(err?.response?.data?.message || 'فشل بدء الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setLoading(true);
            await whatsappQrApi.disconnect();
            setStatus({ status: 'DISCONNECTED', isLive: false });
            setQrImage(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'فشل قطع الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = () => {
        switch (status?.status) {
            case 'CONNECTED': return '#22c55e';
            case 'QR_PENDING': return '#f59e0b';
            case 'RECONNECTING': return '#3b82f6';
            default: return '#64748b';
        }
    };

    const getStatusLabel = () => {
        switch (status?.status) {
            case 'CONNECTED': return '✅ متصل';
            case 'QR_PENDING': return '⏳ في انتظار مسح QR';
            case 'RECONNECTING': return '🔄 جاري إعادة الاتصال';
            default: return '❌ غير متصل';
        }
    };

    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                maxWidth: 480,
                margin: '0 auto',
                direction: 'rtl',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                    }}
                >
                    💬
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                        واتساب — مسح QR
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                        ربط رقم واتساب بالنظام عبر Baileys
                    </p>
                </div>
            </div>

            {/* Status badge */}
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: `${getStatusColor()}15`,
                    color: getStatusColor(),
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 16,
                }}
            >
                <span
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: getStatusColor(),
                        display: 'inline-block',
                    }}
                />
                {getStatusLabel()}
                {status?.phone && (
                    <span style={{ color: '#64748b', fontWeight: 400, direction: 'ltr' }}>
                        {status.phone}
                    </span>
                )}
            </div>

            {/* Error */}
            {error && (
                <div
                    style={{
                        padding: '10px 14px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 10,
                        color: '#b91c1c',
                        fontSize: 13,
                        marginBottom: 16,
                    }}
                >
                    {error}
                </div>
            )}

            {/* QR Code display */}
            {qrImage && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div
                        style={{
                            background: '#fff',
                            padding: 16,
                            borderRadius: 12,
                            display: 'inline-block',
                            border: '2px solid #e2e8f0',
                        }}
                    >
                        <img
                            src={qrImage}
                            alt="WhatsApp QR Code"
                            style={{ width: 256, height: 256, borderRadius: 8 }}
                        />
                    </div>
                    <p style={{ color: '#64748b', fontSize: 13, marginTop: 12 }}>
                        افتح واتساب → الأجهزة المرتبطة → مسح QR
                    </p>
                </div>
            )}

            {/* Connected info */}
            {status?.status === 'CONNECTED' && (
                <div
                    style={{
                        padding: 16,
                        background: '#f0fdf4',
                        borderRadius: 12,
                        marginBottom: 16,
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                    <div style={{ fontWeight: 600, color: '#15803d', marginBottom: 4 }}>
                        واتساب متصل بنجاح
                    </div>
                    {status.phone && (
                        <div style={{ color: '#64748b', fontSize: 14, direction: 'ltr' }}>
                            {status.phone}
                        </div>
                    )}
                    {status.connectedAt && (
                        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                            متصل منذ: {new Date(status.connectedAt).toLocaleString('ar-SA')}
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
                {(status?.status !== 'CONNECTED' && status?.status !== 'QR_PENDING') && (
                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px 0',
                            borderRadius: 10,
                            border: 'none',
                            background: '#22c55e',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s',
                        }}
                    >
                        {loading ? '⏳ جاري...' : '🔗 بدء الاتصال عبر QR'}
                    </button>
                )}

                {(status?.status === 'CONNECTED' || status?.status === 'QR_PENDING') && (
                    <button
                        onClick={handleDisconnect}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px 0',
                            borderRadius: 10,
                            border: 'none',
                            background: '#ef4444',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s',
                        }}
                    >
                        {loading ? '⏳ جاري...' : '⛔ قطع الاتصال'}
                    </button>
                )}
            </div>

            {/* Instructions */}
            {!status?.status || status.status === 'DISCONNECTED' ? (
                <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 10, fontSize: 13, color: '#475569' }}>
                    <strong>خطوات الربط:</strong>
                    <ol style={{ margin: '8px 0 0', paddingRight: 20, lineHeight: 2 }}>
                        <li>اضغط "بدء الاتصال عبر QR"</li>
                        <li>افتح واتساب على هاتفك</li>
                        <li>اذهب إلى الإعدادات → الأجهزة المرتبطة</li>
                        <li>امسح رمز QR الظاهر على الشاشة</li>
                        <li>سيتم الربط تلقائياً!</li>
                    </ol>
                </div>
            ) : null}
        </div>
    );
};

export default WhatsappConnect;

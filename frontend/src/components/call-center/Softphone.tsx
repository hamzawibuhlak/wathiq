import React, { useState, useEffect } from 'react';
import { useSoftphone, type CallState } from '@/hooks/useSoftphone';

/**
 * Softphone component — floating phone dialer for making/receiving WebRTC calls.
 * Connects to UCM6301 via JsSIP.
 * 
 * Listens for custom `softphone:dial` event from other pages (e.g. CallCenterPage)
 * to initiate calls through the WebRTC dialer.
 */

const stateLabels: Record<CallState, string> = {
    idle: 'غير متصل',
    registering: 'جاري التسجيل...',
    registered: 'متصل ✓',
    calling: 'جاري الاتصال...',
    ringing: 'يرن...',
    in_call: 'مكالمة جارية',
    incoming: 'مكالمة واردة',
    error: 'خطأ',
};

export const Softphone: React.FC = () => {
    const {
        state,
        extension,
        formattedDuration,
        remoteNumber,
        isMuted,
        isOnHold,
        error,
        callHistory,
        register,
        call,
        answer,
        hangup,
        toggleMute,
        toggleHold,
        sendDTMF,
        unregister,
        isRegistered,
    } = useSoftphone();

    const [isOpen, setIsOpen] = useState(false);
    const [dialNumber, setDialNumber] = useState('');
    const [activeTab, setActiveTab] = useState<'dialer' | 'history'>('dialer');

    const dialpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

    // ── Listen for external dial requests ────────────
    useEffect(() => {
        const handleExternalDial = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const number = detail?.number;
            if (!number) return;

            setIsOpen(true);
            setActiveTab('dialer');
            setDialNumber(number);

            // If already registered, dial immediately
            if (isRegistered) {
                call(number);
            } else if (extension) {
                // Auto-register, then dial (user needs to click again after registration)
                register();
                setDialNumber(number);
            }
        };

        window.addEventListener('softphone:dial', handleExternalDial);
        return () => window.removeEventListener('softphone:dial', handleExternalDial);
    }, [isRegistered, extension, call, register]);

    const handleDial = () => {
        if (dialNumber.length > 0) {
            call(dialNumber);
        }
    };

    const handleDialpadPress = (key: string) => {
        if (state === 'in_call') {
            sendDTMF(key);
        } else {
            setDialNumber((prev) => prev + key);
        }
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="softphone-fab"
                style={{
                    position: 'fixed',
                    bottom: 24,
                    left: 24,
                    zIndex: 9999,
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: state === 'in_call' || state === 'incoming' ? '#22c55e' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    transition: 'all 0.3s',
                    animation: state === 'incoming' ? 'pulse-ring 1.5s infinite' : undefined,
                }}
                title="الهاتف"
            >
                📞
            </button>

            {/* Softphone panel */}
            {isOpen && (
                <div
                    className="softphone-panel"
                    style={{
                        position: 'fixed',
                        bottom: 90,
                        left: 24,
                        zIndex: 9998,
                        width: 320,
                        maxHeight: 520,
                        background: '#1e293b',
                        borderRadius: 16,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        fontFamily: 'Inter, sans-serif',
                        direction: 'rtl',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #334155',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>مركز الاتصال</div>
                            <div style={{ fontSize: 11, color: state === 'registered' ? '#4ade80' : '#94a3b8' }}>
                                {stateLabels[state]}
                                {extension && ` — ${extension.extension}`}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ padding: '8px 16px', background: '#7f1d1d', color: '#fca5a5', fontSize: 12 }}>
                            {error}
                        </div>
                    )}

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
                        {(['dialer', 'history'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    flex: 1,
                                    padding: '8px 0',
                                    border: 'none',
                                    background: activeTab === tab ? '#334155' : 'transparent',
                                    color: activeTab === tab ? '#fff' : '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: activeTab === tab ? 600 : 400,
                                }}
                            >
                                {tab === 'dialer' ? '🔢 لوحة الأرقام' : '📋 السجل'}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
                        {activeTab === 'dialer' ? (
                            <>
                                {/* In-call display */}
                                {(state === 'in_call' || state === 'calling' || state === 'ringing' || state === 'incoming') && (
                                    <div style={{ textAlign: 'center', marginBottom: 12, padding: 16 }}>
                                        <div style={{ fontSize: 18, fontWeight: 700 }}>{remoteNumber || 'مجهول'}</div>
                                        <div style={{ fontSize: 24, color: '#4ade80', marginTop: 4 }}>{formattedDuration}</div>
                                    </div>
                                )}

                                {/* Number display */}
                                {state !== 'in_call' && state !== 'calling' && state !== 'ringing' && state !== 'incoming' && (
                                    <input
                                        type="text"
                                        value={dialNumber}
                                        onChange={(e) => setDialNumber(e.target.value)}
                                        placeholder="أدخل الرقم..."
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderRadius: 8,
                                            border: '1px solid #475569',
                                            background: '#0f172a',
                                            color: '#fff',
                                            fontSize: 18,
                                            textAlign: 'center',
                                            marginBottom: 12,
                                            outline: 'none',
                                            direction: 'ltr',
                                        }}
                                    />
                                )}

                                {/* Dialpad */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                                    {dialpadKeys.map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => handleDialpadPress(key)}
                                            style={{
                                                padding: '12px 0',
                                                borderRadius: 10,
                                                border: 'none',
                                                background: '#334155',
                                                color: '#fff',
                                                fontSize: 18,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                transition: 'background 0.2s',
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.background = '#475569')}
                                            onMouseOut={(e) => (e.currentTarget.style.background = '#334155')}
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                    {!isRegistered && (
                                        <button
                                            onClick={() => register()}
                                            style={{
                                                flex: 1,
                                                padding: '10px 0',
                                                borderRadius: 10,
                                                border: 'none',
                                                background: '#2563eb',
                                                color: '#fff',
                                                fontWeight: 600,
                                                cursor: extension ? 'pointer' : 'not-allowed',
                                                opacity: extension ? 1 : 0.5,
                                            }}
                                            disabled={!extension}
                                        >
                                            تسجيل الخط
                                        </button>
                                    )}

                                    {state === 'registered' && (
                                        <>
                                            <button
                                                onClick={handleDial}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 0',
                                                    borderRadius: 10,
                                                    border: 'none',
                                                    background: '#22c55e',
                                                    color: '#fff',
                                                    fontWeight: 600,
                                                    cursor: dialNumber ? 'pointer' : 'not-allowed',
                                                    opacity: dialNumber ? 1 : 0.5,
                                                }}
                                                disabled={!dialNumber}
                                            >
                                                اتصال 📞
                                            </button>
                                            <button
                                                onClick={unregister}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: 10,
                                                    border: 'none',
                                                    background: '#475569',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                }}
                                                title="إلغاء التسجيل"
                                            >
                                                ⏏
                                            </button>
                                        </>
                                    )}

                                    {state === 'incoming' && (
                                        <>
                                            <button
                                                onClick={answer}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 0',
                                                    borderRadius: 10,
                                                    border: 'none',
                                                    background: '#22c55e',
                                                    color: '#fff',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                رد 📞
                                            </button>
                                            <button
                                                onClick={hangup}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 0',
                                                    borderRadius: 10,
                                                    border: 'none',
                                                    background: '#ef4444',
                                                    color: '#fff',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                رفض 🚫
                                            </button>
                                        </>
                                    )}

                                    {(state === 'in_call' || state === 'calling' || state === 'ringing') && (
                                        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                                            <button
                                                onClick={toggleMute}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 0',
                                                    borderRadius: 10,
                                                    border: 'none',
                                                    background: isMuted ? '#f59e0b' : '#475569',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    fontSize: 13,
                                                }}
                                            >
                                                {isMuted ? '🔇 كتم' : '🎤 صوت'}
                                            </button>
                                            <button
                                                onClick={toggleHold}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 0',
                                                    borderRadius: 10,
                                                    border: 'none',
                                                    background: isOnHold ? '#f59e0b' : '#475569',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    fontSize: 13,
                                                }}
                                            >
                                                {isOnHold ? '⏸ انتظار' : '▶ تشغيل'}
                                            </button>
                                            <button
                                                onClick={hangup}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 0',
                                                    borderRadius: 10,
                                                    border: 'none',
                                                    background: '#ef4444',
                                                    color: '#fff',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    fontSize: 13,
                                                }}
                                            >
                                                إنهاء 📵
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* History tab */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {callHistory.length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#64748b', padding: 20, fontSize: 13 }}>
                                        لا توجد مكالمات بعد
                                    </div>
                                )}
                                {callHistory.map((c) => (
                                    <div
                                        key={c.id}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            background: '#0f172a',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: 12,
                                        }}
                                    >
                                        <div>
                                            <span style={{ marginLeft: 6 }}>
                                                {c.direction === 'INBOUND' ? '📥' : '📤'}
                                            </span>
                                            <strong>{c.direction === 'INBOUND' ? c.fromNumber : c.toNumber}</strong>
                                            {c.client && (
                                                <span style={{ color: '#94a3b8', marginRight: 6 }}>({c.client.name})</span>
                                            )}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: 11 }}>
                                            {c.duration ? `${Math.floor(c.duration / 60)}:${(c.duration % 60).toString().padStart(2, '0')}` : c.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CSS animations */}
            <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
          70% { box-shadow: 0 0 0 20px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
        </>
    );
};

export default Softphone;

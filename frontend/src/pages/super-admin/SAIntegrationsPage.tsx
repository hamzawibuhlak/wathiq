import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, ConfigItem } from './integrations/integrationUtils';

const INTEGRATIONS = [
    { id: 'ai', path: '/super-admin/integrations/ai', label: 'الذكاء الاصطناعي', icon: '🧠', color: '#6366f1', desc: 'ChatGPT و Claude و OpenRouter للبحث القانوني الذكي', keys: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENROUTER_API_KEY'] },
    { id: 'smtp', path: '/super-admin/integrations/smtp', label: 'البريد الإلكتروني (SMTP)', icon: '📧', color: '#3b82f6', desc: 'إرسال الإشعارات والفواتير عبر البريد', keys: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] },
    { id: 'whatsapp', path: '/super-admin/integrations/whatsapp', label: 'واتساب Business', icon: '📱', color: '#25D366', desc: 'إشعارات وتذكيرات واتساب للعملاء', keys: ['WA_TOKEN', 'WA_PHONE_ID'] },
    { id: 'callcenter', path: '/super-admin/integrations/callcenter', label: 'مركز الاتصال', icon: '📞', color: '#06b6d4', desc: 'إجراء واستقبال المكالمات (Twilio/Unifonic)', keys: ['CC_API_KEY'] },
    { id: 'calendar', path: '/super-admin/integrations/calendar', label: 'Google Calendar', icon: '📅', color: '#f59e0b', desc: 'مزامنة مواعيد الجلسات والاجتماعات', keys: ['GC_CLIENT_ID', 'GC_CLIENT_SECRET'] },
    { id: 'sendgrid', path: '/super-admin/integrations/sendgrid', label: 'SendGrid', icon: '✉️', color: '#1A82E2', desc: 'بريد إلكتروني عالي الحجم (بديل SMTP)', keys: ['SG_API_KEY'] },
];

export default function SAIntegrationsHub() {
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api('/super-admin/config')
            .then(setConfigs)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const hasKey = (key: string) => configs.some(c => c.key === key);

    const getStatus = (keys: string[]): 'active' | 'partial' | 'none' => {
        const found = keys.filter(k => hasKey(k)).length;
        if (found === keys.length) return 'active';
        if (found > 0) return 'partial';
        return 'none';
    };

    const statusLabels = {
        active: { text: 'مفعّل', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)' },
        partial: { text: 'غير مكتمل', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        none: { text: 'غير مفعّل', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
    };

    return (
        <div style={{ padding: '24px', color: '#e2e8f0', maxWidth: '960px' }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🔗 التكاملات والربط
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '6px 0 0' }}>
                    إدارة جميع التكاملات الخارجية للنظام — اختر خدمة للإعداد
                </p>
            </div>

            {loading ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>جاري التحميل...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {INTEGRATIONS.map(item => {
                        const status = getStatus(item.keys);
                        const sl = statusLabels[status];
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                style={{
                                    display: 'flex', flexDirection: 'column', gap: '12px',
                                    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
                                    padding: '24px', textDecoration: 'none', color: 'inherit',
                                    transition: 'all 0.25s ease',
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = item.color;
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${item.color}15`;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = '#1e293b';
                                    (e.currentTarget as HTMLElement).style.transform = 'none';
                                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '32px' }}>{item.icon}</span>
                                    <span style={{
                                        fontSize: '11px', fontWeight: 600, color: sl.color,
                                        background: sl.bg, padding: '4px 10px', borderRadius: '8px',
                                    }}>
                                        {sl.text}
                                    </span>
                                </div>
                                <div>
                                    <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>{item.label}</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #1e293b' }}>
                                    <span style={{ color: item.color, fontSize: '13px', fontWeight: 600 }}>إعداد ←</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

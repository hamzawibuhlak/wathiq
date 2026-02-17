import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, ConfigItem, pageWrapStyle, sectionStyle, backLinkStyle } from './integrationUtils';
import { SectionHeader, FormField, ActionButtons, ResultBanner } from './IntegrationComponents';

export default function CalendarIntegrationPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [gcClientId, setGcClientId] = useState('');
    const [gcClientSecret, setGcClientSecret] = useState('');
    const [gcRedirectUri, setGcRedirectUri] = useState('');

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api('/super-admin/config?category=calendar');
            const map: Record<string, string> = {};
            data.forEach((c: ConfigItem) => { map[c.key] = c.value; });
            if (map['GC_CLIENT_ID']) setGcClientId(map['GC_CLIENT_ID']);
            if (map['GC_CLIENT_SECRET']) setGcClientSecret(map['GC_CLIENT_SECRET']);
            if (map['GC_REDIRECT_URI']) setGcRedirectUri(map['GC_REDIRECT_URI']);
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    const handleSave = async () => {
        setSaving(true); setResult(null);
        try {
            const items = [
                { key: 'GC_CLIENT_ID', value: gcClientId, category: 'calendar', label: 'Client ID' },
                { key: 'GC_CLIENT_SECRET', value: gcClientSecret, category: 'calendar', label: 'Client Secret', encrypted: true },
                { key: 'GC_REDIRECT_URI', value: gcRedirectUri, category: 'calendar', label: 'Redirect URI' },
            ];
            for (const cfg of items as any[]) {
                if (!cfg.value || cfg.value.includes('••••')) continue;
                await api('/super-admin/config', { method: 'POST', body: JSON.stringify(cfg) });
            }
            await loadConfigs();
            setResult({ success: true, message: '✅ تم حفظ إعدادات Google Calendar بنجاح!' });
        } catch (e: any) { setResult({ success: false, error: 'فشل الحفظ: ' + e.message }); }
        setSaving(false);
    };

    return (
        <div style={pageWrapStyle}>
            <Link to="/super-admin/integrations" style={backLinkStyle}>→ العودة للتكاملات</Link>

            <div style={sectionStyle}>
                {loading ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>جاري التحميل...</p>
                ) : (
                    <>
                        <SectionHeader icon="📅" title="Google Calendar" desc="مزامنة مواعيد الجلسات والاجتماعات مع تقويم جوجل" />
                        <FormField label="Client ID" value={gcClientId} onChange={setGcClientId} placeholder="xxxxxxx.apps.googleusercontent.com" dir="ltr" />
                        <FormField label="Client Secret" value={gcClientSecret} onChange={setGcClientSecret} placeholder="GOCSPX-xxxxxxx" type="password" dir="ltr" />
                        <FormField label="Redirect URI" value={gcRedirectUri} onChange={setGcRedirectUri} placeholder="https://bewathiq.com/api/calendar/callback" dir="ltr" />
                        <p style={{ fontSize: '11px', color: '#475569', margin: '12px 0 0' }}>
                            أنشئ OAuth 2.0 credentials من <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" style={{ color: '#f59e0b' }}>Google Cloud Console</a>
                        </p>
                        <ActionButtons onSave={handleSave} saving={saving} />
                        <ResultBanner result={result} />
                    </>
                )}
            </div>
        </div>
    );
}

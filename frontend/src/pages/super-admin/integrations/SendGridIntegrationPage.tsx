import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, ConfigItem, pageWrapStyle, sectionStyle, backLinkStyle } from './integrationUtils';
import { SectionHeader, FormField, ActionButtons, ResultBanner } from './IntegrationComponents';

export default function SendGridIntegrationPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [sgApiKey, setSgApiKey] = useState('');
    const [sgFromEmail, setSgFromEmail] = useState('');
    const [sgFromName, setSgFromName] = useState('');

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api('/super-admin/config?category=sendgrid');
            const map: Record<string, string> = {};
            data.forEach((c: ConfigItem) => { map[c.key] = c.value; });
            if (map['SG_API_KEY']) setSgApiKey(map['SG_API_KEY']);
            if (map['SG_FROM_EMAIL']) setSgFromEmail(map['SG_FROM_EMAIL']);
            if (map['SG_FROM_NAME']) setSgFromName(map['SG_FROM_NAME']);
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    const handleSave = async () => {
        setSaving(true); setResult(null);
        try {
            const items = [
                { key: 'SG_API_KEY', value: sgApiKey, category: 'sendgrid', label: 'مفتاح API', encrypted: true },
                { key: 'SG_FROM_EMAIL', value: sgFromEmail, category: 'sendgrid', label: 'بريد المرسل' },
                { key: 'SG_FROM_NAME', value: sgFromName, category: 'sendgrid', label: 'اسم المرسل' },
            ];
            for (const cfg of items as any[]) {
                if (!cfg.value || cfg.value.includes('••••')) continue;
                await api('/super-admin/config', { method: 'POST', body: JSON.stringify(cfg) });
            }
            await loadConfigs();
            setResult({ success: true, message: '✅ تم حفظ إعدادات SendGrid بنجاح!' });
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
                        <SectionHeader icon="✉️" title="SendGrid" desc="خدمة إرسال بريد إلكتروني عالية الحجم (بديل SMTP)" />
                        <FormField label="مفتاح API" value={sgApiKey} onChange={setSgApiKey} placeholder="SG.xxxxxxx" type="password" dir="ltr" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                            <FormField label="بريد المرسل" value={sgFromEmail} onChange={setSgFromEmail} placeholder="noreply@example.com" dir="ltr" />
                            <FormField label="اسم المرسل" value={sgFromName} onChange={setSgFromName} placeholder="وثيق" />
                        </div>
                        <p style={{ fontSize: '11px', color: '#475569', margin: '12px 0 0' }}>
                            احصل على المفتاح من <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener" style={{ color: '#1A82E2' }}>SendGrid Dashboard</a>
                        </p>
                        <ActionButtons onSave={handleSave} saving={saving} />
                        <ResultBanner result={result} />
                    </>
                )}
            </div>
        </div>
    );
}

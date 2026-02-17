import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, ConfigItem, pageWrapStyle, sectionStyle, backLinkStyle } from './integrationUtils';
import { SectionHeader, FormField, ActionButtons, ResultBanner } from './IntegrationComponents';

export default function WhatsAppIntegrationPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [waToken, setWaToken] = useState('');
    const [waPhoneId, setWaPhoneId] = useState('');
    const [waBusinessId, setWaBusinessId] = useState('');

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api('/super-admin/config?category=whatsapp');
            const map: Record<string, string> = {};
            data.forEach((c: ConfigItem) => { map[c.key] = c.value; });
            if (map['WA_TOKEN']) setWaToken(map['WA_TOKEN']);
            if (map['WA_PHONE_ID']) setWaPhoneId(map['WA_PHONE_ID']);
            if (map['WA_BUSINESS_ID']) setWaBusinessId(map['WA_BUSINESS_ID']);
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    const handleSave = async () => {
        setSaving(true); setResult(null);
        try {
            const items = [
                { key: 'WA_TOKEN', value: waToken, category: 'whatsapp', label: 'رمز الوصول', encrypted: true },
                { key: 'WA_PHONE_ID', value: waPhoneId, category: 'whatsapp', label: 'معرّف رقم الهاتف' },
                { key: 'WA_BUSINESS_ID', value: waBusinessId, category: 'whatsapp', label: 'معرّف الحساب' },
            ];
            for (const cfg of items as any[]) {
                if (!cfg.value || cfg.value.includes('••••')) continue;
                await api('/super-admin/config', { method: 'POST', body: JSON.stringify(cfg) });
            }
            await loadConfigs();
            setResult({ success: true, message: '✅ تم حفظ إعدادات واتساب بنجاح!' });
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
                        <SectionHeader icon="📱" title="واتساب Business API" desc="ربط واتساب لإرسال الإشعارات والتذكيرات للعملاء" />
                        <FormField label="رمز الوصول (Access Token)" value={waToken} onChange={setWaToken} placeholder="EAAxxxxxxx" type="password" dir="ltr" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                            <FormField label="معرّف رقم الهاتف (Phone Number ID)" value={waPhoneId} onChange={setWaPhoneId} placeholder="123456789" dir="ltr" />
                            <FormField label="معرّف حساب الأعمال (Business Account ID)" value={waBusinessId} onChange={setWaBusinessId} placeholder="987654321" dir="ltr" />
                        </div>
                        <p style={{ fontSize: '11px', color: '#475569', margin: '12px 0 0' }}>
                            احصل على بيانات الاعتماد من <a href="https://developers.facebook.com/" target="_blank" rel="noopener" style={{ color: '#25D366' }}>Meta for Developers</a>
                        </p>
                        <ActionButtons onSave={handleSave} saving={saving} />
                        <ResultBanner result={result} />
                    </>
                )}
            </div>
        </div>
    );
}

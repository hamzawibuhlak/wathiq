import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, ConfigItem, pageWrapStyle, sectionStyle, labelStyle, toggleBtnStyle, backLinkStyle } from './integrationUtils';
import { SectionHeader, FormField, ActionButtons, ResultBanner } from './IntegrationComponents';

export default function CallCenterIntegrationPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [ccProvider, setCcProvider] = useState('twilio');
    const [ccApiKey, setCcApiKey] = useState('');
    const [ccAccountSid, setCcAccountSid] = useState('');
    const [ccPhoneNumber, setCcPhoneNumber] = useState('');

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api('/super-admin/config?category=callcenter');
            const map: Record<string, string> = {};
            data.forEach((c: ConfigItem) => { map[c.key] = c.value; });
            if (map['CC_PROVIDER']) setCcProvider(map['CC_PROVIDER']);
            if (map['CC_API_KEY']) setCcApiKey(map['CC_API_KEY']);
            if (map['CC_ACCOUNT_SID']) setCcAccountSid(map['CC_ACCOUNT_SID']);
            if (map['CC_PHONE_NUMBER']) setCcPhoneNumber(map['CC_PHONE_NUMBER']);
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    const handleSave = async () => {
        setSaving(true); setResult(null);
        try {
            const items = [
                { key: 'CC_PROVIDER', value: ccProvider, category: 'callcenter', label: 'المزود' },
                { key: 'CC_API_KEY', value: ccApiKey, category: 'callcenter', label: 'مفتاح API', encrypted: true },
                { key: 'CC_ACCOUNT_SID', value: ccAccountSid, category: 'callcenter', label: 'Account SID' },
                { key: 'CC_PHONE_NUMBER', value: ccPhoneNumber, category: 'callcenter', label: 'رقم الهاتف' },
            ];
            for (const cfg of items as any[]) {
                if (!cfg.value || cfg.value.includes('••••')) continue;
                await api('/super-admin/config', { method: 'POST', body: JSON.stringify(cfg) });
            }
            await loadConfigs();
            setResult({ success: true, message: '✅ تم حفظ إعدادات مركز الاتصال بنجاح!' });
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
                        <SectionHeader icon="📞" title="مركز الاتصال" desc="ربط خدمة الاتصال لإجراء واستقبال المكالمات" />
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>مزود الخدمة</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[
                                    { id: 'twilio', label: 'Twilio', desc: 'الأشهر عالمياً' },
                                    { id: 'vonage', label: 'Vonage', desc: 'Nexmo سابقاً' },
                                    { id: 'unifonic', label: 'Unifonic', desc: 'سعودي 🇸🇦' },
                                ].map(p => (
                                    <button key={p.id} onClick={() => setCcProvider(p.id)} style={toggleBtnStyle(ccProvider === p.id)}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{p.label}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{p.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <FormField label="مفتاح API / Auth Token" value={ccApiKey} onChange={setCcApiKey} placeholder="xxxxxxxx" type="password" dir="ltr" />
                            <FormField label="Account SID" value={ccAccountSid} onChange={setCcAccountSid} placeholder="ACxxxxxxxx" dir="ltr" />
                        </div>
                        <FormField label="رقم الهاتف" value={ccPhoneNumber} onChange={setCcPhoneNumber} placeholder="+966xxxxxxxxx" dir="ltr" />
                        <ActionButtons onSave={handleSave} saving={saving} />
                        <ResultBanner result={result} />
                    </>
                )}
            </div>
        </div>
    );
}

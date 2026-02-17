import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, ConfigItem, pageWrapStyle, sectionStyle, labelStyle, inputStyle, btnStyle, backLinkStyle } from './integrationUtils';
import { SectionHeader, FormField, ResultBanner } from './IntegrationComponents';

export default function SMTPIntegrationPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('587');
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');
    const [smtpFrom, setSmtpFrom] = useState('');
    const [smtpFromName, setSmtpFromName] = useState('');
    const [smtpSecure, setSmtpSecure] = useState(false);
    const [smtpTestEmail, setSmtpTestEmail] = useState('');

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api('/super-admin/config?category=smtp');
            const map: Record<string, string> = {};
            data.forEach((c: ConfigItem) => { map[c.key] = c.value; });
            if (map['SMTP_HOST']) setSmtpHost(map['SMTP_HOST']);
            if (map['SMTP_PORT']) setSmtpPort(map['SMTP_PORT']);
            if (map['SMTP_USER']) setSmtpUser(map['SMTP_USER']);
            if (map['SMTP_PASS']) setSmtpPass(map['SMTP_PASS']);
            if (map['SMTP_FROM']) setSmtpFrom(map['SMTP_FROM']);
            if (map['SMTP_FROM_NAME']) setSmtpFromName(map['SMTP_FROM_NAME']);
            if (map['SMTP_SECURE']) setSmtpSecure(map['SMTP_SECURE'] === 'true');
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    const handleSave = async () => {
        setSaving(true); setResult(null);
        try {
            const items = [
                { key: 'SMTP_HOST', value: smtpHost, category: 'smtp', label: 'خادم SMTP' },
                { key: 'SMTP_PORT', value: smtpPort, category: 'smtp', label: 'منفذ SMTP' },
                { key: 'SMTP_USER', value: smtpUser, category: 'smtp', label: 'اسم المستخدم' },
                { key: 'SMTP_PASS', value: smtpPass, category: 'smtp', label: 'كلمة المرور', encrypted: true },
                { key: 'SMTP_FROM', value: smtpFrom, category: 'smtp', label: 'بريد المرسل' },
                { key: 'SMTP_FROM_NAME', value: smtpFromName, category: 'smtp', label: 'اسم المرسل' },
                { key: 'SMTP_SECURE', value: smtpSecure ? 'true' : 'false', category: 'smtp', label: 'SSL/TLS' },
            ];
            for (const cfg of items as any[]) {
                if (!cfg.value || cfg.value.includes('••••')) continue;
                await api('/super-admin/config', { method: 'POST', body: JSON.stringify(cfg) });
            }
            await loadConfigs();
            setResult({ success: true, message: '✅ تم حفظ إعدادات SMTP بنجاح!' });
        } catch (e: any) { setResult({ success: false, error: 'فشل الحفظ: ' + e.message }); }
        setSaving(false);
    };

    const handleTest = async () => {
        if (!smtpTestEmail) { setResult({ success: false, error: 'أدخل بريد الاختبار' }); return; }
        setTesting(true); setResult(null);
        try {
            const r = await api('/super-admin/config/test-smtp', { method: 'POST', body: JSON.stringify({ testEmail: smtpTestEmail }) });
            setResult(r);
        } catch (e: any) { setResult({ success: false, error: e.message }); }
        setTesting(false);
    };

    return (
        <div style={pageWrapStyle}>
            <Link to="/super-admin/integrations" style={backLinkStyle}>→ العودة للتكاملات</Link>

            <div style={sectionStyle}>
                {loading ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>جاري التحميل...</p>
                ) : (
                    <>
                        <SectionHeader icon="📧" title="إعدادات البريد الإلكتروني (SMTP)" desc="ربط خادم البريد لإرسال الإشعارات والفواتير" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <FormField label="خادم SMTP" value={smtpHost} onChange={setSmtpHost} placeholder="smtp.hostinger.com" dir="ltr" />
                            <FormField label="المنفذ" value={smtpPort} onChange={setSmtpPort} placeholder="587" dir="ltr" />
                            <FormField label="اسم المستخدم" value={smtpUser} onChange={setSmtpUser} placeholder="info@example.com" dir="ltr" />
                            <FormField label="كلمة المرور" value={smtpPass} onChange={setSmtpPass} placeholder="••••••••" type="password" dir="ltr" />
                            <FormField label="بريد المرسل (From)" value={smtpFrom} onChange={setSmtpFrom} placeholder="noreply@example.com" dir="ltr" />
                            <FormField label="اسم المرسل (From Name)" value={smtpFromName} onChange={setSmtpFromName} placeholder="وثيق" />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                            <label style={{ ...labelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={smtpSecure} onChange={e => setSmtpSecure(e.target.checked)} style={{ accentColor: '#6366f1' }} />
                                استخدام SSL/TLS (للمنفذ 465)
                            </label>
                        </div>

                        <div style={{ marginTop: '20px', padding: '16px', background: '#0c1222', borderRadius: '12px', border: '1px solid #1e293b' }}>
                            <label style={labelStyle}>📩 اختبار الاتصال — أرسل بريد تجريبي</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input style={{ ...inputStyle, flex: 1 }} placeholder="أدخل بريدك لتلقي رسالة الاختبار" value={smtpTestEmail} onChange={e => setSmtpTestEmail(e.target.value)} />
                                <button onClick={handleTest} disabled={testing} style={{ ...btnStyle, background: testing ? '#334155' : 'linear-gradient(135deg, #059669, #10b981)', whiteSpace: 'nowrap' }}>
                                    {testing ? '⏳ جاري...' : '📩 إرسال اختبار'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleSave} disabled={saving} style={{ ...btnStyle, flex: 1, background: saving ? '#334155' : 'linear-gradient(135deg, #4f46e5, #6366f1)', fontSize: '14px', padding: '12px' }}>
                                {saving ? '⏳ جاري الحفظ...' : '💾 حفظ إعدادات SMTP'}
                            </button>
                        </div>

                        <ResultBanner result={result} />
                    </>
                )}
            </div>
        </div>
    );
}

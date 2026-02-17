import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, ConfigItem, pageWrapStyle, sectionStyle, labelStyle, inputStyle, toggleBtnStyle, backLinkStyle } from './integrationUtils';
import { SectionHeader, KeyInput, ActionButtons, ResultBanner } from './IntegrationComponents';

export default function AIIntegrationPage() {
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [aiProvider, setAiProvider] = useState('auto');
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [openaiModel, setOpenaiModel] = useState('gpt-4o');
    const [anthropicModel, setAnthropicModel] = useState('claude-3-5-sonnet-20241022');

    const loadConfigs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api('/super-admin/config?category=ai');
            setConfigs(data);
            const map: Record<string, string> = {};
            data.forEach((c: ConfigItem) => { map[c.key] = c.value; });
            if (map['AI_PROVIDER']) setAiProvider(map['AI_PROVIDER']);
            if (map['OPENAI_API_KEY']) setOpenaiKey(map['OPENAI_API_KEY']);
            if (map['ANTHROPIC_API_KEY']) setAnthropicKey(map['ANTHROPIC_API_KEY']);
            if (map['OPENAI_MODEL']) setOpenaiModel(map['OPENAI_MODEL']);
            if (map['ANTHROPIC_MODEL']) setAnthropicModel(map['ANTHROPIC_MODEL']);
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    const hasKey = (key: string) => configs.some(c => c.key === key);

    const handleDeleteKey = async (key: string) => {
        if (!confirm(`هل أنت متأكد من حذف ${key}؟`)) return;
        try { await api(`/super-admin/config/${key}`, { method: 'DELETE' }); await loadConfigs(); }
        catch (e: any) { alert('فشل الحذف: ' + e.message); }
    };

    const handleSave = async () => {
        setSaving(true); setResult(null);
        try {
            const items: any[] = [
                { key: 'AI_PROVIDER', value: aiProvider, category: 'ai', label: 'مزود الذكاء الاصطناعي' },
                { key: 'OPENAI_MODEL', value: openaiModel, category: 'ai', label: 'موديل OpenAI' },
                { key: 'ANTHROPIC_MODEL', value: anthropicModel, category: 'ai', label: 'موديل Anthropic' },
            ];
            if (openaiKey && !openaiKey.includes('••••')) items.push({ key: 'OPENAI_API_KEY', value: openaiKey, category: 'ai', label: 'مفتاح OpenAI', encrypted: true });
            if (anthropicKey && !anthropicKey.includes('••••')) items.push({ key: 'ANTHROPIC_API_KEY', value: anthropicKey, category: 'ai', label: 'مفتاح Anthropic', encrypted: true });
            for (const cfg of items) {
                if (!cfg.value || cfg.value.includes('••••')) continue;
                await api('/super-admin/config', { method: 'POST', body: JSON.stringify(cfg) });
            }
            await loadConfigs();
            setResult({ success: true, message: '✅ تم حفظ الإعدادات بنجاح!' });
        } catch (e: any) { setResult({ success: false, error: 'فشل الحفظ: ' + e.message }); }
        setSaving(false);
    };

    const handleTest = async () => {
        setTesting(true); setResult(null);
        try { const r = await api('/super-admin/config/test-ai', { method: 'POST' }); setResult(r); }
        catch (e: any) { setResult({ success: false, error: e.message }); }
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
                        <SectionHeader icon="🧠" title="إعدادات الذكاء الاصطناعي" desc="ربط ChatGPT أو Claude للبحث القانوني الذكي" />

                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>مزود الذكاء الاصطناعي</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[
                                    { id: 'auto', label: '🔄 تلقائي', desc: 'يكتشف أي مفتاح موجود' },
                                    { id: 'openai', label: '🟢 OpenAI', desc: 'GPT-4o' },
                                    { id: 'anthropic', label: '🟣 Anthropic', desc: 'Claude 3.5' },
                                ].map(p => (
                                    <button key={p.id} onClick={() => setAiProvider(p.id)} style={toggleBtnStyle(aiProvider === p.id)}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{p.label}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{p.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <KeyInput label="🟢 مفتاح OpenAI API" value={openaiKey} onChange={setOpenaiKey} hasKey={hasKey('OPENAI_API_KEY')} onDelete={() => handleDeleteKey('OPENAI_API_KEY')} placeholder="sk-xxxx" />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '16px' }}>
                            <label style={{ ...labelStyle, flex: 1, marginBottom: 0 }}>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>الموديل</span>
                                <select style={{ ...inputStyle, marginTop: '4px' }} value={openaiModel} onChange={e => setOpenaiModel(e.target.value)}>
                                    <option value="gpt-4o">GPT-4o (الأفضل)</option>
                                    <option value="gpt-4o-mini">GPT-4o Mini (أرخص)</option>
                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                </select>
                            </label>
                        </div>

                        <KeyInput label="🟣 مفتاح Anthropic API" value={anthropicKey} onChange={setAnthropicKey} hasKey={hasKey('ANTHROPIC_API_KEY')} onDelete={() => handleDeleteKey('ANTHROPIC_API_KEY')} placeholder="sk-ant-xxxx" />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '16px' }}>
                            <label style={{ ...labelStyle, flex: 1, marginBottom: 0 }}>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>الموديل</span>
                                <select style={{ ...inputStyle, marginTop: '4px' }} value={anthropicModel} onChange={e => setAnthropicModel(e.target.value)}>
                                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                                    <option value="claude-3-haiku-20240307">Claude 3 Haiku (أرخص)</option>
                                    <option value="claude-3-opus-20240229">Claude 3 Opus (الأقوى)</option>
                                </select>
                            </label>
                        </div>

                        <ActionButtons onSave={handleSave} onTest={handleTest} saving={saving} testing={testing} testLabel="🧪 اختبار AI" />
                        <ResultBanner result={result} />
                    </>
                )}
            </div>
        </div>
    );
}

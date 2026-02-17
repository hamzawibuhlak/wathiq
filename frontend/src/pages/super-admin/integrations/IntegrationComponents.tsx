import { labelStyle, inputStyle, keyBlockStyle, btnStyle, delBtnStyle } from './integrationUtils';

// ═══════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════
export function SectionHeader({ icon, title, desc }: { icon: string; title: string; desc: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '24px' }}>{icon}</span>
            <div>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>{title}</h2>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>{desc}</p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════
// FORM FIELD
// ═══════════════════════════════════════
export function FormField({ label, value, onChange, placeholder, type = 'text', dir }: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; dir?: string;
}) {
    return (
        <div style={{ marginBottom: '4px' }}>
            <label style={labelStyle}>{label}</label>
            <input
                style={{ ...inputStyle, ...(dir === 'ltr' ? { direction: 'ltr' as const, textAlign: 'left' as const } : {}) }}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    );
}

// ═══════════════════════════════════════
// KEY INPUT (with delete)
// ═══════════════════════════════════════
export function KeyInput({ label, value, onChange, hasKey, onDelete, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; hasKey: boolean; onDelete: () => void; placeholder: string;
}) {
    return (
        <div style={{ ...keyBlockStyle, marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>{label}</label>
                {hasKey && <button onClick={onDelete} style={delBtnStyle}>حذف المفتاح</button>}
            </div>
            <input style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }} type="password" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
        </div>
    );
}

// ═══════════════════════════════════════
// ACTION BUTTONS
// ═══════════════════════════════════════
export function ActionButtons({ onSave, onTest, saving, testing, testLabel }: {
    onSave: () => void; onTest?: () => void; saving: boolean; testing?: boolean; testLabel?: string;
}) {
    return (
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button onClick={onSave} disabled={saving} style={{ ...btnStyle, flex: 1, background: saving ? '#334155' : 'linear-gradient(135deg, #4f46e5, #6366f1)', fontSize: '14px', padding: '12px' }}>
                {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
            </button>
            {onTest && (
                <button onClick={onTest} disabled={testing} style={{ ...btnStyle, flex: 1, background: testing ? '#334155' : 'linear-gradient(135deg, #059669, #10b981)', fontSize: '14px', padding: '12px' }}>
                    {testing ? '⏳ جاري الاختبار...' : testLabel || '🧪 اختبار الاتصال'}
                </button>
            )}
        </div>
    );
}

// ═══════════════════════════════════════
// RESULT BANNER
// ═══════════════════════════════════════
export function ResultBanner({ result }: { result: any }) {
    if (!result) return null;
    return (
        <div style={{
            marginTop: '16px', padding: '16px', borderRadius: '12px',
            background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${result.success ? '#10b98133' : '#ef444433'}`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>{result.success ? '✅' : '❌'}</span>
                <strong style={{ color: result.success ? '#4ade80' : '#f87171', fontSize: '14px' }}>
                    {result.success ? 'نجاح!' : 'خطأ'}
                </strong>
            </div>
            {result.message && <p style={{ color: '#4ade80', fontSize: '13px', margin: '4px 0' }}>{result.message}</p>}
            {result.error && <p style={{ color: '#f87171', fontSize: '13px', margin: '4px 0' }}>{result.error}</p>}
            {result.response && <p style={{ color: '#a5b4fc', fontSize: '13px', margin: '4px 0', fontStyle: 'italic' }}>رد AI: "{result.response}"</p>}
            {result.provider && <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0' }}>المزود: <strong>{result.provider}</strong>{result.model && <> | الموديل: <strong>{result.model}</strong></>}</p>}
            {result.details && <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0' }}>الخادم: {result.details.host}:{result.details.port}</p>}
        </div>
    );
}

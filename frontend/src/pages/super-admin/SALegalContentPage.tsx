import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function api(url: string, options?: RequestInit) {
    const token = localStorage.getItem('sa_token') || localStorage.getItem('token');
    const res = await fetch(`${API}/api${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options?.headers,
        },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface Regulation {
    id: string; title: string; titleEn?: string; number?: string;
    issuedBy?: string; category: string; status: string;
    content: string; issuedDate?: string; effectiveDate?: string;
    tags?: string[]; articles?: any[];
    createdAt: string;
}
interface Precedent {
    id: string; caseNumber?: string; court: string; courtType: string;
    circuit?: string; judgmentDate?: string; summary: string;
    fullText?: string; legalPrinciple: string; caseType: string;
    outcome: string; keywords: string[]; isVerified: boolean;
    createdAt: string;
}
interface Term {
    id: string; termAr: string; termEn?: string; definition: string;
    example?: string; category?: string; relatedTerms: string[];
    source?: string; createdAt: string;
}

const COURT_TYPES: Record<string, string> = {
    SUPREME_COURT: 'المحكمة العليا', APPEAL_COURT: 'محكمة الاستئناف',
    GENERAL_COURT: 'المحكمة العامة', COMMERCIAL_COURT: 'المحكمة التجارية',
    LABOR_COURT: 'المحكمة العمالية', ADMINISTRATIVE_COURT: 'المحكمة الإدارية',
    FAMILY_COURT: 'محكمة الأحوال الشخصية', CRIMINAL_COURT: 'المحكمة الجزائية',
};
const OUTCOMES: Record<string, string> = {
    FOR_PLAINTIFF: 'لصالح المدعي', FOR_DEFENDANT: 'لصالح المدعى عليه',
    PARTIAL: 'جزئي', DISMISSED: 'مرفوض', SETTLEMENT: 'تسوية',
};
const REG_CATEGORIES = [
    'SYSTEM', 'REGULATION', 'ROYAL_DECREE', 'MINISTERIAL_DECISION', 'CIRCULAR', 'GUIDELINE',
];

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
export default function SALegalContentPage() {
    const [tab, setTab] = useState<'regulations' | 'precedents' | 'terms'>('regulations');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        api('/legal-library/stats').then(setStats).catch(() => { });
    }, []);

    const tabs = [
        { id: 'regulations' as const, label: 'الأنظمة واللوائح', icon: '📜', count: stats?.regulations || 0 },
        { id: 'precedents' as const, label: 'السوابق القضائية', icon: '⚖️', count: stats?.precedents || 0 },
        { id: 'terms' as const, label: 'المصطلحات القانونية', icon: '📖', count: stats?.terms || 0 },
    ];

    return (
        <div style={{ padding: '24px', color: '#e2e8f0' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>
                    📚 إدارة المحتوى القانوني
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '6px 0 0' }}>
                    أضف وأدر الأنظمة والسوابق والمصطلحات القانونية التي يعتمد عليها البحث الذكي
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '12px 12px 0 0',
                            border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                            transition: 'all 0.2s',
                            background: tab === t.id ? '#4f46e5' : 'transparent',
                            color: tab === t.id ? '#fff' : '#94a3b8',
                        }}>
                        <span>{t.icon}</span>
                        {t.label}
                        <span style={{
                            background: tab === t.id ? 'rgba(255,255,255,0.2)' : '#1e293b',
                            padding: '2px 8px', borderRadius: '10px', fontSize: '12px',
                        }}>{t.count}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'regulations' && <RegulationsTab onRefresh={() => api('/legal-library/stats').then(setStats)} />}
            {tab === 'precedents' && <PrecedentsTab onRefresh={() => api('/legal-library/stats').then(setStats)} />}
            {tab === 'terms' && <TermsTab onRefresh={() => api('/legal-library/stats').then(setStats)} />}
        </div>
    );
}

// ═══════════════════════════════════════
// REGULATIONS TAB
// ═══════════════════════════════════════
function RegulationsTab({ onRefresh }: { onRefresh: () => void }) {
    const [items, setItems] = useState<Regulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        title: '', titleEn: '', number: '', issuedBy: '', category: 'SYSTEM',
        status: 'ACTIVE_REG', content: '', issuedDate: '', effectiveDate: '',
        tags: '', articles: [{ number: '1', title: '', content: '' }],
    });

    const load = useCallback(() => {
        setLoading(true);
        api('/legal-library/regulations').then(d => setItems(d.data || d)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async () => {
        try {
            await api('/legal-library/regulations', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                    articles: form.articles.filter(a => a.content),
                }),
            });
            setShowForm(false);
            setForm({ title: '', titleEn: '', number: '', issuedBy: '', category: 'SYSTEM', status: 'ACTIVE_REG', content: '', issuedDate: '', effectiveDate: '', tags: '', articles: [{ number: '1', title: '', content: '' }] });
            load();
            onRefresh();
        } catch (e: any) { alert('خطأ: ' + e.message); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا النظام؟')) return;
        try {
            await api(`/legal-library/regulations/${id}`, { method: 'DELETE' });
            load(); onRefresh();
        } catch (e: any) { alert('خطأ: ' + e.message); }
    };

    const addArticle = () => {
        setForm(f => ({ ...f, articles: [...f.articles, { number: String(f.articles.length + 1), title: '', content: '' }] }));
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>الأنظمة واللوائح</h2>
                <button onClick={() => setShowForm(!showForm)} style={btnStyle}>{showForm ? '✕ إلغاء' : '+ إضافة نظام'}</button>
            </div>

            {showForm && (
                <div style={formBoxStyle}>
                    <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: '16px' }}>إضافة نظام جديد</h3>
                    <div style={gridStyle}>
                        <input style={inputStyle} placeholder="عنوان النظام *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                        <input style={inputStyle} placeholder="العنوان بالإنجليزية" value={form.titleEn} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))} />
                        <input style={inputStyle} placeholder="رقم النظام" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} />
                        <input style={inputStyle} placeholder="الجهة المصدرة" value={form.issuedBy} onChange={e => setForm(f => ({ ...f, issuedBy: e.target.value }))} />
                        <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                            {REG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input style={inputStyle} type="date" placeholder="تاريخ الإصدار" value={form.issuedDate} onChange={e => setForm(f => ({ ...f, issuedDate: e.target.value }))} />
                    </div>
                    <textarea style={{ ...inputStyle, marginTop: '12px', minHeight: '100px' }} placeholder="نص النظام *" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
                    <input style={{ ...inputStyle, marginTop: '12px' }} placeholder="الوسوم (مفصولة بفاصلة)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />

                    {/* Articles */}
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 style={{ color: '#cbd5e1', margin: 0, fontSize: '14px' }}>المواد</h4>
                            <button onClick={addArticle} style={{ ...btnStyle, fontSize: '12px', padding: '4px 12px' }}>+ مادة</button>
                        </div>
                        {form.articles.map((art, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input style={{ ...inputStyle, width: '60px', textAlign: 'center' }} value={art.number} onChange={e => {
                                    const arts = [...form.articles]; arts[i] = { ...arts[i], number: e.target.value }; setForm(f => ({ ...f, articles: arts }));
                                }} />
                                <input style={{ ...inputStyle, flex: 1 }} placeholder="عنوان المادة" value={art.title} onChange={e => {
                                    const arts = [...form.articles]; arts[i] = { ...arts[i], title: e.target.value }; setForm(f => ({ ...f, articles: arts }));
                                }} />
                                <input style={{ ...inputStyle, flex: 2 }} placeholder="نص المادة *" value={art.content} onChange={e => {
                                    const arts = [...form.articles]; arts[i] = { ...arts[i], content: e.target.value }; setForm(f => ({ ...f, articles: arts }));
                                }} />
                            </div>
                        ))}
                    </div>

                    <button onClick={handleSubmit} style={{ ...btnStyle, marginTop: '16px', width: '100%', background: '#16a34a' }} disabled={!form.title || !form.content}>
                        💾 حفظ النظام
                    </button>
                </div>
            )}

            {loading ? <p style={{ color: '#64748b' }}>جاري التحميل...</p> : items.length === 0 ? (
                <div style={emptyStyle}>
                    <span style={{ fontSize: '48px' }}>📜</span>
                    <p>لا توجد أنظمة بعد. أضف أول نظام!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map(item => (
                        <div key={item.id} style={cardStyle}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ color: '#fff', fontSize: '15px', margin: '0 0 4px', fontWeight: 600 }}>{item.title}</h3>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                                    {item.number && <span>رقم: {item.number}</span>}
                                    <span>{item.category}</span>
                                    <span style={{ color: item.status === 'ACTIVE_REG' ? '#4ade80' : '#f59e0b' }}>{item.status}</span>
                                    {item.articles?.length ? <span>{item.articles.length} مادة</span> : null}
                                </div>
                            </div>
                            <button onClick={() => handleDelete(item.id)} style={deleteBtnStyle}>🗑️</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════
// PRECEDENTS TAB
// ═══════════════════════════════════════
function PrecedentsTab({ onRefresh }: { onRefresh: () => void }) {
    const [items, setItems] = useState<Precedent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        caseNumber: '', court: '', courtType: 'GENERAL_COURT', circuit: '',
        judgmentDate: '', summary: '', fullText: '', legalPrinciple: '',
        caseType: '', outcome: 'FOR_PLAINTIFF', keywords: '',
    });

    const load = useCallback(() => {
        setLoading(true);
        api('/legal-library/precedents').then(d => setItems(d.data || d)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async () => {
        try {
            await api('/legal-library/precedents', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
                }),
            });
            setShowForm(false);
            setForm({ caseNumber: '', court: '', courtType: 'GENERAL_COURT', circuit: '', judgmentDate: '', summary: '', fullText: '', legalPrinciple: '', caseType: '', outcome: 'FOR_PLAINTIFF', keywords: '' });
            load(); onRefresh();
        } catch (e: any) { alert('خطأ: ' + e.message); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الحكم؟')) return;
        try {
            await api(`/legal-library/precedents/${id}`, { method: 'DELETE' });
            load(); onRefresh();
        } catch (e: any) { alert('خطأ: ' + e.message); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>السوابق القضائية</h2>
                <button onClick={() => setShowForm(!showForm)} style={btnStyle}>{showForm ? '✕ إلغاء' : '+ إضافة حكم'}</button>
            </div>

            {showForm && (
                <div style={formBoxStyle}>
                    <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: '16px' }}>إضافة حكم قضائي</h3>
                    <div style={gridStyle}>
                        <input style={inputStyle} placeholder="رقم القضية" value={form.caseNumber} onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))} />
                        <input style={inputStyle} placeholder="المحكمة *" value={form.court} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} />
                        <select style={inputStyle} value={form.courtType} onChange={e => setForm(f => ({ ...f, courtType: e.target.value }))}>
                            {Object.entries(COURT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <input style={inputStyle} placeholder="الدائرة" value={form.circuit} onChange={e => setForm(f => ({ ...f, circuit: e.target.value }))} />
                        <input style={inputStyle} placeholder="نوع القضية *" value={form.caseType} onChange={e => setForm(f => ({ ...f, caseType: e.target.value }))} />
                        <select style={inputStyle} value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}>
                            {Object.entries(OUTCOMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <input style={inputStyle} type="date" placeholder="تاريخ الحكم" value={form.judgmentDate} onChange={e => setForm(f => ({ ...f, judgmentDate: e.target.value }))} />
                    </div>
                    <textarea style={{ ...inputStyle, marginTop: '12px', minHeight: '80px' }} placeholder="ملخص الحكم *" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
                    <textarea style={{ ...inputStyle, marginTop: '12px', minHeight: '80px' }} placeholder="المبدأ القانوني *" value={form.legalPrinciple} onChange={e => setForm(f => ({ ...f, legalPrinciple: e.target.value }))} />
                    <textarea style={{ ...inputStyle, marginTop: '12px', minHeight: '60px' }} placeholder="النص الكامل (اختياري)" value={form.fullText} onChange={e => setForm(f => ({ ...f, fullText: e.target.value }))} />
                    <input style={{ ...inputStyle, marginTop: '12px' }} placeholder="الكلمات المفتاحية (مفصولة بفاصلة)" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} />
                    <button onClick={handleSubmit} style={{ ...btnStyle, marginTop: '16px', width: '100%', background: '#16a34a' }} disabled={!form.court || !form.summary || !form.legalPrinciple || !form.caseType}>
                        💾 حفظ الحكم
                    </button>
                </div>
            )}

            {loading ? <p style={{ color: '#64748b' }}>جاري التحميل...</p> : items.length === 0 ? (
                <div style={emptyStyle}>
                    <span style={{ fontSize: '48px' }}>⚖️</span>
                    <p>لا توجد سوابق قضائية بعد. أضف أول حكم!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map(item => (
                        <div key={item.id} style={cardStyle}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ color: '#fff', fontSize: '15px', margin: '0 0 4px', fontWeight: 600 }}>
                                    {COURT_TYPES[item.courtType] || item.court} — {item.caseType}
                                </h3>
                                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {item.summary}
                                </p>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                                    {item.caseNumber && <span>قضية: {item.caseNumber}</span>}
                                    <span style={{ color: '#a78bfa' }}>{OUTCOMES[item.outcome]}</span>
                                    {item.judgmentDate && <span>{new Date(item.judgmentDate).toLocaleDateString('ar-SA')}</span>}
                                </div>
                            </div>
                            <button onClick={() => handleDelete(item.id)} style={deleteBtnStyle}>🗑️</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════
// TERMS TAB
// ═══════════════════════════════════════
function TermsTab({ onRefresh }: { onRefresh: () => void }) {
    const [items, setItems] = useState<Term[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        termAr: '', termEn: '', definition: '', example: '',
        category: '', relatedTerms: '', source: '',
    });

    const load = useCallback(() => {
        setLoading(true);
        api('/legal-library/terms').then(setItems).catch(() => { }).finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async () => {
        try {
            await api('/legal-library/terms', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    relatedTerms: form.relatedTerms.split(',').map(t => t.trim()).filter(Boolean),
                }),
            });
            setShowForm(false);
            setForm({ termAr: '', termEn: '', definition: '', example: '', category: '', relatedTerms: '', source: '' });
            load(); onRefresh();
        } catch (e: any) { alert('خطأ: ' + e.message); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المصطلح؟')) return;
        try {
            await api(`/legal-library/terms/${id}`, { method: 'DELETE' });
            load(); onRefresh();
        } catch (e: any) { alert('خطأ: ' + e.message); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>المصطلحات القانونية</h2>
                <button onClick={() => setShowForm(!showForm)} style={btnStyle}>{showForm ? '✕ إلغاء' : '+ إضافة مصطلح'}</button>
            </div>

            {showForm && (
                <div style={formBoxStyle}>
                    <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: '16px' }}>إضافة مصطلح قانوني</h3>
                    <div style={gridStyle}>
                        <input style={inputStyle} placeholder="المصطلح بالعربية *" value={form.termAr} onChange={e => setForm(f => ({ ...f, termAr: e.target.value }))} />
                        <input style={inputStyle} placeholder="المصطلح بالإنجليزية" value={form.termEn} onChange={e => setForm(f => ({ ...f, termEn: e.target.value }))} />
                        <input style={inputStyle} placeholder="التصنيف" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                        <input style={inputStyle} placeholder="المصدر" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
                    </div>
                    <textarea style={{ ...inputStyle, marginTop: '12px', minHeight: '80px' }} placeholder="التعريف *" value={form.definition} onChange={e => setForm(f => ({ ...f, definition: e.target.value }))} />
                    <textarea style={{ ...inputStyle, marginTop: '12px', minHeight: '60px' }} placeholder="مثال توضيحي (اختياري)" value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))} />
                    <input style={{ ...inputStyle, marginTop: '12px' }} placeholder="مصطلحات ذات صلة (مفصولة بفاصلة)" value={form.relatedTerms} onChange={e => setForm(f => ({ ...f, relatedTerms: e.target.value }))} />
                    <button onClick={handleSubmit} style={{ ...btnStyle, marginTop: '16px', width: '100%', background: '#16a34a' }} disabled={!form.termAr || !form.definition}>
                        💾 حفظ المصطلح
                    </button>
                </div>
            )}

            {loading ? <p style={{ color: '#64748b' }}>جاري التحميل...</p> : items.length === 0 ? (
                <div style={emptyStyle}>
                    <span style={{ fontSize: '48px' }}>📖</span>
                    <p>لا توجد مصطلحات بعد. أضف أول مصطلح!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '8px' }}>
                    {items.map(item => (
                        <div key={item.id} style={{ ...cardStyle, flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ color: '#fff', fontSize: '15px', margin: '0 0 2px', fontWeight: 600 }}>{item.termAr}</h3>
                                    {item.termEn && <p style={{ color: '#6366f1', fontSize: '12px', margin: '0 0 4px' }}>{item.termEn}</p>}
                                </div>
                                <button onClick={() => handleDelete(item.id)} style={deleteBtnStyle}>🗑️</button>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {item.definition}
                            </p>
                            {item.category && <span style={{ color: '#64748b', fontSize: '11px', marginTop: '6px' }}>📁 {item.category}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════
const btnStyle: React.CSSProperties = {
    background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px',
    padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s',
};
const inputStyle: React.CSSProperties = {
    background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
    borderRadius: '10px', padding: '10px 14px', fontSize: '13px', width: '100%',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
};
const gridStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px',
};
const formBoxStyle: React.CSSProperties = {
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
    padding: '20px', marginBottom: '20px',
};
const cardStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
    padding: '14px 18px', transition: 'all 0.2s',
};
const deleteBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px',
    padding: '4px', opacity: 0.5, transition: 'opacity 0.2s',
};
const emptyStyle: React.CSSProperties = {
    textAlign: 'center', padding: '60px 20px', color: '#64748b',
    background: '#0f172a', borderRadius: '16px', border: '1px dashed #1e293b',
};

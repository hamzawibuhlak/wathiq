import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { superAdminApi } from '@/api/superAdmin';

export default function SATenantsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [frozenFilter, setFrozenFilter] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['sa-tenants', search, planFilter, frozenFilter, page],
        queryFn: () => superAdminApi.getTenants({
            search: search || undefined,
            planType: planFilter || undefined,
            isFrozen: frozenFilter || undefined,
            page,
            limit: 20,
        }),
    });

    const tenants = data?.data || [];
    const meta = data?.meta || { page: 1, total: 0, totalPages: 1 };
    const planLabels: Record<string, string> = { BASIC: 'أساسية', PROFESSIONAL: 'احترافية', ENTERPRISE: 'مؤسسية' };

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>المكاتب المسجلة</h1>
                <span style={{ color: '#64748b', fontSize: '14px' }}>{meta.total} مكتب</span>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="🔍 بحث بالاسم أو الرابط..."
                    style={{
                        flex: 1, minWidth: '200px', padding: '10px 16px',
                        background: '#1e293b', border: '1px solid #334155',
                        borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none',
                    }}
                />
                <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
                    style={{
                        padding: '10px 16px', background: '#1e293b', border: '1px solid #334155',
                        borderRadius: '12px', color: '#e2e8f0', fontSize: '14px', outline: 'none',
                    }}>
                    <option value="">كل الباقات</option>
                    <option value="BASIC">أساسية</option>
                    <option value="PROFESSIONAL">احترافية</option>
                    <option value="ENTERPRISE">مؤسسية</option>
                </select>
                <select value={frozenFilter} onChange={e => { setFrozenFilter(e.target.value); setPage(1); }}
                    style={{
                        padding: '10px 16px', background: '#1e293b', border: '1px solid #334155',
                        borderRadius: '12px', color: '#e2e8f0', fontSize: '14px', outline: 'none',
                    }}>
                    <option value="">كل الحالات</option>
                    <option value="false">نشط</option>
                    <option value="true">مجمّد</option>
                </select>
            </div>

            {/* Table */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b' }}>
                            {['المكتب', 'المالك', 'الباقة', 'المدينة', 'الحالة', 'القضايا', 'المستخدمون', 'التسجيل'].map(h => (
                                <th key={h} style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px', fontWeight: 500, textAlign: 'right' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map((t: any) => (
                            <tr key={t.id}
                                onClick={() => navigate(`/super-admin/tenants/${t.id}`)}
                                style={{ borderBottom: '1px solid #1e293b', cursor: 'pointer', transition: 'background 0.15s' }}
                                onMouseOver={e => (e.currentTarget.style.background = '#1e293b')}
                                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: 'rgba(99,102,241,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#818cf8', fontWeight: 700, fontSize: '13px',
                                        }}>{t.name?.charAt(0)}</div>
                                        <div>
                                            <p style={{ color: '#fff', fontSize: '13px', fontWeight: 500, margin: 0 }}>{t.name}</p>
                                            <p style={{ color: '#475569', fontSize: '11px', margin: 0 }}>{t.slug}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>
                                    {t.users?.[0]?.name || '—'}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <span style={{
                                        fontSize: '11px', padding: '3px 10px', borderRadius: '8px',
                                        background: t.planType === 'ENTERPRISE' ? 'rgba(139,92,246,0.2)' : t.planType === 'PROFESSIONAL' ? 'rgba(99,102,241,0.2)' : 'rgba(100,116,139,0.2)',
                                        color: t.planType === 'ENTERPRISE' ? '#c084fc' : t.planType === 'PROFESSIONAL' ? '#818cf8' : '#94a3b8',
                                    }}>{planLabels[t.planType] || t.planType}</span>
                                </td>
                                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{t.city || '—'}</td>
                                <td style={{ padding: '14px 16px' }}>
                                    {t.isFrozen ? (
                                        <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: '11px', padding: '3px 10px', borderRadius: '8px' }}>🔒 مجمّد</span>
                                    ) : (
                                        <span style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontSize: '11px', padding: '3px 10px', borderRadius: '8px' }}>نشط</span>
                                    )}
                                </td>
                                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>{t._count?.cases ?? 0}</td>
                                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>{t._count?.users ?? 0}</td>
                                <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px' }}>
                                    {new Date(t.createdAt).toLocaleDateString('ar-SA')}
                                </td>
                            </tr>
                        ))}
                        {tenants.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>
                                    {search ? 'لا توجد نتائج للبحث' : 'لا توجد مكاتب مسجلة'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 500,
                                background: p === page ? '#4f46e5' : '#1e293b',
                                color: p === page ? '#fff' : '#94a3b8',
                            }}>{p}</button>
                    ))}
                </div>
            )}
        </div>
    );
}

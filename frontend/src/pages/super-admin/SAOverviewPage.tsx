import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/api/superAdmin';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
        indigo: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', text: '#818cf8' },
        green: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#4ade80' },
        amber: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' },
        purple: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: '#c084fc' },
    };
    const c = colors[color] || colors.indigo;

    return (
        <div style={{
            background: '#0f172a', border: `1px solid ${c.border}`, borderRadius: '16px', padding: '20px',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>{label}</span>
                <span style={{
                    width: '36px', height: '36px', background: c.bg, borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>{icon}</span>
            </div>
            <p style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: 0 }}>{value ?? '—'}</p>
        </div>
    );
};

export default function SAOverviewPage() {
    const navigate = useNavigate();
    const { data: stats } = useQuery({ queryKey: ['sa-overview'], queryFn: superAdminApi.getOverview, refetchInterval: 30000 });
    const { data: recent } = useQuery({ queryKey: ['sa-recent'], queryFn: () => superAdminApi.getRecent(10) });

    const planLabels: Record<string, string> = { BASIC: 'أساسية', PROFESSIONAL: 'احترافية', ENTERPRISE: 'مؤسسية' };

    return (
        <div style={{ padding: '28px' }}>
            <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '24px' }}>نظرة عامة</h1>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <StatCard label="إجمالي المكاتب" value={stats?.tenants?.total} icon="🏢" color="indigo" />
                <StatCard label="مكاتب نشطة" value={stats?.tenants?.active} icon="✅" color="green" />
                <StatCard label="الإيراد التقديري" value={stats?.revenue?.estimated ? `${stats.revenue.estimated.toLocaleString()} ر.س` : '—'} icon="💰" color="amber" />
                <StatCard label="محادثات مفتوحة" value={stats?.support?.openChats} icon="💬" color="purple" />
            </div>

            {/* Plan Distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { plan: 'Basic', key: 'basic', price: 500, color: '#64748b' },
                    { plan: 'Professional', key: 'professional', price: 1500, color: '#6366f1' },
                    { plan: 'Enterprise', key: 'enterprise', price: 3500, color: '#8b5cf6' },
                ].map(p => (
                    <div key={p.plan} style={{
                        background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{p.plan}</span>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>{p.price} ر.س/شهر</span>
                        </div>
                        <p style={{ color: '#fff', fontSize: '32px', fontWeight: 700, margin: '4px 0' }}>
                            {stats?.plans?.[p.key] ?? 0}
                        </p>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                            {((stats?.plans?.[p.key] ?? 0) * p.price).toLocaleString()} ر.س/شهر
                        </p>
                    </div>
                ))}
            </div>

            {/* Growth Indicator */}
            {stats?.tenants && (
                <div style={{
                    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', marginBottom: '24px',
                    display: 'flex', gap: '32px',
                }}>
                    <div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 4px' }}>تسجيلات هذا الشهر</p>
                        <p style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>{stats.tenants.newThisMonth}</p>
                    </div>
                    <div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 4px' }}>نمو</p>
                        <p style={{ color: stats.tenants.growth >= 0 ? '#4ade80' : '#f87171', fontSize: '24px', fontWeight: 700, margin: 0 }}>
                            {stats.tenants.growth >= 0 ? '+' : ''}{stats.tenants.growth}%
                        </p>
                    </div>
                    <div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 4px' }}>مكاتب مجمّدة</p>
                        <p style={{ color: '#fbbf24', fontSize: '24px', fontWeight: 700, margin: 0 }}>{stats.tenants.frozen}</p>
                    </div>
                </div>
            )}

            {/* Recent Registrations */}
            <div style={{
                background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px',
            }}>
                <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>آخر التسجيلات</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(recent || []).map((t: any) => (
                        <div key={t.id}
                            onClick={() => navigate(`/super-admin/tenants/${t.id}`)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px', background: '#1e293b', borderRadius: '12px',
                                cursor: 'pointer', transition: 'background 0.2s',
                            }}
                            onMouseOver={e => (e.currentTarget.style.background = '#334155')}
                            onMouseOut={e => (e.currentTarget.style.background = '#1e293b')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '36px', height: '36px', background: 'rgba(99,102,241,0.2)',
                                    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#818cf8', fontWeight: 700, fontSize: '14px',
                                }}>{t.name?.charAt(0)}</div>
                                <div>
                                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: 500, margin: 0 }}>
                                        {t.name}
                                        {t.isFrozen && <span style={{
                                            background: 'rgba(239,68,68,0.2)', color: '#f87171',
                                            fontSize: '11px', padding: '2px 8px', borderRadius: '8px', marginRight: '8px',
                                        }}>مجمّد</span>}
                                    </p>
                                    <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                                        {t.slug} · {t.city || '—'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <span style={{
                                    background: t.planType === 'ENTERPRISE' ? 'rgba(139,92,246,0.2)' : t.planType === 'PROFESSIONAL' ? 'rgba(99,102,241,0.2)' : 'rgba(100,116,139,0.2)',
                                    color: t.planType === 'ENTERPRISE' ? '#c084fc' : t.planType === 'PROFESSIONAL' ? '#818cf8' : '#94a3b8',
                                    fontSize: '11px', padding: '3px 10px', borderRadius: '8px',
                                }}>{planLabels[t.planType] || t.planType}</span>
                                <p style={{ color: '#475569', fontSize: '11px', margin: '4px 0 0' }}>
                                    {new Date(t.createdAt).toLocaleDateString('ar-SA')}
                                </p>
                            </div>
                        </div>
                    ))}
                    {(!recent || recent.length === 0) && (
                        <p style={{ color: '#475569', textAlign: 'center', padding: '20px', fontSize: '14px' }}>
                            لا توجد تسجيلات بعد
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

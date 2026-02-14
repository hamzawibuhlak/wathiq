import { useQuery } from '@tanstack/react-query';
import { marketingApi } from '@/api/marketing';
import { Users, Target, Zap, TrendingUp, Phone, Star, Megaphone } from 'lucide-react';
import { useSlugPath } from '@/hooks/useSlugPath';

const SOURCE_LABELS: Record<string, string> = {
    GOOGLE_ADS: 'إعلان جوجل', META_ADS: 'إعلان ميتا', TIKTOK_ADS: 'تيك توك',
    REFERRAL: 'توصية', AFFILIATE: 'عمولة', ORGANIC_SEARCH: 'بحث طبيعي',
    SOCIAL_MEDIA: 'سوشل ميديا', PHONE_CALL: 'اتصال هاتفي', WALK_IN: 'زيارة مباشرة',
    WEBSITE: 'الموقع', OTHER: 'أخرى',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    NEW: { label: 'جديد', color: '#94a3b8' },
    CONTACTED: { label: 'تم التواصل', color: '#3b82f6' },
    QUALIFIED: { label: 'مؤهل', color: '#8b5cf6' },
    PROPOSAL: { label: 'عرض مُقدَّم', color: '#f59e0b' },
    WON: { label: 'تحول لعميل', color: '#10b981' },
    LOST: { label: 'خسرنا اهتمامه', color: '#ef4444' },
    NURTURING: { label: 'قيد المتابعة', color: '#06b6d4' },
};

export default function MarketingDashboard() {
    const { nav } = useSlugPath();
    const { data: leadStats } = useQuery({ queryKey: ['leads-stats'], queryFn: marketingApi.getLeadStats });
    const { data: affiliateStats } = useQuery({ queryKey: ['affiliate-stats'], queryFn: marketingApi.getAffiliateStats });
    const { data: callStats } = useQuery({ queryKey: ['call-stats'], queryFn: marketingApi.getCallStats });

    return (
        <div style={{ padding: 28 }} dir="rtl">
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>لوحة التسويق</h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>نظرة عامة على جميع الأنشطة التسويقية</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <KpiCard
                    title="إجمالي العملاء المحتملين"
                    value={leadStats?.total || 0}
                    icon={<Users style={{ width: 20, height: 20, color: '#3b82f6' }} />}
                    bg="#eff6ff"
                    subtitle={`+${leadStats?.newToday || 0} اليوم`}
                    onClick={() => nav('/marketing/leads')}
                />
                <KpiCard
                    title="نسبة التحويل"
                    value={`${leadStats?.conversionRate || 0}%`}
                    icon={<Target style={{ width: 20, height: 20, color: '#10b981' }} />}
                    bg="#ecfdf5"
                    subtitle="من عميل محتمل لعميل"
                />
                <KpiCard
                    title="مكالمات اليوم"
                    value={callStats?.todayCalls || 0}
                    icon={<Phone style={{ width: 20, height: 20, color: '#8b5cf6' }} />}
                    bg="#f5f3ff"
                    subtitle={`معدل الرد ${callStats?.answerRate || 0}%`}
                    onClick={() => nav('/marketing/telemarketing')}
                />
                <KpiCard
                    title="عمولات معلقة"
                    value={`${(affiliateStats?.pendingAmount || 0).toLocaleString('ar-SA')} ر.س`}
                    icon={<Zap style={{ width: 20, height: 20, color: '#f59e0b' }} />}
                    bg="#fffbeb"
                    subtitle={`${affiliateStats?.pendingCount || 0} عمولة`}
                    onClick={() => nav('/marketing/affiliate')}
                />
            </div>

            {/* Row 2: Conversion Funnel + Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Conversion Funnel */}
                <div style={{
                    background: '#fff', borderRadius: 16, padding: 24,
                    border: '1px solid #e2e8f0',
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp style={{ width: 18, height: 18, color: '#10b981' }} />
                        مسار التحويل (Sales Funnel)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {leadStats?.byStatus?.map((s: any) => {
                            const info = STATUS_LABELS[s.status] || { label: s.status, color: '#94a3b8' };
                            const pct = leadStats?.total > 0 ? Math.round((s._count / leadStats.total) * 100) : 0;
                            return (
                                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ width: 100, fontSize: 12, color: '#64748b', textAlign: 'left' }}>{info.label}</span>
                                    <div style={{ flex: 1, height: 28, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 8,
                                            background: `linear-gradient(90deg, ${info.color}, ${info.color}dd)`,
                                            width: `${Math.max(pct, 3)}%`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingLeft: 8, paddingRight: 8,
                                            transition: 'width 0.6s ease',
                                        }}>
                                            <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{s._count}</span>
                                        </div>
                                    </div>
                                    <span style={{ width: 40, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{
                    background: '#fff', borderRadius: 16, padding: 24,
                    border: '1px solid #e2e8f0',
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>إجراءات سريعة</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { label: 'إضافة عميل محتمل', icon: Users, href: '/marketing/leads', color: '#3b82f6' },
                            { label: 'بدء حملة جديدة', icon: Megaphone, href: '/marketing/campaigns', color: '#8b5cf6' },
                            { label: 'إضافة مسوق بالعمولة', icon: Star, href: '/marketing/affiliate', color: '#f59e0b' },
                            { label: 'جدولة محتوى', icon: TrendingUp, href: '/marketing/calendar', color: '#10b981' },
                        ].map(action => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.label}
                                    onClick={() => nav(action.href)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '12px 14px', borderRadius: 12,
                                        border: '1px solid #e2e8f0', background: '#fff',
                                        cursor: 'pointer', textAlign: 'right', transition: 'all 0.2s',
                                        fontSize: 13, color: '#334155',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = action.color; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                >
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 10,
                                        background: `${action.color}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Icon style={{ width: 16, height: 16, color: action.color }} />
                                    </div>
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Row 3: Lead Sources */}
            <div style={{
                background: '#fff', borderRadius: 16, padding: 24,
                border: '1px solid #e2e8f0',
            }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
                    مصادر العملاء المحتملين
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                    {leadStats?.bySource?.map((s: any) => (
                        <div key={s.source} style={{
                            textAlign: 'center', padding: 16,
                            background: '#f8fafc', borderRadius: 12,
                            border: '1px solid #e2e8f0',
                        }}>
                            <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{s._count}</p>
                            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                {SOURCE_LABELS[s.source] || s.source}
                            </p>
                        </div>
                    ))}
                    {(!leadStats?.bySource || leadStats.bySource.length === 0) && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            لا توجد بيانات بعد
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, bg, subtitle, onClick }: any) {
    return (
        <div
            onClick={onClick}
            style={{
                background: '#fff', borderRadius: 16, padding: 20,
                border: '1px solid #e2e8f0',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{title}</p>
                <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {icon}
                </div>
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>{value}</p>
            {subtitle && <p style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>↑ {subtitle}</p>}
        </div>
    );
}

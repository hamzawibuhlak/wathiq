import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, DollarSign, MousePointerClick, Eye, Target, Wifi, WifiOff } from 'lucide-react';
import { marketingApi } from '@/api/marketing';

const PLATFORM_COLORS: Record<string, { label: string; color: string; icon: string }> = {
    GOOGLE_ADS: { label: 'إعلانات جوجل', color: '#ea4335', icon: '🔍' },
    META: { label: 'ميتا / فيسبوك', color: '#1877f2', icon: '📘' },
    TIKTOK: { label: 'تيك توك', color: '#000000', icon: '🎵' },
    SNAPCHAT: { label: 'سناب شات', color: '#fffc00', icon: '👻' },
    TWITTER: { label: 'تويتر / X', color: '#1da1f2', icon: '🐦' },
};

export default function AdsAnalyticsPage() {
    const [dateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
    });

    const { data: connections } = useQuery({ queryKey: ['ads-connections'], queryFn: marketingApi.getAdsConnections });
    const { data: dashboard } = useQuery({
        queryKey: ['ads-dashboard', dateRange],
        queryFn: () => marketingApi.getAdsDashboard(dateRange),
    });

    const totals = dashboard?.totals || {};

    return (
        <div style={{ padding: 28 }} dir="rtl">
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>نتائج الإعلانات</h1>

            {/* Connected Platforms */}
            <div style={{
                background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', marginBottom: 24,
            }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>المنصات المتصلة</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                    {Object.entries(PLATFORM_COLORS).map(([key, info]) => {
                        const connected = connections?.find((c: any) => c.platform === key);
                        return (
                            <div key={key} style={{
                                flex: 1, padding: 16, borderRadius: 14,
                                border: `1px solid ${connected ? info.color + '30' : '#e2e8f0'}`,
                                background: connected ? `${info.color}08` : '#f8fafc',
                                textAlign: 'center',
                            }}>
                                <span style={{ fontSize: 24 }}>{info.icon}</span>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '6px 0 4px' }}>{info.label}</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                    {connected ? (
                                        <>
                                            <Wifi style={{ width: 12, height: 12, color: '#10b981' }} />
                                            <span style={{ fontSize: 10, color: '#10b981' }}>متصل</span>
                                        </>
                                    ) : (
                                        <>
                                            <WifiOff style={{ width: 12, height: 12, color: '#94a3b8' }} />
                                            <span style={{ fontSize: 10, color: '#94a3b8' }}>غير متصل</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
                <KpiCard icon={<DollarSign />} label="إجمالي الإنفاق"
                    value={`${(totals.totalSpend || 0).toLocaleString('ar-SA')} ر.س`}
                    color="#ef4444" bg="#fef2f2" />
                <KpiCard icon={<Eye />} label="المشاهدات"
                    value={(totals.totalImpressions || 0).toLocaleString('ar-SA')}
                    color="#3b82f6" bg="#eff6ff" />
                <KpiCard icon={<MousePointerClick />} label="النقرات"
                    value={(totals.totalClicks || 0).toLocaleString('ar-SA')}
                    color="#8b5cf6" bg="#f5f3ff" />
                <KpiCard icon={<Target />} label="التحويلات"
                    value={(totals.totalConversions || 0).toLocaleString('ar-SA')}
                    color="#10b981" bg="#ecfdf5" />
                <KpiCard icon={<TrendingUp />} label="CTR"
                    value={`${(totals.ctr || 0).toFixed(2)}%`}
                    color="#f59e0b" bg="#fffbeb" />
            </div>

            {/* Cost Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
                <CostCard label="تكلفة النقرة (CPC)" value={`${(totals.avgCpc || 0).toFixed(2)} ر.س`} />
                <CostCard label="تكلفة العميل (CPL)" value={`${(totals.avgCpl || 0).toFixed(2)} ر.س`} />
                <CostCard label="العائد على الإنفاق (ROAS)"
                    value={totals.totalSpend > 0 ? `${((totals.totalConversions * 1000) / totals.totalSpend).toFixed(2)}x` : '0x'} />
            </div>

            {/* Platform Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* By Platform */}
                <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChart3 style={{ width: 16, height: 16, color: '#3b82f6' }} />
                        الأداء حسب المنصة
                    </h3>
                    {dashboard?.byPlatform && Object.entries(dashboard.byPlatform).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {Object.entries(dashboard.byPlatform).map(([platform, data]: any) => {
                                const info = PLATFORM_COLORS[platform] || { label: platform, color: '#94a3b8', icon: '📊' };
                                return (
                                    <div key={platform} style={{
                                        padding: 14, borderRadius: 12, background: '#f8fafc',
                                        border: `1px solid ${info.color}20`,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                                                {info.icon} {info.label}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>
                                                {data.spend.toLocaleString('ar-SA')} ر.س
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11, color: '#64748b' }}>
                                            <span>مشاهدات: {data.impressions.toLocaleString('ar-SA')}</span>
                                            <span>نقرات: {data.clicks.toLocaleString('ar-SA')}</span>
                                            <span>تحويلات: {data.conversions}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>لا توجد بيانات بعد</p>
                    )}
                </div>

                {/* Daily Trend */}
                <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp style={{ width: 16, height: 16, color: '#10b981' }} />
                        الاتجاه اليومي
                    </h3>
                    {dashboard?.dailyTrend && dashboard.dailyTrend.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflow: 'auto' }}>
                            {dashboard.dailyTrend.slice(-14).map((day: any) => {
                                const maxSpend = Math.max(...dashboard.dailyTrend.map((d: any) => d.spend));
                                const pct = maxSpend > 0 ? (day.spend / maxSpend) * 100 : 0;
                                return (
                                    <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ width: 70, fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                                            {new Date(day.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <div style={{ flex: 1, height: 20, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 4,
                                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                                width: `${Math.max(pct, 2)}%`,
                                            }} />
                                        </div>
                                        <span style={{ width: 60, fontSize: 10, color: '#64748b', textAlign: 'left' }}>
                                            {day.spend.toFixed(0)} ر.س
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>لا توجد بيانات بعد</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function KpiCard({ icon, label, value, color, bg }: any) {
    return (
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 10, background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: color,
                }}>
                    {icon}
                </div>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{value}</p>
        </div>
    );
}

function CostCard({ label, value }: any) {
    return (
        <div style={{
            background: '#fff', borderRadius: 14, padding: 20,
            border: '1px solid #e2e8f0', textAlign: 'center',
        }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{value}</p>
        </div>
    );
}

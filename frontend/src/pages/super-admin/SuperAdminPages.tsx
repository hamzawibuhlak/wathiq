import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { BarChart3, Users, Building2, CreditCard, Activity, Flag, Bell, FileText, Shield, TrendingUp, AlertTriangle, CheckCircle, ChevronLeft, Search, Eye, Ban, Plus, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchApi(url: string, options?: RequestInit) {
    const token = useAuthStore.getState().token;
    const res = await fetch(url, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) throw new Error('فشل في العملية');
    return res.json();
}

// ===================== LAYOUT =====================

const navItems = [
    { path: '/super-admin', icon: BarChart3, label: 'لوحة التحكم' },
    { path: '/super-admin/tenants', icon: Building2, label: 'المستأجرين' },
    { path: '/super-admin/plans', icon: CreditCard, label: 'خطط الاشتراك' },
    { path: '/super-admin/feature-flags', icon: Flag, label: 'الميزات' },
    { path: '/super-admin/announcements', icon: Bell, label: 'الإعلانات' },
    { path: '/super-admin/health', icon: Activity, label: 'صحة النظام' },
    { path: '/super-admin/audit-logs', icon: FileText, label: 'سجل التدقيق' },
];

export function SuperAdminLayout() {
    const location = useLocation();
    const user = useAuthStore((s: any) => s.user);

    return (
        <div dir="rtl" style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'Inter, Tajawal, sans-serif' }}>
            {/* Sidebar */}
            <aside style={{ width: 260, background: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '1.5rem 0' }}>
                <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Shield size={28} color="#818cf8" />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 18, color: '#818cf8' }}>وثيق</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>لوحة تحكم المدير</div>
                        </div>
                    </div>
                </div>
                <nav style={{ flex: 1 }}>
                    {navItems.map((item) => {
                        const active = location.pathname === item.path || (item.path !== '/super-admin' && location.pathname.startsWith(item.path));
                        return (
                            <Link key={item.path} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 1.5rem', color: active ? '#818cf8' : '#94a3b8', background: active ? '#818cf81a' : 'transparent', textDecoration: 'none', borderRight: active ? '3px solid #818cf8' : '3px solid transparent', fontSize: 14, transition: 'all 0.2s' }}>
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #334155' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>Super Admin</div>
                </div>
            </aside>
            {/* Main */}
            <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}

// ===================== DASHBOARD =====================

export function SuperAdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi(`${API}/super-admin/dashboard`).then(setStats).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>جاري التحميل...</div>;
    if (!stats) return <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>فشل تحميل البيانات</div>;

    const cards = [
        { label: 'إجمالي المستأجرين', value: stats.tenants?.total || 0, icon: Building2, color: '#818cf8' },
        { label: 'اشتراكات نشطة', value: stats.tenants?.active || 0, icon: CheckCircle, color: '#34d399' },
        { label: 'فترة تجريبية', value: stats.tenants?.trial || 0, icon: Activity, color: '#fbbf24' },
        { label: 'موقوف', value: stats.tenants?.suspended || 0, icon: AlertTriangle, color: '#ef4444' },
        { label: 'إجمالي المستخدمين', value: stats.users?.total || 0, icon: Users, color: '#60a5fa' },
        { label: 'إجمالي القضايا', value: stats.cases?.total || 0, icon: FileText, color: '#a78bfa' },
        { label: 'الإيراد الشهري (MRR)', value: `${stats.revenue?.mrr || 0} ر.س`, icon: TrendingUp, color: '#34d399' },
        { label: 'معدل التذبذب', value: `${stats.health?.churnRate || 0}%`, icon: AlertTriangle, color: '#f87171' },
    ];

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: '1.5rem', color: '#f1f5f9' }}>لوحة التحكم الرئيسية</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {cards.map((c, i) => (
                    <div key={i} style={{ background: '#1e293b', borderRadius: 12, padding: '1.25rem', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: '#94a3b8' }}>{c.label}</span>
                            <c.icon size={20} color={c.color} />
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </div>
            {stats.tenants?.newThisMonth !== undefined && (
                <div style={{ marginTop: '2rem', background: '#1e293b', borderRadius: 12, padding: '1.5rem', border: '1px solid #334155' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f1f5f9' }}>ملخص الشهر</h3>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div><span style={{ color: '#94a3b8' }}>مستأجرين جدد: </span><strong style={{ color: '#34d399' }}>{stats.tenants.newThisMonth}</strong></div>
                        <div><span style={{ color: '#94a3b8' }}>نسبة النمو: </span><strong style={{ color: stats.tenants.growthRate >= 0 ? '#34d399' : '#ef4444' }}>{stats.tenants.growthRate}%</strong></div>
                        <div><span style={{ color: '#94a3b8' }}>إيراد سنوي (ARR): </span><strong style={{ color: '#818cf8' }}>{stats.revenue?.arr || 0} ر.س</strong></div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===================== TENANTS =====================

export function TenantsPage() {
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const load = (s?: string) => {
        setLoading(true);
        fetchApi(`${API}/super-admin/tenants?search=${s || ''}`).then(setData).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>إدارة المستأجرين</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', right: 10, top: 10, color: '#64748b' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(search)} placeholder="بحث..." style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 36px 8px 12px', color: '#e2e8f0', fontSize: 14 }} />
                    </div>
                </div>
            </div>
            {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>جاري التحميل...</div> : (
                <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155' }}>
                                {['المكتب', 'البريد', 'الخطة', 'المستخدمين', 'القضايا', 'الحالة', 'إجراءات'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data?.data?.map((t: any) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '12px 16px', fontSize: 14 }}>{t.name}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>{t.email}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 13 }}><span style={{ background: '#818cf820', color: '#818cf8', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>{t.subscription?.plan?.nameAr || 'بدون'}</span></td>
                                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{t._count?.users || 0}</td>
                                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{t._count?.cases || 0}</td>
                                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: t.isActive ? '#34d39920' : '#ef444420', color: t.isActive ? '#34d399' : '#ef4444' }}>{t.isActive ? 'نشط' : 'موقوف'}</span></td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <Link to={`/super-admin/tenants/${t.id}`} style={{ padding: 6, borderRadius: 6, background: '#334155', color: '#94a3b8', border: 'none', cursor: 'pointer', display: 'flex' }}><Eye size={14} /></Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data?.meta && <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', fontSize: 12, color: '#64748b' }}>إجمالي: {data.meta.total} مستأجر</div>}
                </div>
            )}
        </div>
    );
}

// ===================== TENANT DETAILS =====================

export function TenantDetailsPage() {
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const id = window.location.pathname.split('/').pop();
    const user = useAuthStore((s: any) => s.user);

    useEffect(() => {
        fetchApi(`${API}/super-admin/tenants/${id}`).then(setTenant).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    const handleSuspend = async () => {
        if (!confirm('هل أنت متأكد من إيقاف هذا المستأجر؟')) return;
        await fetchApi(`${API}/super-admin/tenants/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ adminId: user?.id, reason: 'إيقاف إداري' }) });
        window.location.reload();
    };

    const handleActivate = async () => {
        await fetchApi(`${API}/super-admin/tenants/${id}/activate`, { method: 'PATCH', body: JSON.stringify({ adminId: user?.id }) });
        window.location.reload();
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>جاري التحميل...</div>;
    if (!tenant) return <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>المستأجر غير موجود</div>;

    return (
        <div>
            <Link to="/super-admin/tenants" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#818cf8', textDecoration: 'none', marginBottom: '1rem', fontSize: 14 }}>
                <ChevronLeft size={16} /> العودة للقائمة
            </Link>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>{tenant.name}</h1>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>{tenant.email}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {tenant.isActive ? (
                        <button onClick={handleSuspend} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}><Ban size={14} /> إيقاف</button>
                    ) : (
                        <button onClick={handleActivate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#34d399', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}><CheckCircle size={14} /> تفعيل</button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'المستخدمين', value: tenant._count?.users || 0 },
                    { label: 'القضايا', value: tenant._count?.cases || 0 },
                    { label: 'العملاء', value: tenant._count?.clients || 0 },
                    { label: 'المستندات', value: tenant._count?.documents || 0 },
                    { label: 'قضايا آخر 30 يوم', value: tenant.activity?.recentCases || 0 },
                    { label: 'مستخدمين نشطين', value: tenant.activity?.activeUsers || 0 },
                ].map((c, i) => (
                    <div key={i} style={{ background: '#1e293b', borderRadius: 12, padding: '1rem', border: '1px solid #334155' }}>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>{c.value}</div>
                    </div>
                ))}
            </div>

            {tenant.subscription && (
                <div style={{ background: '#1e293b', borderRadius: 12, padding: '1.5rem', border: '1px solid #334155' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f1f5f9' }}>تفاصيل الاشتراك</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div><span style={{ color: '#94a3b8', fontSize: 13 }}>الخطة:</span><br /><strong>{tenant.subscription.plan?.nameAr}</strong></div>
                        <div><span style={{ color: '#94a3b8', fontSize: 13 }}>الحالة:</span><br /><strong style={{ color: tenant.subscription.status === 'ACTIVE' ? '#34d399' : '#fbbf24' }}>{tenant.subscription.status}</strong></div>
                        <div><span style={{ color: '#94a3b8', fontSize: 13 }}>المبلغ:</span><br /><strong>{Number(tenant.subscription.amount)} ر.س/{tenant.subscription.billingCycle === 'MONTHLY' ? 'شهري' : 'سنوي'}</strong></div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ===================== PLANS =====================

export function SubscriptionPlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi(`${API}/super-admin/plans`).then(setPlans).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>جاري التحميل...</div>;

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: '1.5rem', color: '#f1f5f9' }}>خطط الاشتراك</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {plans.map((p: any) => (
                    <div key={p.id} style={{ background: '#1e293b', borderRadius: 16, padding: '1.5rem', border: p.isPopular ? '2px solid #818cf8' : '1px solid #334155', position: 'relative' }}>
                        {p.isPopular && <span style={{ position: 'absolute', top: -10, right: 16, background: '#818cf8', color: '#fff', fontSize: 11, padding: '2px 10px', borderRadius: 10 }}>الأكثر شيوعاً</span>}
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{p.nameAr}</h3>
                        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>{p.descriptionAr || p.description}</p>
                        <div style={{ marginBottom: 16 }}>
                            <span style={{ fontSize: 32, fontWeight: 800, color: '#818cf8' }}>{Number(p.monthlyPrice)}</span>
                            <span style={{ color: '#94a3b8', fontSize: 13 }}> ر.س/شهر</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 2 }}>
                            <div>👥 حد المستخدمين: <strong style={{ color: '#e2e8f0' }}>{p.maxUsers}</strong></div>
                            <div>📁 حد القضايا: <strong style={{ color: '#e2e8f0' }}>{p.maxCases}</strong></div>
                            <div>💾 التخزين: <strong style={{ color: '#e2e8f0' }}>{p.maxStorageGB} GB</strong></div>
                            <div>👤 حد العملاء: <strong style={{ color: '#e2e8f0' }}>{p.maxClients}</strong></div>
                        </div>
                        <div style={{ borderTop: '1px solid #334155', marginTop: 12, paddingTop: 12, fontSize: 12, color: '#64748b' }}>
                            {p._count?.subscriptions || 0} اشتراك نشط
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ===================== FEATURE FLAGS =====================

export function FeatureFlagsPage() {
    const [flags, setFlags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const user = useAuthStore((s: any) => s.user);

    const load = () => fetchApi(`${API}/super-admin/feature-flags`).then(setFlags).catch(console.error).finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const toggle = async (key: string, current: boolean) => {
        await fetchApi(`${API}/super-admin/feature-flags/${key}`, { method: 'PATCH', body: JSON.stringify({ isEnabled: !current, adminId: user?.id }) });
        load();
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>جاري التحميل...</div>;

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: '1.5rem', color: '#f1f5f9' }}>إدارة الميزات</h1>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
                {flags.map((f: any, i: number) => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: i < flags.length - 1 ? '1px solid #334155' : 'none' }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{f.name}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{f.key} {f.description && `— ${f.description}`}</div>
                        </div>
                        <button onClick={() => toggle(f.key, f.isEnabled)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: f.isEnabled ? '#34d399' : '#64748b' }}>
                            {f.isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                    </div>
                ))}
                {flags.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>لا توجد ميزات بعد</div>}
            </div>
        </div>
    );
}

// ===================== ANNOUNCEMENTS =====================

export function AnnouncementsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', titleAr: '', content: '', contentAr: '', type: 'INFO', startDate: new Date().toISOString().split('T')[0] });
    const user = useAuthStore((s: any) => s.user);

    const load = () => fetchApi(`${API}/super-admin/announcements`).then(setItems).catch(console.error).finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const submit = async () => {
        await fetchApi(`${API}/super-admin/announcements`, { method: 'POST', body: JSON.stringify({ ...form, startDate: new Date(form.startDate), adminId: user?.id }) });
        setShowForm(false);
        load();
    };

    const typeColors: any = { INFO: '#60a5fa', WARNING: '#fbbf24', MAINTENANCE: '#f87171', NEW_FEATURE: '#34d399' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>الإعلانات</h1>
                <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#818cf8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}><Plus size={14} /> إعلان جديد</button>
            </div>

            {showForm && (
                <div style={{ background: '#1e293b', borderRadius: 12, padding: '1.5rem', border: '1px solid #334155', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title (EN)" style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14 }} />
                        <input value={form.titleAr} onChange={e => setForm({ ...form, titleAr: e.target.value })} placeholder="العنوان (عربي)" style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14 }} />
                    </div>
                    <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Content" rows={3} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14, resize: 'vertical', marginBottom: '1rem' }} />
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14 }}>
                            <option value="INFO">معلومات</option>
                            <option value="WARNING">تحذير</option>
                            <option value="MAINTENANCE">صيانة</option>
                            <option value="NEW_FEATURE">ميزة جديدة</option>
                        </select>
                        <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14 }} />
                        <button onClick={submit} style={{ padding: '8px 20px', background: '#34d399', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>نشر</button>
                    </div>
                </div>
            )}

            {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>جاري التحميل...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.map((a: any) => (
                        <div key={a.id} style={{ background: '#1e293b', borderRadius: 12, padding: '1.25rem', border: '1px solid #334155', borderRight: `4px solid ${typeColors[a.type] || '#818cf8'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{a.titleAr || a.title}</h3>
                                <span style={{ fontSize: 11, color: typeColors[a.type], background: `${typeColors[a.type]}20`, padding: '2px 8px', borderRadius: 6 }}>{a.type}</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>{a.contentAr || a.content}</p>
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>{new Date(a.createdAt).toLocaleDateString('ar-SA')}</div>
                        </div>
                    ))}
                    {items.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>لا توجد إعلانات</div>}
                </div>
            )}
        </div>
    );
}

// ===================== SYSTEM HEALTH =====================

export function SystemHealthPage() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const load = () => { setLoading(true); fetchApi(`${API}/super-admin/system/health`).then(setHealth).catch(console.error).finally(() => setLoading(false)); };
    useEffect(() => { load(); }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>جاري التحميل...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>صحة النظام</h1>
                <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}><RefreshCw size={14} /> تحديث</button>
            </div>

            {health && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1e293b', borderRadius: 12, padding: '1.25rem', border: '1px solid #334155', marginBottom: '1.5rem' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: health.status === 'healthy' ? '#34d399' : '#ef4444' }} />
                        <span style={{ fontSize: 18, fontWeight: 700, color: health.status === 'healthy' ? '#34d399' : '#ef4444' }}>
                            {health.status === 'healthy' ? 'النظام يعمل بشكل طبيعي' : 'يوجد مشكلة في النظام'}
                        </span>
                        <span style={{ fontSize: 12, color: '#64748b', marginRight: 'auto' }}>{new Date(health.timestamp).toLocaleString('ar-SA')}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'سجلات آخر 24 ساعة', value: health.metrics?.last24h?.totalLogs || 0 },
                            { label: 'أخطاء', value: health.metrics?.last24h?.errorCount || 0, color: '#ef4444' },
                            { label: 'نسبة الأخطاء', value: `${health.metrics?.last24h?.errorRate || 0}%` },
                            { label: 'مستخدمين نشطين', value: health.metrics?.last24h?.activeUsers || 0, color: '#34d399' },
                        ].map((c, i) => (
                            <div key={i} style={{ background: '#1e293b', borderRadius: 12, padding: '1rem', border: '1px solid #334155' }}>
                                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{c.label}</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: c.color || '#f1f5f9' }}>{c.value}</div>
                            </div>
                        ))}
                    </div>

                    {health.database && Array.isArray(health.database) && health.database[0] && (
                        <div style={{ background: '#1e293b', borderRadius: 12, padding: '1.5rem', border: '1px solid #334155' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#f1f5f9' }}>قاعدة البيانات</h3>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div><span style={{ color: '#94a3b8', fontSize: 13 }}>الحجم: </span><strong>{health.database[0].db_size}</strong></div>
                                <div><span style={{ color: '#94a3b8', fontSize: 13 }}>الاتصالات: </span><strong>{String(health.database[0].connections)}</strong></div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ===================== AUDIT LOGS =====================

export function AuditLogsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState('');

    const load = (act?: string) => {
        setLoading(true);
        fetchApi(`${API}/super-admin/audit-logs?action=${act || ''}`).then(setData).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>سجل التدقيق</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input value={action} onChange={e => setAction(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(action)} placeholder="فلتر حسب الإجراء..." style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 14, width: 200 }} />
                </div>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>جاري التحميل...</div> : (
                <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155' }}>
                                {['التاريخ', 'الإجراء', 'المورد', 'المنفذ', 'تفاصيل'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data?.data?.map((l: any) => (
                                <tr key={l.id} style={{ borderBottom: '1px solid #1e293b33' }}>
                                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b' }}>{new Date(l.createdAt).toLocaleString('ar-SA')}</td>
                                    <td style={{ padding: '10px 16px' }}><span style={{ fontSize: 12, background: '#818cf820', color: '#818cf8', padding: '2px 8px', borderRadius: 6 }}>{l.action}</span></td>
                                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{l.resource}</td>
                                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>{l.actorRole}</td>
                                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.newValues ? JSON.stringify(l.newValues).substring(0, 50) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data?.meta && <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', fontSize: 12, color: '#64748b' }}>إجمالي: {data.meta.total} سجل</div>}
                </div>
            )}
        </div>
    );
}

export default SuperAdminDashboard;

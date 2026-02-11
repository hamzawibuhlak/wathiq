import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Copy, Plus, DollarSign, Users, CheckCircle, CreditCard } from 'lucide-react';
import { marketingApi } from '@/api/marketing';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: 'نشط', color: '#10b981', bg: '#ecfdf5' },
    INACTIVE: { label: 'غير نشط', color: '#94a3b8', bg: '#f1f5f9' },
    SUSPENDED: { label: 'موقوف', color: '#ef4444', bg: '#fef2f2' },
};

const COMMISSION_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'معلقة', color: '#f59e0b', bg: '#fffbeb' },
    APPROVED: { label: 'موافق عليها', color: '#3b82f6', bg: '#eff6ff' },
    PAID: { label: 'مدفوعة', color: '#10b981', bg: '#ecfdf5' },
    REJECTED: { label: 'مرفوضة', color: '#ef4444', bg: '#fef2f2' },
};

export default function AffiliatesPage() {
    const [activeTab, setActiveTab] = useState<'affiliates' | 'commissions'>('affiliates');
    const [showNewModal, setShowNewModal] = useState(false);
    const [newAffiliate, setNewAffiliate] = useState({ name: '', phone: '', email: '', commissionType: 'FIXED', commissionValue: 500 });
    const [commFilter, setCommFilter] = useState('');
    const queryClient = useQueryClient();

    const { data: affiliates } = useQuery({ queryKey: ['affiliates'], queryFn: marketingApi.getAffiliates });
    const { data: stats } = useQuery({ queryKey: ['affiliate-stats'], queryFn: marketingApi.getAffiliateStats });
    const { data: commissions } = useQuery({
        queryKey: ['commissions', commFilter],
        queryFn: () => marketingApi.getAllCommissions(commFilter || undefined),
        enabled: activeTab === 'commissions',
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => marketingApi.createAffiliate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['affiliates'] });
            setShowNewModal(false);
            toast.success('تمت إضافة المسوق');
        },
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => marketingApi.approveCommission(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['commissions'] });
            toast.success('تمت الموافقة');
        },
    });

    const payMutation = useMutation({
        mutationFn: (id: string) => marketingApi.payCommission(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['commissions'] });
            queryClient.invalidateQueries({ queryKey: ['affiliate-stats'] });
            toast.success('تم الدفع');
        },
    });

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('تم نسخ الكود');
    };

    return (
        <div style={{ padding: 28 }} dir="rtl">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>التسويق بالعمولة</h1>
                <button onClick={() => setShowNewModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#fff', fontSize: 13, fontWeight: 600,
                    }}>
                    <Plus style={{ width: 16, height: 16 }} /> مسوق جديد
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard icon={<Users style={{ width: 18, height: 18, color: '#f59e0b' }} />}
                    label="المسوقون النشطون" value={stats?.totalAffiliates || 0} bg="#fffbeb" />
                <StatCard icon={<DollarSign style={{ width: 18, height: 18, color: '#ef4444' }} />}
                    label="عمولات معلقة" value={`${(stats?.pendingAmount || 0).toLocaleString('ar-SA')} ر.س`} bg="#fef2f2" />
                <StatCard icon={<CheckCircle style={{ width: 18, height: 18, color: '#3b82f6' }} />}
                    label="عمولات بالانتظار" value={stats?.pendingCount || 0} bg="#eff6ff" />
                <StatCard icon={<CreditCard style={{ width: 18, height: 18, color: '#10b981' }} />}
                    label="إجمالي المدفوع" value={`${(stats?.totalPaid || 0).toLocaleString('ar-SA')} ر.س`} bg="#ecfdf5" />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content' }}>
                <TabBtn active={activeTab === 'affiliates'} onClick={() => setActiveTab('affiliates')} label="المسوقون" />
                <TabBtn active={activeTab === 'commissions'} onClick={() => setActiveTab('commissions')} label="العمولات" />
            </div>

            {/* Affiliates List */}
            {activeTab === 'affiliates' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {affiliates?.map((aff: any) => {
                        const statusInfo = STATUS_COLORS[aff.status] || STATUS_COLORS.ACTIVE;
                        return (
                            <div key={aff.id} style={{
                                background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #e2e8f0',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 12,
                                            background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Star style={{ width: 20, height: 20, color: '#f59e0b' }} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{aff.name}</p>
                                            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{aff.phone || aff.email}</p>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                                        background: statusInfo.bg, color: statusInfo.color,
                                    }}>
                                        {statusInfo.label}
                                    </span>
                                </div>

                                {/* Referral Code */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 14px', background: '#f8fafc', borderRadius: 10, marginBottom: 14,
                                }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                        {aff.referralCode}
                                    </span>
                                    <button onClick={() => copyCode(aff.referralCode)}
                                        style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                        <Copy style={{ width: 15, height: 15, color: '#64748b' }} />
                                    </button>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                    <MiniStat label="العملاء" value={aff._count?.leads || 0} />
                                    <MiniStat label="الأرباح" value={`${(aff.totalEarned || 0).toLocaleString('ar-SA')} ر.س`} />
                                    <MiniStat label="المدفوع" value={`${(aff.totalPaid || 0).toLocaleString('ar-SA')} ر.س`} />
                                </div>
                            </div>
                        );
                    })}
                    {(!affiliates || affiliates.length === 0) && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            لا يوجد مسوقون بالعمولة بعد
                        </div>
                    )}
                </div>
            )}

            {/* Commissions Tab */}
            {activeTab === 'commissions' && (
                <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                        {['', 'PENDING', 'APPROVED', 'PAID'].map(s => (
                            <button key={s} onClick={() => setCommFilter(s)}
                                style={{
                                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    border: commFilter === s ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    background: commFilter === s ? '#eff6ff' : '#fff',
                                    color: commFilter === s ? '#3b82f6' : '#64748b',
                                }}>
                                {s === '' ? 'الكل' : COMMISSION_STATUS[s]?.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>المسوق</th>
                                    <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>العميل</th>
                                    <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>المبلغ</th>
                                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>الحالة</th>
                                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissions?.map((c: any) => {
                                    const statusInfo = COMMISSION_STATUS[c.status] || COMMISSION_STATUS.PENDING;
                                    return (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 16px', fontWeight: 500 }}>{c.affiliate?.name}</td>
                                            <td style={{ padding: '12px 16px', color: '#64748b' }}>{c.lead?.name}</td>
                                            <td style={{ padding: '12px 16px', fontWeight: 700 }}>{c.amount.toLocaleString('ar-SA')} ر.س</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: 11, padding: '3px 10px', borderRadius: 8, fontWeight: 600,
                                                    background: statusInfo.bg, color: statusInfo.color,
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                {c.status === 'PENDING' && (
                                                    <button onClick={() => approveMutation.mutate(c.id)}
                                                        style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #3b82f6', background: '#eff6ff', cursor: 'pointer', fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>
                                                        موافقة
                                                    </button>
                                                )}
                                                {c.status === 'APPROVED' && (
                                                    <button onClick={() => payMutation.mutate(c.id)}
                                                        style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #10b981', background: '#ecfdf5', cursor: 'pointer', fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                                                        دفع
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* New Affiliate Modal */}
            {showNewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setShowNewModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: 440 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>مسوق جديد</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>الاسم *</label>
                                <input value={newAffiliate.name} onChange={e => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>الهاتف</label>
                                    <input value={newAffiliate.phone} onChange={e => setNewAffiliate({ ...newAffiliate, phone: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>البريد</label>
                                    <input value={newAffiliate.email} onChange={e => setNewAffiliate({ ...newAffiliate, email: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>نوع العمولة</label>
                                    <select value={newAffiliate.commissionType} onChange={e => setNewAffiliate({ ...newAffiliate, commissionType: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }}>
                                        <option value="FIXED">مبلغ ثابت</option>
                                        <option value="PERCENTAGE">نسبة مئوية</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                                        {newAffiliate.commissionType === 'FIXED' ? 'المبلغ (ر.س)' : 'النسبة %'}
                                    </label>
                                    <input type="number" value={newAffiliate.commissionValue}
                                        onChange={e => setNewAffiliate({ ...newAffiliate, commissionValue: +e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button onClick={() => createMutation.mutate(newAffiliate)}
                                    disabled={!newAffiliate.name || createMutation.isPending}
                                    style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                                    {createMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
                                </button>
                                <button onClick={() => setShowNewModal(false)}
                                    style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, bg }: any) {
    return (
        <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>{value}</p>
        </div>
    );
}

function MiniStat({ label, value }: any) {
    return (
        <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{value}</p>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{label}</p>
        </div>
    );
}

function TabBtn({ active, onClick, label }: any) {
    return (
        <button onClick={onClick}
            style={{
                padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: active ? '#fff' : 'transparent', color: active ? '#0f172a' : '#64748b',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
            {label}
        </button>
    );
}

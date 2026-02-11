import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Megaphone, Eye, MousePointerClick, Users } from 'lucide-react';
import { marketingApi } from '@/api/marketing';
import toast from 'react-hot-toast';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    SOCIAL_MEDIA: { label: 'سوشل ميديا', color: '#3b82f6' },
    GOOGLE_ADS: { label: 'جوجل', color: '#ea4335' },
    META_ADS: { label: 'ميتا', color: '#1877f2' },
    TIKTOK_ADS: { label: 'تيك توك', color: '#000000' },
    EMAIL: { label: 'بريد إلكتروني', color: '#f59e0b' },
    WHATSAPP: { label: 'واتساب', color: '#25d366' },
    TELEMARKETING: { label: 'هاتفي', color: '#8b5cf6' },
    EVENT: { label: 'فعالية', color: '#06b6d4' },
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'مسودة', color: '#94a3b8', bg: '#f1f5f9' },
    ACTIVE: { label: 'نشطة', color: '#10b981', bg: '#ecfdf5' },
    PAUSED: { label: 'متوقفة', color: '#f59e0b', bg: '#fffbeb' },
    ENDED: { label: 'منتهية', color: '#64748b', bg: '#f1f5f9' },
    ARCHIVED: { label: 'مؤرشفة', color: '#94a3b8', bg: '#f8fafc' },
};

export default function CampaignsPage() {
    const [showNewModal, setShowNewModal] = useState(false);
    const [typeFilter, setTypeFilter] = useState('');
    const [newCampaign, setNewCampaign] = useState({ name: '', type: 'SOCIAL_MEDIA', budget: 0, goal: '', description: '' });
    const queryClient = useQueryClient();

    const { data: campaigns } = useQuery({
        queryKey: ['campaigns', typeFilter],
        queryFn: () => marketingApi.getCampaigns(typeFilter ? { type: typeFilter } : {}),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => marketingApi.createCampaign(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            setShowNewModal(false);
            setNewCampaign({ name: '', type: 'SOCIAL_MEDIA', budget: 0, goal: '', description: '' });
            toast.success('تم إنشاء الحملة');
        },
    });

    return (
        <div style={{ padding: 28 }} dir="rtl">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>الحملات التسويقية</h1>
                <button onClick={() => setShowNewModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        color: '#fff', fontSize: 13, fontWeight: 600,
                    }}>
                    <Plus style={{ width: 16, height: 16 }} /> حملة جديدة
                </button>
            </div>

            {/* Type Filters */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                <FilterBtn active={typeFilter === ''} onClick={() => setTypeFilter('')} label="الكل" />
                {Object.entries(TYPE_LABELS).map(([key, info]) => (
                    <FilterBtn key={key} active={typeFilter === key} onClick={() => setTypeFilter(key)} label={info.label} />
                ))}
            </div>

            {/* Campaigns Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {campaigns?.map((campaign: any) => {
                    const typeInfo = TYPE_LABELS[campaign.type] || { label: campaign.type, color: '#94a3b8' };
                    const statusInfo = STATUS_LABELS[campaign.status] || STATUS_LABELS.DRAFT;
                    return (
                        <div key={campaign.id} style={{
                            background: '#fff', borderRadius: 16, padding: 22,
                            border: '1px solid #e2e8f0', transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 12,
                                        background: `${typeInfo.color}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Megaphone style={{ width: 18, height: 18, color: typeInfo.color }} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{campaign.name}</p>
                                        <span style={{ fontSize: 11, color: typeInfo.color }}>{typeInfo.label}</span>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 600,
                                    background: statusInfo.bg, color: statusInfo.color,
                                }}>
                                    {statusInfo.label}
                                </span>
                            </div>

                            {/* Budget */}
                            {campaign.budget > 0 && (
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, color: '#94a3b8' }}>الميزانية</span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
                                            {campaign.spent.toLocaleString('ar-SA')} / {campaign.budget.toLocaleString('ar-SA')} ر.س
                                        </span>
                                    </div>
                                    <div style={{ height: 4, background: '#f1f5f9', borderRadius: 4 }}>
                                        <div style={{
                                            height: '100%', borderRadius: 4,
                                            background: campaign.spent / campaign.budget > 0.9 ? '#ef4444' : '#10b981',
                                            width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%`,
                                        }} />
                                    </div>
                                </div>
                            )}

                            {/* Metrics */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                <MetricCell icon={<Eye style={{ width: 13, height: 13 }} />} label="مشاهدة" value={campaign.impressions} />
                                <MetricCell icon={<MousePointerClick style={{ width: 13, height: 13 }} />} label="نقرة" value={campaign.clicks} />
                                <MetricCell icon={<Users style={{ width: 13, height: 13 }} />} label="تحويل" value={campaign.conversions} />
                            </div>

                            {/* Leads count */}
                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
                                <span>العملاء المحتملون: {campaign._count?.leads || 0}</span>
                                {campaign.costPerLead && <span>تكلفة العميل: {campaign.costPerLead?.toFixed(0)} ر.س</span>}
                            </div>
                        </div>
                    );
                })}
                {(!campaigns || campaigns.length === 0) && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                        <Megaphone style={{ width: 40, height: 40, margin: '0 auto 12px' }} />
                        <p>لا توجد حملات بعد</p>
                    </div>
                )}
            </div>

            {/* New Campaign Modal */}
            {showNewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setShowNewModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: 480 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>حملة تسويقية جديدة</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>اسم الحملة *</label>
                                <input value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>النوع</label>
                                    <select value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }}>
                                        {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>الميزانية (ر.س)</label>
                                    <input type="number" value={newCampaign.budget}
                                        onChange={e => setNewCampaign({ ...newCampaign, budget: +e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>الهدف</label>
                                <input value={newCampaign.goal} onChange={e => setNewCampaign({ ...newCampaign, goal: e.target.value })}
                                    placeholder="مثال: زيادة عدد العملاء بنسبة 20%"
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>وصف الحملة</label>
                                <textarea value={newCampaign.description}
                                    onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button onClick={() => createMutation.mutate(newCampaign)}
                                    disabled={!newCampaign.name || createMutation.isPending}
                                    style={{
                                        padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                        background: !newCampaign.name ? '#d1d5db' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                        color: '#fff', fontSize: 14, fontWeight: 600,
                                    }}>
                                    {createMutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء'}
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

function MetricCell({ icon, label, value }: any) {
    return (
        <div style={{ textAlign: 'center', padding: 10, background: '#f8fafc', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#94a3b8', marginBottom: 4 }}>
                {icon} <span style={{ fontSize: 10 }}>{label}</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>{(value || 0).toLocaleString('ar-SA')}</p>
        </div>
    );
}

function FilterBtn({ active, onClick, label }: any) {
    return (
        <button onClick={onClick}
            style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: active ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                background: active ? '#f5f3ff' : '#fff',
                color: active ? '#8b5cf6' : '#64748b',
                whiteSpace: 'nowrap',
            }}>
            {label}
        </button>
    );
}

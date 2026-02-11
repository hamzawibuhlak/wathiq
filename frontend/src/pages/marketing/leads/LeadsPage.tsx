import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List, Search, Phone, Trash2, Eye } from 'lucide-react';
import { marketingApi } from '@/api/marketing';
import toast from 'react-hot-toast';

type ViewMode = 'kanban' | 'list';

const STATUS_COLUMNS = [
    { key: 'NEW', label: 'جديد', color: '#94a3b8', bg: '#f1f5f9' },
    { key: 'CONTACTED', label: 'تم التواصل', color: '#3b82f6', bg: '#eff6ff' },
    { key: 'QUALIFIED', label: 'مؤهل', color: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'PROPOSAL', label: 'عرض مُقدَّم', color: '#f59e0b', bg: '#fffbeb' },
    { key: 'WON', label: 'تحول لعميل ✅', color: '#10b981', bg: '#ecfdf5' },
    { key: 'LOST', label: 'خسرنا اهتمامه', color: '#ef4444', bg: '#fef2f2' },
];

const SOURCE_LABELS: Record<string, string> = {
    GOOGLE_ADS: 'جوجل', META_ADS: 'ميتا', TIKTOK_ADS: 'تيك توك',
    REFERRAL: 'توصية', AFFILIATE: 'عمولة', PHONE_CALL: 'هاتف',
    WEBSITE: 'موقع', WALK_IN: 'زيارة', SOCIAL_MEDIA: 'سوشل', OTHER: 'أخرى',
    ORGANIC_SEARCH: 'بحث طبيعي',
};

export default function LeadsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [search, setSearch] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', source: 'PHONE_CALL', notes: '' });
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: kanbanData } = useQuery({
        queryKey: ['leads-kanban'],
        queryFn: marketingApi.getLeadsKanban,
        enabled: viewMode === 'kanban',
    });

    const { data: listData } = useQuery({
        queryKey: ['leads-list', search],
        queryFn: () => marketingApi.getLeads({ search, limit: 50 }),
        enabled: viewMode === 'list',
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => marketingApi.createLead(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads-kanban'] });
            queryClient.invalidateQueries({ queryKey: ['leads-list'] });
            setShowNewModal(false);
            setNewLead({ name: '', phone: '', email: '', source: 'PHONE_CALL', notes: '' });
            toast.success('تمت إضافة العميل المحتمل');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => marketingApi.deleteLead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads-kanban'] });
            queryClient.invalidateQueries({ queryKey: ['leads-list'] });
            toast.success('تم حذف العميل المحتمل');
        },
    });


    return (
        <div style={{ padding: 28, height: '100%', display: 'flex', flexDirection: 'column' }} dir="rtl">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>العملاء المحتملون</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search style={{ width: 16, height: 16, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="بحث..."
                            style={{
                                paddingRight: 36, paddingLeft: 12, height: 36,
                                border: '1px solid #e2e8f0', borderRadius: 10,
                                fontSize: 13, outline: 'none', width: 200,
                            }}
                        />
                    </div>
                    {/* View Toggle */}
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
                        <button
                            onClick={() => setViewMode('kanban')}
                            style={{
                                padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: viewMode === 'kanban' ? '#fff' : 'transparent',
                                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            }}
                        >
                            <LayoutGrid style={{ width: 16, height: 16, color: '#64748b' }} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: viewMode === 'list' ? '#fff' : 'transparent',
                                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            }}
                        >
                            <List style={{ width: 16, height: 16, color: '#64748b' }} />
                        </button>
                    </div>
                    {/* Add Button */}
                    <button
                        onClick={() => setShowNewModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 10,
                            border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff', fontSize: 13, fontWeight: 600,
                        }}
                    >
                        <Plus style={{ width: 16, height: 16 }} />
                        عميل محتمل جديد
                    </button>
                </div>
            </div>

            {/* Kanban View */}
            {viewMode === 'kanban' && (
                <div style={{ display: 'flex', gap: 14, overflowX: 'auto', flex: 1, paddingBottom: 12 }}>
                    {STATUS_COLUMNS.map(col => {
                        const leads = kanbanData?.[col.key] || [];
                        return (
                            <div key={col.key} style={{
                                minWidth: 260, width: 260, display: 'flex', flexDirection: 'column',
                                background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
                            }}>
                                {/* Column Header */}
                                <div style={{
                                    padding: '14px 16px', borderBottom: '2px solid ' + col.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{col.label}</span>
                                    </div>
                                    <span style={{
                                        fontSize: 11, fontWeight: 600,
                                        padding: '2px 8px', borderRadius: 8,
                                        background: col.bg, color: col.color,
                                    }}>
                                        {leads.length}
                                    </span>
                                </div>
                                {/* Cards */}
                                <div style={{ flex: 1, padding: 10, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {leads.map((lead: any) => (
                                        <div
                                            key={lead.id}
                                            onClick={() => navigate(`/marketing/leads/${lead.id}`)}
                                            style={{
                                                padding: 14, borderRadius: 12,
                                                border: '1px solid #e2e8f0', background: '#fff',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = col.color; }}
                                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                        >
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{lead.name}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                                {lead.phone && <Phone style={{ width: 12, height: 12, color: '#94a3b8' }} />}
                                                <span style={{ fontSize: 11, color: '#64748b' }}>{lead.phone || 'بدون هاتف'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                                <span style={{
                                                    fontSize: 10, padding: '2px 8px', borderRadius: 6,
                                                    background: '#f1f5f9', color: '#64748b',
                                                }}>
                                                    {SOURCE_LABELS[lead.source] || lead.source}
                                                </span>
                                                {/* Score */}
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    background: lead.score >= 60 ? '#dcfce7' : lead.score >= 30 ? '#fef3c7' : '#f1f5f9',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 10, fontWeight: 700,
                                                    color: lead.score >= 60 ? '#16a34a' : lead.score >= 30 ? '#d97706' : '#94a3b8',
                                                }}>
                                                    {lead.score}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {leads.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: 20, color: '#cbd5e1', fontSize: 12 }}>
                                            لا يوجد عملاء
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>الاسم</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>الهاتف</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>المصدر</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>الحالة</th>
                                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>Score</th>
                                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listData?.data?.map((lead: any) => {
                                const statusInfo = STATUS_COLUMNS.find(s => s.key === lead.status);
                                return (
                                    <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                    >
                                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{lead.name}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{lead.phone || '-'}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#f1f5f9', color: '#64748b' }}>
                                                {SOURCE_LABELS[lead.source] || lead.source}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                fontSize: 11, padding: '3px 10px', borderRadius: 8,
                                                background: statusInfo?.bg || '#f1f5f9',
                                                color: statusInfo?.color || '#94a3b8', fontWeight: 600,
                                            }}>
                                                {statusInfo?.label || lead.status}
                                            </span>
                                        </td>
                                        <td style={{
                                            padding: '12px 16px', textAlign: 'center', fontWeight: 700,
                                            color: lead.score >= 60 ? '#16a34a' : lead.score >= 30 ? '#d97706' : '#94a3b8',
                                        }}>
                                            {lead.score}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/marketing/leads/${lead.id}`); }}
                                                    style={{ padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6 }}>
                                                    <Eye style={{ width: 15, height: 15, color: '#3b82f6' }} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(lead.id); }}
                                                    style={{ padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6 }}>
                                                    <Trash2 style={{ width: 15, height: 15, color: '#ef4444' }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* New Lead Modal */}
            {showNewModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}
                    onClick={() => setShowNewModal(false)}
                >
                    <div style={{
                        background: '#fff', borderRadius: 20, padding: 32, width: 480,
                        maxHeight: '80vh', overflow: 'auto',
                    }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>عميل محتمل جديد</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>الاسم *</label>
                                <input value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>الهاتف</label>
                                    <input value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>البريد</label>
                                    <input value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                        style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>المصدر</label>
                                <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none' }}>
                                    {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>ملاحظات</label>
                                <textarea value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginTop: 8 }}>
                                <button
                                    onClick={() => createMutation.mutate(newLead)}
                                    disabled={!newLead.name || createMutation.isPending}
                                    style={{
                                        padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                        background: !newLead.name ? '#d1d5db' : 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#fff', fontSize: 14, fontWeight: 600,
                                    }}
                                >
                                    {createMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
                                </button>
                                <button onClick={() => setShowNewModal(false)}
                                    style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#64748b' }}>
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

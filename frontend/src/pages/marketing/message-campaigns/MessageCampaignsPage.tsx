import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, MessageSquare, Plus, Send } from 'lucide-react';
import { marketingApi } from '@/api/marketing';
import toast from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'مسودة', color: '#94a3b8', bg: '#f1f5f9' },
    ACTIVE: { label: 'نشطة', color: '#10b981', bg: '#ecfdf5' },
    PAUSED: { label: 'متوقفة', color: '#f59e0b', bg: '#fffbeb' },
    ENDED: { label: 'مكتملة', color: '#3b82f6', bg: '#eff6ff' },
};

export default function MessageCampaignsPage() {
    const [typeFilter, setTypeFilter] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const [newCampaign, setNewCampaign] = useState({ name: '', type: 'WHATSAPP', content: '', subject: '', targetType: 'CLIENTS' });
    const queryClient = useQueryClient();

    const { data: campaigns } = useQuery({
        queryKey: ['message-campaigns', typeFilter],
        queryFn: () => marketingApi.getMessageCampaigns(typeFilter || undefined),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => marketingApi.createMessageCampaign(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['message-campaigns'] }); setShowNewModal(false); toast.success('تم إنشاء الحملة'); },
    });

    return (
        <div style={{ padding: 28 }} dir="rtl">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>حملات الرسائل</h1>
                <button onClick={() => setShowNewModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                    <Plus style={{ width: 16, height: 16 }} /> حملة جديدة
                </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[{ key: '', label: 'الكل', icon: Send }, { key: 'WHATSAPP', label: 'واتساب', icon: MessageSquare }, { key: 'EMAIL', label: 'بريد', icon: Mail }].map(item => {
                    const Icon = item.icon;
                    return (<button key={item.key} onClick={() => setTypeFilter(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: typeFilter === item.key ? '2px solid #10b981' : '1px solid #e2e8f0', background: typeFilter === item.key ? '#ecfdf5' : '#fff', color: typeFilter === item.key ? '#10b981' : '#64748b' }}><Icon style={{ width: 15, height: 15 }} />{item.label}</button>);
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {campaigns?.map((c: any) => {
                    const st = STATUS_MAP[c.status] || STATUS_MAP.DRAFT;
                    const isWA = c.type === 'WHATSAPP';
                    return (
                        <div key={c.id} style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: isWA ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {isWA ? <MessageSquare style={{ width: 18, height: 18, color: '#25d366' }} /> : <Mail style={{ width: 18, height: 18, color: '#f59e0b' }} />}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{c.name}</p>
                                        <span style={{ fontSize: 11, color: '#64748b' }}>{isWA ? 'واتساب' : 'بريد'} • {c._count?.recipients || 0} مُستلم</span>
                                    </div>
                                </div>
                                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                            </div>
                            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, marginBottom: 14, fontSize: 12, color: '#374151', maxHeight: 80, overflow: 'hidden' }}>{c.content}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                <MiniStat label="مُرسل" value={c.totalSent} /><MiniStat label="مُستَلم" value={c.totalDelivered} /><MiniStat label="مفتوح" value={c.totalOpened} /><MiniStat label="رد" value={c.totalReplied} />
                            </div>
                        </div>
                    );
                })}
                {(!campaigns || campaigns.length === 0) && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: '#94a3b8' }}>لا توجد حملات رسائل بعد</div>}
            </div>

            {showNewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowNewModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: 480 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>حملة رسائل جديدة</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <input value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="اسم الحملة" style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <select value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }}>
                                    <option value="WHATSAPP">واتساب</option><option value="EMAIL">بريد إلكتروني</option>
                                </select>
                                <select value={newCampaign.targetType} onChange={e => setNewCampaign({ ...newCampaign, targetType: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }}>
                                    <option value="CLIENTS">جميع العملاء</option><option value="LEADS">العملاء المحتملون</option>
                                </select>
                            </div>
                            <textarea value={newCampaign.content} onChange={e => setNewCampaign({ ...newCampaign, content: e.target.value })} placeholder="محتوى الرسالة" rows={4} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, resize: 'vertical' }} />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => createMutation.mutate(newCampaign)} disabled={!newCampaign.name || !newCampaign.content} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 14, fontWeight: 600 }}>إنشاء</button>
                                <button onClick={() => setShowNewModal(false)} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 }}>إلغاء</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MiniStat({ label, value }: any) {
    return (<div style={{ textAlign: 'center', padding: 8, background: '#f8fafc', borderRadius: 8 }}><p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{value}</p><p style={{ fontSize: 9, color: '#94a3b8', margin: 0 }}>{label}</p></div>);
}

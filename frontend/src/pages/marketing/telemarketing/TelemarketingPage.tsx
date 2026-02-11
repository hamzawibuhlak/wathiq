import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, PhoneOff, Clock, CheckCircle, AlertCircle, User, FileText, Plus } from 'lucide-react';
import { marketingApi } from '@/api/marketing';
import toast from 'react-hot-toast';

const CALL_OUTCOMES = ['مهتم', 'غير مهتم', 'سيتواصل لاحقاً', 'طلب معلومات إضافية', 'حجز موعد'];

export default function TelemarketingPage() {
    const [activeTab, setActiveTab] = useState<'queue' | 'scripts'>('queue');
    const [showCallModal, setShowCallModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [callForm, setCallForm] = useState({ status: 'ANSWERED', duration: 0, notes: '', outcome: '' });
    const queryClient = useQueryClient();

    const { data: queue } = useQuery({ queryKey: ['call-queue'], queryFn: marketingApi.getCallQueue });
    const { data: scripts } = useQuery({ queryKey: ['call-scripts'], queryFn: marketingApi.getCallScripts });
    const { data: stats } = useQuery({ queryKey: ['call-stats'], queryFn: marketingApi.getCallStats });

    const logCallMutation = useMutation({
        mutationFn: (data: any) => marketingApi.logCall(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['call-queue'] });
            queryClient.invalidateQueries({ queryKey: ['call-stats'] });
            setShowCallModal(false);
            toast.success('تم تسجيل المكالمة');
        },
    });

    const handleCallEnd = () => {
        if (!selectedLead) return;
        logCallMutation.mutate({
            leadId: selectedLead.id,
            phone: selectedLead.phone || '',
            ...callForm,
        });
    };

    return (
        <div style={{ padding: 28 }} dir="rtl">
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>التسويق الهاتفي</h1>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                <StatCard icon={<Phone style={{ width: 18, height: 18, color: '#3b82f6' }} />}
                    label="مكالمات اليوم" value={stats?.todayCalls || 0} bg="#eff6ff" />
                <StatCard icon={<CheckCircle style={{ width: 18, height: 18, color: '#10b981' }} />}
                    label="مكالمات مُجابة" value={stats?.answered || 0} bg="#ecfdf5" />
                <StatCard icon={<AlertCircle style={{ width: 18, height: 18, color: '#f59e0b' }} />}
                    label="معدل الرد" value={`${stats?.answerRate || 0}%`} bg="#fffbeb" />
                <StatCard icon={<Clock style={{ width: 18, height: 18, color: '#8b5cf6' }} />}
                    label="متوسط المدة" value={`${stats?.avgDuration || 0} ث`} bg="#f5f3ff" />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content' }}>
                <button onClick={() => setActiveTab('queue')}
                    style={{
                        padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        background: activeTab === 'queue' ? '#fff' : 'transparent',
                        color: activeTab === 'queue' ? '#0f172a' : '#64748b',
                        boxShadow: activeTab === 'queue' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}>
                    قائمة المكالمات ({queue?.length || 0})
                </button>
                <button onClick={() => setActiveTab('scripts')}
                    style={{
                        padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        background: activeTab === 'scripts' ? '#fff' : 'transparent',
                        color: activeTab === 'scripts' ? '#0f172a' : '#64748b',
                        boxShadow: activeTab === 'scripts' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}>
                    السكريبتات ({scripts?.length || 0})
                </button>
            </div>

            {/* Call Queue */}
            {activeTab === 'queue' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {queue?.map((lead: any) => (
                        <div key={lead.id} style={{
                            background: '#fff', borderRadius: 14, padding: 18,
                            border: '1px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <User style={{ width: 20, height: 20, color: '#64748b' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{lead.name}</p>
                                    <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                                        {lead.phone || 'بدون هاتف'} • محاولات: {lead.callAttempts}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {lead.nextFollowUp && (
                                    <span style={{ fontSize: 11, color: '#f59e0b', background: '#fffbeb', padding: '4px 10px', borderRadius: 8 }}>
                                        <Clock style={{ width: 12, height: 12, display: 'inline', marginLeft: 4 }} />
                                        {new Date(lead.nextFollowUp).toLocaleDateString('ar-SA')}
                                    </span>
                                )}
                                <button
                                    onClick={() => { setSelectedLead(lead); setShowCallModal(true); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#fff', fontSize: 12, fontWeight: 600,
                                    }}>
                                    <Phone style={{ width: 14, height: 14 }} />
                                    اتصل الآن
                                </button>
                            </div>
                        </div>
                    ))}
                    {(!queue || queue.length === 0) && (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
                            لا توجد مكالمات مجدولة اليوم
                        </div>
                    )}
                </div>
            )}

            {/* Scripts Tab */}
            {activeTab === 'scripts' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    {scripts?.map((script: any) => (
                        <div key={script.id} style={{
                            background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e2e8f0',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <FileText style={{ width: 16, height: 16, color: '#3b82f6' }} />
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{script.name}</h3>
                            </div>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#f1f5f9', color: '#64748b' }}>
                                {script.targetType}
                            </span>
                            <div style={{
                                marginTop: 14, padding: 14, background: '#f8fafc', borderRadius: 10,
                                fontSize: 13, color: '#374151', lineHeight: 1.8,
                                maxHeight: 150, overflow: 'auto',
                            }}>
                                {script.content}
                            </div>
                        </div>
                    ))}
                    {(!scripts || scripts.length === 0) && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                            لا توجد سكريبتات بعد
                        </div>
                    )}
                </div>
            )}

            {/* Call Result Modal */}
            {showCallModal && selectedLead && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setShowCallModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: 440 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>تسجيل نتيجة المكالمة</h2>
                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>{selectedLead.name} - {selectedLead.phone}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>حالة المكالمة</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {[
                                        { key: 'ANSWERED', label: 'رد', icon: CheckCircle, color: '#10b981' },
                                        { key: 'NO_ANSWER', label: 'لم يرد', icon: PhoneOff, color: '#f59e0b' },
                                        { key: 'BUSY', label: 'مشغول', icon: AlertCircle, color: '#ef4444' },
                                    ].map(s => {
                                        const Icon = s.icon;
                                        return (
                                            <button key={s.key}
                                                onClick={() => setCallForm({ ...callForm, status: s.key })}
                                                style={{
                                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                    padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
                                                    cursor: 'pointer',
                                                    border: callForm.status === s.key ? `2px solid ${s.color}` : '1px solid #e2e8f0',
                                                    background: callForm.status === s.key ? `${s.color}10` : '#fff',
                                                    color: callForm.status === s.key ? s.color : '#64748b',
                                                }}>
                                                <Icon style={{ width: 14, height: 14 }} /> {s.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {callForm.status === 'ANSWERED' && (
                                <>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>النتيجة</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {CALL_OUTCOMES.map(o => (
                                                <button key={o}
                                                    onClick={() => setCallForm({ ...callForm, outcome: o })}
                                                    style={{
                                                        padding: '6px 12px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                                                        border: callForm.outcome === o ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                                        background: callForm.outcome === o ? '#eff6ff' : '#fff',
                                                        color: callForm.outcome === o ? '#3b82f6' : '#64748b',
                                                    }}>
                                                    {o}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>المدة (ثواني)</label>
                                        <input type="number" value={callForm.duration}
                                            onChange={e => setCallForm({ ...callForm, duration: +e.target.value })}
                                            style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                                    </div>
                                </>
                            )}
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>ملاحظات</label>
                                <textarea value={callForm.notes}
                                    onChange={e => setCallForm({ ...callForm, notes: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={handleCallEnd}
                                    style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                                    حفظ
                                </button>
                                <button onClick={() => setShowCallModal(false)}
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
                <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{value}</p>
        </div>
    );
}

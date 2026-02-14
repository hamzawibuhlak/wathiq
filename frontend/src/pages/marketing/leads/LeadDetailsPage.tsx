import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Phone, Mail, MessageSquare, FileText, User, ChevronDown } from 'lucide-react';
import { marketingApi } from '@/api/marketing';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
    { key: 'NEW', label: 'جديد', color: '#94a3b8' },
    { key: 'CONTACTED', label: 'تم التواصل', color: '#3b82f6' },
    { key: 'QUALIFIED', label: 'مؤهل', color: '#8b5cf6' },
    { key: 'PROPOSAL', label: 'عرض مُقدَّم', color: '#f59e0b' },
    { key: 'WON', label: 'تحول لعميل ✅', color: '#10b981' },
    { key: 'LOST', label: 'خسرنا اهتمامه', color: '#ef4444' },
    { key: 'NURTURING', label: 'قيد المتابعة', color: '#06b6d4' },
];

const ACTIVITY_ICONS: Record<string, any> = {
    CALL: Phone, EMAIL: Mail, WHATSAPP: MessageSquare,
    MEETING: User, NOTE: FileText, STATUS_CHANGE: ChevronDown,
};

const ACTIVITY_LABELS: Record<string, string> = {
    CALL: 'مكالمة', EMAIL: 'بريد إلكتروني', WHATSAPP: 'واتساب',
    MEETING: 'اجتماع', NOTE: 'ملاحظة', STATUS_CHANGE: 'تغيير حالة',
};

export default function LeadDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { nav } = useSlugPath();
    const queryClient = useQueryClient();
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityForm, setActivityForm] = useState({ type: 'CALL', notes: '', duration: 0, outcome: '' });

    const { data: lead, isLoading } = useQuery({
        queryKey: ['lead', id],
        queryFn: () => marketingApi.getLeadById(id!),
        enabled: !!id,
    });

    const statusMutation = useMutation({
        mutationFn: (status: string) => marketingApi.updateLeadStatus(id!, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead', id] });
            toast.success('تم تحديث الحالة');
        },
    });

    const activityMutation = useMutation({
        mutationFn: (data: any) => marketingApi.logLeadActivity(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead', id] });
            setShowActivityModal(false);
            setActivityForm({ type: 'CALL', notes: '', duration: 0, outcome: '' });
            toast.success('تم تسجيل النشاط');
        },
    });

    if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>جارٍ التحميل...</div>;
    if (!lead) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>غير موجود</div>;

    const currentStatus = STATUS_OPTIONS.find(s => s.key === lead.status);

    return (
        <div style={{ padding: 28 }} dir="rtl">
            {/* Back */}
            <button onClick={() => nav('/marketing/leads')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, marginBottom: 20 }}>
                <ArrowRight style={{ width: 16, height: 16 }} /> العودة للقائمة
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                {/* Left: Info + Activities */}
                <div>
                    {/* Lead Info */}
                    <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{lead.name}</h1>
                            {/* Score */}
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: lead.score >= 60 ? '#dcfce7' : lead.score >= 30 ? '#fef3c7' : '#f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, fontWeight: 800,
                                color: lead.score >= 60 ? '#16a34a' : lead.score >= 30 ? '#d97706' : '#94a3b8',
                            }}>
                                {lead.score}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                            <InfoItem label="الهاتف" value={lead.phone || '-'} icon={<Phone style={{ width: 14, height: 14 }} />} />
                            <InfoItem label="البريد" value={lead.email || '-'} icon={<Mail style={{ width: 14, height: 14 }} />} />
                            <InfoItem label="المسؤول" value={lead.assignee?.name || 'غير محدد'} icon={<User style={{ width: 14, height: 14 }} />} />
                        </div>
                        {lead.notes && (
                            <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 10, fontSize: 13, color: '#64748b' }}>
                                {lead.notes}
                            </div>
                        )}
                    </div>

                    {/* Activity Timeline */}
                    <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>سجل الأنشطة</h3>
                            <button onClick={() => setShowActivityModal(true)}
                                style={{
                                    padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                    color: '#fff', fontSize: 12, fontWeight: 600,
                                }}>
                                + تسجيل نشاط
                            </button>
                        </div>
                        {lead.activities?.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>لا توجد أنشطة بعد</p>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {lead.activities?.map((act: any) => {
                                const Icon = ACTIVITY_ICONS[act.type] || FileText;
                                return (
                                    <div key={act.id} style={{
                                        display: 'flex', gap: 12, padding: 14,
                                        background: '#f8fafc', borderRadius: 12,
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 10,
                                            background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Icon style={{ width: 15, height: 15, color: '#0ea5e9' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                                                    {ACTIVITY_LABELS[act.type] || act.type}
                                                </span>
                                                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                                    {new Date(act.createdAt).toLocaleDateString('ar-SA')}
                                                </span>
                                            </div>
                                            {act.notes && <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>{act.notes}</p>}
                                            {act.outcome && <span style={{ fontSize: 11, color: '#10b981' }}>النتيجة: {act.outcome}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: Status + Actions */}
                <div>
                    {/* Status Card */}
                    <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>الحالة الحالية</h3>
                        <div style={{
                            padding: 14, borderRadius: 12, textAlign: 'center',
                            background: `${currentStatus?.color}15`,
                            border: `2px solid ${currentStatus?.color}`,
                            marginBottom: 16,
                        }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: currentStatus?.color }}>
                                {currentStatus?.label}
                            </span>
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>تغيير الحالة</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {STATUS_OPTIONS.filter(s => s.key !== lead.status).map(s => (
                                <button key={s.key}
                                    onClick={() => statusMutation.mutate(s.key)}
                                    style={{
                                        padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                        border: `1px solid ${s.color}30`, background: `${s.color}10`,
                                        color: s.color, cursor: 'pointer',
                                    }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>معلومات إضافية</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <SmallInfo label="محاولات الاتصال" value={lead.callAttempts} />
                            <SmallInfo label="آخر تواصل" value={lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString('ar-SA') : 'لم يتم بعد'} />
                            <SmallInfo label="المرحلة" value={lead.stage} />
                            {lead.affiliate && <SmallInfo label="مسوق بالعمولة" value={lead.affiliate.name} />}
                            {lead.campaign && <SmallInfo label="الحملة" value={lead.campaign.name} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Modal */}
            {showActivityModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    onClick={() => setShowActivityModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: 440 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>تسجيل نشاط</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>نوع النشاط</label>
                                <select value={activityForm.type} onChange={e => setActivityForm({ ...activityForm, type: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }}>
                                    {Object.entries(ACTIVITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>ملاحظات</label>
                                <textarea value={activityForm.notes} onChange={e => setActivityForm({ ...activityForm, notes: e.target.value })}
                                    rows={3} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, resize: 'vertical' }} />
                            </div>
                            {activityForm.type === 'CALL' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>المدة (دقائق)</label>
                                        <input type="number" value={activityForm.duration} onChange={e => setActivityForm({ ...activityForm, duration: +e.target.value })}
                                            style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>النتيجة</label>
                                        <input value={activityForm.outcome} onChange={e => setActivityForm({ ...activityForm, outcome: e.target.value })}
                                            style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button onClick={() => activityMutation.mutate(activityForm)}
                                    disabled={activityMutation.isPending}
                                    style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                                    {activityMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
                                </button>
                                <button onClick={() => setShowActivityModal(false)}
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

function InfoItem({ label, value, icon }: any) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: '#94a3b8' }}>{icon}</div>
            <div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: 0 }}>{value}</p>
            </div>
        </div>
    );
}

function SmallInfo({ label, value }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#94a3b8' }}>{label}</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
        </div>
    );
}

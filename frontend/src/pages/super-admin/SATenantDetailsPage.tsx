import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { superAdminApi } from '@/api/superAdmin';
import toast from 'react-hot-toast';

export default function SATenantDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [noteType, setNoteType] = useState('GENERAL');

    const { data: t, refetch } = useQuery({
        queryKey: ['sa-tenant', id],
        queryFn: () => superAdminApi.getTenantDetails(id!),
        enabled: !!id,
    });

    const freeze = useMutation({
        mutationFn: (reason: string) => superAdminApi.freeze(id!, reason),
        onSuccess: () => { refetch(); toast.success('تم تجميد المكتب'); },
    });
    const unfreeze = useMutation({
        mutationFn: () => superAdminApi.unfreeze(id!),
        onSuccess: () => { refetch(); toast.success('تم رفع التجميد'); },
    });
    const changePlan = useMutation({
        mutationFn: (planType: string) => superAdminApi.changePlan(id!, planType),
        onSuccess: () => { refetch(); toast.success('تم تغيير الباقة'); },
    });
    const softDel = useMutation({
        mutationFn: () => superAdminApi.softDelete(id!),
        onSuccess: () => { toast.success('تم حذف المكتب (ناعم)'); navigate('/super-admin/tenants'); },
    });
    const hardDel = useMutation({
        mutationFn: () => superAdminApi.hardDelete(id!),
        onSuccess: () => { toast.success('تم الحذف النهائي'); navigate('/super-admin/tenants'); },
    });
    const addNote = useMutation({
        mutationFn: () => superAdminApi.addNote(id!, noteContent, noteType),
        onSuccess: () => { setNoteContent(''); refetch(); toast.success('تمت إضافة الملاحظة'); },
    });

    const owner = t?.users?.find((u: any) => u.role === 'OWNER');

    if (!t) return <div style={{ padding: '28px', color: '#64748b' }}>جاري التحميل...</div>;

    return (
        <div style={{ padding: '28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <button onClick={() => navigate('/super-admin/tenants')}
                        style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '13px', marginBottom: '8px' }}>
                        ← العودة للمكاتب
                    </button>
                    <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {t.name}
                        {t.isFrozen && (
                            <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: '12px', padding: '3px 12px', borderRadius: '8px' }}>
                                🔒 مجمّد
                            </span>
                        )}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>
                        bewathiq.com/{t.slug} · {t.city || '—'} · {t.email}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Plan Selector */}
                    <select value={t.planType} onChange={e => changePlan.mutate(e.target.value)}
                        style={{
                            padding: '8px 16px', background: '#1e293b', border: '1px solid #334155',
                            borderRadius: '10px', color: '#e2e8f0', fontSize: '13px', outline: 'none', cursor: 'pointer',
                        }}>
                        <option value="BASIC">Basic</option>
                        <option value="PROFESSIONAL">Professional</option>
                        <option value="ENTERPRISE">Enterprise</option>
                    </select>

                    {/* Freeze/Unfreeze */}
                    {t.isFrozen ? (
                        <button onClick={() => unfreeze.mutate()}
                            style={{
                                padding: '8px 16px', background: '#16a34a', border: 'none',
                                borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                            }}>🔓 رفع التجميد</button>
                    ) : (
                        <button onClick={() => {
                            const reason = prompt('سبب التجميد:');
                            if (reason) freeze.mutate(reason);
                        }}
                            style={{
                                padding: '8px 16px', background: '#d97706', border: 'none',
                                borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                            }}>🔒 تجميد</button>
                    )}

                    {/* Delete */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => { setDeleteType('soft'); setShowDeleteModal(true); setDeleteConfirm(''); }}
                            style={{
                                padding: '8px 16px', background: '#dc2626', border: 'none',
                                borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                            }}>🗑️ حذف</button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        {[
                            { label: 'المستخدمون', value: t._count?.users ?? 0 },
                            { label: 'القضايا', value: t._count?.cases ?? 0 },
                            { label: 'العملاء', value: t._count?.clients ?? 0 },
                            { label: 'المستندات', value: t._count?.documents ?? 0 },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px',
                                padding: '16px', textAlign: 'center',
                            }}>
                                <p style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>{s.value}</p>
                                <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Owner Info */}
                    {owner && (
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' }}>
                            <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>معلومات المالك</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: 'rgba(99,102,241,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#818cf8', fontWeight: 700, fontSize: '16px',
                                }}>{owner.name?.charAt(0)}</div>
                                <div>
                                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: 500, margin: 0 }}>{owner.name}</p>
                                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: '2px 0 0' }}>{owner.email}</p>
                                    {owner.phone && <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>{owner.phone}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* All Users */}
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>كل المستخدمين</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            {t.users?.map((u: any) => (
                                <div key={u.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', background: '#1e293b', borderRadius: '10px',
                                }}>
                                    <div>
                                        <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{u.name}</span>
                                        <span style={{ color: '#475569', fontSize: '12px', marginRight: '8px' }}>{u.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                                            background: 'rgba(99,102,241,0.2)', color: '#818cf8',
                                        }}>{u.role}</span>
                                        <span style={{
                                            width: '6px', height: '6px', borderRadius: '50%',
                                            background: u.isActive ? '#4ade80' : '#f87171',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>ملاحظات داخلية</h3>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <input value={noteContent} onChange={e => setNoteContent(e.target.value)}
                                placeholder="أضف ملاحظة..."
                                style={{
                                    flex: 1, padding: '10px 14px', background: '#1e293b', border: '1px solid #334155',
                                    borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none',
                                }}
                            />
                            <select value={noteType} onChange={e => setNoteType(e.target.value)}
                                style={{
                                    padding: '10px', background: '#1e293b', border: '1px solid #334155',
                                    borderRadius: '10px', color: '#e2e8f0', fontSize: '12px', outline: 'none',
                                }}>
                                <option value="GENERAL">عام</option>
                                <option value="BILLING">مالي</option>
                                <option value="TECHNICAL">تقني</option>
                                <option value="COMPLAINT">شكوى</option>
                                <option value="FOLLOWUP">متابعة</option>
                            </select>
                            <button onClick={() => noteContent && addNote.mutate()}
                                style={{
                                    padding: '10px 16px', background: '#4f46e5', border: 'none',
                                    borderRadius: '10px', color: '#fff', fontSize: '13px', cursor: 'pointer',
                                }}>إضافة</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                            {(t.tenantNotes || []).map((n: any) => (
                                <div key={n.id} style={{ padding: '12px', background: '#1e293b', borderRadius: '10px' }}>
                                    <p style={{ color: '#e2e8f0', fontSize: '13px', margin: 0 }}>{n.content}</p>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                        <span style={{ color: '#475569', fontSize: '11px' }}>
                                            {new Date(n.createdAt).toLocaleDateString('ar-SA')}
                                        </span>
                                        <span style={{
                                            fontSize: '10px', padding: '1px 6px', borderRadius: '4px',
                                            background: 'rgba(99,102,241,0.2)', color: '#818cf8',
                                        }}>{n.type}</span>
                                    </div>
                                </div>
                            ))}
                            {(!t.tenantNotes || t.tenantNotes.length === 0) && (
                                <p style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '16px' }}>لا توجد ملاحظات</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column — Mini Chat */}
                <div style={{
                    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
                    padding: '20px', display: 'flex', flexDirection: 'column', maxHeight: '600px',
                }}>
                    <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
                        💬 الدردشة مع المكتب
                    </h3>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        {(t.superAdminChatRoom?.messages || []).slice().reverse().map((msg: any) => (
                            <div key={msg.id} style={{
                                alignSelf: msg.senderType === 'ADMIN' ? 'flex-start' : 'flex-end',
                                maxWidth: '85%', padding: '10px 14px',
                                background: msg.senderType === 'ADMIN' ? '#4f46e5' : '#1e293b',
                                borderRadius: msg.senderType === 'ADMIN' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                            }}>
                                <p style={{ color: '#e2e8f0', fontSize: '13px', margin: 0 }}>{msg.content}</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', margin: '4px 0 0' }}>
                                    {msg.senderName} · {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                        {(!t.superAdminChatRoom || !t.superAdminChatRoom.messages?.length) && (
                            <p style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>لا توجد رسائل بعد</p>
                        )}
                    </div>
                    <p style={{ color: '#475569', fontSize: '12px', textAlign: 'center' }}>
                        للدردشة الكاملة، زر <button onClick={() => navigate('/super-admin/chat')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '12px' }}>صفحة الدردشة</button>
                    </p>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
                }}>
                    <div style={{
                        background: '#0f172a', border: '1px solid #334155', borderRadius: '20px',
                        padding: '28px', width: '400px',
                    }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px',
                            background: deleteType === 'hard' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                        }}>{deleteType === 'hard' ? '⚠️' : '📦'}</div>

                        <h3 style={{ color: '#fff', fontWeight: 700, textAlign: 'center', margin: '0 0 8px' }}>
                            {deleteType === 'hard' ? '⚠️ حذف نهائي — لا يُسترجع' : 'حذف ناعم'}
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', margin: '0 0 20px' }}>
                            {deleteType === 'hard'
                                ? `ستُحذف جميع بيانات "${t.name}" بشكل نهائي ولا يمكن التراجع`
                                : 'سيُجمَّد المكتب ويُخفى — يمكن استرجاعه لاحقاً'}
                        </p>

                        {deleteType === 'hard' && (
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>اكتب اسم المكتب للتأكيد:</p>
                                <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                                    placeholder={t.name}
                                    style={{
                                        width: '100%', padding: '10px 14px', background: '#1e293b',
                                        border: '1px solid #475569', borderRadius: '10px', color: '#fff',
                                        fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowDeleteModal(false)}
                                style={{
                                    flex: 1, padding: '10px', background: '#1e293b', border: 'none',
                                    borderRadius: '12px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer',
                                }}>إلغاء</button>
                            <button
                                disabled={deleteType === 'hard' && deleteConfirm !== t.name}
                                onClick={() => {
                                    deleteType === 'soft' ? softDel.mutate() : hardDel.mutate();
                                    setShowDeleteModal(false);
                                }}
                                style={{
                                    flex: 1, padding: '10px', border: 'none', borderRadius: '12px',
                                    fontSize: '14px', cursor: 'pointer', color: '#fff',
                                    background: deleteType === 'hard' ? '#dc2626' : '#d97706',
                                    opacity: deleteType === 'hard' && deleteConfirm !== t.name ? 0.4 : 1,
                                }}>
                                {deleteType === 'hard' ? 'حذف نهائياً' : 'تأكيد الحذف'}
                            </button>
                        </div>

                        {deleteType === 'soft' && (
                            <button onClick={() => { setDeleteType('hard'); setDeleteConfirm(''); }}
                                style={{
                                    width: '100%', marginTop: '12px', padding: '10px', background: 'none',
                                    border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px',
                                    color: '#f87171', fontSize: '12px', cursor: 'pointer',
                                }}>⚠️ أريد حذف نهائي بدلاً من ذلك</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { superAdminApi } from '@/api/superAdmin';
import toast from 'react-hot-toast';

export default function SAStaffPage() {
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SUPPORT' });
    const [resetPw, setResetPw] = useState<{ id: string; name: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const { data: staff, refetch } = useQuery({ queryKey: ['sa-staff'], queryFn: superAdminApi.getStaff });

    const addStaff = useMutation({
        mutationFn: () => superAdminApi.addStaff(form),
        onSuccess: () => { refetch(); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'SUPPORT' }); toast.success('تم إضافة الموظف'); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'فشل الإضافة'),
    });

    const updateRole = useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) => superAdminApi.updateStaffRole(id, role),
        onSuccess: () => { refetch(); toast.success('تم تحديث الدور'); },
    });

    const toggleActive = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            isActive ? superAdminApi.deactivateStaff(id) : superAdminApi.activateStaff(id),
        onSuccess: () => { refetch(); toast.success('تم التحديث'); },
    });

    const resetPasswordMut = useMutation({
        mutationFn: () => superAdminApi.resetPassword(resetPw!.id, newPassword),
        onSuccess: () => { setResetPw(null); setNewPassword(''); toast.success('تم إعادة تعيين كلمة المرور'); },
    });

    const roleLabels: Record<string, string> = {
        OWNER: 'مالك النظام', MANAGER: 'مدير', SUPPORT: 'دعم فني', SALES: 'مبيعات', MODERATOR: 'مشرف',
    };
    const roleColors: Record<string, string> = {
        OWNER: '#c084fc', MANAGER: '#818cf8', SUPPORT: '#4ade80', SALES: '#fbbf24', MODERATOR: '#94a3b8',
    };

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>👥 موظفو وثيق</h1>
                <button onClick={() => setShowAdd(true)}
                    style={{
                        padding: '10px 20px', background: '#4f46e5', border: 'none',
                        borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                    }}>+ إضافة موظف</button>
            </div>

            {/* Staff Table */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b' }}>
                            {['الموظف', 'البريد', 'الدور', 'الحالة', 'آخر دخول', 'إجراءات'].map(h => (
                                <th key={h} style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px', fontWeight: 500, textAlign: 'right' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(staff || []).map((s: any) => (
                            <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: 'rgba(99,102,241,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#818cf8', fontWeight: 700, fontSize: '13px',
                                        }}>{s.name?.charAt(0)}</div>
                                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>{s.name}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{s.email}</td>
                                <td style={{ padding: '14px 16px' }}>
                                    <select value={s.role}
                                        onChange={e => updateRole.mutate({ id: s.id, role: e.target.value })}
                                        disabled={s.role === 'OWNER'}
                                        style={{
                                            padding: '4px 10px', background: '#1e293b', border: '1px solid #334155',
                                            borderRadius: '8px', color: roleColors[s.role] || '#94a3b8', fontSize: '12px',
                                            outline: 'none', cursor: s.role === 'OWNER' ? 'not-allowed' : 'pointer',
                                        }}>
                                        {Object.entries(roleLabels).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    <span style={{
                                        fontSize: '11px', padding: '3px 10px', borderRadius: '8px',
                                        background: s.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                        color: s.isActive ? '#4ade80' : '#f87171',
                                    }}>{s.isActive ? 'نشط' : 'موقوف'}</span>
                                </td>
                                <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px' }}>
                                    {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString('ar-SA') : 'لم يسجل دخول'}
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                    {s.role !== 'OWNER' && (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => toggleActive.mutate({ id: s.id, isActive: s.isActive })}
                                                style={{
                                                    padding: '4px 10px', background: s.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                                                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                                                    color: s.isActive ? '#f87171' : '#4ade80', fontSize: '11px',
                                                }}>{s.isActive ? 'إيقاف' : 'تفعيل'}</button>
                                            <button onClick={() => { setResetPw({ id: s.id, name: s.name }); setNewPassword(''); }}
                                                style={{
                                                    padding: '4px 10px', background: 'rgba(245,158,11,0.2)',
                                                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                                                    color: '#fbbf24', fontSize: '11px',
                                                }}>كلمة مرور</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Staff Modal */}
            {showAdd && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
                }}>
                    <div style={{
                        background: '#0f172a', border: '1px solid #334155', borderRadius: '20px',
                        padding: '28px', width: '400px',
                    }}>
                        <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>إضافة موظف جديد</h3>
                        {[
                            { key: 'name', label: 'الاسم', type: 'text', placeholder: 'أحمد محمد' },
                            { key: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'ahmed@bewathiq.com' },
                            { key: 'password', label: 'كلمة المرور', type: 'password', placeholder: '••••••••' },
                        ].map(f => (
                            <div key={f.key} style={{ marginBottom: '14px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                                <input
                                    type={f.type} value={(form as any)[f.key]}
                                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                    placeholder={f.placeholder}
                                    style={{
                                        width: '100%', padding: '10px 14px', background: '#1e293b',
                                        border: '1px solid #334155', borderRadius: '10px', color: '#fff',
                                        fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        ))}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>الدور</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                style={{
                                    width: '100%', padding: '10px 14px', background: '#1e293b',
                                    border: '1px solid #334155', borderRadius: '10px', color: '#e2e8f0',
                                    fontSize: '14px', outline: 'none',
                                }}>
                                <option value="SUPPORT">دعم فني</option>
                                <option value="SALES">مبيعات</option>
                                <option value="MODERATOR">مشرف</option>
                                <option value="MANAGER">مدير</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowAdd(false)}
                                style={{
                                    flex: 1, padding: '10px', background: '#1e293b', border: 'none',
                                    borderRadius: '12px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer',
                                }}>إلغاء</button>
                            <button onClick={() => addStaff.mutate()}
                                disabled={!form.name || !form.email || !form.password}
                                style={{
                                    flex: 1, padding: '10px', background: '#4f46e5', border: 'none',
                                    borderRadius: '12px', color: '#fff', fontSize: '14px', cursor: 'pointer',
                                    opacity: form.name && form.email && form.password ? 1 : 0.5,
                                }}>إضافة</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetPw && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
                }}>
                    <div style={{
                        background: '#0f172a', border: '1px solid #334155', borderRadius: '20px',
                        padding: '28px', width: '380px',
                    }}>
                        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                            إعادة تعيين كلمة المرور
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>للموظف: {resetPw.name}</p>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                            placeholder="كلمة المرور الجديدة"
                            style={{
                                width: '100%', padding: '10px 14px', background: '#1e293b',
                                border: '1px solid #334155', borderRadius: '10px', color: '#fff',
                                fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setResetPw(null)}
                                style={{ flex: 1, padding: '10px', background: '#1e293b', border: 'none', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                                إلغاء
                            </button>
                            <button onClick={() => resetPasswordMut.mutate()} disabled={!newPassword}
                                style={{
                                    flex: 1, padding: '10px', background: '#d97706', border: 'none',
                                    borderRadius: '12px', color: '#fff', cursor: 'pointer',
                                    opacity: newPassword ? 1 : 0.5,
                                }}>تحديث</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

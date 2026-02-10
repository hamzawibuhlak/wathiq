import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const API = '/api/hr';

async function fetchApi(url: string, options?: RequestInit) {
    const token = useAuthStore.getState().token;
    const res = await fetch(url, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'فشل'); }
    return res.json();
}

const statusMap: Record<string, { label: string; color: string }> = {
    LEAVE_PENDING: { label: 'في الانتظار', color: '#f59e0b' },
    LEAVE_APPROVED: { label: 'معتمد', color: '#10b981' },
    LEAVE_REJECTED: { label: 'مرفوض', color: '#ef4444' },
    LEAVE_CANCELED: { label: 'ملغي', color: '#6b7280' },
};

export default function LeaveManagementPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);

    useEffect(() => { loadData(); }, [statusFilter]);

    const loadData = async () => {
        try {
            setLoading(true);
            const qs = statusFilter ? `?status=${statusFilter}` : '';
            const [reqs, lts] = await Promise.all([
                fetchApi(`${API}/leave/requests${qs}`),
                fetchApi(`${API}/leave/types`),
            ]);
            setRequests(reqs); setLeaveTypes(lts);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleReview = async (id: string, status: string) => {
        try { await fetchApi(`${API}/leave/requests/${id}/review`, { method: 'PUT', body: JSON.stringify({ status }) }); loadData(); }
        catch (e: any) { alert(e.message); }
    };

    const handleInitialize = async () => {
        try { await fetchApi(`${API}/leave/types/initialize`, { method: 'POST' }); loadData(); }
        catch (e: any) { alert(e.message); }
    };

    const openModal = async () => {
        try { setEmployees(await fetchApi(`${API}/employees`)); setShowModal(true); }
        catch (e) { console.error(e); }
    };

    const pending = requests.filter((r: any) => r.status === 'LEAVE_PENDING').length;
    const approved = requests.filter((r: any) => r.status === 'LEAVE_APPROVED').length;
    const rejected = requests.filter((r: any) => r.status === 'LEAVE_REJECTED').length;

    return (
        <div style={{ padding: '24px', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>إدارة الإجازات</h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0' }}>طلبات الإجازات والموافقات</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {leaveTypes.length === 0 && <button onClick={handleInitialize} style={{ padding: '10px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>تهيئة أنواع الإجازات</button>}
                    <button onClick={openModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}><Plus size={18} /> طلب إجازة</button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                    { label: 'في الانتظار', value: pending, color: '#f59e0b', bg: '#fffbeb', icon: Clock },
                    { label: 'معتمدة', value: approved, color: '#10b981', bg: '#ecfdf5', icon: CheckCircle },
                    { label: 'مرفوضة', value: rejected, color: '#ef4444', bg: '#fef2f2', icon: XCircle },
                ].map((c, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><c.icon size={20} color={c.color} /></div>
                        <div><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{c.label}</p><p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{c.value}</p></div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div style={{ marginBottom: '20px' }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', background: 'white', direction: 'rtl' }}>
                    <option value="">جميع الحالات</option>
                    {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>جاري التحميل...</div> :
                    requests.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}><Calendar size={40} color="#cbd5e1" /><p>لا توجد طلبات إجازة</p></div> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: '#f8fafc' }}>
                                {['الموظف', 'نوع الإجازة', 'من', 'إلى', 'الأيام', 'الحالة', 'إجراءات'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {requests.map((r: any) => {
                                    const s = statusMap[r.status] || { label: r.status, color: '#6b7280' };
                                    return (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '14px 16px' }}><p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{r.employee?.firstName} {r.employee?.lastName}</p></td>
                                            <td style={{ padding: '14px 16px', fontSize: '14px' }}>{r.leaveType?.nameAr || r.leaveType?.name}</td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px' }}>{new Date(r.startDate).toLocaleDateString('ar-SA')}</td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px' }}>{new Date(r.endDate).toLocaleDateString('ar-SA')}</td>
                                            <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600' }}>{r.totalDays}</td>
                                            <td style={{ padding: '14px 16px' }}><span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: s.color + '18', color: s.color }}>{s.label}</span></td>
                                            <td style={{ padding: '14px 16px' }}>
                                                {r.status === 'LEAVE_PENDING' && (
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button onClick={() => handleReview(r.id, 'LEAVE_APPROVED')} style={{ padding: '6px 12px', background: '#ecfdf5', color: '#10b981', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>اعتماد</button>
                                                        <button onClick={() => handleReview(r.id, 'LEAVE_REJECTED')} style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>رفض</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
            </div>

            {showModal && <SubmitLeaveModal employees={employees} leaveTypes={leaveTypes} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); loadData(); }} />}
        </div>
    );
}

function SubmitLeaveModal({ employees, leaveTypes, onClose, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try { setLoading(true); await fetchApi(`${API}/leave/requests`, { method: 'POST', body: JSON.stringify(form) }); onSuccess(); }
        catch (err: any) { alert(err.message); } finally { setLoading(false); }
    };

    const iStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', direction: 'rtl' as const };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '500px', padding: '28px', direction: 'rtl' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px' }}>طلب إجازة جديد</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div><label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>الموظف *</label>
                            <select required style={iStyle} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}><option value="">اختر</option>{employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}</select>
                        </div>
                        <div><label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>نوع الإجازة *</label>
                            <select required style={iStyle} value={form.leaveTypeId} onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}><option value="">اختر</option>{leaveTypes.map((lt: any) => <option key={lt.id} value={lt.id}>{lt.nameAr || lt.name}</option>)}</select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div><label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>من *</label><input required type="date" style={iStyle} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                            <div><label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>إلى *</label><input required type="date" style={iStyle} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
                        </div>
                        <div><label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>السبب *</label>
                            <textarea required style={{ ...iStyle, minHeight: '80px' }} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button type="submit" disabled={loading} style={{ padding: '10px 28px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>{loading ? 'جاري الإرسال...' : 'إرسال الطلب'}</button>
                        <button type="button" onClick={onClose} style={{ padding: '10px 28px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>إلغاء</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
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

const statusLabels: Record<string, { label: string; color: string }> = {
    PRESENT: { label: 'حاضر', color: '#10b981' },
    ABSENT: { label: 'غائب', color: '#ef4444' },
    LATE: { label: 'متأخر', color: '#f59e0b' },
    HALF_DAY: { label: 'نصف يوم', color: '#6366f1' },
    ON_LEAVE_ATT: { label: 'إجازة', color: '#8b5cf6' },
};

export default function AttendancePage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => { loadAttendance(); }, [selectedDate]);

    const loadAttendance = async () => {
        try { setLoading(true); setRecords(await fetchApi(`${API}/attendance?date=${selectedDate}`)); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleClockIn = async (employeeId: string) => {
        try { await fetchApi(`${API}/attendance/clock-in`, { method: 'POST', body: JSON.stringify({ employeeId }) }); loadAttendance(); }
        catch (e: any) { alert(e.message); }
    };

    const handleClockOut = async (employeeId: string) => {
        try { await fetchApi(`${API}/attendance/clock-out`, { method: 'POST', body: JSON.stringify({ employeeId }) }); loadAttendance(); }
        catch (e: any) { alert(e.message); }
    };

    const handleMarkAbsent = async () => {
        try { const r = await fetchApi(`${API}/attendance/mark-absent`, { method: 'POST', body: JSON.stringify({ date: selectedDate }) }); alert(`تم تسجيل ${r.marked} غائب`); loadAttendance(); }
        catch (e: any) { alert(e.message); }
    };

    const summary = {
        present: records.filter(r => r.status === 'PRESENT').length,
        late: records.filter(r => r.status === 'LATE').length,
        absent: records.filter(r => r.status === 'ABSENT').length,
    };

    return (
        <div style={{ padding: '24px', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>الحضور والانصراف</h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0' }}>تتبع حضور وانصراف الموظفين</p>
                </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                    { label: 'حاضرون', value: summary.present, color: '#10b981', bg: '#ecfdf5', icon: CheckCircle },
                    { label: 'متأخرون', value: summary.late, color: '#f59e0b', bg: '#fffbeb', icon: Clock },
                    { label: 'غائبون', value: summary.absent, color: '#ef4444', bg: '#fef2f2', icon: XCircle },
                ].map((c, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><c.icon size={20} color={c.color} /></div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{c.label}</p>
                            <p style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{c.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Date & Actions */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px' }} />
                <button onClick={handleMarkAbsent} style={{ padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>تسجيل الغياب التلقائي</button>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>جاري التحميل...</div> :
                    records.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}><Clock size={40} color="#cbd5e1" /><p>لا توجد سجلات</p></div> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: '#f8fafc' }}>
                                {['الموظف', 'الحالة', 'الحضور', 'الانصراف', 'ساعات العمل', 'تأخر', 'إجراءات'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {records.map((r: any) => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{r.employee?.firstName} {r.employee?.lastName}</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{r.employee?.employeeNumber}</p>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: (statusLabels[r.status]?.color || '#6b7280') + '18', color: statusLabels[r.status]?.color }}>{statusLabels[r.status]?.label || r.status}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '14px' }}>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '14px' }}>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '14px' }}>{r.workHours ? `${Number(r.workHours).toFixed(1)}h` : '-'}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '14px', color: r.isLate ? '#f59e0b' : '#475569' }}>{r.isLate ? `${r.lateMinutes}m` : '0'}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {!r.checkIn && <button onClick={() => handleClockIn(r.employeeId)} style={{ padding: '6px 12px', background: '#ecfdf5', color: '#10b981', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>حضور</button>}
                                            {r.checkIn && !r.checkOut && <button onClick={() => handleClockOut(r.employeeId)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>انصراف</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}

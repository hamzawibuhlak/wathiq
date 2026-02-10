import { useState, useEffect } from 'react';
import { DollarSign, Download, Clock, CreditCard } from 'lucide-react';
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
    PAYROLL_DRAFT: { label: 'مسودة', color: '#64748b' },
    PAYROLL_PROCESSED: { label: 'معالج', color: '#f59e0b' },
    PAYROLL_APPROVED: { label: 'معتمد', color: '#6366f1' },
    PAYROLL_PAID: { label: 'مدفوع', color: '#10b981' },
};

export default function PayrollPage() {
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [generating, setGenerating] = useState(false);

    useEffect(() => { loadPayrolls(); }, [month, year]);

    const loadPayrolls = async () => {
        try { setLoading(true); setPayrolls(await fetchApi(`${API}/payroll?month=${month}&year=${year}`)); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleGenerate = async () => {
        try { setGenerating(true); await fetchApi(`${API}/payroll/generate`, { method: 'POST', body: JSON.stringify({ month, year }) }); loadPayrolls(); }
        catch (e: any) { alert(e.message); } finally { setGenerating(false); }
    };

    const handleApprove = async (id: string) => {
        try { await fetchApi(`${API}/payroll/${id}/approve`, { method: 'PUT' }); loadPayrolls(); }
        catch (e: any) { alert(e.message); }
    };

    const handleMarkPaid = async (id: string) => {
        try { await fetchApi(`${API}/payroll/${id}/mark-paid`, { method: 'PUT', body: JSON.stringify({ paymentMethod: 'bank_transfer' }) }); loadPayrolls(); }
        catch (e: any) { alert(e.message); }
    };

    const handleDownloadBank = async () => {
        try {
            const token = useAuthStore.getState().token;
            const res = await fetch(`${API}/payroll/bank-file?month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `payroll-${year}-${month}.csv`; a.click();
        } catch (e: any) { alert(e.message); }
    };

    const totalGross = payrolls.reduce((s, p) => s + Number(p.grossSalary || 0), 0);
    const totalNet = payrolls.reduce((s, p) => s + Number(p.netSalary || 0), 0);
    const totalDeductions = payrolls.reduce((s, p) => s + Number(p.totalDeductions || 0), 0);

    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    return (
        <div style={{ padding: '24px', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>مسيّر الرواتب</h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0' }}>إعداد وإدارة رواتب الموظفين</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <select value={month} onChange={e => setMonth(+e.target.value)} style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', background: 'white' }}>
                        {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(+e.target.value)} style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', background: 'white' }}>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={handleGenerate} disabled={generating}
                        style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', opacity: generating ? 0.7 : 1 }}>
                        {generating ? 'جاري الإعداد...' : 'إعداد الرواتب'}
                    </button>
                    {payrolls.length > 0 && (
                        <button onClick={handleDownloadBank} style={{ padding: '10px 16px', background: '#ecfdf5', color: '#10b981', border: '1px solid #bbf7d0', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Download size={16} /> ملف البنك
                        </button>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                    { label: 'إجمالي الرواتب', value: totalGross, color: '#6366f1', bg: '#eef2ff', icon: DollarSign },
                    { label: 'صافي الرواتب', value: totalNet, color: '#10b981', bg: '#ecfdf5', icon: CreditCard },
                    { label: 'الاستقطاعات', value: totalDeductions, color: '#ef4444', bg: '#fef2f2', icon: Clock },
                ].map((c, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><c.icon size={20} color={c.color} /></div>
                        <div><p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{c.label}</p><p style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>{c.value.toLocaleString('ar-SA')} ر.س</p></div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>جاري التحميل...</div> :
                    payrolls.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        <DollarSign size={40} color="#cbd5e1" /><p>لا توجد رواتب لشهر {months[month - 1]} {year}</p>
                        <button onClick={handleGenerate} style={{ marginTop: '8px', padding: '8px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>إعداد الرواتب</button>
                    </div> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: '#f8fafc' }}>
                                {['الموظف', 'الأساسي', 'البدلات', 'الإجمالي', 'GOSI', 'خصومات', 'الصافي', 'الحالة', 'إجراءات'].map(h => (
                                    <th key={h} style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {payrolls.map((p: any) => {
                                    const s = statusMap[p.status] || { label: p.status, color: '#6b7280' };
                                    const allowances = Number(p.housingAllowance || 0) + Number(p.transportAllowance || 0);
                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '14px' }}><p style={{ margin: 0, fontWeight: '600', fontSize: '13px' }}>{p.employee?.firstName} {p.employee?.lastName}</p><p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{p.employee?.employeeNumber}</p></td>
                                            <td style={{ padding: '14px', fontSize: '13px' }}>{Number(p.basicSalary).toLocaleString()}</td>
                                            <td style={{ padding: '14px', fontSize: '13px' }}>{allowances.toLocaleString()}</td>
                                            <td style={{ padding: '14px', fontSize: '13px', fontWeight: '600' }}>{Number(p.grossSalary).toLocaleString()}</td>
                                            <td style={{ padding: '14px', fontSize: '13px', color: '#ef4444' }}>{Number(p.gosiEmployee).toLocaleString()}</td>
                                            <td style={{ padding: '14px', fontSize: '13px', color: '#ef4444' }}>{Number(p.totalDeductions).toLocaleString()}</td>
                                            <td style={{ padding: '14px', fontSize: '13px', fontWeight: '700', color: '#10b981' }}>{Number(p.netSalary).toLocaleString()}</td>
                                            <td style={{ padding: '14px' }}><span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.color + '18', color: s.color }}>{s.label}</span></td>
                                            <td style={{ padding: '14px' }}>
                                                {p.status === 'PAYROLL_DRAFT' && <button onClick={() => handleApprove(p.id)} style={{ padding: '5px 10px', background: '#eef2ff', color: '#6366f1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>اعتماد</button>}
                                                {p.status === 'PAYROLL_APPROVED' && <button onClick={() => handleMarkPaid(p.id)} style={{ padding: '5px 10px', background: '#ecfdf5', color: '#10b981', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>تم الدفع</button>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
            </div>
        </div>
    );
}

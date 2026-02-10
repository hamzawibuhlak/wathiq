import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, UserCheck, UserX, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const API = '/api/hr';

async function fetchApi(url: string, options?: RequestInit) {
    const token = useAuthStore.getState().token;
    const res = await fetch(url, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'فشل في العملية'); }
    return res.json();
}

interface Employee {
    id: string; employeeNumber: string; firstName: string; lastName: string;
    firstNameAr?: string; lastNameAr?: string; email?: string; phone: string;
    jobTitle: string; jobTitleAr?: string; employmentStatus: string; contractType: string;
    hireDate: string; department: { id: string; name: string };
}

const statusMap: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'نشط', color: '#10b981' }, PROBATION: { label: 'فترة تجربة', color: '#f59e0b' },
    ON_LEAVE: { label: 'إجازة', color: '#6366f1' }, SUSPENDED: { label: 'موقوف', color: '#ef4444' },
    TERMINATED: { label: 'منتهي', color: '#6b7280' }, RESIGNED: { label: 'مستقيل', color: '#8b5cf6' },
};

const contractMap: Record<string, string> = {
    FULL_TIME: 'دوام كامل', PART_TIME: 'دوام جزئي', CONTRACT: 'عقد', TEMPORARY: 'مؤقت', INTERNSHIP: 'تدريب',
};

export default function EmployeesListPage() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => { loadData(); }, [statusFilter, search]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.set('employmentStatus', statusFilter);
            if (search) params.set('search', search);
            const qs = params.toString() ? `?${params}` : '';
            const [emps, s] = await Promise.all([
                fetchApi(`${API}/employees${qs}`),
                fetchApi(`${API}/employees/statistics`),
            ]);
            setEmployees(emps);
            setStats(s);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div style={{ padding: '24px', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>إدارة الموظفين</h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0' }}>إدارة بيانات الموظفين والهيكل التنظيمي</p>
                </div>
                <button onClick={() => setShowAddModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                    <Plus size={18} /> إضافة موظف
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {[
                        { label: 'إجمالي الموظفين', value: stats.total, icon: Users, color: '#6366f1', bg: '#eef2ff' },
                        { label: 'نشط', value: stats.active, icon: UserCheck, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'فترة تجربة', value: stats.probation, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'منتهي', value: stats.terminated, icon: UserX, color: '#ef4444', bg: '#fef2f2' },
                    ].map((card, i) => (
                        <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{card.label}</p>
                                    <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '4px 0 0' }}>{card.value}</p>
                                </div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <card.icon size={24} color={card.color} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="text" placeholder="بحث بالاسم أو الرقم..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 40px 10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', direction: 'rtl' }} />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', background: 'white', direction: 'rtl' }}>
                    <option value="">جميع الحالات</option>
                    {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {loading ? <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>جاري التحميل...</div> :
                    employees.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <Users size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                            <p style={{ color: '#64748b', fontSize: '16px' }}>لا يوجد موظفون</p>
                            <button onClick={() => setShowAddModal(true)} style={{ marginTop: '12px', padding: '8px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>إضافة أول موظف</button>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: '#f8fafc' }}>
                                {['الرقم', 'الموظف', 'المسمى', 'القسم', 'العقد', 'الحالة', 'التعيين'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id} onClick={() => navigate(`/hr/employees/${emp.id}`)}
                                        style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6366f1', fontWeight: '600' }}>{emp.employeeNumber}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '600' }}>{emp.firstName[0]}</div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{emp.firstName} {emp.lastName}</p>
                                                    {emp.email && <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{emp.email}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{emp.jobTitleAr || emp.jobTitle}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{emp.department?.name || '-'}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px' }}>{contractMap[emp.contractType] || emp.contractType}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: (statusMap[emp.employmentStatus]?.color || '#6b7280') + '18', color: statusMap[emp.employmentStatus]?.color }}>{statusMap[emp.employmentStatus]?.label || emp.employmentStatus}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b' }}>{new Date(emp.hireDate).toLocaleDateString('ar-SA')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
            </div>

            {showAddModal && <AddEmployeeModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); loadData(); }} />}
        </div>
    );
}

function AddEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        firstName: '', lastName: '', firstNameAr: '', lastNameAr: '', dateOfBirth: '', gender: 'MALE',
        nationality: 'سعودي', nationalIdNumber: '', maritalStatus: 'SINGLE', email: '', phone: '',
        jobTitle: '', jobTitleAr: '', departmentId: '', hireDate: '', contractType: 'FULL_TIME',
        basicSalary: '', housingAllowance: '', transportAllowance: '', bankName: '', iban: '',
    });

    useEffect(() => { fetchApi(`${API}/departments`).then(setDepartments).catch(() => { }); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await fetchApi(`${API}/employees`, {
                method: 'POST',
                body: JSON.stringify({ ...form, basicSalary: parseFloat(form.basicSalary) || 0, housingAllowance: parseFloat(form.housingAllowance) || 0, transportAllowance: parseFloat(form.transportAllowance) || 0 }),
            });
            onSuccess();
        } catch (err: any) { alert(err.message || 'حدث خطأ'); } finally { setLoading(false); }
    };

    const iStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', direction: 'rtl' as const };
    const lStyle = { fontSize: '13px', fontWeight: '600' as const, color: '#374151', marginBottom: '4px', display: 'block' as const };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '700px', maxHeight: '85vh', overflow: 'auto', padding: '28px', direction: 'rtl' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px' }}>إضافة موظف جديد</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div><label style={lStyle}>الاسم الأول (عربي)</label><input style={iStyle} value={form.firstNameAr} onChange={e => setForm({ ...form, firstNameAr: e.target.value })} /></div>
                        <div><label style={lStyle}>الاسم الأخير (عربي)</label><input style={iStyle} value={form.lastNameAr} onChange={e => setForm({ ...form, lastNameAr: e.target.value })} /></div>
                        <div><label style={lStyle}>First Name *</label><input required style={iStyle} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
                        <div><label style={lStyle}>Last Name *</label><input required style={iStyle} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
                        <div><label style={lStyle}>تاريخ الميلاد *</label><input required type="date" style={iStyle} value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
                        <div><label style={lStyle}>الجنس</label><select style={iStyle} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="MALE">ذكر</option><option value="FEMALE">أنثى</option></select></div>
                        <div><label style={lStyle}>الجنسية</label><input style={iStyle} value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} /></div>
                        <div><label style={lStyle}>رقم الهوية *</label><input required style={iStyle} value={form.nationalIdNumber} onChange={e => setForm({ ...form, nationalIdNumber: e.target.value })} /></div>
                        <div><label style={lStyle}>الهاتف *</label><input required style={iStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        <div><label style={lStyle}>البريد</label><input type="email" style={iStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                        <div><label style={lStyle}>المسمى الوظيفي *</label><input required style={iStyle} value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} /></div>
                        <div><label style={lStyle}>القسم *</label><select required style={iStyle} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}><option value="">اختر</option>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                        <div><label style={lStyle}>تاريخ التعيين *</label><input required type="date" style={iStyle} value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} /></div>
                        <div><label style={lStyle}>نوع العقد</label><select style={iStyle} value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })}><option value="FULL_TIME">دوام كامل</option><option value="PART_TIME">دوام جزئي</option><option value="CONTRACT">عقد</option></select></div>
                        <div><label style={lStyle}>الراتب الأساسي *</label><input required type="number" step="0.01" style={iStyle} value={form.basicSalary} onChange={e => setForm({ ...form, basicSalary: e.target.value })} /></div>
                        <div><label style={lStyle}>بدل سكن</label><input type="number" step="0.01" style={iStyle} value={form.housingAllowance} onChange={e => setForm({ ...form, housingAllowance: e.target.value })} /></div>
                        <div><label style={lStyle}>بدل نقل</label><input type="number" step="0.01" style={iStyle} value={form.transportAllowance} onChange={e => setForm({ ...form, transportAllowance: e.target.value })} /></div>
                        <div><label style={lStyle}>البنك</label><input style={iStyle} value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} /></div>
                        <div style={{ gridColumn: 'span 2' }}><label style={lStyle}>IBAN</label><input style={iStyle} value={form.iban} onChange={e => setForm({ ...form, iban: e.target.value })} placeholder="SA..." /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-start' }}>
                        <button type="submit" disabled={loading} style={{ padding: '10px 28px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>{loading ? 'جاري الحفظ...' : 'حفظ الموظف'}</button>
                        <button type="button" onClick={onClose} style={{ padding: '10px 28px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>إلغاء</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

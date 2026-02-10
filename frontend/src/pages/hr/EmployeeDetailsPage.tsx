import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Phone, Mail, Building2, CreditCard, FileText, Calculator } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const API = '/api/hr';

async function fetchApi(url: string) {
    const token = useAuthStore.getState().token;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('فشل');
    return res.json();
}

const statusMap: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'نشط', color: '#10b981' }, PROBATION: { label: 'فترة تجربة', color: '#f59e0b' },
    ON_LEAVE: { label: 'إجازة', color: '#6366f1' }, SUSPENDED: { label: 'موقوف', color: '#ef4444' },
    TERMINATED: { label: 'منتهي', color: '#6b7280' }, RESIGNED: { label: 'مستقيل', color: '#8b5cf6' },
};

export default function EmployeeDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<any>(null);
    const [eosb, setEosb] = useState<any>(null);
    const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => { loadEmployee(); }, [id]);

    const loadEmployee = async () => {
        try {
            const emp = await fetchApi(`${API}/employees/${id}`);
            setEmployee(emp);
            try {
                const [e, lb] = await Promise.all([fetchApi(`${API}/employees/${id}/eosb`), fetchApi(`${API}/leave/balances/${id}`)]);
                setEosb(e); setLeaveBalances(lb);
            } catch { }
        } catch { navigate('/hr/employees'); } finally { setLoading(false); }
    };

    if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>جاري التحميل...</div>;
    if (!employee) return null;

    const s = statusMap[employee.employmentStatus];
    const tabs = [
        { id: 'info', label: 'المعلومات الشخصية' }, { id: 'employment', label: 'معلومات التوظيف' },
        { id: 'salary', label: 'الراتب والبدلات' }, { id: 'leaves', label: 'الإجازات' }, { id: 'documents', label: 'المستندات' },
    ];

    const InfoRow = ({ label, value }: { label: string; value: any }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>{label}</span>
            <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>{value || '-'}</span>
        </div>
    );

    return (
        <div style={{ padding: '24px', direction: 'rtl' }}>
            <button onClick={() => navigate('/hr/employees')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' }}>
                <ArrowRight size={18} /> العودة للقائمة
            </button>

            {/* Header */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: '700' }}>
                        {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{employee.firstNameAr || employee.firstName} {employee.lastNameAr || employee.lastName}</h1>
                        <p style={{ color: '#64748b', margin: '4px 0', fontSize: '15px' }}>{employee.jobTitleAr || employee.jobTitle}</p>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px' }}><CreditCard size={14} /> {employee.employeeNumber}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px' }}><Building2 size={14} /> {employee.department?.name}</span>
                            {employee.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px' }}><Phone size={14} /> {employee.phone}</span>}
                            {employee.email && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px' }}><Mail size={14} /> {employee.email}</span>}
                        </div>
                    </div>
                    <span style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: (s?.color || '#6b7280') + '18', color: s?.color }}>{s?.label || employee.employmentStatus}</span>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f8fafc', borderRadius: '12px', padding: '4px', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap',
                            background: activeTab === tab.id ? 'white' : 'transparent', color: activeTab === tab.id ? '#6366f1' : '#64748b',
                            boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                {activeTab === 'info' && <>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>المعلومات الشخصية</h3>
                    <InfoRow label="تاريخ الميلاد" value={new Date(employee.dateOfBirth).toLocaleDateString('ar-SA')} />
                    <InfoRow label="الجنس" value={employee.gender === 'MALE' ? 'ذكر' : 'أنثى'} />
                    <InfoRow label="الجنسية" value={employee.nationality} />
                    <InfoRow label="الحالة الاجتماعية" value={{ SINGLE: 'أعزب', MARRIED: 'متزوج', DIVORCED: 'مطلق', WIDOWED: 'أرمل' }[employee.maritalStatus as string]} />
                    <InfoRow label="الهاتف" value={employee.phone} />
                    <InfoRow label="البريد" value={employee.email} />
                </>}

                {activeTab === 'employment' && <>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>معلومات التوظيف</h3>
                    <InfoRow label="الرقم الوظيفي" value={employee.employeeNumber} />
                    <InfoRow label="القسم" value={employee.department?.name} />
                    <InfoRow label="نوع العقد" value={{ FULL_TIME: 'دوام كامل', PART_TIME: 'دوام جزئي', CONTRACT: 'عقد' }[employee.contractType as string]} />
                    <InfoRow label="تاريخ التعيين" value={new Date(employee.hireDate).toLocaleDateString('ar-SA')} />
                    <InfoRow label="المدير المباشر" value={employee.directManager ? `${employee.directManager.firstName} ${employee.directManager.lastName}` : '-'} />
                </>}

                {activeTab === 'salary' && <>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>الراتب والبدلات</h3>
                    <InfoRow label="الراتب الأساسي" value={`${Number(employee.basicSalary).toLocaleString()} ر.س`} />
                    <InfoRow label="بدل السكن" value={`${Number(employee.housingAllowance).toLocaleString()} ر.س`} />
                    <InfoRow label="بدل النقل" value={`${Number(employee.transportAllowance).toLocaleString()} ر.س`} />
                    <InfoRow label="إجمالي الراتب" value={`${(Number(employee.basicSalary) + Number(employee.housingAllowance) + Number(employee.transportAllowance)).toLocaleString()} ر.س`} />
                    <InfoRow label="البنك" value={employee.bankName} />
                    <InfoRow label="IBAN" value={employee.iban} />
                    {eosb && (
                        <div style={{ marginTop: '20px', padding: '16px', background: '#eef2ff', borderRadius: '12px' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#4338ca', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Calculator size={18} /> مكافأة نهاية الخدمة</h4>
                            <InfoRow label="سنوات الخدمة" value={`${eosb.yearsOfService} سنة`} />
                            <InfoRow label="المبلغ" value={<span style={{ fontWeight: '700', color: '#4338ca' }}>{Number(eosb.eosb).toLocaleString()} ر.س</span>} />
                        </div>
                    )}
                </>}

                {activeTab === 'leaves' && <>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>أرصدة الإجازات</h3>
                    {leaveBalances.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' }}>لا توجد أرصدة</p> : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                            {leaveBalances.map((b: any) => (
                                <div key={b.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                                    <p style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px' }}>{b.leaveType?.nameAr || b.leaveType?.name}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: '#64748b' }}>مخصص: {b.allocated}</span>
                                        <span style={{ color: '#10b981' }}>متبقي: {b.remaining}</span>
                                    </div>
                                    <div style={{ marginTop: '8px', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                                        <div style={{ height: '100%', width: `${b.allocated ? (b.used / b.allocated) * 100 : 0}%`, background: '#6366f1', borderRadius: '3px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>}

                {activeTab === 'documents' && <>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px' }}>المستندات</h3>
                    {(!employee.documents || employee.documents.length === 0) ? <p style={{ color: '#64748b', textAlign: 'center' }}>لا توجد مستندات</p> :
                        employee.documents.map((doc: any) => (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', marginBottom: '8px' }}>
                                <FileText size={20} color="#6366f1" />
                                <div><p style={{ margin: 0, fontWeight: '500' }}>{doc.title}</p><p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{new Date(doc.uploadedAt).toLocaleDateString('ar-SA')}</p></div>
                            </div>
                        ))
                    }
                </>}
            </div>
        </div>
    );
}

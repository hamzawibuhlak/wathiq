import { useState, useEffect } from 'react';
import { Wallet, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

const API_BASE = '/api/accounting';

async function fetchApi(url: string, options?: RequestInit) {
    const token = useAuthStore.getState().token;
    const res = await fetch(url, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) throw new Error('فشل في العملية');
    return res.json();
}

const statusMap: Record<string, { label: string; color: string }> = {
    EXP_PENDING: { label: 'بانتظار الموافقة', color: 'bg-yellow-100 text-yellow-700' },
    EXP_APPROVED: { label: 'موافق عليه', color: 'bg-green-100 text-green-700' },
    EXP_REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-700' },
    EXP_PAID: { label: 'مدفوع', color: 'bg-blue-100 text-blue-700' },
};

const paymentMethodLabels: Record<string, string> = {
    CASH: 'نقداً', BANK_TRANSFER: 'تحويل بنكي', CHECK: 'شيك', CREDIT_CARD: 'بطاقة ائتمان', DEBIT_CARD: 'بطاقة سحب',
};

export function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);

    const [newExpense, setNewExpense] = useState({
        date: new Date().toISOString().split('T')[0], amount: '', expenseCategoryId: '',
        description: '', paymentMethod: 'CASH', reference: '', notes: '',
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount || 0);

    const loadExpenses = async () => {
        try {
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const data = await fetchApi(`${API_BASE}/expenses${params}`);
            setExpenses(data);
        } catch { toast.error('فشل في تحميل المصروفات'); }
        finally { setLoading(false); }
    };

    const loadCategories = async () => {
        try { setCategories(await fetchApi(`${API_BASE}/expense-categories`)); } catch { }
    };

    useEffect(() => { loadExpenses(); loadCategories(); }, [statusFilter]);

    const handleCreate = async () => {
        if (!newExpense.description || !newExpense.amount || !newExpense.expenseCategoryId) {
            toast.error('يرجى تعبئة الحقول المطلوبة'); return;
        }
        setCreating(true);
        try {
            await fetchApi(`${API_BASE}/expenses`, {
                method: 'POST',
                body: JSON.stringify({ ...newExpense, amount: parseFloat(newExpense.amount) }),
            });
            toast.success('تم إضافة المصروف');
            setShowCreate(false);
            setNewExpense({ date: new Date().toISOString().split('T')[0], amount: '', expenseCategoryId: '', description: '', paymentMethod: 'CASH', reference: '', notes: '' });
            loadExpenses();
        } catch { toast.error('فشل في إضافة المصروف'); }
        finally { setCreating(false); }
    };

    const handleApprove = async (id: string) => {
        try { await fetchApi(`${API_BASE}/expenses/${id}/approve`, { method: 'POST' }); toast.success('تم الموافقة'); loadExpenses(); }
        catch { toast.error('فشل في الموافقة'); }
    };

    const handleReject = async (id: string) => {
        try { await fetchApi(`${API_BASE}/expenses/${id}/reject`, { method: 'POST' }); toast.success('تم الرفض'); loadExpenses(); }
        catch { toast.error('فشل في الرفض'); }
    };

    // Stats
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const pendingCount = expenses.filter(e => e.status === 'EXP_PENDING').length;
    const approvedTotal = expenses.filter(e => e.status === 'EXP_APPROVED' || e.status === 'EXP_PAID').reduce((s, e) => s + Number(e.amount || 0), 0);

    if (loading) {
        return (<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="w-7 h-7 text-primary" />المصروفات</h1>
                    <p className="text-muted-foreground">إدارة ومتابعة المصروفات</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)}><Plus className="w-4 h-4 ml-2" />مصروف جديد</Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                    <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">بانتظار الموافقة</p>
                    <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">الموافق عليها</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(approvedTotal)}</p>
                </div>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <h2 className="text-lg font-semibold">مصروف جديد</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} />
                        <Input type="number" placeholder="المبلغ *" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                        <select value={newExpense.expenseCategoryId} onChange={e => setNewExpense({ ...newExpense, expenseCategoryId: e.target.value })}
                            className="h-10 px-3 rounded-md border bg-background text-sm">
                            <option value="">اختر التصنيف *</option>
                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input placeholder="الوصف *" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                        <select value={newExpense.paymentMethod} onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                            className="h-10 px-3 rounded-md border bg-background text-sm">
                            {Object.entries(paymentMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
                        <Button onClick={handleCreate} disabled={creating}>
                            {creating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}حفظ
                        </Button>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="bg-card rounded-xl border p-4">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="h-10 px-3 rounded-md border bg-background text-sm min-w-[160px]">
                    <option value="">جميع الحالات</option>
                    {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* List */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-right">الرقم</th>
                            <th className="py-3 px-4 text-right">التاريخ</th>
                            <th className="py-3 px-4 text-right">الوصف</th>
                            <th className="py-3 px-4 text-right">التصنيف</th>
                            <th className="py-3 px-4 text-right">المبلغ</th>
                            <th className="py-3 px-4 text-right">طريقة الدفع</th>
                            <th className="py-3 px-4 text-right">الحالة</th>
                            <th className="py-3 px-4 text-right">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((exp: any) => (
                            <tr key={exp.id} className="border-b hover:bg-muted/30 transition">
                                <td className="py-3 px-4 font-mono text-primary">{exp.expenseNumber}</td>
                                <td className="py-3 px-4 text-muted-foreground">{new Date(exp.date).toLocaleDateString('ar-SA')}</td>
                                <td className="py-3 px-4">{exp.description}</td>
                                <td className="py-3 px-4 text-muted-foreground">{exp.expenseCategory?.name}</td>
                                <td className="py-3 px-4 font-semibold">{formatCurrency(Number(exp.amount))}</td>
                                <td className="py-3 px-4">{paymentMethodLabels[exp.paymentMethod] || exp.paymentMethod}</td>
                                <td className="py-3 px-4">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusMap[exp.status]?.color || 'bg-gray-100'}`}>
                                        {statusMap[exp.status]?.label || exp.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    {exp.status === 'EXP_PENDING' && (
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleApprove(exp.id)} className="text-green-600" title="موافقة"><CheckCircle className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleReject(exp.id)} className="text-red-600" title="رفض"><XCircle className="w-4 h-4" /></Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {expenses.length === 0 && (
                    <div className="p-12 text-center">
                        <Wallet className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">لا توجد مصروفات</h3>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExpensesPage;

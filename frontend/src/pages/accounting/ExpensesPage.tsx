import { useState } from 'react';
import { Wallet, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import {
    useExpenses,
    useExpenseCategories,
    useCreateExpense,
    useApproveExpense,
    useRejectExpense,
} from '@/hooks/use-accounting';
import {
    Expense, ExpenseStatus, PaymentMethod,
    EXPENSE_STATUS_LABELS, PAYMENT_METHOD_LABELS,
} from '@/types/accounting.types';
import toast from 'react-hot-toast';

export function ExpensesPage() {
    const [statusFilter, setStatusFilter] = useState<ExpenseStatus | ''>('');
    const [showCreate, setShowCreate] = useState(false);

    const { data: expenses = [], isLoading } = useExpenses(statusFilter || undefined);
    const { data: categories = [] } = useExpenseCategories();
    const createMutation = useCreateExpense();
    const approveMutation = useApproveExpense();
    const rejectMutation = useRejectExpense();

    const [newExpense, setNewExpense] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        expenseCategoryId: '',
        description: '',
        paymentMethod: 'CASH' as PaymentMethod,
        reference: '',
        notes: '',
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount || 0);

    const handleCreate = () => {
        if (!newExpense.description || !newExpense.amount || !newExpense.expenseCategoryId) {
            toast.error('يرجى تعبئة الحقول المطلوبة');
            return;
        }
        createMutation.mutate(
            { ...newExpense, amount: parseFloat(newExpense.amount) },
            {
                onSuccess: () => {
                    setShowCreate(false);
                    setNewExpense({
                        date: new Date().toISOString().split('T')[0],
                        amount: '', expenseCategoryId: '', description: '',
                        paymentMethod: 'CASH', reference: '', notes: '',
                    });
                },
            }
        );
    };

    // Stats
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const pendingCount = expenses.filter(e => e.status === 'EXP_PENDING').length;
    const approvedTotal = expenses
        .filter(e => e.status === 'EXP_APPROVED' || e.status === 'EXP_PAID')
        .reduce((s, e) => s + Number(e.amount || 0), 0);

    if (isLoading) return <LoadingState size="lg" />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="w-7 h-7 text-primary" />المصروفات
                    </h1>
                    <p className="text-muted-foreground">إدارة ومتابعة المصروفات</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="w-4 h-4 ml-2" />مصروف جديد
                </Button>
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
                        <select
                            value={newExpense.expenseCategoryId}
                            onChange={e => setNewExpense({ ...newExpense, expenseCategoryId: e.target.value })}
                            className="h-10 px-3 rounded-md border bg-background text-sm"
                        >
                            <option value="">اختر التصنيف *</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            placeholder="الوصف *"
                            value={newExpense.description}
                            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                        />
                        <select
                            value={newExpense.paymentMethod}
                            onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value as PaymentMethod })}
                            className="h-10 px-3 rounded-md border bg-background text-sm"
                        >
                            {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
                        <Button onClick={handleCreate} disabled={createMutation.isPending}>
                            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                            حفظ
                        </Button>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="bg-card rounded-xl border p-4">
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as ExpenseStatus | '')}
                    className="h-10 px-3 rounded-md border bg-background text-sm min-w-[160px]"
                >
                    <option value="">جميع الحالات</option>
                    {Object.entries(EXPENSE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* List */}
            {expenses.length === 0 ? (
                <EmptyState icon={Wallet} title="لا توجد مصروفات" description="ابدأ بإضافة أول مصروف." />
            ) : (
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
                            {expenses.map((exp: Expense) => (
                                <tr key={exp.id} className="border-b hover:bg-muted/30 transition">
                                    <td className="py-3 px-4 font-mono text-primary">{exp.expenseNumber}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{new Date(exp.date).toLocaleDateString('ar-SA')}</td>
                                    <td className="py-3 px-4">{exp.description}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{exp.expenseCategory?.name}</td>
                                    <td className="py-3 px-4 font-semibold">{formatCurrency(Number(exp.amount))}</td>
                                    <td className="py-3 px-4">{PAYMENT_METHOD_LABELS[exp.paymentMethod] || exp.paymentMethod}</td>
                                    <td className="py-3 px-4">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${EXPENSE_STATUS_LABELS[exp.status]?.color || 'bg-gray-100'}`}>
                                            {EXPENSE_STATUS_LABELS[exp.status]?.label || exp.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {exp.status === 'EXP_PENDING' && (
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => approveMutation.mutate(exp.id)}
                                                    className="text-green-600"
                                                    title="موافقة"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="sm"
                                                    onClick={() => rejectMutation.mutate(exp.id)}
                                                    className="text-red-600"
                                                    title="رفض"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ExpensesPage;

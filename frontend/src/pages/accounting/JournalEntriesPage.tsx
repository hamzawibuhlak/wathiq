import { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, Clock, XCircle, ArrowUpDown, Eye, Loader2 } from 'lucide-react';
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

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    DRAFT: { label: 'مسودة', color: 'bg-gray-100 text-gray-700', icon: Clock },
    PENDING_APPROVAL: { label: 'بانتظار الموافقة', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    APPROVED: { label: 'موافق عليه', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    POSTED: { label: 'مرحل', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    REVERSED: { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const typeLabels: Record<string, string> = {
    MANUAL: 'يدوي', INVOICE: 'فاتورة', PAYMENT: 'دفعة', RECEIPT: 'إيصال',
    ADJUSTMENT: 'تعديل', OPENING_BALANCE: 'رصيد افتتاحي', CLOSING: 'إقفال', DEPRECIATION: 'إهلاك',
};

export function JournalEntriesPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);

    // New entry form
    const [newEntry, setNewEntry] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '', type: 'MANUAL',
        lines: [{ accountId: '', description: '', debit: 0, credit: 0 }, { accountId: '', description: '', debit: 0, credit: 0 }],
    });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount || 0);

    const loadEntries = async () => {
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (statusFilter) params.set('status', statusFilter);
            const data = await fetchApi(`${API_BASE}/journal-entries?${params}`);
            setEntries(data.entries || []);
            setTotalPages(data.totalPages || 1);
        } catch { toast.error('فشل في تحميل القيود'); }
        finally { setLoading(false); }
    };

    const loadAccounts = async () => {
        try {
            const data = await fetchApi(`${API_BASE}/accounts`);
            setAccounts(data);
        } catch { }
    };

    useEffect(() => { loadEntries(); loadAccounts(); }, [page, statusFilter]);

    const handleApprove = async (id: string) => {
        try {
            await fetchApi(`${API_BASE}/journal-entries/${id}/approve`, { method: 'POST' });
            toast.success('تم الموافقة على القيد');
            loadEntries();
        } catch { toast.error('فشل في الموافقة'); }
    };

    const handlePost = async (id: string) => {
        try {
            await fetchApi(`${API_BASE}/journal-entries/${id}/post`, { method: 'POST' });
            toast.success('تم ترحيل القيد');
            loadEntries();
        } catch { toast.error('فشل في الترحيل'); }
    };

    const addLine = () => {
        setNewEntry(prev => ({
            ...prev,
            lines: [...prev.lines, { accountId: '', description: '', debit: 0, credit: 0 }],
        }));
    };

    const updateLine = (index: number, field: string, value: any) => {
        setNewEntry(prev => ({
            ...prev,
            lines: prev.lines.map((l, i) => i === index ? { ...l, [field]: value } : l),
        }));
    };

    const totalDebit = newEntry.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = newEntry.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const handleCreate = async () => {
        if (!newEntry.description) { toast.error('يرجى إدخال الوصف'); return; }
        if (!isBalanced) { toast.error('القيد غير متوازن'); return; }
        if (totalDebit === 0) { toast.error('يجب إدخال مبالغ'); return; }

        setCreating(true);
        try {
            await fetchApi(`${API_BASE}/journal-entries`, {
                method: 'POST',
                body: JSON.stringify({
                    ...newEntry,
                    lines: newEntry.lines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0)),
                }),
            });
            toast.success('تم إنشاء القيد');
            setShowCreate(false);
            setNewEntry({ date: new Date().toISOString().split('T')[0], description: '', type: 'MANUAL', lines: [{ accountId: '', description: '', debit: 0, credit: 0 }, { accountId: '', description: '', debit: 0, credit: 0 }] });
            loadEntries();
        } catch { toast.error('فشل في إنشاء القيد'); }
        finally { setCreating(false); }
    };

    if (loading) {
        return (<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-7 h-7 text-primary" />القيود اليومية</h1>
                    <p className="text-muted-foreground">إدارة قيود المحاسبة - القيد المزدوج</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="w-4 h-4 ml-2" />قيد جديد
                </Button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-card rounded-xl border p-6 space-y-4">
                    <h2 className="text-lg font-semibold">قيد يومية جديد</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input type="date" value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} />
                        <Input placeholder="الوصف *" value={newEntry.description} onChange={e => setNewEntry({ ...newEntry, description: e.target.value })} />
                        <select value={newEntry.type} onChange={e => setNewEntry({ ...newEntry, type: e.target.value })} className="h-10 px-3 rounded-md border bg-background text-sm">
                            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>

                    {/* Lines */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="py-2 px-3 text-right">الحساب</th>
                                    <th className="py-2 px-3 text-right">البيان</th>
                                    <th className="py-2 px-3 text-right w-32">مدين</th>
                                    <th className="py-2 px-3 text-right w-32">دائن</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newEntry.lines.map((line, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="py-2 px-3">
                                            <select value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)}
                                                className="h-9 w-full px-2 rounded border bg-background text-sm">
                                                <option value="">اختر حساب</option>
                                                {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.accountNumber} - {a.nameAr}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-2 px-3"><Input placeholder="بيان" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} className="h-9" /></td>
                                        <td className="py-2 px-3"><Input type="number" min="0" step="0.01" value={line.debit || ''} onChange={e => updateLine(i, 'debit', parseFloat(e.target.value) || 0)} className="h-9" /></td>
                                        <td className="py-2 px-3"><Input type="number" min="0" step="0.01" value={line.credit || ''} onChange={e => updateLine(i, 'credit', parseFloat(e.target.value) || 0)} className="h-9" /></td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-muted/30 font-semibold">
                                    <td colSpan={2} className="py-2 px-3">الإجمالي</td>
                                    <td className="py-2 px-3">{formatCurrency(totalDebit)}</td>
                                    <td className="py-2 px-3">{formatCurrency(totalCredit)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={addLine}>+ سطر</Button>
                            <span className={`text-sm font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                {isBalanced ? '✓ متوازن' : '✗ غير متوازن'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
                            <Button onClick={handleCreate} disabled={creating || !isBalanced}>
                                {creating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                                حفظ القيد
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-card rounded-xl border p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="h-10 px-3 rounded-md border bg-background text-sm min-w-[160px]">
                        <option value="">جميع الحالات</option>
                        {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Entries List */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-right">رقم القيد</th>
                            <th className="py-3 px-4 text-right">التاريخ</th>
                            <th className="py-3 px-4 text-right">الوصف</th>
                            <th className="py-3 px-4 text-right">النوع</th>
                            <th className="py-3 px-4 text-right">المبلغ</th>
                            <th className="py-3 px-4 text-right">الحالة</th>
                            <th className="py-3 px-4 text-right">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry: any) => {
                            const totalDr = entry.lines?.reduce((s: number, l: any) => s + Number(l.debit || 0), 0) || 0;
                            const st = statusLabels[entry.status] || statusLabels.DRAFT;
                            const StIcon = st.icon;
                            return (
                                <tr key={entry.id} className="border-b hover:bg-muted/30 transition">
                                    <td className="py-3 px-4 font-mono text-primary">{entry.entryNumber}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{new Date(entry.date).toLocaleDateString('ar-SA')}</td>
                                    <td className="py-3 px-4">{entry.description}</td>
                                    <td className="py-3 px-4"><span className="text-xs bg-muted px-2 py-0.5 rounded">{typeLabels[entry.type] || entry.type}</span></td>
                                    <td className="py-3 px-4 font-semibold">{formatCurrency(totalDr)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${st.color}`}>
                                            <StIcon className="w-3 h-3" />{st.label}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {entry.status === 'DRAFT' && (
                                                <Button variant="ghost" size="sm" onClick={() => handleApprove(entry.id)} className="text-blue-600">
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {entry.status === 'APPROVED' && (
                                                <Button variant="ghost" size="sm" onClick={() => handlePost(entry.id)} className="text-green-600">
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {entries.length === 0 && (
                    <div className="p-12 text-center">
                        <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">لا توجد قيود</h3>
                        <p className="text-muted-foreground">أنشئ قيداً يومياً جديداً للبدء</p>
                    </div>
                )}
            </div>

            {/* Entry Detail */}
            {selectedEntry && (
                <div className="bg-card rounded-xl border p-6">
                    <h3 className="text-lg font-semibold mb-4">تفاصيل القيد: {selectedEntry.entryNumber}</h3>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b bg-muted/50">
                            <th className="py-2 px-3 text-right">الحساب</th><th className="py-2 px-3 text-right">البيان</th>
                            <th className="py-2 px-3 text-right">مدين</th><th className="py-2 px-3 text-right">دائن</th>
                        </tr></thead>
                        <tbody>
                            {selectedEntry.lines?.map((line: any) => (
                                <tr key={line.id} className="border-b">
                                    <td className="py-2 px-3">{line.account?.accountNumber} - {line.account?.nameAr}</td>
                                    <td className="py-2 px-3 text-muted-foreground">{line.description}</td>
                                    <td className="py-2 px-3 text-green-600">{Number(line.debit) > 0 ? formatCurrency(Number(line.debit)) : '-'}</td>
                                    <td className="py-2 px-3 text-red-600">{Number(line.credit) > 0 ? formatCurrency(Number(line.credit)) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
                    <span className="text-sm text-muted-foreground px-4">صفحة {page} من {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>التالي</Button>
                </div>
            )}
        </div>
    );
}

export default JournalEntriesPage;

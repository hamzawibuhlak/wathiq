import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Receipt, AlertTriangle, Search, X, TrendingUp, TrendingDown, DollarSign, Clock, FileDown, Trash2, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { InvoiceCard } from '@/components/invoices';
import { useInvoices, useDeleteInvoice, useMarkInvoiceAsPaid } from '@/hooks/use-invoices';
import { BulkActionsBar } from '@/components/common/BulkActionsBar';
import { exportInvoices } from '@/api/exports.api';
import toast from 'react-hot-toast';

export function InvoicesListPage() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const limit = 12;

    const { data, isLoading, error } = useInvoices({
        search: search || undefined,
        status: status || undefined,
        page,
        limit,
    });

    const deleteMutation = useDeleteInvoice();
    const markPaidMutation = useMarkInvoiceAsPaid();

    const invoices = data?.data || [];
    const totalPages = data?.meta?.totalPages || 1;

    // Selection handlers
    const handleSelectItem = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedIds(invoices.map(i => i.id));
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const isAllSelected = invoices.length > 0 && selectedIds.length === invoices.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < invoices.length;

    // Export handler
    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportInvoices({
                status: status || undefined,
                ids: selectedIds.length > 0 ? selectedIds : undefined,
            });
            toast.success('تم تصدير البيانات بنجاح');
        } catch (error) {
            toast.error('فشل تصدير البيانات');
        } finally {
            setIsExporting(false);
        }
    };

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} فاتورة؟`)) return;

        try {
            for (const id of selectedIds) {
                await deleteMutation.mutateAsync(id);
            }
            setSelectedIds([]);
            toast.success(`تم حذف ${selectedIds.length} فاتورة`);
        } catch (error) {
            toast.error('فشل حذف بعض الفواتير');
        }
    };

    // Bulk mark as paid handler
    const handleBulkMarkPaid = async () => {
        if (!window.confirm(`هل أنت متأكد من تعليم ${selectedIds.length} فاتورة كمدفوعة؟`)) return;

        try {
            for (const id of selectedIds) {
                await markPaidMutation.mutateAsync(id);
            }
            setSelectedIds([]);
            toast.success(`تم تعليم ${selectedIds.length} فاتورة كمدفوعة`);
        } catch (error) {
            toast.error('فشل تعليم بعض الفواتير');
        }
    };

    // Calculate stats from loaded invoices
    const stats = {
        total: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        paid: invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.totalAmount, 0),
        pending: invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED').reduce((sum, inv) => sum + inv.totalAmount, 0),
        overdue: invoices.filter(inv => {
            if (inv.status === 'PAID') return false;
            if (!inv.dueDate) return false;
            return new Date(inv.dueDate) < new Date();
        }).reduce((sum, inv) => sum + inv.totalAmount, 0),
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
            deleteMutation.mutate(id);
        }
    };

    const handleMarkPaid = (id: string) => {
        markPaidMutation.mutate(id);
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setPage(1);
        setSelectedIds([]);
    };

    const statusOptions = [
        { value: '', label: 'جميع الحالات' },
        { value: 'DRAFT', label: 'مسودة' },
        { value: 'SENT', label: 'مُرسلة' },
        { value: 'PAID', label: 'مدفوعة' },
        { value: 'OVERDUE', label: 'متأخرة' },
        { value: 'CANCELLED', label: 'ملغاة' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Receipt className="w-7 h-7 text-primary" />
                        الفواتير
                    </h1>
                    <p className="text-muted-foreground">
                        إدارة الفواتير والمدفوعات
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                        <FileDown className="w-4 h-4 ml-2" />
                        {isExporting ? 'جاري التصدير...' : 'تصدير Excel'}
                    </Button>
                    <Link to="/invoices/new">
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            فاتورة جديدة
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">الإجمالي</p>
                            <p className="text-lg font-bold">{formatCurrency(stats.total)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">المدفوعة</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.paid)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">المعلقة</p>
                            <p className="text-lg font-bold text-yellow-600">{formatCurrency(stats.pending)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">المتأخرة</p>
                            <p className="text-lg font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="بحث برقم الفاتورة أو اسم العميل..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); setSelectedIds([]); }}
                        className="h-10 px-3 rounded-md border bg-background text-sm min-w-[140px]"
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {(search || status) && (
                        <Button variant="ghost" onClick={handleReset}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Select All Header */}
            {!isLoading && !error && invoices.length > 0 && (
                <div className="flex items-center gap-3 px-2">
                    <Checkbox
                        checked={isAllSelected}
                        indeterminate={isSomeSelected}
                        onChange={() => {
                            if (isAllSelected) {
                                handleClearSelection();
                            } else {
                                handleSelectAll();
                            }
                        }}
                    />
                    <span className="text-sm text-muted-foreground">
                        {isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </span>
                    {selectedIds.length > 0 && (
                        <span className="text-sm font-medium text-primary">
                            ({selectedIds.length} محدد)
                        </span>
                    )}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-card rounded-xl border p-5 animate-pulse">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 bg-muted rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-1/2 h-4 bg-muted rounded" />
                                    <div className="w-1/3 h-3 bg-muted rounded" />
                                </div>
                            </div>
                            <div className="w-2/3 h-6 bg-muted rounded mb-4" />
                            <div className="flex justify-between pt-3 border-t">
                                <div className="w-16 h-5 bg-muted rounded-full" />
                                <div className="w-24 h-4 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-destructive font-medium">حدث خطأ أثناء تحميل الفواتير</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && invoices.length === 0 && (
                <div className="bg-card rounded-xl border p-12 text-center">
                    <Receipt className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد فواتير</h3>
                    <p className="text-muted-foreground mb-4">
                        لم يتم العثور على فواتير مطابقة
                    </p>
                    <Link to="/invoices/new">
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            إنشاء فاتورة جديدة
                        </Button>
                    </Link>
                </div>
            )}

            {/* Invoices Grid */}
            {!isLoading && !error && invoices.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {invoices.map((invoice) => (
                            <div key={invoice.id} className="relative">
                                {/* Checkbox overlay */}
                                <div className="absolute top-3 right-3 z-10">
                                    <Checkbox
                                        checked={selectedIds.includes(invoice.id)}
                                        onChange={() => handleSelectItem(invoice.id)}
                                    />
                                </div>
                                <div className={selectedIds.includes(invoice.id) ? 'ring-2 ring-primary rounded-xl' : ''}>
                                    <InvoiceCard
                                        invoice={invoice}
                                        onMarkPaid={handleMarkPaid}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                السابق
                            </Button>
                            <span className="text-sm text-muted-foreground px-4">
                                صفحة {page} من {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                التالي
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Bulk Actions Bar */}
            <BulkActionsBar
                selectedCount={selectedIds.length}
                totalCount={invoices.length}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                isAllSelected={isAllSelected}
                actions={[
                    {
                        label: 'تصدير',
                        icon: <FileDown className="w-4 h-4" />,
                        onClick: handleExport,
                        disabled: isExporting,
                    },
                    {
                        label: 'تعليم كمدفوعة',
                        icon: <CheckCircle className="w-4 h-4" />,
                        onClick: handleBulkMarkPaid,
                        variant: 'secondary',
                    },
                    {
                        label: 'حذف',
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: handleBulkDelete,
                        variant: 'destructive',
                    },
                ]}
            />
        </div>
    );
}

export default InvoicesListPage;

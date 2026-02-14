import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { Plus, Scale, AlertTriangle, FileDown, Trash2, CheckCircle, Clock, XCircle, Archive } from 'lucide-react';
import { Button } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { CaseCard, CaseFilters, FilterValues } from '@/components/cases';
import { useCases, useDeleteCase } from '@/hooks/use-cases';
import { BulkActionsBar } from '@/components/common/BulkActionsBar';
import { exportCases } from '@/api/exports.api';
import { casesApi } from '@/api/cases.api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function CasesListPage() {
    const { p } = useSlugPath();
    const [filters, setFilters] = useState<FilterValues>({});
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const limit = 10;
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useCases({
        ...filters,
        page,
        limit
    });

    const deleteMutation = useDeleteCase();

    const cases = data?.data || [];
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
        setSelectedIds(cases.map(c => c.id));
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const isAllSelected = cases.length > 0 && selectedIds.length === cases.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < cases.length;

    // Export handler
    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportCases({
                status: filters.status || undefined,
                ids: selectedIds.length > 0 ? selectedIds : undefined
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
        if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} قضية؟`)) return;

        try {
            await casesApi.bulkDelete(selectedIds);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            toast.success(`تم حذف ${selectedIds.length} قضية`);
        } catch (error) {
            toast.error('فشل حذف القضايا');
        }
    };

    // Bulk status change handler
    const handleBulkStatusChange = async (status: string) => {
        setIsUpdatingStatus(true);
        try {
            await casesApi.bulkUpdateStatus(selectedIds, status);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            toast.success(`تم تحديث حالة ${selectedIds.length} قضية`);
        } catch (error) {
            toast.error('فشل تحديث الحالة');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleFilter = (newFilters: FilterValues) => {
        setFilters(newFilters);
        setPage(1);
        setSelectedIds([]);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه القضية؟')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Scale className="w-7 h-7 text-primary" />
                        إدارة القضايا
                    </h1>
                    <p className="text-muted-foreground">
                        إدارة جميع القضايا القانونية في مكتبك
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                        <FileDown className="w-4 h-4 ml-2" />
                        {isExporting ? 'جاري التصدير...' : 'تصدير Excel'}
                    </Button>
                    <Link to={p('/cases/new')}>
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            قضية جديدة
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <CaseFilters onFilter={handleFilter} initialValues={filters} />

            {/* Select All Header */}
            {!isLoading && !error && cases.length > 0 && (
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
                                <div className="w-10 h-10 bg-muted rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-3/4 h-4 bg-muted rounded" />
                                    <div className="w-1/2 h-3 bg-muted rounded" />
                                </div>
                            </div>
                            <div className="w-full h-4 bg-muted rounded mb-3" />
                            <div className="flex gap-4 mb-3">
                                <div className="w-16 h-3 bg-muted rounded" />
                                <div className="w-16 h-3 bg-muted rounded" />
                            </div>
                            <div className="flex justify-between pt-3 border-t">
                                <div className="w-20 h-5 bg-muted rounded-full" />
                                <div className="w-16 h-4 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-destructive font-medium">حدث خطأ أثناء تحميل القضايا</p>
                    <p className="text-sm text-muted-foreground">يرجى المحاولة مرة أخرى</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && cases.length === 0 && (
                <div className="bg-card rounded-xl border p-12 text-center">
                    <Scale className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد قضايا</h3>
                    <p className="text-muted-foreground mb-4">
                        لم يتم العثور على قضايا مطابقة للفلاتر المحددة
                    </p>
                    <Link to={p('/cases/new')}>
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            إنشاء قضية جديدة
                        </Button>
                    </Link>
                </div>
            )}

            {/* Cases Grid */}
            {!isLoading && !error && cases.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cases.map((caseItem) => (
                            <div key={caseItem.id} className="relative">
                                {/* Checkbox overlay */}
                                <div className="absolute top-3 right-3 z-10">
                                    <Checkbox
                                        checked={selectedIds.includes(caseItem.id)}
                                        onChange={() => handleSelectItem(caseItem.id)}
                                    />
                                </div>
                                <div className={selectedIds.includes(caseItem.id) ? 'ring-2 ring-primary rounded-xl' : ''}>
                                    <CaseCard
                                        caseData={caseItem}
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
                totalCount={cases.length}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                isAllSelected={isAllSelected}
                actions={[
                    {
                        label: 'تصدير',
                        icon: <FileDown className="w-4 h-4" />,
                        onClick: handleExport,
                        disabled: isExporting
                    },
                    {
                        label: 'مفتوحة',
                        icon: <Clock className="w-4 h-4" />,
                        onClick: () => handleBulkStatusChange('OPEN'),
                        disabled: isUpdatingStatus
                    },
                    {
                        label: 'جارية',
                        icon: <CheckCircle className="w-4 h-4" />,
                        onClick: () => handleBulkStatusChange('IN_PROGRESS'),
                        disabled: isUpdatingStatus
                    },
                    {
                        label: 'مغلقة',
                        icon: <XCircle className="w-4 h-4" />,
                        onClick: () => handleBulkStatusChange('CLOSED'),
                        disabled: isUpdatingStatus
                    },
                    {
                        label: 'أرشفة',
                        icon: <Archive className="w-4 h-4" />,
                        onClick: () => handleBulkStatusChange('ARCHIVED'),
                        disabled: isUpdatingStatus
                    },
                    {
                        label: 'حذف',
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: handleBulkDelete,
                        variant: 'destructive'
                    },
                ]}
            />
        </div>
    );
}

export default CasesListPage;

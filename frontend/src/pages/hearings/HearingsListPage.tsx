import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { Plus, CalendarDays, List, AlertTriangle, Search, X, FileDown, Trash2, Clock, CheckCircle, PauseCircle, XCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { HearingCard } from '@/components/hearings';
import { useHearings, useDeleteHearing } from '@/hooks/use-hearings';
import { BulkActionsBar } from '@/components/common/BulkActionsBar';
import { exportHearings } from '@/api/exports.api';
import { hearingsApi } from '@/api/hearings.api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function HearingsListPage() {
    const { p } = useSlugPath();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const limit = 12;
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useHearings({
        search: search || undefined,
        status: status || undefined,
        page,
        limit
    });

    const deleteMutation = useDeleteHearing();

    const hearings = data?.data || [];
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
        setSelectedIds(hearings.map(h => h.id));
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const isAllSelected = hearings.length > 0 && selectedIds.length === hearings.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < hearings.length;

    // Export handler
    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportHearings({
                status: status || undefined,
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
        if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} جلسة؟`)) return;

        try {
            await hearingsApi.bulkDelete(selectedIds);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['hearings'] });
            toast.success(`تم حذف ${selectedIds.length} جلسة`);
        } catch (error) {
            toast.error('فشل حذف الجلسات');
        }
    };

    // Bulk status change handler
    const handleBulkStatusChange = async (newStatus: string) => {
        setIsUpdatingStatus(true);
        try {
            await hearingsApi.bulkUpdateStatus(selectedIds, newStatus);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['hearings'] });
            toast.success(`تم تحديث حالة ${selectedIds.length} جلسة`);
        } catch (error) {
            toast.error('فشل تحديث الحالة');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الجلسة؟')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSearch = () => {
        setPage(1);
        setSelectedIds([]);
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setPage(1);
        setSelectedIds([]);
    };

    const statusOptions = [
        { value: '', label: 'جميع الحالات' },
        { value: 'SCHEDULED', label: 'مجدولة' },
        { value: 'COMPLETED', label: 'منتهية' },
        { value: 'POSTPONED', label: 'مؤجلة' },
        { value: 'CANCELLED', label: 'ملغاة' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarDays className="w-7 h-7 text-primary" />
                        قائمة الجلسات
                    </h1>
                    <p className="text-muted-foreground">
                        عرض وإدارة جميع جلسات المحكمة
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex items-center bg-muted rounded-lg p-1">
                        <Link
                            to={p('/hearings/calendar')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-muted-foreground transition-colors"
                        >
                            <CalendarDays className="w-4 h-4" />
                            تقويم
                        </Link>
                        <button
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-card shadow text-foreground transition-colors"
                        >
                            <List className="w-4 h-4" />
                            قائمة
                        </button>
                    </div>
                    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                        <FileDown className="w-4 h-4 ml-2" />
                        {isExporting ? 'جاري التصدير...' : 'تصدير'}
                    </Button>
                    <Link to={p('/hearings/new')}>
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            جلسة جديدة
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="بحث بالعنوان..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pr-10"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                                setSelectedIds([]);
                            }}
                            className="h-10 px-3 rounded-md border bg-background text-sm min-w-[140px]"
                        >
                            {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <Button onClick={handleSearch}>بحث</Button>
                        {(search || status) && (
                            <Button variant="ghost" onClick={handleReset}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Select All Header */}
            {!isLoading && !error && hearings.length > 0 && (
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
                                <div className="w-14 h-14 bg-muted rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-3/4 h-4 bg-muted rounded" />
                                    <div className="w-1/2 h-3 bg-muted rounded" />
                                </div>
                            </div>
                            <div className="w-full h-4 bg-muted rounded mb-3" />
                            <div className="flex justify-between pt-3 border-t">
                                <div className="w-16 h-5 bg-muted rounded-full" />
                                <div className="w-20 h-4 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-destructive font-medium">حدث خطأ أثناء تحميل الجلسات</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && hearings.length === 0 && (
                <div className="bg-card rounded-xl border p-12 text-center">
                    <CalendarDays className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد جلسات</h3>
                    <p className="text-muted-foreground mb-4">
                        لم يتم العثور على جلسات مطابقة
                    </p>
                    <Link to={p('/hearings/new')}>
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            إنشاء جلسة جديدة
                        </Button>
                    </Link>
                </div>
            )}

            {/* Hearings Grid */}
            {!isLoading && !error && hearings.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {hearings.map((hearing) => (
                            <div key={hearing.id} className="relative">
                                {/* Checkbox overlay */}
                                <div className="absolute top-3 right-3 z-10">
                                    <Checkbox
                                        checked={selectedIds.includes(hearing.id)}
                                        onChange={() => handleSelectItem(hearing.id)}
                                    />
                                </div>
                                <div className={selectedIds.includes(hearing.id) ? 'ring-2 ring-primary rounded-xl' : ''}>
                                    <HearingCard
                                        hearing={hearing}
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
                totalCount={hearings.length}
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
                        label: 'مجدولة',
                        icon: <Clock className="w-4 h-4" />,
                        onClick: () => handleBulkStatusChange('SCHEDULED'),
                        disabled: isUpdatingStatus
                    },
                    {
                        label: 'منتهية',
                        icon: <CheckCircle className="w-4 h-4" />,
                        onClick: () => handleBulkStatusChange('COMPLETED'),
                        disabled: isUpdatingStatus
                    },
                    {
                        label: 'مؤجلة',
                        icon: <PauseCircle className="w-4 h-4" />,
                        onClick: () => handleBulkStatusChange('POSTPONED'),
                        disabled: isUpdatingStatus
                    },
                    {
                        label: 'ملغاة',
                        icon: <XCircle className="w-4 h-4" />,
                        onClick: () => handleBulkStatusChange('CANCELLED'),
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

export default HearingsListPage;

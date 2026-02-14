import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, AlertTriangle, FileDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { ClientCard, ClientFilters, ClientFilterValues } from '@/components/clients';
import { useClients, useDeleteClient } from '@/hooks/use-clients';
import { BulkActionsBar } from '@/components/common/BulkActionsBar';
import { exportClients } from '@/api/exports.api';
import toast from 'react-hot-toast';

export function ClientsListPage() {
    const [filters, setFilters] = useState<ClientFilterValues>({});
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const limit = 12;

    const { data, isLoading, error } = useClients({
        search: filters.search,
        isActive: filters.isActive,
        page,
        limit,
    });

    const deleteMutation = useDeleteClient();

    const clients = data?.data || [];
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
        setSelectedIds(clients.map(c => c.id));
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const isAllSelected = clients.length > 0 && selectedIds.length === clients.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < clients.length;

    // Export handler
    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportClients({
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
        if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} عميل؟`)) return;

        try {
            for (const id of selectedIds) {
                await deleteMutation.mutateAsync(id);
            }
            setSelectedIds([]);
            toast.success(`تم حذف ${selectedIds.length} عميل`);
        } catch (error) {
            toast.error('فشل حذف بعض العملاء');
        }
    };

    const handleFilter = (newFilters: ClientFilterValues) => {
        setFilters(newFilters);
        setPage(1);
        setSelectedIds([]);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="w-7 h-7 text-primary" />
                        إدارة العملاء
                    </h1>
                    <p className="text-muted-foreground">
                        إدارة بيانات العملاء والموكلين
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                        <FileDown className="w-4 h-4 ml-2" />
                        {isExporting ? 'جاري التصدير...' : 'تصدير Excel'}
                    </Button>
                    <Link to="new">
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            عميل جديد
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <ClientFilters onFilter={handleFilter} initialValues={filters} />

            {/* Select All Header */}
            {!isLoading && !error && clients.length > 0 && (
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
                                <div className="w-12 h-12 bg-muted rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-3/4 h-4 bg-muted rounded" />
                                    <div className="w-1/2 h-3 bg-muted rounded" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="w-full h-3 bg-muted rounded" />
                                <div className="w-2/3 h-3 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-destructive font-medium">حدث خطأ أثناء تحميل العملاء</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && clients.length === 0 && (
                <div className="bg-card rounded-xl border p-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا يوجد عملاء</h3>
                    <p className="text-muted-foreground mb-4">
                        لم يتم العثور على عملاء مطابقين
                    </p>
                    <Link to="new">
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة عميل جديد
                        </Button>
                    </Link>
                </div>
            )}

            {/* Clients Grid */}
            {!isLoading && !error && clients.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clients.map((client) => (
                            <div key={client.id} className="relative">
                                {/* Checkbox overlay */}
                                <div className="absolute top-3 right-3 z-10">
                                    <Checkbox
                                        checked={selectedIds.includes(client.id)}
                                        onChange={() => handleSelectItem(client.id)}
                                    />
                                </div>
                                <div className={selectedIds.includes(client.id) ? 'ring-2 ring-primary rounded-xl' : ''}>
                                    <ClientCard
                                        client={client}
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
                totalCount={clients.length}
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

export default ClientsListPage;

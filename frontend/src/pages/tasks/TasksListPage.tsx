import { useState } from 'react';
import { Plus, CheckSquare, Search, X, Trash2, AlertTriangle, Filter } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskCard } from '@/components/tasks/TaskCard';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { useTasks, useDeleteTask, useBulkDeleteTasks, useBulkUpdateTaskStatus, useTaskStats } from '@/hooks/use-tasks';
import { useLawyers } from '@/hooks/use-lawyers';
import { TaskStatus, TaskPriority } from '@/api/tasks.api';

export function TasksListPage() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<TaskStatus | ''>('');
    const [priority, setPriority] = useState<TaskPriority | ''>('');
    const [assignedToId, setAssignedToId] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const limit = 12;

    const { data: lawyersData } = useLawyers();
    const lawyers = lawyersData?.data || [];

    const { data, isLoading, error } = useTasks({
        search: search || undefined,
        status: status || undefined,
        priority: priority || undefined,
        assignedToId: assignedToId || undefined,
        rootOnly: true,
        page,
        limit,
    });

    const { data: statsData } = useTaskStats();
    const stats = statsData?.data;

    const deleteMutation = useDeleteTask();
    const bulkDeleteMutation = useBulkDeleteTasks();
    const bulkUpdateStatusMutation = useBulkUpdateTaskStatus();

    const tasks = data?.data || [];
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
        setSelectedIds(tasks.map(t => t.id));
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const isAllSelected = tasks.length > 0 && selectedIds.length === tasks.length;

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} مهمة؟`)) return;
        bulkDeleteMutation.mutate(selectedIds, {
            onSuccess: () => setSelectedIds([])
        });
    };

    // Bulk status change handler
    const handleBulkStatusChange = async (newStatus: TaskStatus) => {
        bulkUpdateStatusMutation.mutate({ ids: selectedIds, status: newStatus }, {
            onSuccess: () => setSelectedIds([])
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
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
        setPriority('');
        setAssignedToId('');
        setPage(1);
        setSelectedIds([]);
    };

    const statusOptions = [
        { value: '', label: 'جميع الحالات' },
        { value: 'TODO', label: 'قيد الانتظار' },
        { value: 'IN_PROGRESS', label: 'قيد التنفيذ' },
        { value: 'REVIEW', label: 'قيد المراجعة' },
        { value: 'BLOCKED', label: 'معلقة' },
        { value: 'COMPLETED', label: 'مكتملة' },
        { value: 'CANCELLED', label: 'ملغاة' },
    ];

    const priorityOptions = [
        { value: '', label: 'جميع الأولويات' },
        { value: 'URGENT', label: 'عاجلة' },
        { value: 'HIGH', label: 'عالية' },
        { value: 'MEDIUM', label: 'متوسطة' },
        { value: 'LOW', label: 'منخفضة' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CheckSquare className="w-7 h-7 text-primary" />
                        إدارة المهام
                    </h1>
                    <p className="text-muted-foreground">
                        إنشاء وتتبع المهام والأنشطة
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="w-4 h-4 ml-2" />
                        فلترة
                    </Button>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 ml-2" />
                        مهمة جديدة
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card rounded-xl border p-4">
                        <div className="text-2xl font-bold text-primary">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">إجمالي المهام</div>
                    </div>
                    <div className="bg-card rounded-xl border p-4">
                        <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
                        <div className="text-sm text-muted-foreground">قيد التنفيذ</div>
                    </div>
                    <div className="bg-card rounded-xl border p-4">
                        <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
                        <div className="text-sm text-muted-foreground">مكتملة</div>
                    </div>
                    <div className="bg-card rounded-xl border p-4">
                        <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
                        <div className="text-sm text-muted-foreground">متأخرة</div>
                    </div>
                </div>
            )}

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
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value as TaskStatus | '');
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
                        {showFilters && (
                            <>
                                <select
                                    value={priority}
                                    onChange={(e) => {
                                        setPriority(e.target.value as TaskPriority | '');
                                        setPage(1);
                                    }}
                                    className="h-10 px-3 rounded-md border bg-background text-sm min-w-[140px]"
                                >
                                    {priorityOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={assignedToId}
                                    onChange={(e) => {
                                        setAssignedToId(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-10 px-3 rounded-md border bg-background text-sm min-w-[140px]"
                                >
                                    <option value="">جميع المحامين</option>
                                    {lawyers.map((lawyer) => (
                                        <option key={lawyer.id} value={lawyer.id}>
                                            {lawyer.name}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                        <Button onClick={handleSearch}>بحث</Button>
                        {(search || status || priority || assignedToId) && (
                            <Button variant="ghost" onClick={handleReset}>
                                <X className="w-4 h-4 ml-1" />
                                إعادة تعيين
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={isAllSelected}
                            onChange={(e) => e.target.checked ? handleSelectAll() : handleClearSelection()}
                        />
                        <span className="text-sm font-medium">
                            تم تحديد {selectedIds.length} مهمة
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleBulkStatusChange(e.target.value as TaskStatus);
                                    e.target.value = '';
                                }
                            }}
                            className="h-9 px-3 rounded-md border bg-background text-sm"
                            defaultValue=""
                        >
                            <option value="" disabled>تغيير الحالة إلى...</option>
                            <option value="TODO">قيد الانتظار</option>
                            <option value="IN_PROGRESS">قيد التنفيذ</option>
                            <option value="COMPLETED">مكتملة</option>
                            <option value="CANCELLED">ملغاة</option>
                        </select>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                            <Trash2 className="w-4 h-4 ml-1" />
                            حذف
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Select All */}
            {tasks.length > 0 && selectedIds.length === 0 && (
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={isAllSelected}
                        onChange={(e) => e.target.checked ? handleSelectAll() : handleClearSelection()}
                    />
                    <span className="text-sm text-muted-foreground">تحديد الكل</span>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>حدث خطأ أثناء تحميل المهام</span>
                </div>
            )}

            {/* Tasks Grid */}
            {!isLoading && !error && (
                <>
                    {tasks.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-xl border">
                            <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">لا توجد مهام</h3>
                            <p className="text-muted-foreground mb-4">
                                لم يتم العثور على أي مهام. قم بإنشاء مهمة جديدة.
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="w-4 h-4 ml-2" />
                                مهمة جديدة
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {tasks.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    isSelected={selectedIds.includes(task.id)}
                                    onSelect={() => handleSelectItem(task.id)}
                                    onDelete={() => handleDelete(task.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                السابق
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                صفحة {page} من {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                التالي
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Create Task Dialog */}
            <CreateTaskDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
        </div>
    );
}

export default TasksListPage;

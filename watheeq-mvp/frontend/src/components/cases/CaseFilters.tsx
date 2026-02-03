import { Search, X, Filter } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { useState } from 'react';

interface CaseFiltersProps {
    onFilter: (filters: FilterValues) => void;
    initialValues?: FilterValues;
}

export interface FilterValues {
    search?: string;
    status?: string;
    caseType?: string;
    priority?: string;
}

const statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'OPEN', label: 'مفتوحة' },
    { value: 'IN_PROGRESS', label: 'قيد المعالجة' },
    { value: 'CLOSED', label: 'مغلقة' },
    { value: 'PENDING', label: 'معلقة' },
    { value: 'ARCHIVED', label: 'مؤرشفة' },
];

const typeOptions = [
    { value: '', label: 'جميع الأنواع' },
    { value: 'CIVIL', label: 'مدني' },
    { value: 'CRIMINAL', label: 'جنائي' },
    { value: 'COMMERCIAL', label: 'تجاري' },
    { value: 'LABOR', label: 'عمالي' },
    { value: 'FAMILY', label: 'أحوال شخصية' },
    { value: 'ADMINISTRATIVE', label: 'إداري' },
];

const priorityOptions = [
    { value: '', label: 'جميع الأولويات' },
    { value: 'HIGH', label: 'عالية' },
    { value: 'MEDIUM', label: 'متوسطة' },
    { value: 'LOW', label: 'منخفضة' },
];

export function CaseFilters({ onFilter, initialValues = {} }: CaseFiltersProps) {
    const [search, setSearch] = useState(initialValues.search || '');
    const [status, setStatus] = useState(initialValues.status || '');
    const [caseType, setCaseType] = useState(initialValues.caseType || '');
    const [priority, setPriority] = useState(initialValues.priority || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleApply = () => {
        onFilter({
            search: search || undefined,
            status: status || undefined,
            caseType: caseType || undefined,
            priority: priority || undefined,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setCaseType('');
        setPriority('');
        onFilter({});
    };

    const hasActiveFilters = status || caseType || priority;

    return (
        <div className="bg-card rounded-xl border p-4 mb-6">
            {/* Search and Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="بحث بالعنوان أو الوصف..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleApply}>
                        بحث
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4 ml-2" />
                        فلاتر
                        {hasActiveFilters && (
                            <span className="mr-2 w-2 h-2 bg-primary rounded-full" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label>الحالة</Label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                        >
                            {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>النوع</Label>
                        <select
                            value={caseType}
                            onChange={(e) => setCaseType(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                        >
                            {typeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>الأولوية</Label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                        >
                            {priorityOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-3 flex gap-2 justify-end pt-2">
                        <Button variant="ghost" onClick={handleReset}>
                            <X className="w-4 h-4 ml-2" />
                            إعادة تعيين
                        </Button>
                        <Button onClick={handleApply}>
                            تطبيق الفلاتر
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CaseFilters;

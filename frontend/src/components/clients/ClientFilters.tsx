import { Search, X } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useState } from 'react';

interface ClientFiltersProps {
    onFilter: (filters: FilterValues) => void;
    initialValues?: FilterValues;
}

export interface FilterValues {
    search?: string;
    clientType?: string;
    isActive?: boolean;
}

const typeOptions = [
    { value: '', label: 'جميع الأنواع' },
    { value: 'individual', label: 'فرد' },
    { value: 'company', label: 'شركة' },
];

const statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' },
];

export function ClientFilters({ onFilter, initialValues = {} }: ClientFiltersProps) {
    const [search, setSearch] = useState(initialValues.search || '');
    const [clientType, setClientType] = useState(initialValues.clientType || '');
    const [status, setStatus] = useState('');

    const handleApply = () => {
        onFilter({
            search: search || undefined,
            clientType: clientType || undefined,
            isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
        });
    };

    const handleReset = () => {
        setSearch('');
        setClientType('');
        setStatus('');
        onFilter({});
    };

    return (
        <div className="bg-card rounded-xl border p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="بحث بالاسم أو البريد أو الجوال..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                    />
                </div>
                <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value)}
                    className="h-10 px-3 rounded-md border bg-background text-sm min-w-[120px]"
                >
                    {typeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-10 px-3 rounded-md border bg-background text-sm min-w-[120px]"
                >
                    {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <Button onClick={handleApply}>بحث</Button>
                {(search || clientType || status) && (
                    <Button variant="ghost" onClick={handleReset}>
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export default ClientFilters;

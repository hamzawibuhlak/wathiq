import { useState } from 'react';
import { Filter, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentFiltersProps {
    filters: {
        search?: string;
        documentType?: string;
        tags?: string[];
        fromDate?: string;
        toDate?: string;
        onlyLatest?: boolean;
    };
    onChange: (filters: any) => void;
}

const documentTypes = [
    { value: '', label: 'الكل' },
    { value: 'CONTRACT', label: 'عقد' },
    { value: 'POWER_OF_ATTORNEY', label: 'وكالة' },
    { value: 'COURT_DOCUMENT', label: 'مستند محكمة' },
    { value: 'COURT_ORDER', label: 'حكم محكمة' },
    { value: 'PLEADING', label: 'مذكرة' },
    { value: 'EVIDENCE', label: 'دليل' },
    { value: 'CORRESPONDENCE', label: 'مراسلة' },
    { value: 'INVOICE', label: 'فاتورة' },
    { value: 'RECEIPT', label: 'إيصال' },
    { value: 'ID_DOCUMENT', label: 'وثيقة هوية' },
    { value: 'OTHER', label: 'أخرى' },
];

export function DocumentFilters({ filters, onChange }: DocumentFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [searchValue, setSearchValue] = useState(filters.search || '');

    const handleSearch = () => {
        onChange({ ...filters, search: searchValue });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const clearFilters = () => {
        setSearchValue('');
        onChange({
            search: undefined,
            documentType: undefined,
            tags: undefined,
            fromDate: undefined,
            toDate: undefined,
            onlyLatest: true,
        });
    };

    const hasActiveFilters = filters.search || filters.documentType || filters.fromDate || filters.toDate || filters.tags?.length;

    return (
        <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="ابحث في المستندات (يشمل نص OCR)..."
                        className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    بحث
                </button>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors",
                        showAdvanced ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                >
                    <Filter className="h-4 w-4" />
                    فلاتر
                </button>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Document Type */}
                        <div>
                            <label className="block text-sm font-medium mb-2">نوع المستند</label>
                            <select
                                value={filters.documentType || ''}
                                onChange={(e) => onChange({ ...filters, documentType: e.target.value || undefined })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            >
                                {documentTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* From Date */}
                        <div>
                            <label className="block text-sm font-medium mb-2">من تاريخ</label>
                            <input
                                type="date"
                                value={filters.fromDate || ''}
                                onChange={(e) => onChange({ ...filters, fromDate: e.target.value || undefined })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            />
                        </div>

                        {/* To Date */}
                        <div>
                            <label className="block text-sm font-medium mb-2">إلى تاريخ</label>
                            <input
                                type="date"
                                value={filters.toDate || ''}
                                onChange={(e) => onChange({ ...filters, toDate: e.target.value || undefined })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            />
                        </div>
                    </div>

                    {/* Only Latest Checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="onlyLatest"
                            checked={filters.onlyLatest !== false}
                            onChange={(e) => onChange({ ...filters, onlyLatest: e.target.checked })}
                            className="rounded border-gray-300"
                        />
                        <label htmlFor="onlyLatest" className="text-sm">
                            عرض الإصدارات الأخيرة فقط
                        </label>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 text-sm text-destructive hover:underline"
                        >
                            <X className="h-4 w-4" />
                            مسح الفلاتر
                        </button>
                    )}
                </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {filters.search && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                            بحث: {filters.search}
                            <button onClick={() => { setSearchValue(''); onChange({ ...filters, search: undefined }); }}>
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {filters.documentType && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                            النوع: {documentTypes.find(t => t.value === filters.documentType)?.label}
                            <button onClick={() => onChange({ ...filters, documentType: undefined })}>
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {filters.fromDate && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                            من: {filters.fromDate}
                            <button onClick={() => onChange({ ...filters, fromDate: undefined })}>
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {filters.toDate && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                            إلى: {filters.toDate}
                            <button onClick={() => onChange({ ...filters, toDate: undefined })}>
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default DocumentFilters;

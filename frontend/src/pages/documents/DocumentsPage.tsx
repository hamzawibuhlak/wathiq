import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    FileText, Plus, Grid3X3, List, AlertTriangle, Search, X, Check, 
    Filter, Tag, Calendar, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui';
import { DocumentCard, DocumentViewer, BulkActionsBar } from '@/components/documents';
import { UploadDialog } from '@/components/documents/UploadDialog';
import { VersionHistoryDialog } from '@/components/documents/VersionHistoryDialog';
import { useDocuments, useDeleteDocument, useDownloadDocument } from '@/hooks/use-documents';
import { useCases } from '@/hooks/use-cases';
import { documentsApi } from '@/api/documents.api';
import type { Document } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type ViewMode = 'grid' | 'list';

const documentTypes = [
    { value: '', label: 'جميع الأنواع' },
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

export function DocumentsPage() {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const urlCaseId = searchParams.get('caseId') || '';

    // UI State
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Filter State
    const [searchValue, setSearchValue] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        documentType: '',
        caseId: urlCaseId,
        fromDate: '',
        toDate: '',
        onlyLatest: true,
    });
    const [page, setPage] = useState(1);
    const limit = 12;

    // Version History Dialog
    const [versionHistoryDoc, setVersionHistoryDoc] = useState<Document | null>(null);

    // New Version Upload
    const [uploadVersionDoc, setUploadVersionDoc] = useState<Document | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Viewer state
    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentDocIndex, setCurrentDocIndex] = useState(0);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    // Auto-open uploader if caseId is in URL
    useEffect(() => {
        if (urlCaseId) {
            setShowUploadDialog(true);
            setFilters(prev => ({ ...prev, caseId: urlCaseId }));
        }
    }, [urlCaseId]);

    const { data, isLoading, error, refetch } = useDocuments({
        search: filters.search || undefined,
        documentType: filters.documentType || undefined,
        caseId: filters.caseId || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        onlyLatest: filters.onlyLatest,
        page,
        limit,
    });

    const { data: casesData } = useCases({ limit: 100 });

    const deleteMutation = useDeleteDocument();
    const downloadMutation = useDownloadDocument();

    // OCR Processing Mutation
    const ocrMutation = useMutation({
        mutationFn: async (documentId: string) => {
            // Show loading toast
            const toastId = toast.loading('جارٍ معالجة OCR... قد تستغرق العملية عدة ثوانٍ');
            try {
                const result = await documentsApi.processOcr(documentId);
                toast.dismiss(toastId);
                return result;
            } catch (error) {
                toast.dismiss(toastId);
                throw error;
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            const charCount = data?.data?.textLength || 0;
            if (charCount > 0) {
                toast.success(`تم استخراج ${charCount} حرف من المستند بنجاح`);
            } else {
                toast.success('تمت معالجة OCR بنجاح');
            }
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'فشل في معالجة OCR';
            toast.error(message);
        },
    });

    // New Version Upload Mutation
    const newVersionMutation = useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) => documentsApi.createNewVersion(id, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success('تم رفع الإصدار الجديد بنجاح');
            setUploadVersionDoc(null);
        },
        onError: () => {
            toast.error('فشل في رفع الإصدار الجديد');
        },
    });

    const documents = data?.data || [];
    const totalPages = data?.meta?.totalPages || 1;
    const cases = casesData?.data || [];

    const selectionMode = selectedIds.size > 0;

    // Search handler
    const handleSearch = () => {
        setFilters(prev => ({ ...prev, search: searchValue }));
        setPage(1);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المستند؟')) {
            deleteMutation.mutate(id);
        }
    };

    const handleDownload = (doc: Document) => {
        downloadMutation.mutate({ id: doc.id, fileName: doc.fileName });
    };

    const handleReset = () => {
        setSearchValue('');
        setFilters({
            search: '',
            documentType: '',
            caseId: '',
            fromDate: '',
            toDate: '',
            onlyLatest: true,
        });
        setPage(1);
    };

    // Preview handling
    const handlePreview = useCallback((doc: Document) => {
        const index = documents.findIndex(d => d.id === doc.id);
        setCurrentDocIndex(index >= 0 ? index : 0);
        setViewerOpen(true);
    }, [documents]);

    const handleNextDocument = () => {
        if (currentDocIndex < documents.length - 1) {
            setCurrentDocIndex(currentDocIndex + 1);
        }
    };

    const handlePreviousDocument = () => {
        if (currentDocIndex > 0) {
            setCurrentDocIndex(currentDocIndex - 1);
        }
    };

    // Selection handling
    const handleSelect = (id: string, selected: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (selected) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === documents.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(documents.map(d => d.id)));
        }
    };

    const handleCancelSelection = () => {
        setSelectedIds(new Set());
    };

    // Bulk actions
    const handleBulkDownload = async () => {
        setIsDownloadingBulk(true);
        try {
            for (const id of selectedIds) {
                const doc = documents.find(d => d.id === id);
                if (doc) {
                    await downloadMutation.mutateAsync({ id: doc.id, fileName: doc.fileName });
                }
            }
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Bulk download error:', error);
        } finally {
            setIsDownloadingBulk(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} ملف؟`)) return;

        setIsDeletingBulk(true);
        try {
            for (const id of selectedIds) {
                await deleteMutation.mutateAsync(id);
            }
            setSelectedIds(new Set());
            refetch();
        } catch (error) {
            console.error('Bulk delete error:', error);
        } finally {
            setIsDeletingBulk(false);
        }
    };

    // Version History
    const handleVersionHistory = (doc: Document) => {
        setVersionHistoryDoc(doc);
    };

    // OCR Processing
    const handleProcessOcr = (doc: Document) => {
        ocrMutation.mutate(doc.id);
    };

    // Upload New Version
    const handleUploadNewVersion = (doc: Document) => {
        setUploadVersionDoc(doc);
        setTimeout(() => fileInputRef.current?.click(), 100);
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && uploadVersionDoc) {
            newVersionMutation.mutate({ id: uploadVersionDoc.id, file });
        }
        e.target.value = '';
    };

    const currentDocument = documents[currentDocIndex] || null;
    const allSelected = documents.length > 0 && selectedIds.size === documents.length;

    const hasActiveFilters = filters.search || filters.documentType || filters.caseId || filters.fromDate || filters.toDate;

    return (
        <div className="space-y-6 pb-20">
            {/* Hidden file input for new version upload */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                onChange={handleFileSelected}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-7 h-7 text-primary" />
                        المستندات
                    </h1>
                    <p className="text-muted-foreground">
                        إدارة ورفع وتحميل المستندات مع دعم OCR والإصدارات
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Refresh */}
                    <button
                        onClick={() => refetch()}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="تحديث"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>

                    {/* Select All */}
                    {documents.length > 0 && (
                        <button
                            onClick={handleSelectAll}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                                allSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                            )}
                            title="تحديد الكل"
                        >
                            <div className={cn(
                                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                                allSelected
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-muted-foreground/30'
                            )}>
                                {allSelected && <Check className="w-3 h-3" />}
                            </div>
                            <span className="text-sm hidden sm:inline">تحديد الكل</span>
                        </button>
                    )}

                    {/* View Toggle */}
                    <div className="flex items-center bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                'p-2 rounded-md transition-colors',
                                viewMode === 'grid' ? 'bg-card shadow' : 'text-muted-foreground'
                            )}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                'p-2 rounded-md transition-colors',
                                viewMode === 'list' ? 'bg-card shadow' : 'text-muted-foreground'
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <Button onClick={() => setShowUploadDialog(true)}>
                        <Plus className="w-4 h-4 ml-2" />
                        رفع مستند
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-card rounded-xl border p-4 space-y-4">
                {/* Main Search Bar */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="ابحث في المستندات (يشمل محتوى OCR)..."
                            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        بحث
                    </button>
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors",
                            showAdvancedFilters ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                    >
                        <Filter className="h-4 w-4" />
                        فلاتر
                    </button>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                    <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Document Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2">نوع المستند</label>
                                <select
                                    value={filters.documentType}
                                    onChange={(e) => { setFilters(prev => ({ ...prev, documentType: e.target.value })); setPage(1); }}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                >
                                    {documentTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Case Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-2">القضية</label>
                                <select
                                    value={filters.caseId}
                                    onChange={(e) => { setFilters(prev => ({ ...prev, caseId: e.target.value })); setPage(1); }}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                >
                                    <option value="">جميع القضايا</option>
                                    {cases.map((c: any) => (
                                        <option key={c.id} value={c.id}>
                                            {c.caseNumber} - {c.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* From Date */}
                            <div>
                                <label className="block text-sm font-medium mb-2">من تاريخ</label>
                                <input
                                    type="date"
                                    value={filters.fromDate}
                                    onChange={(e) => { setFilters(prev => ({ ...prev, fromDate: e.target.value })); setPage(1); }}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                />
                            </div>

                            {/* To Date */}
                            <div>
                                <label className="block text-sm font-medium mb-2">إلى تاريخ</label>
                                <input
                                    type="date"
                                    value={filters.toDate}
                                    onChange={(e) => { setFilters(prev => ({ ...prev, toDate: e.target.value })); setPage(1); }}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                />
                            </div>
                        </div>

                        {/* Only Latest Checkbox */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="onlyLatest"
                                checked={filters.onlyLatest}
                                onChange={(e) => { setFilters(prev => ({ ...prev, onlyLatest: e.target.checked })); setPage(1); }}
                                className="rounded border-gray-300"
                            />
                            <label htmlFor="onlyLatest" className="text-sm">
                                عرض الإصدارات الأخيرة فقط
                            </label>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={handleReset}
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
                                <Search className="h-3 w-3" />
                                بحث: {filters.search}
                                <button onClick={() => { setSearchValue(''); setFilters(prev => ({ ...prev, search: '' })); }}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filters.documentType && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                <Tag className="h-3 w-3" />
                                النوع: {documentTypes.find(t => t.value === filters.documentType)?.label}
                                <button onClick={() => setFilters(prev => ({ ...prev, documentType: '' }))}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filters.caseId && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                القضية: {cases.find((c: any) => c.id === filters.caseId)?.caseNumber}
                                <button onClick={() => setFilters(prev => ({ ...prev, caseId: '' }))}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filters.fromDate && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                <Calendar className="h-3 w-3" />
                                من: {filters.fromDate}
                                <button onClick={() => setFilters(prev => ({ ...prev, fromDate: '' }))}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {filters.toDate && (
                            <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                <Calendar className="h-3 w-3" />
                                إلى: {filters.toDate}
                                <button onClick={() => setFilters(prev => ({ ...prev, toDate: '' }))}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className={cn(
                    'gap-4',
                    viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-2'
                )}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-card rounded-xl border p-4 animate-pulse">
                            <div className="flex items-start gap-4 mb-3">
                                <div className="w-12 h-12 bg-muted rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-3/4 h-4 bg-muted rounded" />
                                    <div className="w-1/2 h-3 bg-muted rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-destructive font-medium">حدث خطأ أثناء تحميل المستندات</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && documents.length === 0 && (
                <div className="bg-card rounded-xl border p-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد مستندات</h3>
                    <p className="text-muted-foreground mb-4">
                        لم يتم العثور على مستندات مطابقة
                    </p>
                    <Button onClick={() => setShowUploadDialog(true)}>
                        <Plus className="w-4 h-4 ml-2" />
                        رفع مستند جديد
                    </Button>
                </div>
            )}

            {/* Documents */}
            {!isLoading && !error && documents.length > 0 && (
                <>
                    <div className={cn(
                        'gap-4',
                        viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-2'
                    )}>
                        {documents.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                view={viewMode}
                                onPreview={handlePreview}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onVersionHistory={handleVersionHistory}
                                onProcessOcr={handleProcessOcr}
                                onUploadNewVersion={handleUploadNewVersion}
                                isSelected={selectedIds.has(doc.id)}
                                onSelect={handleSelect}
                                selectionMode={selectionMode}
                            />
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

            {/* Upload Dialog */}
            <UploadDialog
                isOpen={showUploadDialog}
                onClose={() => setShowUploadDialog(false)}
                defaultCaseId={urlCaseId}
            />

            {/* Version History Dialog */}
            {versionHistoryDoc && (
                <VersionHistoryDialog
                    documentId={versionHistoryDoc.id}
                    isOpen={!!versionHistoryDoc}
                    onClose={() => setVersionHistoryDoc(null)}
                />
            )}

            {/* Document Viewer */}
            <DocumentViewer
                document={currentDocument}
                documents={documents}
                currentIndex={currentDocIndex}
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                onNext={handleNextDocument}
                onPrevious={handlePreviousDocument}
                onDownload={handleDownload}
            />

            {/* Bulk Actions Bar */}
            <BulkActionsBar
                selectedCount={selectedIds.size}
                onDownloadAll={handleBulkDownload}
                onDeleteSelected={handleBulkDelete}
                onCancelSelection={handleCancelSelection}
                isDownloading={isDownloadingBulk}
                isDeleting={isDeletingBulk}
            />
        </div>
    );
}

export default DocumentsPage;

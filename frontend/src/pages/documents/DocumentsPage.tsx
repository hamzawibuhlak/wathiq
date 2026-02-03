import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus, Grid3X3, List, AlertTriangle, Search, X, Check } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { FileUploader, DocumentCard, DocumentViewer, BulkActionsBar } from '@/components/documents';
import { useDocuments, useUploadDocument, useDeleteDocument, useDownloadDocument } from '@/hooks/use-documents';
import { useCases } from '@/hooks/use-cases';
import type { Document } from '@/types';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

export function DocumentsPage() {
    const [searchParams] = useSearchParams();
    const urlCaseId = searchParams.get('caseId') || '';

    const [showUploader, setShowUploader] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [search, setSearch] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [caseIdFilter, setCaseIdFilter] = useState(urlCaseId);
    const [page, setPage] = useState(1);
    const limit = 12;

    // Auto-open uploader if caseId is in URL (coming from case details page)
    useEffect(() => {
        if (urlCaseId) {
            setShowUploader(true);
            setCaseIdFilter(urlCaseId);
        }
    }, [urlCaseId]);

    // Viewer state
    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentDocIndex, setCurrentDocIndex] = useState(0);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDownloadingBulk, setIsDownloadingBulk] = useState(false);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    const { data, isLoading, error, refetch } = useDocuments({
        search: search || undefined,
        documentType: documentType || undefined,
        caseId: caseIdFilter || undefined,
        page,
        limit,
    });

    const { data: casesData } = useCases({ limit: 100 });

    const uploadMutation = useUploadDocument();
    const deleteMutation = useDeleteDocument();
    const downloadMutation = useDownloadDocument();

    const documents = data?.data || [];
    const totalPages = data?.meta?.totalPages || 1;
    const cases = casesData?.data?.map((c) => ({
        id: c.id,
        title: c.title,
        caseNumber: c.caseNumber,
    })) || [];

    const selectionMode = selectedIds.size > 0;

    const handleUpload = (file: File, title: string, description: string, docType: string, caseId?: string) => {
        uploadMutation.mutate(
            { file, title, description, documentType: docType, caseId },
            { onSuccess: () => setShowUploader(false) }
        );
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
        setSearch('');
        setDocumentType('');
        setCaseIdFilter('');
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
            // Download each file sequentially
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

    const typeOptions = [
        { value: '', label: 'جميع الأنواع' },
        { value: 'CONTRACT', label: 'عقد' },
        { value: 'PLEADING', label: 'مذكرة' },
        { value: 'EVIDENCE', label: 'دليل' },
        { value: 'COURT_ORDER', label: 'حكم محكمة' },
        { value: 'CORRESPONDENCE', label: 'مراسلة' },
        { value: 'OTHER', label: 'أخرى' },
    ];

    const currentDocument = documents[currentDocIndex] || null;
    const allSelected = documents.length > 0 && selectedIds.size === documents.length;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-7 h-7 text-primary" />
                        المستندات
                    </h1>
                    <p className="text-muted-foreground">
                        إدارة ورفع وتحميل المستندات
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Select All (when documents exist) */}
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
                    <Button onClick={() => setShowUploader(!showUploader)}>
                        <Plus className="w-4 h-4 ml-2" />
                        رفع مستند
                    </Button>
                </div>
            </div>

            {/* Upload Section */}
            {showUploader && (
                <div className="bg-card rounded-xl border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">رفع مستند جديد</h2>
                        <button
                            onClick={() => setShowUploader(false)}
                            className="p-1 hover:bg-muted rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <FileUploader
                        onUpload={handleUpload}
                        isLoading={uploadMutation.isPending}
                        cases={cases}
                        defaultCaseId={urlCaseId}
                    />
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
                        />
                    </div>
                    <select
                        value={documentType}
                        onChange={(e) => { setDocumentType(e.target.value); setPage(1); }}
                        className="h-10 px-3 rounded-md border bg-background text-sm min-w-[120px]"
                    >
                        {typeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={caseIdFilter}
                        onChange={(e) => { setCaseIdFilter(e.target.value); setPage(1); }}
                        className="h-10 px-3 rounded-md border bg-background text-sm min-w-[150px]"
                    >
                        <option value="">جميع القضايا</option>
                        {cases.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.caseNumber}
                            </option>
                        ))}
                    </select>
                    {(search || documentType || caseIdFilter) && (
                        <Button variant="ghost" onClick={handleReset}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
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
                    <Button onClick={() => setShowUploader(true)}>
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

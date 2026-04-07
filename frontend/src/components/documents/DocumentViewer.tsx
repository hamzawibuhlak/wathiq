import { useEffect, useCallback, useState } from 'react';
import {
    X,
    Download,
    Printer,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,
    FileText,
    Image as ImageIcon,
    File,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui';
import type { Document } from '@/types';
import { formatDate } from '@/lib/utils'

interface DocumentViewerProps {
    document: Document | null;
    documents?: Document[];
    currentIndex?: number;
    isOpen: boolean;
    onClose: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    onDownload?: (doc: Document) => void;
}

export function DocumentViewer({
    document: doc,
    documents = [],
    currentIndex = 0,
    isOpen,
    onClose,
    onNext,
    onPrevious,
    onDownload,
}: DocumentViewerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [imageZoom, setImageZoom] = useState(1);

    const isImage = doc?.mimeType?.includes('image');
    const isPdf = doc?.mimeType?.includes('pdf');
    const hasMultiple = documents.length > 1;
    const canGoPrevious = currentIndex > 0;
    const canGoNext = currentIndex < documents.length - 1;

    // Build preview URL with token for authenticated access
    const getPreviewUrlWithToken = (docId: string) => {
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        return `${baseUrl}/documents/${docId}/preview`;
    };

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'Escape':
                if (isFullscreen) {
                    setIsFullscreen(false);
                } else {
                    onClose();
                }
                break;
            case 'ArrowLeft':
                if (canGoNext) onNext?.();
                break;
            case 'ArrowRight':
                if (canGoPrevious) onPrevious?.();
                break;
            case 'p':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    handlePrint();
                }
                break;
        }
    }, [isOpen, isFullscreen, canGoNext, canGoPrevious, onClose, onNext, onPrevious]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Reset zoom when document changes
    useEffect(() => {
        setImageZoom(1);
    }, [doc?.id]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handlePrint = () => {
        if (doc && (isPdf || isImage)) {
            const printWindow = window.open(getPreviewUrlWithToken(doc.id), '_blank');
            if (printWindow) {
                printWindow.addEventListener('load', () => printWindow.print());
            }
        }
    };

    const handleOpenInNewTab = () => {
        if (doc) {
            window.open(getPreviewUrlWithToken(doc.id), '_blank');
        }
    };

    const handleZoomIn = () => setImageZoom((z) => Math.min(z + 0.25, 3));
    const handleZoomOut = () => setImageZoom((z) => Math.max(z - 0.25, 0.5));

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = () => {
        if (doc?.mimeType?.includes('pdf')) return <FileText className="w-24 h-24 text-red-500" />;
        if (doc?.mimeType?.includes('image')) return <ImageIcon className="w-24 h-24 text-blue-500" />;
        if (doc?.mimeType?.includes('word')) return <FileText className="w-24 h-24 text-blue-600" />;
        return <File className="w-24 h-24 text-gray-500" />;
    };

    if (!isOpen || !doc) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className={`
                    bg-card rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300
                    ${isFullscreen ? 'w-full h-full rounded-none' : 'w-[95vw] h-[95vh] max-w-7xl'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center gap-3 min-w-0">
                        <h2 className="text-lg font-semibold truncate">{doc.title}</h2>
                        <span className="text-sm text-muted-foreground hidden sm:inline">
                            {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Zoom controls for images */}
                        {isImage && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleZoomOut}
                                    disabled={imageZoom <= 0.5}
                                    title="تصغير"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </Button>
                                <span className="text-xs w-12 text-center">{Math.round(imageZoom * 100)}%</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleZoomIn}
                                    disabled={imageZoom >= 3}
                                    title="تكبير"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </Button>
                            </>
                        )}

                        <div className="w-px h-6 bg-border mx-2 hidden sm:block" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload?.(doc)}
                            title="تحميل"
                        >
                            <Download className="w-4 h-4" />
                            <span className="mr-1 hidden sm:inline">تحميل</span>
                        </Button>

                        {(isPdf || isImage) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenInNewTab}
                                title="فتح في نافذة جديدة"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span className="mr-1 hidden sm:inline">فتح</span>
                            </Button>
                        )}

                        {(isPdf || isImage) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrint}
                                title="طباعة"
                            >
                                <Printer className="w-4 h-4" />
                                <span className="mr-1 hidden sm:inline">طباعة</span>
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            title={isFullscreen ? "تصغير" : "ملء الشاشة"}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-4 h-4" />
                            ) : (
                                <Maximize2 className="w-4 h-4" />
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            title="إغلاق (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
                    {isImage ? (
                        <div
                            className="flex items-center justify-center overflow-auto"
                            style={{ cursor: imageZoom > 1 ? 'grab' : 'default' }}
                        >
                            <img
                                src={getPreviewUrlWithToken(doc.id)}
                                alt={doc.title}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg transition-transform"
                                style={{ transform: `scale(${imageZoom})` }}
                            />
                        </div>
                    ) : isPdf ? (
                        <object
                            data={getPreviewUrlWithToken(doc.id)}
                            type="application/pdf"
                            className="w-full h-full rounded-lg border bg-white"
                        >
                            {/* Fallback if object tag doesn't work */}
                            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                                <FileText className="w-24 h-24 text-red-500 mb-4" />
                                <p className="text-lg font-medium mb-2">
                                    {doc.title}
                                </p>
                                <p className="text-sm text-muted-foreground mb-6">
                                    لا يمكن عرض ملف PDF مباشرة. يمكنك فتحه في نافذة جديدة أو تحميله.
                                </p>
                                <div className="flex items-center gap-3">
                                    <Button onClick={handleOpenInNewTab}>
                                        <ExternalLink className="w-4 h-4 ml-2" />
                                        فتح في نافذة جديدة
                                    </Button>
                                    <Button variant="outline" onClick={() => onDownload?.(doc)}>
                                        <Download className="w-4 h-4 ml-2" />
                                        تحميل
                                    </Button>
                                </div>
                            </div>
                        </object>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8">
                            {getFileIcon()}
                            <p className="mt-4 text-lg text-muted-foreground">
                                المعاينة غير متاحة لهذا النوع من الملفات
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {doc.fileName}
                            </p>
                            <Button className="mt-6" onClick={() => onDownload?.(doc)}>
                                <Download className="w-4 h-4 ml-2" />
                                تحميل الملف
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer with Navigation */}
                {hasMultiple && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNext}
                            disabled={!canGoNext}
                        >
                            <ChevronRight className="w-4 h-4 ml-1" />
                            الملف التالي
                        </Button>

                        <span className="text-sm text-muted-foreground">
                            {currentIndex + 1} من {documents.length}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPrevious}
                            disabled={!canGoPrevious}
                        >
                            الملف السابق
                            <ChevronLeft className="w-4 h-4 mr-1" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DocumentViewer;

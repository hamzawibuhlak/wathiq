import { FileText, Image, File, Download, Trash2, Eye, MoreVertical, Check, History, Scan, Tag, Upload, FolderInput, Copy, GripVertical, Home, LinkIcon, Pencil } from 'lucide-react';
import type { Document } from '@/types';
import { formatDate } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { documentsApi } from '@/api/documents.api';

interface DocumentCardProps {
    document: Document;
    onPreview?: (doc: Document) => void;
    onDownload?: (doc: Document) => void;
    onDelete?: (id: string) => void;
    onEdit?: (doc: Document) => void;
    onVersionHistory?: (doc: Document) => void;
    onProcessOcr?: (doc: Document) => void;
    onUploadNewVersion?: (doc: Document) => void;
    onMoveToFolder?: (doc: Document) => void;
    onCopyToFolder?: (doc: Document) => void;
    onRemoveCopy?: (doc: Document) => void;
    onMoveToRoot?: (doc: Document) => void;
    view?: 'grid' | 'list';
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    selectionMode?: boolean;
}

const typeLabels: Record<string, string> = {
    CONTRACT: 'عقد',
    PLEADING: 'مذكرة',
    EVIDENCE: 'دليل',
    COURT_ORDER: 'حكم محكمة',
    CORRESPONDENCE: 'مراسلة',
    POWER_OF_ATTORNEY: 'وكالة',
    COURT_DOCUMENT: 'مستند محكمة',
    INVOICE: 'فاتورة',
    RECEIPT: 'إيصال',
    ID_DOCUMENT: 'وثيقة هوية',
    OTHER: 'أخرى',
};

const ocrStatusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-700' },
    PROCESSING: { label: 'جارٍ المعالجة', color: 'bg-blue-100 text-blue-700' },
    COMPLETED: { label: 'مكتمل', color: 'bg-green-100 text-green-700' },
    FAILED: { label: 'فشل', color: 'bg-red-100 text-red-700' },
    NOT_APPLICABLE: { label: 'غير متاح', color: 'bg-gray-100 text-gray-700' },
};

export function DocumentCard({
    document: doc,
    onPreview,
    onDownload,
    onDelete,
    onEdit,
    onVersionHistory,
    onProcessOcr,
    onUploadNewVersion,
    onMoveToFolder,
    onCopyToFolder,
    onRemoveCopy,
    onMoveToRoot,
    view = 'grid',
    isSelected = false,
    onSelect,
    selectionMode = false,
}: DocumentCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [thumbError, setThumbError] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Generate preview URL for thumbnails
    const previewUrl = documentsApi.getPreviewUrl(doc.id);
    const isImage = doc.mimeType?.startsWith('image/');
    const canShowThumbnail = isImage && !thumbError;

    const getFileIcon = () => {
        if (doc.mimeType?.includes('pdf')) return <FileText className="w-10 h-10 text-red-500" />;
        if (doc.mimeType?.includes('image')) return <Image className="w-10 h-10 text-blue-500" />;
        if (doc.mimeType?.includes('word')) return <FileText className="w-10 h-10 text-blue-600" />;
        return <File className="w-10 h-10 text-gray-500" />;
    };

    const getSmallFileIcon = () => {
        if (doc.mimeType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
        if (doc.mimeType?.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
        if (doc.mimeType?.includes('word')) return <FileText className="w-5 h-5 text-blue-600" />;
        return <File className="w-5 h-5 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleCardClick = (e: React.MouseEvent) => {
        if (selectionMode) {
            e.preventDefault();
            onSelect?.(doc.id, !isSelected);
            return;
        }
        onPreview?.(doc);
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(doc.id, !isSelected);
    };

    // Drag handlers
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/document-id', doc.id);
        e.dataTransfer.setData('text/plain', doc.title);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const Checkbox = () => (
        <button
            onClick={handleCheckboxClick}
            className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                isSelected
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/30 hover:border-primary/50 bg-background'
            )}
        >
            {isSelected && <Check className="w-3 h-3" />}
        </button>
    );

    if (view === 'list') {
        return (
            <div
                className={cn(
                    "flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-sm transition-all cursor-pointer",
                    isSelected && "ring-2 ring-primary bg-primary/5"
                )}
                onClick={handleCardClick}
                draggable
                onDragStart={handleDragStart}
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab flex-shrink-0" />
                    {onSelect && <Checkbox />}
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg">
                        {canShowThumbnail ? (
                            <img
                                src={previewUrl}
                                alt={doc.title}
                                className="w-10 h-10 object-cover rounded-lg"
                                onError={() => setThumbError(true)}
                            />
                        ) : (
                            getFileIcon()
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate">{doc.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{typeLabels[doc.documentType] || doc.documentType}</span>
                            <span>•</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDate(doc.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {onMoveToFolder && (
                        <button
                            onClick={() => onMoveToFolder(doc)}
                            className="p-2 hover:bg-primary/10 text-primary rounded transition-colors"
                            title="نقل لمجلد"
                        >
                            <FolderInput className="w-4 h-4" />
                        </button>
                    )}
                    {onCopyToFolder && (
                        <button
                            onClick={() => onCopyToFolder(doc)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                            title="نسخ لمجلد"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onPreview?.(doc)}
                        className="p-2 hover:bg-muted rounded transition-colors"
                        title="معاينة"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDownload?.(doc)}
                        className="p-2 hover:bg-muted rounded transition-colors"
                        title="تحميل"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete?.(doc.id)}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors"
                        title="حذف"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Grid View
    return (
        <div
            className={cn(
                "bg-card rounded-xl border p-0 hover:shadow-md transition-all cursor-pointer relative group",
                isSelected && "ring-2 ring-primary bg-primary/5"
            )}
            onClick={handleCardClick}
            draggable
            onDragStart={handleDragStart}
        >
            {/* Thumbnail / Preview Area */}
            <div className="relative h-36 bg-muted/30 flex items-center justify-center overflow-hidden rounded-t-xl">
                {canShowThumbnail ? (
                    <img
                        src={previewUrl}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                        onError={() => setThumbError(true)}
                        loading="lazy"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        {getFileIcon()}
                        <span className="text-xs text-muted-foreground uppercase font-medium">
                            {doc.fileName?.split('.').pop()}
                        </span>
                    </div>
                )}

                {/* Checkbox overlay */}
                {onSelect && (
                    <div
                        className={cn(
                            "absolute top-2 right-2 transition-opacity",
                            selectionMode || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Checkbox />
                    </div>
                )}

                {/* File type badge */}
                <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 bg-black/60 text-white rounded text-[10px] font-medium uppercase backdrop-blur-sm">
                        {doc.fileName?.split('.').pop()}
                    </span>
                </div>

                {/* Move/Copy to folder buttons overlay */}
                {(onMoveToFolder || onCopyToFolder) && (
                    <div
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {onMoveToFolder && (
                            <button
                                onClick={() => onMoveToFolder(doc)}
                                className="p-1.5 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90 transition-colors"
                                title="نقل لمجلد"
                            >
                                <FolderInput className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {onCopyToFolder && (
                            <button
                                onClick={() => onCopyToFolder(doc)}
                                className="p-1.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                                title="نسخ لمجلد"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Drag indicator */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white drop-shadow" />
                </div>
            </div>

            {/* Card Content */}
            <div className="p-3">
                <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {getSmallFileIcon()}
                        <h3 className="font-medium text-sm truncate" title={doc.title}>{doc.title}</h3>
                    </div>
                    <div className="relative flex-shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                if (menuRef.current) {
                                    const rect = menuRef.current.getBoundingClientRect();
                                    const menuHeight = 380; // approximate max menu height
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const left = rect.left - 140;
                                    if (spaceBelow < menuHeight) {
                                        // Open upward
                                        setMenuPosition({ bottom: window.innerHeight - rect.top + 4, left });
                                    } else {
                                        // Open downward
                                        setMenuPosition({ top: rect.bottom + 4, left });
                                    }
                                }
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                        >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {showMenu && (
                            <div className="fixed z-50 w-48 bg-card rounded-lg shadow-xl border py-1 max-h-[70vh] overflow-y-auto"
                                style={{
                                    ...(menuPosition.top !== undefined ? { top: menuPosition.top } : {}),
                                    ...(menuPosition.bottom !== undefined ? { bottom: menuPosition.bottom } : {}),
                                    left: menuPosition.left,
                                }}
                            >
                                <button
                                    onClick={() => { onPreview?.(doc); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    معاينة
                                </button>
                                <button
                                    onClick={() => { onDownload?.(doc); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    تحميل
                                </button>
                                {onEdit && (
                                    <button
                                        onClick={() => { onEdit(doc); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        تعديل
                                    </button>
                                )}
                                {onMoveToFolder && (
                                    <button
                                        onClick={() => { onMoveToFolder(doc); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                        <FolderInput className="w-4 h-4" />
                                        نقل لمجلد
                                    </button>
                                )}
                                {onCopyToFolder && (
                                    <button
                                        onClick={() => { onCopyToFolder(doc); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                        نسخ لمجلد
                                    </button>
                                )}
                                {onVersionHistory && (
                                    <button
                                        onClick={() => { onVersionHistory?.(doc); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                        <History className="w-4 h-4" />
                                        سجل الإصدارات
                                    </button>
                                )}
                                {onUploadNewVersion && (
                                    <button
                                        onClick={() => { onUploadNewVersion?.(doc); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                        <Upload className="w-4 h-4" />
                                        رفع إصدار جديد
                                    </button>
                                )}
                                {onProcessOcr && (doc as any).ocrStatus !== 'COMPLETED' && (
                                    <button
                                        onClick={() => { onProcessOcr?.(doc); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                        <Scan className="w-4 h-4" />
                                        استخراج النص (OCR)
                                    </button>
                                )}
                                <div className="border-t my-1" />
                                {onMoveToRoot && (
                                    <button
                                        onClick={() => { onMoveToRoot(doc); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                                    >
                                        <Home className="w-4 h-4" />
                                        نقل للمجلد الأساسي
                                    </button>
                                )}
                                {onRemoveCopy && (
                                    <button
                                        onClick={() => { onRemoveCopy(doc); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        حذف النسخة
                                    </button>
                                )}
                                <button
                                    onClick={() => { onDelete?.(doc.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    حذف الملف
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tags */}
                {(doc as any).tags && (doc as any).tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {(doc as any).tags.slice(0, 2).map((tag: string, idx: number) => (
                            <span key={idx} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">
                                <Tag className="w-2.5 h-2.5" />
                                {tag}
                            </span>
                        ))}
                        {(doc as any).tags.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full text-[10px]">
                                +{(doc as any).tags.length - 2}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-muted rounded">
                            {typeLabels[doc.documentType] || doc.documentType}
                        </span>
                        {(doc as any).ocrStatus && (doc as any).ocrStatus !== 'NOT_APPLICABLE' && (
                            <span className={cn(
                                "px-1.5 py-0.5 rounded flex items-center gap-0.5",
                                ocrStatusLabels[(doc as any).ocrStatus]?.color || 'bg-gray-100'
                            )}>
                                <Scan className="w-2.5 h-2.5" />
                                {ocrStatusLabels[(doc as any).ocrStatus]?.label || (doc as any).ocrStatus}
                            </span>
                        )}
                        {(doc as any).version > 1 && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                v{(doc as any).version}
                            </span>
                        )}
                    </div>
                    <span>{formatFileSize(doc.fileSize)}</span>
                </div>
            </div>
        </div>
    );
}

export default DocumentCard;

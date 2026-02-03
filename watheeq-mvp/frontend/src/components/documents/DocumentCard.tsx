import { FileText, Image, File, Download, Trash2, Eye, MoreVertical, Check } from 'lucide-react';
import type { Document } from '@/types';
import { formatDate } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
    document: Document;
    onPreview?: (doc: Document) => void;
    onDownload?: (doc: Document) => void;
    onDelete?: (id: string) => void;
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
    OTHER: 'أخرى',
};

export function DocumentCard({
    document: doc,
    onPreview,
    onDownload,
    onDelete,
    view = 'grid',
    isSelected = false,
    onSelect,
    selectionMode = false,
}: DocumentCardProps) {
    const [showMenu, setShowMenu] = useState(false);
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

    const getFileIcon = () => {
        if (doc.mimeType?.includes('pdf')) return <FileText className="w-10 h-10 text-red-500" />;
        if (doc.mimeType?.includes('image')) return <Image className="w-10 h-10 text-blue-500" />;
        if (doc.mimeType?.includes('word')) return <FileText className="w-10 h-10 text-blue-600" />;
        return <File className="w-10 h-10 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // If clicking on checkbox area or in selection mode, toggle selection
        if (selectionMode) {
            e.preventDefault();
            onSelect?.(doc.id, !isSelected);
            return;
        }
        // Otherwise, open preview directly
        onPreview?.(doc);
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(doc.id, !isSelected);
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
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {onSelect && <Checkbox />}
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                        {getFileIcon()}
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
                "bg-card rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer relative group",
                isSelected && "ring-2 ring-primary bg-primary/5"
            )}
            onClick={handleCardClick}
        >
            {/* Checkbox */}
            {onSelect && (
                <div
                    className={cn(
                        "absolute top-3 right-3 transition-opacity",
                        selectionMode || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Checkbox />
                </div>
            )}

            <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 flex items-center justify-center bg-muted/50 rounded-lg">
                    {getFileIcon()}
                </div>
                <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                    >
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                    {showMenu && (
                        <div className="absolute left-0 top-full mt-1 w-36 bg-card rounded-lg shadow-lg border py-1 z-10">
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
                            <button
                                onClick={() => { onDelete?.(doc.id); setShowMenu(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                حذف
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <h3 className="font-medium mb-1 truncate" title={doc.title}>{doc.title}</h3>

            {doc.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{doc.description}</p>
            )}

            <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                <span className="px-2 py-0.5 bg-muted rounded">
                    {typeLabels[doc.documentType] || doc.documentType}
                </span>
                <span>{formatFileSize(doc.fileSize)}</span>
            </div>
        </div>
    );
}

export default DocumentCard;

import { X, Download, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Document } from '@/types';
import { formatDate } from '@/lib/utils';

interface DocumentPreviewProps {
    document: Document | null;
    onClose: () => void;
    onDownload?: (doc: Document) => void;
}

const typeLabels: Record<string, string> = {
    CONTRACT: 'عقد',
    PLEADING: 'مذكرة',
    EVIDENCE: 'دليل',
    COURT_ORDER: 'حكم محكمة',
    CORRESPONDENCE: 'مراسلة',
    OTHER: 'أخرى',
};

export function DocumentPreview({ document: doc, onClose, onDownload }: DocumentPreviewProps) {
    if (!doc) return null;

    const getFileIcon = () => {
        if (doc.mimeType?.includes('pdf')) return <FileText className="w-16 h-16 text-red-500" />;
        if (doc.mimeType?.includes('image')) return <Image className="w-16 h-16 text-blue-500" />;
        if (doc.mimeType?.includes('word')) return <FileText className="w-16 h-16 text-blue-600" />;
        return <File className="w-16 h-16 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isImage = doc.mimeType?.includes('image');
    const isPdf = doc.mimeType?.includes('pdf');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold truncate">{doc.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview Content */}
                <div className="p-6 overflow-auto max-h-[60vh]">
                    {isImage ? (
                        <div className="flex items-center justify-center">
                            <img
                                src={`${import.meta.env.VITE_API_URL || '/api'}/documents/${doc.id}/preview`}
                                alt={doc.title}
                                className="max-w-full max-h-[50vh] object-contain rounded-lg"
                            />
                        </div>
                    ) : isPdf ? (
                        <div className="flex flex-col items-center justify-center">
                            <iframe
                                src={`${import.meta.env.VITE_API_URL || '/api'}/documents/${doc.id}/preview`}
                                className="w-full h-[50vh] rounded-lg border"
                                title={doc.title}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            {getFileIcon()}
                            <p className="mt-4 text-muted-foreground">
                                المعاينة غير متاحة لهذا النوع من الملفات
                            </p>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-4 bg-muted/30 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">النوع</p>
                            <p className="font-medium">{typeLabels[doc.documentType] || doc.documentType}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">الحجم</p>
                            <p className="font-medium">{formatFileSize(doc.fileSize)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">تاريخ الرفع</p>
                            <p className="font-medium">{formatDate(doc.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">القضية</p>
                            <p className="font-medium">{doc.case?.title || 'غير مرتبط'}</p>
                        </div>
                    </div>
                    {doc.description && (
                        <div className="mt-4">
                            <p className="text-muted-foreground text-sm">الوصف</p>
                            <p className="text-sm mt-1">{doc.description}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 p-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        إغلاق
                    </Button>
                    <Button onClick={() => onDownload?.(doc)}>
                        <Download className="w-4 h-4 ml-2" />
                        تحميل
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default DocumentPreview;

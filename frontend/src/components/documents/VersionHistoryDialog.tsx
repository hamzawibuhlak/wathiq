import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/api/documents.api';
import { formatDate } from '@/lib/utils';
import { X, History, Download, RotateCcw, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface VersionHistoryDialogProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function VersionHistoryDialog({ documentId, isOpen, onClose }: VersionHistoryDialogProps) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['document-versions', documentId],
        queryFn: () => documentsApi.getVersionHistory(documentId),
        enabled: isOpen,
    });

    const restoreMutation = useMutation({
        mutationFn: documentsApi.restoreVersion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['document-versions'] });
            toast.success('تم استعادة الإصدار بنجاح');
        },
        onError: () => {
            toast.error('فشل في استعادة الإصدار');
        },
    });

    if (!isOpen) return null;

    const versions = data?.data || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">سجل الإصدارات</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            لا توجد إصدارات سابقة
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {versions.map((version: any) => (
                                <div
                                    key={version.id}
                                    className={cn(
                                        "p-4 border rounded-lg",
                                        version.isLatest && "bg-primary/5 border-primary"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-muted-foreground" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">
                                                        الإصدار {version.version}
                                                    </span>
                                                    {version.isLatest && (
                                                        <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                                                            الحالي
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {version.fileName}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                                    <span>{formatDate(version.createdAt)}</span>
                                                    <span>{version.uploadedBy?.name}</span>
                                                    <span>{(version.fileSize / 1024).toFixed(1)} KB</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => documentsApi.download(version.id)}
                                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                title="تحميل"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            {!version.isLatest && (
                                                <button
                                                    onClick={() => restoreMutation.mutate(version.id)}
                                                    disabled={restoreMutation.isPending}
                                                    className="flex items-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                                >
                                                    {restoreMutation.isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="h-4 w-4" />
                                                    )}
                                                    استعادة
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VersionHistoryDialog;

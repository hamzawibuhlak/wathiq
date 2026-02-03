import { Download, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui';

interface BulkActionsBarProps {
    selectedCount: number;
    onDownloadAll: () => void;
    onDeleteSelected: () => void;
    onCancelSelection: () => void;
    isDownloading?: boolean;
    isDeleting?: boolean;
}

export function BulkActionsBar({
    selectedCount,
    onDownloadAll,
    onDeleteSelected,
    onCancelSelection,
    isDownloading = false,
    isDeleting = false,
}: BulkActionsBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
            <div className="bg-card border-t shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary font-bold rounded-full">
                                {selectedCount}
                            </div>
                            <span className="font-medium">
                                تم تحديد {selectedCount} {selectedCount === 1 ? 'ملف' : selectedCount <= 10 ? 'ملفات' : 'ملف'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onDownloadAll}
                                disabled={isDownloading}
                                isLoading={isDownloading}
                            >
                                <Download className="w-4 h-4 ml-2" />
                                تحميل الكل
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={onDeleteSelected}
                                disabled={isDeleting}
                                isLoading={isDeleting}
                            >
                                <Trash2 className="w-4 h-4 ml-2" />
                                حذف المحدد
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onCancelSelection}
                            >
                                <X className="w-4 h-4 ml-2" />
                                إلغاء
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BulkActionsBar;

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Download, Loader2, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/api/client';
import { toast } from 'react-hot-toast';

interface ExecuteReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reportId: string;
    reportName?: string;
}

const exportFormats = [
    { value: 'EXCEL', label: 'Excel', icon: FileSpreadsheet, description: 'ملف Excel (.xlsx)' },
    { value: 'CSV', label: 'CSV', icon: FileText, description: 'ملف CSV للبيانات' },
    { value: 'JSON', label: 'JSON', icon: FileJson, description: 'ملف JSON' },
    { value: 'PDF', label: 'PDF/HTML', icon: FileText, description: 'ملف قابل للطباعة' },
];

export function ExecuteReportDialog({ open, onOpenChange, reportId, reportName }: ExecuteReportDialogProps) {
    const queryClient = useQueryClient();
    const [format, setFormat] = useState<'EXCEL' | 'CSV' | 'JSON' | 'PDF'>('EXCEL');
    const [isDownloading, setIsDownloading] = useState(false);

    const executeMutation = useMutation({
        mutationFn: () => api.post(`/reports/templates/${reportId}/execute`, { format }),
        onSuccess: async (response) => {
            const execId = response.data.id;
            toast.success('جاري إنشاء التقرير...');
            
            // Poll for completion and download
            setTimeout(async () => {
                await downloadReport(execId);
            }, 2000);
        },
        onError: () => {
            toast.error('فشل تنفيذ التقرير');
        },
    });

    const downloadReport = async (execId: string) => {
        setIsDownloading(true);
        try {
            // Check execution status
            const statusResponse = await api.get(`/reports/executions/${execId}`);
            
            if (statusResponse.data.status === 'COMPLETED') {
                // Download file
                const response = await api.get(`/reports/executions/${execId}/download`, {
                    responseType: 'blob',
                });

                // Get file extension
                const ext = format === 'EXCEL' ? 'xlsx' : format === 'PDF' ? 'html' : format.toLowerCase();
                
                // Create download link
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${reportName || 'report'}-${Date.now()}.${ext}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                toast.success('تم تحميل التقرير بنجاح');
                queryClient.invalidateQueries({ queryKey: ['reports'] });
                onOpenChange(false);
            } else if (statusResponse.data.status === 'FAILED') {
                toast.error('فشل إنشاء التقرير');
            } else {
                // Still processing, retry after delay
                setTimeout(() => downloadReport(execId), 2000);
            }
        } catch (error) {
            toast.error('فشل تحميل التقرير');
        } finally {
            setIsDownloading(false);
        }
    };

    if (!open) return null;

    const isLoading = executeMutation.isPending || isDownloading;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50" 
                onClick={() => !isLoading && onOpenChange(false)} 
            />
            
            {/* Dialog */}
            <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md mx-4" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Download className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">تنفيذ التقرير</h2>
                            <p className="text-sm text-muted-foreground">اختر صيغة التصدير</p>
                        </div>
                    </div>
                    {!isLoading && (
                        <button 
                            onClick={() => onOpenChange(false)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {reportName && (
                        <div className="p-3 rounded-xl bg-muted/50">
                            <p className="text-sm text-muted-foreground">التقرير:</p>
                            <p className="font-medium">{reportName}</p>
                        </div>
                    )}

                    {/* Format Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">صيغة التصدير</label>
                        <div className="grid grid-cols-2 gap-2">
                            {exportFormats.map((fmt) => {
                                const Icon = fmt.icon;
                                return (
                                    <button
                                        key={fmt.value}
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() => setFormat(fmt.value as any)}
                                        className={cn(
                                            "p-3 rounded-xl border text-right transition-all flex items-center gap-3",
                                            format === fmt.value
                                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                : "hover:border-primary/30",
                                            isLoading && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "w-5 h-5",
                                            format === fmt.value ? "text-primary" : "text-muted-foreground"
                                        )} />
                                        <div>
                                            <p className="font-medium text-sm">{fmt.label}</p>
                                            <p className="text-xs text-muted-foreground">{fmt.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 border rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={() => executeMutation.mutate()}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {isDownloading ? 'جاري التحميل...' : 'جاري التنفيذ...'}
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    تنفيذ وتحميل
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExecuteReportDialog;

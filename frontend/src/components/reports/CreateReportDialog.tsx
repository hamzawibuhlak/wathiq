import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/api/client';
import { toast } from 'react-hot-toast';

interface CreateReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const reportTypes = [
    { value: 'CASES_SUMMARY', label: 'ملخص القضايا', description: 'تقرير شامل بجميع القضايا' },
    { value: 'HEARINGS_SCHEDULE', label: 'جدول الجلسات', description: 'قائمة الجلسات المجدولة' },
    { value: 'FINANCIAL_SUMMARY', label: 'الملخص المالي', description: 'تقرير الفواتير والإيرادات' },
    { value: 'CLIENT_ACTIVITY', label: 'نشاط العملاء', description: 'تقرير بجميع العملاء ونشاطهم' },
    { value: 'LAWYER_PERFORMANCE', label: 'أداء المحامين', description: 'مقارنة أداء المحامين' },
    { value: 'INVOICES_AGING', label: 'أعمار الفواتير', description: 'الفواتير المستحقة والمتأخرة' },
];

export function CreateReportDialog({ open, onOpenChange }: CreateReportDialogProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        reportType: 'CASES_SUMMARY',
        config: {
            dateFrom: '',
            dateTo: '',
            status: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: typeof formData) => api.post('/reports', {
            name: data.name,
            description: data.description,
            reportType: data.reportType,
            config: data.config,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            toast.success('تم إنشاء قالب التقرير بنجاح');
            onOpenChange(false);
            setFormData({
                name: '',
                description: '',
                reportType: 'CASES_SUMMARY',
                config: { dateFrom: '', dateTo: '', status: '' },
            });
        },
        onError: () => {
            toast.error('فشل إنشاء التقرير');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('يرجى إدخال اسم التقرير');
            return;
        }
        createMutation.mutate(formData);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50" 
                onClick={() => onOpenChange(false)} 
            />
            
            {/* Dialog */}
            <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">إنشاء قالب تقرير جديد</h2>
                            <p className="text-sm text-muted-foreground">حدد نوع التقرير والإعدادات</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Report Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">اسم التقرير *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="مثال: تقرير القضايا الشهري"
                            className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">الوصف</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="وصف مختصر للتقرير..."
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                        />
                    </div>

                    {/* Report Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">نوع التقرير *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {reportTypes.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, reportType: type.value })}
                                    className={cn(
                                        "p-3 rounded-xl border text-right transition-all",
                                        formData.reportType === type.value
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                            : "hover:border-primary/30"
                                    )}
                                >
                                    <p className="font-medium text-sm">{type.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Filters */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">نطاق التاريخ (اختياري)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">من</label>
                                <input
                                    type="date"
                                    value={formData.config.dateFrom}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        config: { ...formData.config, dateFrom: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">إلى</label>
                                <input
                                    type="date"
                                    value={formData.config.dateTo}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        config: { ...formData.config, dateTo: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 px-4 py-2.5 border rounded-xl hover:bg-muted transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    جاري الإنشاء...
                                </>
                            ) : (
                                'إنشاء التقرير'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateReportDialog;

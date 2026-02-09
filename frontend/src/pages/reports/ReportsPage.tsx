import { useState } from 'react';
import { 
    FileText, 
    Download, 
    Calendar,
    Users,
    Briefcase,
    DollarSign,
    Clock,
    FileSpreadsheet,
    Filter,
    CheckCircle2,
    Loader2,
    Plus,
    Play,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/api/client';
import { useReportTemplates, useDeleteReportTemplate } from '@/hooks/use-reports';
import { CreateReportDialog, ExecuteReportDialog } from '@/components/reports';
import { toast } from 'react-hot-toast';

// Quick export report types (legacy)
const quickReportTypes = [
    {
        id: 'cases',
        title: 'تقرير القضايا',
        description: 'تصدير جميع القضايا مع تفاصيلها',
        icon: Briefcase,
        color: 'blue',
        roles: ['OWNER', 'ADMIN', 'LAWYER'],
        filters: ['status', 'type', 'lawyer', 'dateRange'],
    },
    {
        id: 'invoices',
        title: 'تقرير الفواتير',
        description: 'تصدير الفواتير والمعاملات المالية',
        icon: DollarSign,
        color: 'green',
        roles: ['OWNER', 'ADMIN'],
        filters: ['status', 'dateRange', 'client'],
    },
    {
        id: 'clients',
        title: 'تقرير العملاء',
        description: 'قائمة العملاء مع معلومات التواصل',
        icon: Users,
        color: 'purple',
        roles: ['OWNER', 'ADMIN', 'LAWYER'],
        filters: ['active', 'city'],
    },
    {
        id: 'hearings',
        title: 'تقرير الجلسات',
        description: 'جدول الجلسات والمواعيد',
        icon: Calendar,
        color: 'amber',
        roles: ['OWNER', 'ADMIN', 'LAWYER'],
        filters: ['status', 'dateRange', 'lawyer'],
    },
    {
        id: 'documents',
        title: 'تقرير المستندات',
        description: 'قائمة المستندات وأحجامها وأنواعها',
        icon: FileText,
        color: 'indigo',
        roles: ['OWNER', 'ADMIN', 'LAWYER'],
        filters: ['documentType', 'dateRange'],
    },
    {
        id: 'tasks',
        title: 'تقرير المهام',
        description: 'المهام المكتملة والمعلقة والمتأخرة',
        icon: CheckCircle2,
        color: 'teal',
        roles: ['OWNER', 'ADMIN', 'LAWYER'],
        filters: ['status', 'dateRange', 'assignee'],
    },
    {
        id: 'financial-report',
        title: 'التقرير المالي الشامل',
        description: 'ملخص الإيرادات والمصروفات',
        icon: FileSpreadsheet,
        color: 'emerald',
        roles: ['OWNER', 'ADMIN'],
        filters: ['dateRange'],
    },
];

// Report type labels for templates
const reportTypeLabels: Record<string, string> = {
    CASES_SUMMARY: 'ملخص القضايا',
    CASES_DETAILED: 'تقرير القضايا المفصل',
    HEARINGS_SCHEDULE: 'جدول الجلسات',
    FINANCIAL_SUMMARY: 'الملخص المالي',
    CLIENT_ACTIVITY: 'نشاط العملاء',
    LAWYER_PERFORMANCE: 'أداء المحامين',
    INVOICES_AGING: 'أعمار الفواتير',
};

// Status options for cases
const caseStatusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'OPEN', label: 'مفتوحة' },
    { value: 'IN_PROGRESS', label: 'جارية' },
    { value: 'SUSPENDED', label: 'معلقة' },
    { value: 'CLOSED', label: 'مغلقة' },
    { value: 'ARCHIVED', label: 'مؤرشفة' },
];

// Status options for invoices
const invoiceStatusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'DRAFT', label: 'مسودة' },
    { value: 'PENDING', label: 'مستحقة' },
    { value: 'SENT', label: 'مرسلة' },
    { value: 'PAID', label: 'مدفوعة' },
    { value: 'OVERDUE', label: 'متأخرة' },
    { value: 'CANCELLED', label: 'ملغية' },
];

// Status options for hearings
const hearingStatusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'SCHEDULED', label: 'مجدولة' },
    { value: 'COMPLETED', label: 'منتهية' },
    { value: 'POSTPONED', label: 'مؤجلة' },
    { value: 'CANCELLED', label: 'ملغية' },
];

// Status options for tasks
const taskStatusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'TODO', label: 'للتنفيذ' },
    { value: 'IN_PROGRESS', label: 'قيد التنفيذ' },
    { value: 'REVIEW', label: 'قيد المراجعة' },
    { value: 'COMPLETED', label: 'مكتملة' },
    { value: 'CANCELLED', label: 'ملغية' },
];

// Document type options
const documentTypeOptions = [
    { value: '', label: 'جميع الأنواع' },
    { value: 'CONTRACT', label: 'عقد' },
    { value: 'POWER_OF_ATTORNEY', label: 'توكيل' },
    { value: 'COURT_DOCUMENT', label: 'مستند محكمة' },
    { value: 'EVIDENCE', label: 'دليل' },
    { value: 'CORRESPONDENCE', label: 'مراسلة' },
    { value: 'ID_DOCUMENT', label: 'وثيقة هوية' },
    { value: 'FINANCIAL', label: 'مستند مالي' },
    { value: 'OTHER', label: 'أخرى' },
];

export function ReportsPage() {
    const { user } = useAuthStore();
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);
    const [filters, setFilters] = useState<Record<string, string>>({
        status: '',
        startDate: '',
        endDate: '',
    });

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');

    // Report templates from API
    const { data: templatesData, isLoading: templatesLoading } = useReportTemplates();
    const deleteTemplateMutation = useDeleteReportTemplate();
    const templates = templatesData?.data || [];

    // Filter quick exports based on user role
    const availableReports = quickReportTypes.filter(report => 
        report.roles.includes(user?.role || '')
    );

    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white',
        green: 'bg-green-500/10 text-green-600 group-hover:bg-green-500 group-hover:text-white',
        purple: 'bg-purple-500/10 text-purple-600 group-hover:bg-purple-500 group-hover:text-white',
        amber: 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white',
        emerald: 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white',
        indigo: 'bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white',
        teal: 'bg-teal-500/10 text-teal-600 group-hover:bg-teal-500 group-hover:text-white',
    };

    const handleQuickExport = async (reportId: string) => {
        setIsExporting(true);
        setExportSuccess(null);
        
        try {
            // Build query params
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await api.get(`/exports/${reportId}${params.toString() ? `?${params.toString()}` : ''}`, {
                responseType: 'blob',
            });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${reportId}-report-${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            setExportSuccess(reportId);
            setTimeout(() => setExportSuccess(null), 3000);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('فشل تصدير التقرير. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExecuteTemplate = (templateId: string, templateName: string) => {
        setSelectedTemplateId(templateId);
        setSelectedTemplateName(templateName);
        setExecuteDialogOpen(true);
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
        
        try {
            await deleteTemplateMutation.mutateAsync(templateId);
            toast.success('تم حذف القالب بنجاح');
        } catch {
            toast.error('فشل حذف القالب');
        }
    };

    const getStatusOptions = (reportId: string) => {
        switch (reportId) {
            case 'cases':
                return caseStatusOptions;
            case 'invoices':
                return invoiceStatusOptions;
            case 'hearings':
                return hearingStatusOptions;
            case 'tasks':
                return taskStatusOptions;
            case 'documents':
                return documentTypeOptions;
            default:
                return [];
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileSpreadsheet className="w-7 h-7 text-primary" />
                        التقارير
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        إنشاء وتصدير التقارير بصيغ متعددة
                    </p>
                </div>
                
                <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    قالب تقرير جديد
                </button>
            </div>

            {/* Saved Report Templates Section */}
            {templates.length > 0 && (
                <div className="p-6 rounded-2xl border bg-card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        قوالب التقارير المحفوظة
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((template) => (
                            <div 
                                key={template.id}
                                className="p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{template.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {reportTypeLabels[template.reportType] || template.reportType}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleExecuteTemplate(template.id, template.name)}
                                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-green-600 transition-colors"
                                            title="تنفيذ وتصدير"
                                        >
                                            <Play className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTemplate(template.id)}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {template.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {template.description}
                                    </p>
                                )}
                                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                        {new Date(template.createdAt).toLocaleDateString('ar-SA')}
                                    </span>
                                    <button
                                        onClick={() => handleExecuteTemplate(template.id, template.name)}
                                        className="flex items-center gap-1 text-primary hover:underline"
                                    >
                                        <Download className="w-3 h-3" />
                                        تصدير
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Templates Loading */}
            {templatesLoading && (
                <div className="p-6 rounded-2xl border bg-card">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري تحميل القوالب...
                    </div>
                </div>
            )}

            {/* Quick Export Section */}
            <div className="p-6 rounded-2xl border bg-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    تصدير سريع
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    انقر على نوع التقرير للتخصيص، أو استخدم الأزرار أدناه للتصدير المباشر
                </p>
                
                {/* Quick Export Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {availableReports.map((report) => (
                        <button
                            key={`quick-${report.id}`}
                            onClick={() => handleQuickExport(report.id)}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            <report.icon className="w-4 h-4" />
                            {report.title}
                        </button>
                    ))}
                </div>

                {/* Report Cards with Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableReports.map((report) => {
                        const Icon = report.icon;
                        const isSelected = selectedReport === report.id;
                        const isSuccess = exportSuccess === report.id;
                        
                        return (
                            <div 
                                key={report.id}
                                className={cn(
                                    "group p-6 rounded-2xl border bg-background transition-all duration-200 cursor-pointer",
                                    isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md hover:border-primary/30",
                                    isSuccess && "ring-2 ring-green-500"
                                )}
                                onClick={() => setSelectedReport(isSelected ? null : report.id)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                        colorClasses[report.color]
                                    )}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    {isSuccess && (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    )}
                                </div>
                                
                                <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                                
                                {/* Expanded Filters */}
                                {isSelected && (
                                    <div className="space-y-3 pt-4 border-t mt-4 animate-in slide-in-from-top-2 duration-200">
                                        {/* Status Filter */}
                                        {report.filters.includes('status') && (
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">
                                                    الحالة
                                                </label>
                                                <select
                                                    value={filters.status}
                                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {getStatusOptions(report.id).map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        
                                        {/* Date Range Filter */}
                                        {report.filters.includes('dateRange') && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">
                                                        من تاريخ
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={filters.startDate}
                                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-muted-foreground mb-1 block">
                                                        إلى تاريخ
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={filters.endDate}
                                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Export Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickExport(report.id);
                                            }}
                                            disabled={isExporting}
                                            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {isExporting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    جاري التصدير...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4" />
                                                    تصدير Excel
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                                
                                {/* Click to expand hint */}
                                {!isSelected && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Filter className="w-3 h-3" />
                                        انقر للتخصيص والتصدير
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Info Section */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            ملاحظة حول التقارير
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            يمكنك إنشاء قوالب تقارير مخصصة وحفظها للاستخدام المتكرر. 
                            تدعم التقارير التصدير بصيغ Excel، CSV، JSON، و PDF.
                        </p>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <CreateReportDialog 
                open={createDialogOpen} 
                onOpenChange={setCreateDialogOpen} 
            />
            
            <ExecuteReportDialog
                open={executeDialogOpen}
                onOpenChange={setExecuteDialogOpen}
                reportId={selectedTemplateId}
                reportName={selectedTemplateName}
            />
        </div>
    );
}

export default ReportsPage;

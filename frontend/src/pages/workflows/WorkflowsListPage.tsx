import { useState } from 'react';
import { Plus, Zap, Play, Pause, Trash2, Clock, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui';
import { useWorkflows, useToggleWorkflow, useDeleteWorkflow, useManualTriggerWorkflow } from '@/hooks/use-workflows';
import { Workflow, WorkflowTrigger } from '@/api/workflows.api';
import { cn } from '@/lib/utils';
import { CreateWorkflowDialog } from '@/components/workflows/CreateWorkflowDialog';

const triggerLabels: Record<WorkflowTrigger, string> = {
    CASE_CREATED: 'عند إنشاء قضية',
    CASE_STATUS_CHANGED: 'عند تغيير حالة القضية',
    HEARING_SCHEDULED: 'عند جدولة جلسة',
    HEARING_REMINDER: 'تذكير بموعد الجلسة',
    TASK_OVERDUE: 'عند تأخر المهمة',
    DOCUMENT_UPLOADED: 'عند رفع مستند',
    INVOICE_CREATED: 'عند إنشاء فاتورة',
    INVOICE_OVERDUE: 'عند تأخر الفاتورة',
    CLIENT_CREATED: 'عند إضافة عميل',
    MANUAL: 'تشغيل يدوي',
};

interface TemplateConfig {
    title: string;
    description: string;
    trigger: WorkflowTrigger;
    defaultName: string;
    defaultDescription: string;
}

const workflowTemplates: TemplateConfig[] = [
    {
        title: 'تذكير الجلسات',
        description: 'إرسال إشعار قبل 24 ساعة من موعد الجلسة',
        trigger: 'HEARING_REMINDER',
        defaultName: 'تذكير موعد الجلسة',
        defaultDescription: 'إرسال تذكير تلقائي قبل موعد الجلسة'
    },
    {
        title: 'مهمة عند إنشاء قضية',
        description: 'إنشاء مهمة تلقائياً عند إضافة قضية جديدة',
        trigger: 'CASE_CREATED',
        defaultName: 'مهمة مراجعة القضية الجديدة',
        defaultDescription: 'إنشاء مهمة تلقائية لمراجعة كل قضية جديدة'
    },
    {
        title: 'تنبيه المهام المتأخرة',
        description: 'إرسال إشعار عند تأخر المهمة عن موعدها',
        trigger: 'TASK_OVERDUE',
        defaultName: 'تنبيه المهام المتأخرة',
        defaultDescription: 'إشعار تلقائي عند تأخر أي مهمة'
    },
    {
        title: 'ترحيب بالعملاء',
        description: 'إرسال رسالة ترحيبية عند إضافة عميل جديد',
        trigger: 'CLIENT_CREATED',
        defaultName: 'رسالة ترحيب العميل',
        defaultDescription: 'إرسال رسالة ترحيبية لكل عميل جديد'
    },
    {
        title: 'تذكير الفواتير',
        description: 'إرسال تذكير عند تأخر الفاتورة',
        trigger: 'INVOICE_OVERDUE',
        defaultName: 'تذكير الفواتير المتأخرة',
        defaultDescription: 'تذكير تلقائي بالفواتير المستحقة'
    },
    {
        title: 'إشعار المستندات',
        description: 'إشعار عند رفع مستند جديد للقضية',
        trigger: 'DOCUMENT_UPLOADED',
        defaultName: 'إشعار رفع المستندات',
        defaultDescription: 'تنبيه عند رفع أي مستند جديد'
    },
];

function WorkflowsListPage() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
    
    const { data, isLoading, error } = useWorkflows();
    const toggleMutation = useToggleWorkflow();
    const deleteMutation = useDeleteWorkflow();
    const triggerMutation = useManualTriggerWorkflow();

    const workflows = data?.data || [];

    const handleToggle = (id: string) => {
        toggleMutation.mutate(id);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف سير العمل هذا؟')) {
            deleteMutation.mutate(id);
        }
    };

    const handleManualTrigger = (id: string) => {
        triggerMutation.mutate({ id, triggerData: {} });
    };

    const handleUseTemplate = (template: TemplateConfig) => {
        setSelectedTemplate(template);
        setIsCreateDialogOpen(true);
    };

    const handleOpenCreateDialog = () => {
        setSelectedTemplate(null);
        setIsCreateDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsCreateDialogOpen(false);
        setSelectedTemplate(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="w-7 h-7 text-primary" />
                        سير العمل الآلي
                    </h1>
                    <p className="text-muted-foreground">
                        أتمتة المهام والإشعارات بناءً على الأحداث
                    </p>
                </div>
                <Button onClick={handleOpenCreateDialog}>
                    <Plus className="w-4 h-4 ml-2" />
                    سير عمل جديد
                </Button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <h3 className="font-medium text-blue-900">كيف يعمل سير العمل الآلي؟</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        اختر <strong>محفز</strong> (مثل إنشاء قضية) ثم أضف <strong>إجراءات</strong> (مثل إنشاء مهمة أو إرسال إشعار). 
                        سيتم تنفيذ الإجراءات تلقائياً عند حدوث المحفز.
                    </p>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <span>حدث خطأ أثناء تحميل سير العمل</span>
                </div>
            )}

            {/* Workflows List */}
            {!isLoading && !error && (
                <>
                    {workflows.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-xl border">
                            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">لا يوجد سير عمل</h3>
                            <p className="text-muted-foreground mb-4">
                                لم يتم إنشاء أي سير عمل آلي بعد. ابدأ بإنشاء واحد أو استخدم القوالب الجاهزة أدناه.
                            </p>
                            <Button onClick={handleOpenCreateDialog}>
                                <Plus className="w-4 h-4 ml-2" />
                                إنشاء سير عمل
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">سير العمل النشط ({workflows.length})</h2>
                            <div className="grid gap-4">
                                {workflows.map((workflow) => (
                                    <WorkflowCard
                                        key={workflow.id}
                                        workflow={workflow}
                                        onToggle={() => handleToggle(workflow.id)}
                                        onDelete={() => handleDelete(workflow.id)}
                                        onTrigger={() => handleManualTrigger(workflow.id)}
                                        isToggling={toggleMutation.isPending}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Pre-built Workflows Section */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">قوالب سير العمل الجاهزة</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    اختر قالب جاهز لبدء الإنشاء بسرعة
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workflowTemplates.map((template, index) => (
                        <WorkflowTemplate
                            key={index}
                            title={template.title}
                            description={template.description}
                            trigger={template.trigger}
                            onUse={() => handleUseTemplate(template)}
                        />
                    ))}
                </div>
            </div>

            {/* Create Workflow Dialog */}
            <CreateWorkflowDialog
                isOpen={isCreateDialogOpen}
                onClose={handleCloseDialog}
                initialTrigger={selectedTemplate?.trigger}
                initialName={selectedTemplate?.defaultName}
                initialDescription={selectedTemplate?.defaultDescription}
            />
        </div>
    );
}

interface WorkflowCardProps {
    workflow: Workflow;
    onToggle: () => void;
    onDelete: () => void;
    onTrigger: () => void;
    isToggling: boolean;
}

function WorkflowCard({ workflow, onToggle, onDelete, onTrigger, isToggling }: WorkflowCardProps) {
    return (
        <div className={cn(
            "bg-card rounded-xl border p-4 transition-all",
            !workflow.isActive && "opacity-60"
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            workflow.isActive 
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                        )}>
                            {workflow.isActive ? 'مفعل' : 'متوقف'}
                        </span>
                    </div>
                    {workflow.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                            {workflow.description}
                        </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            {triggerLabels[workflow.triggerType]}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {workflow._count?.executions || 0} تنفيذ
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {workflow.triggerType === 'MANUAL' && workflow.isActive && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onTrigger}
                            title="تشغيل الآن"
                        >
                            <Play className="w-4 h-4" />
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggle}
                        disabled={isToggling}
                        title={workflow.isActive ? 'إيقاف' : 'تفعيل'}
                    >
                        {workflow.isActive ? (
                            <Pause className="w-4 h-4" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="text-destructive hover:text-destructive"
                        title="حذف"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface WorkflowTemplateProps {
    title: string;
    description: string;
    trigger: WorkflowTrigger;
    onUse: () => void;
}

function WorkflowTemplate({ title, description, trigger, onUse }: WorkflowTemplateProps) {
    return (
        <div className="bg-muted/50 rounded-xl border border-dashed p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-medium">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            <div className="flex items-center justify-between">
                <span className="text-xs bg-background px-2 py-1 rounded-full">
                    {triggerLabels[trigger]}
                </span>
                <Button variant="ghost" size="sm" onClick={onUse} className="text-xs">
                    استخدام القالب
                </Button>
            </div>
        </div>
    );
}

export default WorkflowsListPage;

import { useState } from 'react';
import {
    X,
    Zap,
    Plus,
    Trash2,
    Briefcase,
    Calendar,
    Clock,
    Bell,
    FileText,
    Receipt,
    User,
    Play,
    CheckSquare,
    Mail,
    MessageCircle,
    RefreshCw
} from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { useCreateWorkflow } from '@/hooks/use-workflows';
import { useLawyers } from '@/hooks/use-lawyers';
import { WorkflowTrigger, WorkflowAction, CreateWorkflowData } from '@/api/workflows.api';
import { cn } from '@/lib/utils';

interface CreateWorkflowDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialTrigger?: WorkflowTrigger;
    initialName?: string;
    initialDescription?: string;
}

const triggerOptions: { type: WorkflowTrigger; label: string; icon: React.ElementType; description: string }[] = [
    { type: 'CASE_CREATED', label: 'عند إنشاء قضية', icon: Briefcase, description: 'يتم تشغيله عند إضافة قضية جديدة' },
    { type: 'CASE_STATUS_CHANGED', label: 'عند تغيير حالة القضية', icon: RefreshCw, description: 'يتم تشغيله عند تغيير حالة أي قضية' },
    { type: 'HEARING_SCHEDULED', label: 'عند جدولة جلسة', icon: Calendar, description: 'يتم تشغيله عند إضافة جلسة جديدة' },
    { type: 'HEARING_REMINDER', label: 'تذكير بموعد الجلسة', icon: Bell, description: 'يتم تشغيله قبل موعد الجلسة بوقت محدد' },
    { type: 'TASK_OVERDUE', label: 'عند تأخر المهمة', icon: Clock, description: 'يتم تشغيله عند تجاوز موعد استحقاق المهمة' },
    { type: 'DOCUMENT_UPLOADED', label: 'عند رفع مستند', icon: FileText, description: 'يتم تشغيله عند رفع مستند جديد' },
    { type: 'INVOICE_CREATED', label: 'عند إنشاء فاتورة', icon: Receipt, description: 'يتم تشغيله عند إصدار فاتورة جديدة' },
    { type: 'INVOICE_OVERDUE', label: 'عند تأخر الفاتورة', icon: Clock, description: 'يتم تشغيله عند تجاوز موعد استحقاق الفاتورة' },
    { type: 'CLIENT_CREATED', label: 'عند إضافة عميل', icon: User, description: 'يتم تشغيله عند إضافة عميل جديد' },
    { type: 'MANUAL', label: 'تشغيل يدوي', icon: Play, description: 'يتم تشغيله يدوياً من قبل المستخدم' },
];

const actionOptions: { type: WorkflowAction['type']; label: string; icon: React.ElementType; description: string }[] = [
    { type: 'CREATE_TASK', label: 'إنشاء مهمة', icon: CheckSquare, description: 'إنشاء مهمة جديدة تلقائياً' },
    { type: 'SEND_NOTIFICATION', label: 'إرسال إشعار', icon: Bell, description: 'إرسال إشعار داخلي للمستخدم' },
    { type: 'SEND_EMAIL', label: 'إرسال بريد', icon: Mail, description: 'إرسال بريد إلكتروني' },
    { type: 'SEND_WHATSAPP', label: 'إرسال واتساب', icon: MessageCircle, description: 'إرسال رسالة واتساب' },
    { type: 'UPDATE_STATUS', label: 'تحديث الحالة', icon: RefreshCw, description: 'تغيير حالة القضية أو المهمة' },
];

const priorityOptions = [
    { value: 'LOW', label: 'منخفضة' },
    { value: 'MEDIUM', label: 'متوسطة' },
    { value: 'HIGH', label: 'عالية' },
    { value: 'URGENT', label: 'عاجلة' },
];

export function CreateWorkflowDialog({ 
    isOpen, 
    onClose, 
    initialTrigger,
    initialName = '',
    initialDescription = ''
}: CreateWorkflowDialogProps) {
    const [step, setStep] = useState<'trigger' | 'actions' | 'review'>(initialTrigger ? 'actions' : 'trigger');
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [selectedTrigger, setSelectedTrigger] = useState<WorkflowTrigger | null>(initialTrigger || null);
    const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
    const [actions, setActions] = useState<WorkflowAction[]>([]);
    const [currentActionType, setCurrentActionType] = useState<WorkflowAction['type'] | null>(null);
    const [actionConfig, setActionConfig] = useState<Record<string, any>>({});

    const createMutation = useCreateWorkflow();
    const { data: lawyersData } = useLawyers();
    const lawyers = lawyersData?.data || [];

    const resetForm = () => {
        setStep('trigger');
        setName('');
        setDescription('');
        setSelectedTrigger(null);
        setTriggerConfig({});
        setActions([]);
        setCurrentActionType(null);
        setActionConfig({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSelectTrigger = (trigger: WorkflowTrigger) => {
        setSelectedTrigger(trigger);
        setStep('actions');
    };

    const handleAddAction = () => {
        if (!currentActionType) return;

        const newAction: WorkflowAction = {
            type: currentActionType,
            config: { ...actionConfig }
        };

        setActions([...actions, newAction]);
        setCurrentActionType(null);
        setActionConfig({});
    };

    const handleRemoveAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!name.trim() || !selectedTrigger || actions.length === 0) return;

        const data: CreateWorkflowData = {
            name: name.trim(),
            description: description.trim() || undefined,
            triggerType: selectedTrigger,
            triggerConfig,
            actions,
            isActive: true
        };

        createMutation.mutate(data, {
            onSuccess: () => {
                handleClose();
            }
        });
    };

    if (!isOpen) return null;

    const selectedTriggerInfo = triggerOptions.find(t => t.type === selectedTrigger);
    const currentActionInfo = actionOptions.find(a => a.type === currentActionType);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">إنشاء سير عمل جديد</h2>
                    </div>
                    <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Steps indicator */}
                <div className="px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center justify-center gap-4">
                        <StepIndicator 
                            step={1} 
                            label="المحفز" 
                            active={step === 'trigger'} 
                            completed={selectedTrigger !== null}
                        />
                        <div className="w-12 h-px bg-border" />
                        <StepIndicator 
                            step={2} 
                            label="الإجراءات" 
                            active={step === 'actions'} 
                            completed={actions.length > 0}
                        />
                        <div className="w-12 h-px bg-border" />
                        <StepIndicator 
                            step={3} 
                            label="المراجعة" 
                            active={step === 'review'} 
                            completed={false}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Step 1: Select Trigger */}
                    {step === 'trigger' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>اختر المحفز (متى يتم تشغيل سير العمل؟)</Label>
                                <div className="grid gap-2">
                                    {triggerOptions.map((trigger) => {
                                        const Icon = trigger.icon;
                                        return (
                                            <button
                                                key={trigger.type}
                                                onClick={() => handleSelectTrigger(trigger.type)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border text-right transition-all",
                                                    "hover:border-primary hover:bg-primary/5",
                                                    selectedTrigger === trigger.type && "border-primary bg-primary/10"
                                                )}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Icon className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{trigger.label}</h4>
                                                    <p className="text-sm text-muted-foreground">{trigger.description}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Add Actions */}
                    {step === 'actions' && (
                        <div className="space-y-6">
                            {/* Workflow Info */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">اسم سير العمل *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="مثال: تذكير الجلسات"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">الوصف (اختياري)</Label>
                                    <Input
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="وصف مختصر لسير العمل"
                                    />
                                </div>
                            </div>

                            {/* Selected Trigger */}
                            {selectedTriggerInfo && (
                                <div className="p-3 rounded-lg bg-muted/50 border">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium">المحفز:</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <selectedTriggerInfo.icon className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{selectedTriggerInfo.label}</span>
                                    </div>
                                    <button
                                        onClick={() => setStep('trigger')}
                                        className="text-xs text-primary hover:underline mt-2"
                                    >
                                        تغيير المحفز
                                    </button>
                                </div>
                            )}

                            {/* Trigger Config for HEARING_REMINDER */}
                            {selectedTrigger === 'HEARING_REMINDER' && (
                                <div className="p-3 rounded-lg border space-y-2">
                                    <Label>إعدادات التذكير</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">تذكير قبل</span>
                                        <Input
                                            type="number"
                                            value={triggerConfig.hoursBeforeHearing || 24}
                                            onChange={(e) => setTriggerConfig({ ...triggerConfig, hoursBeforeHearing: parseInt(e.target.value) })}
                                            className="w-20"
                                        />
                                        <span className="text-sm">ساعة من موعد الجلسة</span>
                                    </div>
                                </div>
                            )}

                            {/* Added Actions */}
                            {actions.length > 0 && (
                                <div className="space-y-2">
                                    <Label>الإجراءات المضافة ({actions.length})</Label>
                                    <div className="space-y-2">
                                        {actions.map((action, index) => {
                                            const actionInfo = actionOptions.find(a => a.type === action.type);
                                            const Icon = actionInfo?.icon || CheckSquare;
                                            return (
                                                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                            <Icon className="w-4 h-4 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-sm">{actionInfo?.label}</span>
                                                            {action.config.title && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {action.config.title}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveAction(index)}
                                                        className="text-destructive hover:text-destructive/80"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Add New Action */}
                            <div className="space-y-3">
                                <Label>إضافة إجراء جديد</Label>
                                
                                {/* Action Type Selection */}
                                {!currentActionType ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {actionOptions.map((action) => {
                                            const Icon = action.icon;
                                            return (
                                                <button
                                                    key={action.type}
                                                    onClick={() => setCurrentActionType(action.type)}
                                                    className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 text-right"
                                                >
                                                    <Icon className="w-5 h-5 text-primary" />
                                                    <span className="text-sm font-medium">{action.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-lg border space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {currentActionInfo && <currentActionInfo.icon className="w-5 h-5 text-primary" />}
                                                <span className="font-medium">{currentActionInfo?.label}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setCurrentActionType(null);
                                                    setActionConfig({});
                                                }}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Action Config Forms */}
                                        {currentActionType === 'CREATE_TASK' && (
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <Label>عنوان المهمة *</Label>
                                                    <Input
                                                        value={actionConfig.title || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, title: e.target.value })}
                                                        placeholder="مثال: مراجعة ملف القضية {{caseNumber}}"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        يمكنك استخدام {'{{caseNumber}}'}, {'{{clientName}}'} للمتغيرات
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>الوصف</Label>
                                                    <Input
                                                        value={actionConfig.description || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, description: e.target.value })}
                                                        placeholder="تفاصيل المهمة"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label>الأولوية</Label>
                                                        <select
                                                            value={actionConfig.priority || 'MEDIUM'}
                                                            onChange={(e) => setActionConfig({ ...actionConfig, priority: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                                        >
                                                            {priorityOptions.map(p => (
                                                                <option key={p.value} value={p.value}>{p.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label>تستحق خلال (أيام)</Label>
                                                        <Input
                                                            type="number"
                                                            value={actionConfig.dueDays || 3}
                                                            onChange={(e) => setActionConfig({ ...actionConfig, dueDays: parseInt(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>إسناد إلى</Label>
                                                    <select
                                                        value={actionConfig.assignedToId || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, assignedToId: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                                    >
                                                        <option value="">المستخدم المسبب للحدث</option>
                                                        {lawyers.map(lawyer => (
                                                            <option key={lawyer.id} value={lawyer.id}>{lawyer.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {currentActionType === 'SEND_NOTIFICATION' && (
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <Label>عنوان الإشعار *</Label>
                                                    <Input
                                                        value={actionConfig.title || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, title: e.target.value })}
                                                        placeholder="مثال: تذكير بموعد الجلسة"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>نص الإشعار *</Label>
                                                    <textarea
                                                        value={actionConfig.message || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, message: e.target.value })}
                                                        placeholder="لديك جلسة غداً في القضية {{caseNumber}}"
                                                        rows={3}
                                                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>إرسال إلى</Label>
                                                    <select
                                                        value={actionConfig.userId || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, userId: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                                    >
                                                        <option value="">المستخدم المسبب للحدث</option>
                                                        {lawyers.map(lawyer => (
                                                            <option key={lawyer.id} value={lawyer.id}>{lawyer.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {currentActionType === 'SEND_EMAIL' && (
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <Label>إلى (بريد إلكتروني)</Label>
                                                    <Input
                                                        value={actionConfig.to || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, to: e.target.value })}
                                                        placeholder="example@email.com أو اتركه فارغ للعميل"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>الموضوع *</Label>
                                                    <Input
                                                        value={actionConfig.subject || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, subject: e.target.value })}
                                                        placeholder="تذكير بموعد الجلسة"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>النص *</Label>
                                                    <textarea
                                                        value={actionConfig.body || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, body: e.target.value })}
                                                        placeholder="نص الرسالة..."
                                                        rows={4}
                                                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {currentActionType === 'SEND_WHATSAPP' && (
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <Label>رقم الهاتف</Label>
                                                    <Input
                                                        value={actionConfig.to || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, to: e.target.value })}
                                                        placeholder="اتركه فارغ لاستخدام رقم العميل"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>الرسالة *</Label>
                                                    <textarea
                                                        value={actionConfig.message || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, message: e.target.value })}
                                                        placeholder="مرحباً {{clientName}}، لديك جلسة غداً..."
                                                        rows={4}
                                                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {currentActionType === 'UPDATE_STATUS' && (
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <Label>نوع الكيان</Label>
                                                    <select
                                                        value={actionConfig.entityType || 'Case'}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, entityType: e.target.value })}
                                                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                                    >
                                                        <option value="Case">القضية</option>
                                                        <option value="Task">المهمة</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>الحالة الجديدة</Label>
                                                    <Input
                                                        value={actionConfig.newStatus || ''}
                                                        onChange={(e) => setActionConfig({ ...actionConfig, newStatus: e.target.value })}
                                                        placeholder="مثال: ACTIVE أو COMPLETED"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleAddAction}
                                            disabled={!actionConfig.title && currentActionType !== 'UPDATE_STATUS'}
                                            className="w-full"
                                        >
                                            <Plus className="w-4 h-4 ml-2" />
                                            إضافة الإجراء
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 'review' && (
                        <div className="space-y-4">
                            <div className="bg-card rounded-lg border p-4">
                                <h3 className="font-semibold text-lg mb-2">{name}</h3>
                                {description && <p className="text-muted-foreground text-sm mb-4">{description}</p>}
                                
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium">المحفز:</span>
                                        <span className="text-sm">{selectedTriggerInfo?.label}</span>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckSquare className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium">الإجراءات ({actions.length}):</span>
                                        </div>
                                        <div className="mr-6 space-y-1">
                                            {actions.map((action, index) => {
                                                const info = actionOptions.find(a => a.type === action.type);
                                                return (
                                                    <div key={index} className="text-sm text-muted-foreground">
                                                        {index + 1}. {info?.label}
                                                        {action.config.title && `: ${action.config.title}`}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                    <div>
                        {step !== 'trigger' && (
                            <Button
                                variant="ghost"
                                onClick={() => setStep(step === 'review' ? 'actions' : 'trigger')}
                            >
                                السابق
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            إلغاء
                        </Button>
                        {step === 'actions' && actions.length > 0 && name.trim() && (
                            <Button onClick={() => setStep('review')}>
                                التالي
                            </Button>
                        )}
                        {step === 'review' && (
                            <Button 
                                onClick={handleSubmit}
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? 'جاري الحفظ...' : 'إنشاء سير العمل'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepIndicator({ step, label, active, completed }: { step: number; label: string; active: boolean; completed: boolean }) {
    return (
        <div className={cn("flex items-center gap-2", active && "text-primary")}>
            <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium border-2",
                active ? "border-primary bg-primary text-primary-foreground" :
                completed ? "border-green-500 bg-green-500 text-white" :
                "border-muted-foreground/30 text-muted-foreground"
            )}>
                {completed ? '✓' : step}
            </div>
            <span className={cn("text-sm hidden sm:inline", !active && !completed && "text-muted-foreground")}>
                {label}
            </span>
        </div>
    );
}

export default CreateWorkflowDialog;

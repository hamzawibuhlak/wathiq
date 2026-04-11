import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import {
    Plus, Eye, Settings, ArrowRight, ArrowLeft, Trash2, GripVertical,
    Type, AlignLeft, Mail, Phone, Hash, Calendar, ChevronDown,
    Circle, CheckSquare, Upload, Star, FileText, Heading, Save,
    Users, KeyRound, Shield, Send, Copy, X, UserPlus, Layers,
    ChevronRight,
} from 'lucide-react';
import {
    useForm, useCreateForm, useUpdateForm,
    useManageFormAccess, useGenerateFormOtp,
} from '@/hooks/useForms';
import { useUsers } from '@/hooks/useUsers';
import toast from 'react-hot-toast';

// ══════════════════════════════════════════════════════════
// FIELD TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════

const FIELD_TYPES = [
    { type: 'shortText', label: 'نص قصير', icon: Type, group: 'text' },
    { type: 'longText', label: 'نص طويل', icon: AlignLeft, group: 'text' },
    { type: 'email', label: 'بريد إلكتروني', icon: Mail, group: 'text' },
    { type: 'phone', label: 'رقم جوال', icon: Phone, group: 'text' },
    { type: 'number', label: 'رقم', icon: Hash, group: 'text' },
    { type: 'date', label: 'تاريخ', icon: Calendar, group: 'datetime' },
    { type: 'dropdown', label: 'قائمة منسدلة', icon: ChevronDown, group: 'selection' },
    { type: 'radio', label: 'اختيار واحد', icon: Circle, group: 'selection' },
    { type: 'checkbox', label: 'اختيار متعدد', icon: CheckSquare, group: 'selection' },
    { type: 'fileUpload', label: 'رفع ملف', icon: Upload, group: 'media' },
    { type: 'rating', label: 'تقييم', icon: Star, group: 'special' },
    { type: 'sectionHeader', label: 'عنوان قسم', icon: Heading, group: 'layout' },
    { type: 'paragraph', label: 'فقرة نصية', icon: FileText, group: 'layout' },
];

const GROUPS = [
    { key: 'text', label: 'نصوص' },
    { key: 'datetime', label: 'تاريخ ووقت' },
    { key: 'selection', label: 'اختيارات' },
    { key: 'media', label: 'ملفات' },
    { key: 'special', label: 'خاص' },
    { key: 'layout', label: 'تنسيق' },
];

interface FormFieldData {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    helpText?: string;
    required: boolean;
    width: string;
    options?: string[];
    validation?: any; // stores { ...; step?: number }
    fileSettings?: any;
    conditionalShow?: any;
}

type BuilderTab = 'build' | 'preview' | 'access' | 'otp' | 'settings';

// Helper: read/write the step number we stash inside field.validation
const getFieldStep = (f: FormFieldData): number => {
    const s = f.validation?.step;
    return typeof s === 'number' && s >= 0 ? s : 0;
};
const setFieldStep = (f: FormFieldData, step: number): FormFieldData => ({
    ...f,
    validation: { ...(f.validation || {}), step },
});

// ══════════════════════════════════════════════════════════
// MAIN FORM BUILDER PAGE — WIZARD EDITION
// ══════════════════════════════════════════════════════════

export default function FormBuilderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { p } = useSlugPath();
    const isEditing = !!id;

    const { data: existingForm } = useForm(id || '');
    const createMutation = useCreateForm();
    const updateMutation = useUpdateForm();

    const [activeTab, setActiveTab] = useState<BuilderTab>('build');
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [stepCount, setStepCount] = useState(1);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        title: 'نموذج جديد',
        description: '',
        isActive: true,
        isPublic: true,
        allowMultiple: false,
        accentColor: '#4f46e5',
        successMessage: 'شكراً لك! تم استلام إجاباتك',
        notifyOnSubmit: true,
        notifyEmails: [] as string[],
        fields: [] as FormFieldData[],
        // Access
        allowedUserIds: [] as string[],
        // OTP
        otpEnabled: false,
        otpDeliveryMethod: 'email' as 'email' | 'sms' | 'whatsapp',
        otpLength: 6,
        otpExpiryMinutes: 15,
    });

    // Load existing form data
    useEffect(() => {
        if (existingForm && isEditing) {
            const loadedFields: FormFieldData[] = (existingForm.fields || []).map((f: any) => ({
                id: f.id,
                type: f.type,
                label: f.label,
                placeholder: f.placeholder || '',
                helpText: f.helpText || '',
                required: f.required,
                width: f.width || 'full',
                options: f.options || undefined,
                validation: f.validation || undefined,
                fileSettings: f.fileSettings || undefined,
                conditionalShow: f.conditionalShow || undefined,
            }));

            const maxStep = loadedFields.reduce(
                (m, f) => Math.max(m, getFieldStep(f)),
                0,
            );

            setFormData({
                title: existingForm.title,
                description: existingForm.description || '',
                isActive: existingForm.isActive,
                isPublic: existingForm.isPublic,
                allowMultiple: existingForm.allowMultiple,
                accentColor: existingForm.accentColor || '#4f46e5',
                successMessage: existingForm.successMessage || 'شكراً لك! تم استلام إجاباتك',
                notifyOnSubmit: existingForm.notifyOnSubmit,
                notifyEmails: existingForm.notifyEmails || [],
                fields: loadedFields,
                allowedUserIds: (existingForm.allowedUsers || []).map((u: any) => u.id),
                otpEnabled: existingForm.otpEnabled || false,
                otpDeliveryMethod: existingForm.otpDeliveryMethod || 'email',
                otpLength: existingForm.otpLength || 6,
                otpExpiryMinutes: existingForm.otpExpiryMinutes || 15,
            });
            setStepCount(Math.max(1, maxStep + 1));
        }
    }, [existingForm, isEditing]);

    // Group fields by step
    const fieldsByStep = useMemo(() => {
        const map = new Map<number, FormFieldData[]>();
        for (let i = 0; i < stepCount; i++) map.set(i, []);
        for (const f of formData.fields) {
            const s = getFieldStep(f);
            if (!map.has(s)) map.set(s, []);
            map.get(s)!.push(f);
        }
        return map;
    }, [formData.fields, stepCount]);

    const currentStepFields = fieldsByStep.get(currentStep) || [];

    // ─── Field Operations ───

    const addField = (type: string) => {
        const fieldDef = FIELD_TYPES.find(f => f.type === type);
        const hasOptions = ['dropdown', 'radio', 'checkbox'].includes(type);

        const base: FormFieldData = {
            id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type,
            label: fieldDef?.label || 'حقل جديد',
            placeholder: '',
            required: false,
            width: 'full',
            validation: { step: currentStep },
            ...(hasOptions && { options: ['خيار 1', 'خيار 2'] }),
            ...(type === 'fileUpload' && {
                fileSettings: { maxSize: 10, allowedTypes: ['pdf', 'jpg', 'png'], maxFiles: 5 },
            }),
        };

        setFormData(prev => ({ ...prev, fields: [...prev.fields, base] }));
        setSelectedFieldId(base.id);
    };

    const updateField = (fid: string, updates: Partial<FormFieldData>) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.map(f => (f.id === fid ? { ...f, ...updates } : f)),
        }));
    };

    const deleteField = (fid: string) => {
        setFormData(prev => ({ ...prev, fields: prev.fields.filter(f => f.id !== fid) }));
        if (selectedFieldId === fid) setSelectedFieldId(null);
    };

    const duplicateField = (fid: string) => {
        const field = formData.fields.find(f => f.id === fid);
        if (!field) return;
        const clone: FormFieldData = {
            ...field,
            id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            label: `${field.label} (نسخة)`,
        };
        const idx = formData.fields.findIndex(f => f.id === fid);
        const newFields = [...formData.fields];
        newFields.splice(idx + 1, 0, clone);
        setFormData(prev => ({ ...prev, fields: newFields }));
        setSelectedFieldId(clone.id);
    };

    // ─── Step Operations ───

    const addStep = () => {
        const next = stepCount;
        setStepCount(next + 1);
        setCurrentStep(next);
        setSelectedFieldId(null);
    };

    const deleteStep = (stepIdx: number) => {
        if (stepCount <= 1) {
            toast.error('يجب أن يحتوي النموذج على خطوة واحدة على الأقل');
            return;
        }
        // Remove fields in that step, and shift higher steps down by 1
        setFormData(prev => ({
            ...prev,
            fields: prev.fields
                .filter(f => getFieldStep(f) !== stepIdx)
                .map(f => {
                    const s = getFieldStep(f);
                    return s > stepIdx ? setFieldStep(f, s - 1) : f;
                }),
        }));
        setStepCount(stepCount - 1);
        setCurrentStep(Math.max(0, Math.min(currentStep, stepCount - 2)));
        setSelectedFieldId(null);
    };

    // ─── Drag & Drop (within current step) ───

    const handleDragStart = (index: number) => setDraggedIndex(index);
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };
    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            // reorder within currentStepFields, then rebuild the global fields list
            const inStep = [...currentStepFields];
            const [removed] = inStep.splice(draggedIndex, 1);
            inStep.splice(dragOverIndex, 0, removed);

            setFormData(prev => {
                const others = prev.fields.filter(f => getFieldStep(f) !== currentStep);
                return { ...prev, fields: [...others, ...inStep] };
            });
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // ─── Save ───

    const handleSave = () => {
        if (!formData.title.trim()) {
            toast.error('يرجى إدخال عنوان النموذج');
            return;
        }
        if (formData.fields.length === 0) {
            toast.error('يرجى إضافة حقل واحد على الأقل');
            return;
        }

        const payload = {
            ...formData,
            fields: formData.fields.map(({ id: _id, ...field }) => ({
                ...field,
                // make sure step survives in validation JSON
                validation: { ...(field.validation || {}), step: getFieldStep(field as any) },
            })),
        };

        if (isEditing) {
            updateMutation.mutate(
                { id: id!, data: payload },
                {
                    onSuccess: () => {
                        toast.success('تم حفظ التعديلات');
                        navigate(p('/forms'));
                    },
                    onError: () => toast.error('فشل حفظ النموذج'),
                },
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success('تم إنشاء النموذج');
                    navigate(p('/forms'));
                },
                onError: () => toast.error('فشل إنشاء النموذج'),
            });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const selectedField = formData.fields.find(f => f.id === selectedFieldId);

    // ─── Render ───

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
            {/* ═══ HEADER ═══ */}
            <div className="border-b border-gray-200 bg-white px-6 py-3 flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={() => navigate(p('/forms'))}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="رجوع"
                        >
                            <ArrowRight className="w-5 h-5 text-gray-500" />
                        </button>
                        <input
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="text-xl font-bold border-none outline-none bg-transparent flex-1 min-w-0 placeholder:text-gray-300"
                            placeholder="عنوان النموذج"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1">
                            {[
                                { key: 'build', label: 'بناء', icon: Layers },
                                { key: 'preview', label: 'معاينة', icon: Eye },
                                { key: 'access', label: 'الصلاحيات', icon: Users },
                                { key: 'otp', label: 'OTP', icon: KeyRound },
                                { key: 'settings', label: 'إعدادات', icon: Settings },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as BuilderTab)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === tab.key
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
                        >
                            {isPending ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isEditing ? 'حفظ التعديلات' : 'حفظ ونشر'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ CONTENT ═══ */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'build' && (
                    <BuildTab
                        formData={formData}
                        updateFormData={(u) => setFormData(prev => ({ ...prev, ...u }))}
                        stepCount={stepCount}
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        addStep={addStep}
                        deleteStep={deleteStep}
                        currentStepFields={currentStepFields}
                        fieldsByStep={fieldsByStep}
                        selectedField={selectedField}
                        selectedFieldId={selectedFieldId}
                        setSelectedFieldId={setSelectedFieldId}
                        addField={addField}
                        updateField={updateField}
                        deleteField={deleteField}
                        duplicateField={duplicateField}
                        draggedIndex={draggedIndex}
                        dragOverIndex={dragOverIndex}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    />
                )}

                {activeTab === 'preview' && (
                    <div className="h-full overflow-y-auto">
                        <WizardPreviewPanel
                            formData={formData}
                            stepCount={stepCount}
                            fieldsByStep={fieldsByStep}
                        />
                    </div>
                )}

                {activeTab === 'access' && (
                    <div className="h-full overflow-y-auto p-6">
                        <AccessTab
                            formId={id}
                            allowedUserIds={formData.allowedUserIds}
                            onChange={ids => setFormData(prev => ({ ...prev, allowedUserIds: ids }))}
                        />
                    </div>
                )}

                {activeTab === 'otp' && (
                    <div className="h-full overflow-y-auto p-6">
                        <OtpTab
                            formId={id}
                            formData={formData}
                            onChange={u => setFormData(prev => ({ ...prev, ...u }))}
                        />
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="h-full overflow-y-auto p-6">
                        <FormSettingsPanel
                            formData={formData}
                            onChange={updates => setFormData(prev => ({ ...prev, ...updates }))}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// BUILD TAB (Wizard)
// ══════════════════════════════════════════════════════════

interface BuildTabProps {
    formData: any;
    updateFormData: (u: any) => void;
    stepCount: number;
    currentStep: number;
    setCurrentStep: (s: number) => void;
    addStep: () => void;
    deleteStep: (s: number) => void;
    currentStepFields: FormFieldData[];
    fieldsByStep: Map<number, FormFieldData[]>;
    selectedField: FormFieldData | undefined;
    selectedFieldId: string | null;
    setSelectedFieldId: (id: string | null) => void;
    addField: (type: string) => void;
    updateField: (id: string, updates: Partial<FormFieldData>) => void;
    deleteField: (id: string) => void;
    duplicateField: (id: string) => void;
    draggedIndex: number | null;
    dragOverIndex: number | null;
    onDragStart: (i: number) => void;
    onDragOver: (e: React.DragEvent, i: number) => void;
    onDragEnd: () => void;
}

function BuildTab(props: BuildTabProps) {
    const {
        formData, updateFormData, stepCount, currentStep, setCurrentStep, addStep, deleteStep,
        currentStepFields, fieldsByStep,
        selectedField, selectedFieldId, setSelectedFieldId,
        addField, updateField, deleteField, duplicateField,
        draggedIndex, dragOverIndex, onDragStart, onDragOver, onDragEnd,
    } = props;

    return (
        <div className="h-full flex">
            {/* Right rail: Step list + field types */}
            <div className="w-64 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0">
                {/* Step list */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">خطوات النموذج</p>
                        <button
                            onClick={addStep}
                            className="text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1"
                            title="إضافة خطوة"
                        >
                            <Plus className="w-3.5 h-3.5" /> خطوة
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        {Array.from({ length: stepCount }).map((_, idx) => {
                            const count = fieldsByStep.get(idx)?.length || 0;
                            const active = idx === currentStep;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        setCurrentStep(idx);
                                        setSelectedFieldId(null);
                                    }}
                                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${active
                                        ? 'bg-indigo-50 border border-indigo-200'
                                        : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${active ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${active ? 'text-indigo-700' : 'text-gray-700'}`}>
                                            الخطوة {idx + 1}
                                        </p>
                                        <p className="text-[11px] text-gray-400">{count} حقل</p>
                                    </div>
                                    {stepCount > 1 && (
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                deleteStep(idx);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-500 transition-opacity"
                                            title="حذف الخطوة"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Field types */}
                <div className="p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3 tracking-wider">أضف حقلاً للخطوة {currentStep + 1}</p>
                    {GROUPS.map(group => {
                        const groupFields = FIELD_TYPES.filter(f => f.group === group.key);
                        if (groupFields.length === 0) return null;
                        return (
                            <div key={group.key} className="mb-4">
                                <p className="text-[11px] text-gray-400 mb-1.5 font-medium">{group.label}</p>
                                <div className="space-y-1">
                                    {groupFields.map(ft => (
                                        <button
                                            key={ft.type}
                                            onClick={() => addField(ft.type)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-right"
                                        >
                                            <ft.icon className="w-4 h-4 flex-shrink-0" />
                                            {ft.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Center: Canvas for the current step */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-indigo-50/30">
                <div className="max-w-2xl mx-auto p-8">
                    {/* Step header */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                            <Layers className="w-3.5 h-3.5" />
                            خطوة {currentStep + 1} من {stepCount}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                            {currentStep === 0 ? formData.title : `الخطوة ${currentStep + 1}`}
                        </h2>
                        {currentStep === 0 && (
                            <input
                                value={formData.description}
                                onChange={e => updateFormData({ description: e.target.value })}
                                className="text-sm text-gray-500 w-full outline-none bg-transparent placeholder:text-gray-300"
                                placeholder="وصف النموذج (اختياري)"
                            />
                        )}
                    </div>

                    {/* Fields list */}
                    <div className="space-y-3">
                        {currentStepFields.map((field, index) => (
                            <div
                                key={field.id}
                                draggable
                                onDragStart={() => onDragStart(index)}
                                onDragOver={e => onDragOver(e, index)}
                                onDragEnd={onDragEnd}
                                onClick={() => setSelectedFieldId(field.id)}
                                className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all group ${selectedFieldId === field.id
                                    ? 'border-indigo-400 shadow-md ring-4 ring-indigo-100'
                                    : dragOverIndex === index
                                        ? 'border-indigo-200 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300 shadow-sm'
                                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="pt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {(() => {
                                                const ft = FIELD_TYPES.find(f => f.type === field.type);
                                                const Icon = ft?.icon || Type;
                                                return <Icon className="w-4 h-4 text-gray-400" />;
                                            })()}
                                            <span className="font-medium text-gray-800 text-sm">
                                                {field.label}
                                                {field.required && <span className="text-red-500 mr-1">*</span>}
                                            </span>
                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {FIELD_TYPES.find(f => f.type === field.type)?.label}
                                            </span>
                                        </div>
                                        <FieldPreview field={field} />
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={e => { e.stopPropagation(); duplicateField(field.id); }}
                                            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
                                            title="تكرار"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={e => { e.stopPropagation(); deleteField(field.id); }}
                                            className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Empty state */}
                        {currentStepFields.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Plus className="w-8 h-8 text-indigo-400" />
                                </div>
                                <p className="text-gray-500 text-sm font-medium mb-1">لا توجد حقول في هذه الخطوة</p>
                                <p className="text-gray-400 text-xs">اختر نوع حقل من القائمة لإضافته</p>
                            </div>
                        )}
                    </div>

                    {/* Step navigation */}
                    {stepCount > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                disabled={currentStep === 0}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                                السابق
                            </button>
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: stepCount }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-8 bg-indigo-600' : 'w-1.5 bg-gray-300'}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentStep(Math.min(stepCount - 1, currentStep + 1))}
                                disabled={currentStep === stepCount - 1}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                التالي
                                <ChevronRight className="w-4 h-4 rotate-180" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Left rail: Field inspector */}
            {selectedField && (
                <div className="w-72 border-r border-gray-200 bg-white p-4 overflow-y-auto flex-shrink-0">
                    <FieldEditorPanel
                        field={selectedField}
                        onChange={updates => updateField(selectedField.id, updates)}
                    />
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// ACCESS TAB (per-form allowed users)
// ══════════════════════════════════════════════════════════

function AccessTab({ formId, allowedUserIds, onChange }: {
    formId?: string;
    allowedUserIds: string[];
    onChange: (ids: string[]) => void;
}) {
    const { data: usersRes, isLoading } = useUsers();
    const manageAccess = useManageFormAccess();
    const [searchQuery, setSearchQuery] = useState('');

    const users: any[] = Array.isArray(usersRes)
        ? usersRes
        : ((usersRes as any)?.data || []);
    const allowedSet = new Set(allowedUserIds);
    const allowed = users.filter(u => allowedSet.has(u.id));
    const available = users.filter(u => !allowedSet.has(u.id) && (
        !searchQuery ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ));

    const addUser = (userId: string) => {
        const newList = [...allowedUserIds, userId];
        onChange(newList);
        if (formId) {
            manageAccess.mutate(
                { id: formId, data: { add: [userId] } },
                { onSuccess: () => toast.success('تم منح الصلاحية') },
            );
        }
    };

    const removeUser = (userId: string) => {
        const newList = allowedUserIds.filter(id => id !== userId);
        onChange(newList);
        if (formId) {
            manageAccess.mutate(
                { id: formId, data: { remove: [userId] } },
                { onSuccess: () => toast.success('تم إزالة الصلاحية') },
            );
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">صلاحيات النموذج</h2>
                <p className="text-sm text-gray-500">
                    حدد المستخدمين الذين يمكنهم رؤية هذا النموذج وردوده. المنشئ يرى كل شيء دائماً.
                </p>
            </div>

            {/* Currently allowed */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-semibold text-gray-700 text-sm">المستخدمون المصرَّح لهم ({allowed.length})</h3>
                </div>
                {allowed.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400">
                        لم يتم منح أي مستخدم صلاحية بعد — فقط المنشئ يرى هذا النموذج
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {allowed.map(u => (
                            <div key={u.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                    {(u.name || '?').charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                </div>
                                <span className="text-[10px] uppercase font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                    {u.role}
                                </span>
                                <button
                                    onClick={() => removeUser(u.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded"
                                    title="إزالة"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add new */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <UserPlus className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-700 text-sm">إضافة مستخدم</h3>
                </div>
                <div className="p-5">
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن مستخدم بالاسم أو البريد..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                    {isLoading ? (
                        <p className="text-sm text-gray-400 text-center py-4">جاري التحميل...</p>
                    ) : available.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">لا يوجد مستخدمون</p>
                    ) : (
                        <div className="max-h-72 overflow-y-auto space-y-1">
                            {available.slice(0, 20).map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => addUser(u.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 rounded-lg transition-colors text-right"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                                        {(u.name || '?').charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                    </div>
                                    <Plus className="w-4 h-4 text-indigo-500" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// OTP TAB
// ══════════════════════════════════════════════════════════

function OtpTab({ formId, formData, onChange }: {
    formId?: string;
    formData: any;
    onChange: (u: any) => void;
}) {
    const generateOtp = useGenerateFormOtp();
    const [recipientEmail, setRecipientEmail] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [lastOtp, setLastOtp] = useState<any>(null);

    const handleSendOtp = () => {
        if (!formId) {
            toast.error('احفظ النموذج أولاً');
            return;
        }
        if (formData.otpDeliveryMethod === 'email' && !recipientEmail.trim()) {
            toast.error('يرجى إدخال البريد الإلكتروني');
            return;
        }
        if ((formData.otpDeliveryMethod === 'sms' || formData.otpDeliveryMethod === 'whatsapp') && !recipientPhone.trim()) {
            toast.error('يرجى إدخال رقم الجوال');
            return;
        }

        generateOtp.mutate(
            {
                id: formId,
                data: {
                    recipientEmail: recipientEmail.trim() || undefined,
                    recipientPhone: recipientPhone.trim() || undefined,
                    deliveryMethod: formData.otpDeliveryMethod,
                },
            },
            {
                onSuccess: (res: any) => {
                    setLastOtp(res);
                    toast.success('تم إرسال كود التحقق');
                },
                onError: () => toast.error('فشل إرسال الكود'),
            },
        );
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">كلمة مرور لمرة واحدة (OTP)</h2>
                <p className="text-sm text-gray-500">
                    فعّل هذه الميزة لطلب كود تحقق من العميل قبل تعبئة النموذج. مناسب للنماذج الحساسة.
                </p>
            </div>

            {/* OTP toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm font-medium text-gray-800">تفعيل OTP</p>
                        <p className="text-xs text-gray-400">لن يتمكن أحد من تعبئة النموذج دون كود صحيح</p>
                    </div>
                    <button
                        onClick={() => onChange({ otpEnabled: !formData.otpEnabled })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${formData.otpEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <span
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.otpEnabled ? 'right-0.5' : 'right-5'}`}
                        />
                    </button>
                </div>

                {formData.otpEnabled && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        {/* Delivery method */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">طريقة الإرسال</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { key: 'email', label: 'البريد الإلكتروني', icon: Mail },
                                    { key: 'whatsapp', label: 'واتساب', icon: Phone },
                                    { key: 'sms', label: 'رسالة نصية', icon: Send },
                                ].map(m => (
                                    <button
                                        key={m.key}
                                        onClick={() => onChange({ otpDeliveryMethod: m.key })}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium border transition-colors ${formData.otpDeliveryMethod === m.key
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        <m.icon className="w-4 h-4" />
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Code length + expiry */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">طول الكود</label>
                                <select
                                    value={formData.otpLength}
                                    onChange={e => onChange({ otpLength: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value={4}>4 أرقام</option>
                                    <option value={6}>6 أرقام</option>
                                    <option value={8}>8 أرقام</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">مدة الصلاحية (بالدقائق)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={1440}
                                    value={formData.otpExpiryMinutes}
                                    onChange={e => onChange({ otpExpiryMinutes: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Send OTP manually */}
            {formData.otpEnabled && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Send className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-semibold text-gray-700 text-sm">إرسال كود لعميل</h3>
                    </div>
                    {formData.otpDeliveryMethod === 'email' ? (
                        <input
                            type="email"
                            value={recipientEmail}
                            onChange={e => setRecipientEmail(e.target.value)}
                            placeholder="client@example.com"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                        />
                    ) : (
                        <input
                            type="tel"
                            value={recipientPhone}
                            onChange={e => setRecipientPhone(e.target.value)}
                            placeholder="+9665XXXXXXXX"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                        />
                    )}
                    <button
                        onClick={handleSendOtp}
                        disabled={!formId || generateOtp.isPending}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                    >
                        {generateOtp.isPending ? 'جارٍ الإرسال...' : 'إرسال كود تحقق'}
                    </button>
                    {!formId && (
                        <p className="text-xs text-orange-500 mt-2 text-center">احفظ النموذج أولاً لتفعيل الإرسال</p>
                    )}

                    {lastOtp && (
                        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <p className="text-xs text-indigo-700 mb-1">تم الإرسال بنجاح</p>
                            <p className="text-xs text-gray-600">الكود الذي تم إنشاؤه: <span className="font-mono font-bold">{lastOtp.code}</span></p>
                            <p className="text-[11px] text-gray-400 mt-1">صالح حتى {new Date(lastOtp.expiresAt).toLocaleString('ar-SA')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// FIELD PREVIEW (inline)
// ══════════════════════════════════════════════════════════

function FieldPreview({ field }: { field: FormFieldData }) {
    switch (field.type) {
        case 'shortText':
        case 'email':
        case 'phone':
        case 'number':
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400">
                    {field.placeholder || 'أدخل النص هنا...'}
                </div>
            );
        case 'longText':
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 h-16">
                    {field.placeholder || 'أدخل النص هنا...'}
                </div>
            );
        case 'date':
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> اختر التاريخ
                </div>
            );
        case 'dropdown':
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 flex items-center justify-between">
                    <span>اختر من القائمة</span>
                    <ChevronDown className="w-4 h-4" />
                </div>
            );
        case 'radio':
            return (
                <div className="space-y-1.5">
                    {(field.options || ['خيار 1']).map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            {opt}
                        </label>
                    ))}
                </div>
            );
        case 'checkbox':
            return (
                <div className="space-y-1.5">
                    {(field.options || ['خيار 1']).map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-4 h-4 rounded border-2 border-gray-300" />
                            {opt}
                        </label>
                    ))}
                </div>
            );
        case 'fileUpload':
            return (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center text-sm text-gray-400">
                    <Upload className="w-5 h-5 mx-auto mb-1" />
                    اضغط لرفع ملف
                </div>
            );
        case 'rating':
            return (
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className="w-5 h-5 text-gray-300" />
                    ))}
                </div>
            );
        case 'sectionHeader':
            return <div className="text-base font-bold text-gray-700 border-b pb-1">{field.label}</div>;
        case 'paragraph':
            return <p className="text-sm text-gray-500">{field.placeholder || 'نص الفقرة...'}</p>;
        default:
            return <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400">حقل</div>;
    }
}

// ══════════════════════════════════════════════════════════
// FIELD EDITOR PANEL (right inspector)
// ══════════════════════════════════════════════════════════

function FieldEditorPanel({ field, onChange }: { field: FormFieldData; onChange: (u: Partial<FormFieldData>) => void }) {
    const hasOptions = ['dropdown', 'radio', 'checkbox'].includes(field.type);
    const isDecorative = ['sectionHeader', 'paragraph'].includes(field.type);

    return (
        <div className="space-y-5">
            <h3 className="font-semibold text-gray-800 text-sm">خصائص الحقل</h3>

            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">العنوان</label>
                <input
                    value={field.label}
                    onChange={e => onChange({ label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {!isDecorative && (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">نص توضيحي</label>
                    <input
                        value={field.placeholder || ''}
                        onChange={e => onChange({ placeholder: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="مثال: أدخل اسمك الكامل"
                    />
                </div>
            )}

            {!isDecorative && (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">نص مساعدة</label>
                    <input
                        value={field.helpText || ''}
                        onChange={e => onChange({ helpText: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="معلومة إضافية للمجيب"
                    />
                </div>
            )}

            {!isDecorative && (
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">مطلوب</label>
                    <button
                        onClick={() => onChange({ required: !field.required })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${field.required ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <span
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${field.required ? 'right-0.5' : 'right-5'}`}
                        />
                    </button>
                </div>
            )}

            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">العرض</label>
                <div className="flex gap-2">
                    {[
                        { value: 'full', label: 'كامل' },
                        { value: 'half', label: 'نصف' },
                    ].map(w => (
                        <button
                            key={w.value}
                            onClick={() => onChange({ width: w.value })}
                            className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${field.width === w.value
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            {w.label}
                        </button>
                    ))}
                </div>
            </div>

            {hasOptions && (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">الخيارات</label>
                    <div className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input
                                    value={opt}
                                    onChange={e => {
                                        const newOpts = [...(field.options || [])];
                                        newOpts[i] = e.target.value;
                                        onChange({ options: newOpts });
                                    }}
                                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={() => {
                                        const newOpts = (field.options || []).filter((_, j) => j !== i);
                                        onChange({ options: newOpts });
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => onChange({ options: [...(field.options || []), `خيار ${(field.options?.length || 0) + 1}`] })}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            + إضافة خيار
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// WIZARD PREVIEW PANEL (multi-step)
// ══════════════════════════════════════════════════════════

function WizardPreviewPanel({ formData, stepCount, fieldsByStep }: {
    formData: any;
    stepCount: number;
    fieldsByStep: Map<number, FormFieldData[]>;
}) {
    const [previewStep, setPreviewStep] = useState(0);
    const currentFields = fieldsByStep.get(previewStep) || [];

    return (
        <div className="min-h-full bg-gray-100 py-8">
            <div className="max-w-2xl mx-auto">
                {/* Progress */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-t-4" style={{ borderColor: formData.accentColor }}>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{formData.title || 'نموذج بدون عنوان'}</h1>
                    {formData.description && <p className="text-gray-500 text-sm mb-4">{formData.description}</p>}

                    {stepCount > 1 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                <span>الخطوة {previewStep + 1} من {stepCount}</span>
                                <span>{Math.round(((previewStep + 1) / stepCount) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${((previewStep + 1) / stepCount) * 100}%`,
                                        backgroundColor: formData.accentColor,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Fields */}
                {currentFields.map((field: FormFieldData) => (
                    <div key={field.id} className="bg-white rounded-xl shadow-sm p-6 mb-4">
                        {field.type !== 'sectionHeader' && field.type !== 'paragraph' && (
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {field.label}
                                {field.required && <span className="text-red-500 mr-1">*</span>}
                            </label>
                        )}
                        {field.helpText && (
                            <p className="text-xs text-gray-400 mb-2">{field.helpText}</p>
                        )}
                        <PreviewFieldInput field={field} />
                    </div>
                ))}

                {currentFields.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400 text-sm mb-4">
                        لا توجد حقول في هذه الخطوة
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3 mt-6">
                    {previewStep > 0 ? (
                        <button
                            onClick={() => setPreviewStep(previewStep - 1)}
                            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50"
                        >
                            <ArrowRight className="w-4 h-4" />
                            السابق
                        </button>
                    ) : <div />}

                    {previewStep < stepCount - 1 ? (
                        <button
                            onClick={() => setPreviewStep(previewStep + 1)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white"
                            style={{ backgroundColor: formData.accentColor }}
                        >
                            التالي
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            className="px-6 py-2.5 rounded-lg font-medium text-sm text-white"
                            style={{ backgroundColor: formData.accentColor }}
                        >
                            إرسال
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function PreviewFieldInput({ field }: { field: FormFieldData }) {
    switch (field.type) {
        case 'shortText':
        case 'email':
        case 'phone':
        case 'number':
            return (
                <input
                    type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                    placeholder={field.placeholder || ''}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled
                />
            );
        case 'longText':
            return (
                <textarea
                    placeholder={field.placeholder || ''}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none resize-none"
                    disabled
                />
            );
        case 'date':
            return <input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" disabled />;
        case 'dropdown':
            return (
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400" disabled>
                    <option>اختر...</option>
                    {(field.options || []).map((o, i) => <option key={i}>{o}</option>)}
                </select>
            );
        case 'radio':
            return (
                <div className="space-y-2">
                    {(field.options || []).map((o, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm">
                            <input type="radio" name={field.id} disabled /> {o}
                        </label>
                    ))}
                </div>
            );
        case 'checkbox':
            return (
                <div className="space-y-2">
                    {(field.options || []).map((o, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" disabled /> {o}
                        </label>
                    ))}
                </div>
            );
        case 'fileUpload':
            return (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">اسحب الملف هنا أو اضغط للرفع</p>
                </div>
            );
        case 'rating':
            return (
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => <Star key={n} className="w-7 h-7 text-gray-300 cursor-pointer hover:text-yellow-400" />)}
                </div>
            );
        case 'sectionHeader':
            return <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{field.label}</h2>;
        case 'paragraph':
            return <p className="text-sm text-gray-500">{field.placeholder || field.label}</p>;
        default:
            return <input className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" disabled />;
    }
}

// ══════════════════════════════════════════════════════════
// FORM SETTINGS PANEL
// ══════════════════════════════════════════════════════════

function FormSettingsPanel({ formData, onChange }: { formData: any; onChange: (u: any) => void }) {
    const [newEmail, setNewEmail] = useState('');

    const addNotifyEmail = () => {
        if (!newEmail.trim() || !newEmail.includes('@')) return;
        onChange({ notifyEmails: [...(formData.notifyEmails || []), newEmail.trim()] });
        setNewEmail('');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-lg font-bold text-gray-800">إعدادات النموذج</h2>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <h3 className="font-semibold text-gray-700 text-sm">عام</h3>
                <SettingToggle
                    label="النموذج مفعّل"
                    description="يمكن للعملاء الوصول للنموذج وتعبئته"
                    value={formData.isActive}
                    onChange={v => onChange({ isActive: v })}
                />
                <SettingToggle
                    label="نموذج عام"
                    description="لا يحتاج تسجيل دخول للوصول إليه"
                    value={formData.isPublic}
                    onChange={v => onChange({ isPublic: v })}
                />
                <SettingToggle
                    label="السماح بتعبئة متعددة"
                    description="نفس الشخص يمكنه التعبئة أكثر من مرة"
                    value={formData.allowMultiple}
                    onChange={v => onChange({ allowMultiple: v })}
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <h3 className="font-semibold text-gray-700 text-sm">المظهر</h3>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">لون النموذج</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={formData.accentColor}
                            onChange={e => onChange({ accentColor: e.target.value })}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0"
                        />
                        <span className="text-sm text-gray-500 font-mono">{formData.accentColor}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <h3 className="font-semibold text-gray-700 text-sm">بعد الإرسال</h3>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">رسالة النجاح</label>
                    <textarea
                        value={formData.successMessage}
                        onChange={e => onChange({ successMessage: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <h3 className="font-semibold text-gray-700 text-sm">الإشعارات</h3>
                <SettingToggle
                    label="إشعار عند التعبئة"
                    description="إرسال إشعار عند تعبئة النموذج"
                    value={formData.notifyOnSubmit}
                    onChange={v => onChange({ notifyOnSubmit: v })}
                />
                {formData.notifyOnSubmit && (
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">إيميلات الإشعار</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addNotifyEmail()}
                                placeholder="email@example.com"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={addNotifyEmail}
                                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                            >
                                إضافة
                            </button>
                        </div>
                        {(formData.notifyEmails || []).map((email: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <span>{email}</span>
                                <button
                                    onClick={() => onChange({ notifyEmails: formData.notifyEmails.filter((_: any, j: number) => j !== i) })}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function SettingToggle({ label, description, value, onChange }: {
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{description}</p>
            </div>
            <button
                onClick={() => onChange(!value)}
                className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
                <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${value ? 'right-0.5' : 'right-5'}`}
                />
            </button>
        </div>
    );
}

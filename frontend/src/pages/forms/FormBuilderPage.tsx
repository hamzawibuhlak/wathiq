import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import {
    Plus, Eye, Settings, ArrowRight, Trash2, GripVertical,
    Type, AlignLeft, Mail, Phone, Hash, Calendar, ChevronDown,
    Circle, CheckSquare, Upload, Star, FileText, Heading, Save,
} from 'lucide-react';
import { useForm, useCreateForm, useUpdateForm } from '@/hooks/useForms';
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
    validation?: any;
    fileSettings?: any;
    conditionalShow?: any;
}

// ══════════════════════════════════════════════════════════
// MAIN FORM BUILDER PAGE
// ══════════════════════════════════════════════════════════

export default function FormBuilderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { p } = useSlugPath();
    const isEditing = !!id;

    const { data: existingForm } = useForm(id || '');
    const createMutation = useCreateForm();
    const updateMutation = useUpdateForm();

    const [activeTab, setActiveTab] = useState<'build' | 'preview' | 'settings'>('build');
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        title: 'نموذج جديد',
        description: '',
        isActive: true,
        isPublic: true,
        allowMultiple: false,
        accentColor: '#3b82f6',
        successMessage: 'شكراً لك! تم إرسال النموذج بنجاح',
        notifyOnSubmit: true,
        notifyEmails: [] as string[],
        fields: [] as FormFieldData[],
    });

    // Load existing form data
    useEffect(() => {
        if (existingForm && isEditing) {
            setFormData({
                title: existingForm.title,
                description: existingForm.description || '',
                isActive: existingForm.isActive,
                isPublic: existingForm.isPublic,
                allowMultiple: existingForm.allowMultiple,
                accentColor: existingForm.accentColor || '#3b82f6',
                successMessage: existingForm.successMessage || 'شكراً لك! تم إرسال النموذج بنجاح',
                notifyOnSubmit: existingForm.notifyOnSubmit,
                notifyEmails: existingForm.notifyEmails || [],
                fields: (existingForm.fields || []).map((f: any) => ({
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
                })),
            });
        }
    }, [existingForm, isEditing]);

    // ─── Field Operations ───

    const addField = (type: string) => {
        const fieldDef = FIELD_TYPES.find(f => f.type === type);
        const hasOptions = ['dropdown', 'radio', 'checkbox'].includes(type);

        const newField: FormFieldData = {
            id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type,
            label: fieldDef?.label || 'حقل جديد',
            placeholder: '',
            required: false,
            width: 'full',
            ...(hasOptions && { options: ['خيار 1', 'خيار 2'] }),
            ...(type === 'fileUpload' && { fileSettings: { maxSize: 10, allowedTypes: ['pdf', 'jpg', 'png'], maxFiles: 5 } }),
        };

        setFormData(prev => ({
            ...prev,
            fields: [...prev.fields, newField],
        }));
        setSelectedFieldId(newField.id);
    };

    const updateField = (id: string, updates: Partial<FormFieldData>) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.map(f => (f.id === id ? { ...f, ...updates } : f)),
        }));
    };

    const deleteField = (id: string) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.filter(f => f.id !== id),
        }));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const duplicateField = (id: string) => {
        const field = formData.fields.find(f => f.id === id);
        if (!field) return;
        const newField = {
            ...field,
            id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            label: `${field.label} (نسخة)`,
        };
        const idx = formData.fields.findIndex(f => f.id === id);
        const newFields = [...formData.fields];
        newFields.splice(idx + 1, 0, newField);
        setFormData(prev => ({ ...prev, fields: newFields }));
        setSelectedFieldId(newField.id);
    };

    // ─── Drag & Drop ───

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            const newFields = [...formData.fields];
            const [removed] = newFields.splice(draggedIndex, 1);
            newFields.splice(dragOverIndex, 0, removed);
            setFormData(prev => ({ ...prev, fields: newFields }));
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
            fields: formData.fields.map(({ id, ...field }) => field),
        };

        if (isEditing) {
            updateMutation.mutate(
                { id: id!, data: payload },
                {
                    onSuccess: () => {
                        toast.success('تم تحديث النموذج');
                        navigate(p('/forms'));
                    },
                    onError: () => toast.error('فشل تحديث النموذج'),
                },
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    toast.success('تم إنشاء النموذج بنجاح');
                    navigate(p('/forms'));
                },
                onError: () => toast.error('فشل إنشاء النموذج'),
            });
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const selectedField = formData.fields.find(f => f.id === selectedFieldId);

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-6 py-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={() => navigate(p('/forms'))}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowRight className="w-5 h-5 text-gray-500" />
                        </button>
                        <input
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="text-xl font-bold border-none outline-none bg-transparent flex-1 min-w-0"
                            placeholder="عنوان النموذج"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Tabs */}
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            {[
                                { key: 'build', label: 'بناء', icon: Plus },
                                { key: 'preview', label: 'معاينة', icon: Eye },
                                { key: 'settings', label: 'إعدادات', icon: Settings },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
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

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {/* ═══ BUILD TAB ═══ */}
                {activeTab === 'build' && (
                    <div className="h-full flex">
                        {/* Right sidebar: Field Types */}
                        <div className="w-56 border-l border-gray-200 bg-white p-3 overflow-y-auto flex-shrink-0">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wider">أنواع الحقول</p>
                            {GROUPS.map(group => {
                                const groupFields = FIELD_TYPES.filter(f => f.group === group.key);
                                if (groupFields.length === 0) return null;
                                return (
                                    <div key={group.key} className="mb-4">
                                        <p className="text-xs text-gray-400 mb-1.5 font-medium">{group.label}</p>
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

                        {/* Center: Canvas */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-2xl mx-auto space-y-3">
                                {/* Description */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                                    <input
                                        value={formData.title}
                                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="text-xl font-bold w-full outline-none mb-2"
                                        placeholder="عنوان النموذج"
                                    />
                                    <input
                                        value={formData.description}
                                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="text-sm text-gray-500 w-full outline-none"
                                        placeholder="وصف النموذج (اختياري)"
                                    />
                                </div>

                                {/* Fields */}
                                {formData.fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={e => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => setSelectedFieldId(field.id)}
                                        className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all group ${selectedFieldId === field.id
                                            ? 'border-indigo-400 shadow-md'
                                            : dragOverIndex === index
                                                ? 'border-indigo-200 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            } ${draggedIndex === index ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-start gap-2">
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

                                                {/* Field Preview */}
                                                <FieldPreview field={field} />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={e => { e.stopPropagation(); duplicateField(field.id); }}
                                                    className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"
                                                    title="تكرار"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
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

                                {/* Empty State */}
                                {formData.fields.length === 0 && (
                                    <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                        <Plus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-400 text-sm">اضغط على نوع الحقل من القائمة لإضافته</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Left sidebar: Field Editor */}
                        {selectedField && (
                            <div className="w-72 border-r border-gray-200 bg-white p-4 overflow-y-auto flex-shrink-0">
                                <FieldEditorPanel
                                    field={selectedField}
                                    onChange={updates => updateField(selectedField.id, updates)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ PREVIEW TAB ═══ */}
                {activeTab === 'preview' && (
                    <div className="h-full overflow-y-auto">
                        <FormPreviewPanel formData={formData} />
                    </div>
                )}

                {/* ═══ SETTINGS TAB ═══ */}
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
// FIELD PREVIEW (inline in canvas)
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
// FIELD EDITOR PANEL (right sidebar)
// ══════════════════════════════════════════════════════════

function FieldEditorPanel({ field, onChange }: { field: FormFieldData; onChange: (u: Partial<FormFieldData>) => void }) {
    const hasOptions = ['dropdown', 'radio', 'checkbox'].includes(field.type);
    const isDecorative = ['sectionHeader', 'paragraph'].includes(field.type);

    return (
        <div className="space-y-5">
            <h3 className="font-semibold text-gray-800 text-sm">خصائص الحقل</h3>

            {/* Label */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">العنوان</label>
                <input
                    value={field.label}
                    onChange={e => onChange({ label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Placeholder */}
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

            {/* Help Text */}
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

            {/* Required Toggle */}
            {!isDecorative && (
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">مطلوب</label>
                    <button
                        onClick={() => onChange({ required: !field.required })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${field.required ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${field.required ? 'right-0.5' : 'right-5'
                                }`}
                        />
                    </button>
                </div>
            )}

            {/* Width */}
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

            {/* Options (for dropdown, radio, checkbox) */}
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
// FORM PREVIEW PANEL
// ══════════════════════════════════════════════════════════

function FormPreviewPanel({ formData }: { formData: any }) {
    return (
        <div className="min-h-full bg-gray-100 py-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-8 mb-6 border-t-4" style={{ borderColor: formData.accentColor }}>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{formData.title || 'نموذج بدون عنوان'}</h1>
                    {formData.description && <p className="text-gray-500">{formData.description}</p>}
                </div>

                {/* Fields */}
                {formData.fields.map((field: FormFieldData) => (
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

                {formData.fields.length > 0 && (
                    <button
                        className="w-full py-3 rounded-xl font-medium text-white text-lg"
                        style={{ backgroundColor: formData.accentColor }}
                    >
                        إرسال
                    </button>
                )}
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
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-lg font-bold text-gray-800">إعدادات النموذج</h2>

            {/* General */}
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

            {/* Appearance */}
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

            {/* After Submit */}
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

            {/* Notifications */}
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

// ══════════════════════════════════════════════════════════
// SETTING TOGGLE COMPONENT
// ══════════════════════════════════════════════════════════

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
                className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
            >
                <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${value ? 'right-0.5' : 'right-5'
                        }`}
                />
            </button>
        </div>
    );
}

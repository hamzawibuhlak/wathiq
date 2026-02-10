import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    Scale, ScrollText, FileSignature, FileText, Gavel,
    AlertCircle, Sparkles, CheckCircle2, Send, ArrowRight,
    FileCheck, Layout, Zap
} from 'lucide-react';
import { legalDocumentsApi } from '@/api/legalDocuments';
import toast from 'react-hot-toast';

const DOC_TYPES = [
    { key: 'DEFENSE_MEMO', label: 'مذكرة دفاع', desc: 'مذكرة دفاع أمام المحاكم', icon: Scale, color: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
    { key: 'REPLY', label: 'رد على دعوى', desc: 'رد رسمي على صحيفة دعوى', icon: ScrollText, color: '#8b5cf6', gradient: 'from-violet-500 to-violet-600' },
    { key: 'CONTRACT', label: 'عقد', desc: 'عقد قانوني بين أطراف', icon: FileSignature, color: '#10b981', gradient: 'from-emerald-500 to-emerald-600' },
    { key: 'POWER_OF_ATTORNEY', label: 'توكيل رسمي', desc: 'توكيل قانوني رسمي', icon: FileCheck, color: '#f59e0b', gradient: 'from-amber-500 to-amber-600' },
    { key: 'APPEAL', label: 'لائحة اعتراضية', desc: 'اعتراض على حكم قضائي', icon: Gavel, color: '#ef4444', gradient: 'from-red-500 to-red-600' },
    { key: 'COMPLAINT', label: 'شكوى', desc: 'تقديم شكوى رسمية', icon: AlertCircle, color: '#f97316', gradient: 'from-orange-500 to-orange-600' },
    { key: 'LEGAL_OPINION', label: 'رأي قانوني', desc: 'استشارة ورأي قانوني', icon: Sparkles, color: '#6366f1', gradient: 'from-indigo-500 to-indigo-600' },
    { key: 'SETTLEMENT', label: 'اتفاقية تسوية', desc: 'تسوية ودية بين أطراف', icon: CheckCircle2, color: '#14b8a6', gradient: 'from-teal-500 to-teal-600' },
    { key: 'LETTER', label: 'خطاب رسمي', desc: 'خطاب رسمي قانوني', icon: Send, color: '#64748b', gradient: 'from-slate-500 to-slate-600' },
    { key: 'OTHER', label: 'أخرى', desc: 'وثيقة قانونية عامة', icon: FileText, color: '#94a3b8', gradient: 'from-gray-400 to-gray-500' },
];

export default function NewDocumentPage() {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState('');
    const [title, setTitle] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [step, setStep] = useState<'type' | 'details'>('type');

    const { data: templates } = useQuery({
        queryKey: ['legal-doc-templates', selectedType],
        queryFn: () => legalDocumentsApi.getTemplates(selectedType),
        enabled: !!selectedType,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => legalDocumentsApi.create(data),
        onSuccess: (doc) => {
            toast.success('تم إنشاء الوثيقة');
            navigate(`/legal-documents/${doc.id}/edit`);
        },
        onError: () => toast.error('فشل إنشاء الوثيقة'),
    });

    const handleSelectType = (type: string) => {
        setSelectedType(type);
        const typeInfo = DOC_TYPES.find(t => t.key === type);
        setTitle(typeInfo?.label || 'وثيقة جديدة');
        setStep('details');
    };

    const handleCreate = () => {
        if (!title.trim()) {
            toast.error('أدخل عنوان الوثيقة');
            return;
        }
        createMutation.mutate({
            title: title.trim(),
            type: selectedType,
            templateId: selectedTemplate?.id,
        });
    };

    return (
        <div className="p-6 max-w-5xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => step === 'details' ? setStep('type') : navigate('/legal-documents')}
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">وثيقة جديدة</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {step === 'type' ? 'اختر نوع الوثيقة القانونية' : 'حدد العنوان والقالب'}
                    </p>
                </div>
            </div>

            {step === 'type' ? (
                /* Step 1: Choose Type */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {DOC_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.key}
                                onClick={() => handleSelectType(type.key)}
                                className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all group text-center"
                            >
                                <div
                                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                                >
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 text-sm">{type.label}</div>
                                    <div className="text-xs text-gray-400 mt-1">{type.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                /* Step 2: Title + Template */
                <div className="space-y-6">
                    {/* Title */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">عنوان الوثيقة</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            placeholder="مثال: مذكرة دفاع في القضية رقم..."
                            autoFocus
                        />
                    </div>

                    {/* Templates */}
                    {templates && templates.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <Layout className="w-4 h-4 text-blue-500" />
                                القوالب المتاحة
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* No template option */}
                                <button
                                    onClick={() => setSelectedTemplate(null)}
                                    className={`p-4 rounded-xl border-2 text-right transition-all ${!selectedTemplate
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 text-sm">بدون قالب</div>
                                            <div className="text-xs text-gray-400">ابدأ من الصفر</div>
                                        </div>
                                    </div>
                                </button>

                                {templates.map((tmpl: any) => (
                                    <button
                                        key={tmpl.id}
                                        onClick={() => setSelectedTemplate(tmpl)}
                                        className={`p-4 rounded-xl border-2 text-right transition-all ${selectedTemplate?.id === tmpl.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                                <Layout className="w-5 h-5 text-violet-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 text-sm">{tmpl.nameAr}</div>
                                                <div className="text-xs text-gray-400 flex items-center gap-2">
                                                    {tmpl.isSystem && <span className="text-blue-500">قالب النظام</span>}
                                                    <span>استُخدم {tmpl.usageCount} مرة</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create Button */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCreate}
                            disabled={createMutation.isPending || !title.trim()}
                            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            {createMutation.isPending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Zap className="w-5 h-5" />
                            )}
                            إنشاء الوثيقة
                        </button>
                        <button
                            onClick={() => setStep('type')}
                            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            تغيير النوع
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

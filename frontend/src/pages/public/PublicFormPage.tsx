import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Star, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { usePublicForm, useSubmitPublicForm } from '@/hooks/useForms';

export default function PublicFormPage() {
    const { slug } = useParams<{ slug: string }>();
    const { data: form, isLoading, error } = usePublicForm(slug || '');
    const submitMutation = useSubmitPublicForm();

    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitterInfo, setSubmitterInfo] = useState({ submitterName: '', submitterEmail: '', submitterPhone: '' });
    const [submitted, setSubmitted] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateAnswer = (fieldId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [fieldId]: value }));
        if (errors[fieldId]) setErrors(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required
        const newErrors: Record<string, string> = {};
        for (const field of form?.fields || []) {
            if (field.required) {
                const val = answers[field.id];
                if (val === undefined || val === null || val === '') {
                    newErrors[field.id] = `الحقل "${field.label}" مطلوب`;
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        submitMutation.mutate(
            {
                slug: slug!,
                data: {
                    ...submitterInfo,
                    answers,
                },
            },
            {
                onSuccess: (res) => {
                    setSubmitted(true);
                    setSuccessMessage(res.message || 'شكراً لك!');
                },
                onError: (err: any) => {
                    const msg = err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى';
                    setErrors({ _form: msg });
                },
            },
        );
    };

    // ─── Loading ───
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    // ─── Error ───
    if (error || !form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-800 mb-2">النموذج غير متاح</h1>
                    <p className="text-gray-500">تأكد من الرابط أو تواصل مع المسؤول</p>
                </div>
            </div>
        );
    }

    // ─── Success ───
    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white rounded-2xl shadow-lg p-10 max-w-md mx-4">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: form.accentColor + '20' }}
                    >
                        <CheckCircle className="w-8 h-8" style={{ color: form.accentColor }} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">تم الإرسال بنجاح!</h2>
                    <p className="text-gray-500">{successMessage}</p>
                </div>
            </div>
        );
    }

    const accentColor = form.accentColor || '#3b82f6';

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Tenant Logo */}
                {form.tenant?.logo && (
                    <div className="text-center mb-4">
                        <img src={form.tenant.logo} alt={form.tenant.name} className="h-12 mx-auto" />
                    </div>
                )}

                {/* Form Header */}
                <div
                    className="bg-white rounded-xl shadow-sm p-8 mb-6 border-t-4"
                    style={{ borderColor: accentColor }}
                >
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
                    {form.description && <p className="text-gray-500 text-sm">{form.description}</p>}
                    <p className="text-xs text-gray-400 mt-3">
                        <span className="text-red-500">*</span> يشير إلى حقل مطلوب
                    </p>
                </div>

                {/* Form Error */}
                {errors._form && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {errors._form}
                    </div>
                )}

                {/* Submitter Info */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-4 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700">بياناتك</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                            value={submitterInfo.submitterName}
                            onChange={e => setSubmitterInfo(prev => ({ ...prev, submitterName: e.target.value }))}
                            placeholder="الاسم *"
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                            value={submitterInfo.submitterEmail}
                            onChange={e => setSubmitterInfo(prev => ({ ...prev, submitterEmail: e.target.value }))}
                            placeholder="البريد الإلكتروني"
                            type="email"
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                            value={submitterInfo.submitterPhone}
                            onChange={e => setSubmitterInfo(prev => ({ ...prev, submitterPhone: e.target.value }))}
                            placeholder="رقم الجوال"
                            type="tel"
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Fields */}
                <form onSubmit={handleSubmit}>
                    {(form.fields || []).map((field: any) => (
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

                            <PublicFieldInput
                                field={field}
                                value={answers[field.id]}
                                onChange={(val: any) => updateAnswer(field.id, val)}
                                accentColor={accentColor}
                            />

                            {errors[field.id] && (
                                <p className="text-xs text-red-500 mt-1">{errors[field.id]}</p>
                            )}
                        </div>
                    ))}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitMutation.isPending}
                        className="w-full py-3.5 rounded-xl font-medium text-white text-lg disabled:opacity-60 transition-all hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                    >
                        {submitMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                            'إرسال'
                        )}
                    </button>

                    {form.tenant?.name && (
                        <p className="text-center text-xs text-gray-400 mt-4">
                            {form.tenant.name}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// PUBLIC FIELD INPUT
// ══════════════════════════════════════════════════════════

function PublicFieldInput({
    field,
    value,
    onChange,
}: {
    field: any;
    value: any;
    onChange: (v: any) => void;
    accentColor: string;
}) {
    const [rating, setRating] = useState(value || 0);

    switch (field.type) {
        case 'shortText':
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder || ''}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
            );
        case 'longText':
            return (
                <textarea
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder || ''}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                />
            );
        case 'email':
            return (
                <input
                    type="email"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder || 'email@example.com'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    dir="ltr"
                />
            );
        case 'phone':
            return (
                <input
                    type="tel"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder || '05xxxxxxxx'}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    dir="ltr"
                />
            );
        case 'number':
            return (
                <input
                    type="number"
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value ? Number(e.target.value) : '')}
                    placeholder={field.placeholder || ''}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
            );
        case 'date':
            return (
                <input
                    type="date"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
            );
        case 'dropdown':
            return (
                <select
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">اختر...</option>
                    {(field.options || []).map((opt: string, i: number) => (
                        <option key={i} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        case 'radio':
            return (
                <div className="space-y-2.5">
                    {(field.options || []).map((opt: string, i: number) => (
                        <label
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${value === opt ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <input
                                type="radio"
                                name={field.id}
                                checked={value === opt}
                                onChange={() => onChange(opt)}
                                className="accent-indigo-600"
                            />
                            <span className="text-sm">{opt}</span>
                        </label>
                    ))}
                </div>
            );
        case 'checkbox':
            return (
                <div className="space-y-2.5">
                    {(field.options || []).map((opt: string, i: number) => {
                        const selected = Array.isArray(value) ? value : [];
                        const isChecked = selected.includes(opt);
                        return (
                            <label
                                key={i}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                        const newVal = isChecked
                                            ? selected.filter((v: string) => v !== opt)
                                            : [...selected, opt];
                                        onChange(newVal);
                                    }}
                                    className="accent-indigo-600"
                                />
                                <span className="text-sm">{opt}</span>
                            </label>
                        );
                    })}
                </div>
            );
        case 'fileUpload':
            return (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400 hover:border-indigo-300 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">اسحب الملف هنا أو اضغط للرفع</p>
                    <p className="text-xs text-gray-300 mt-1">قريباً - رفع الملفات</p>
                </div>
            );
        case 'rating':
            return (
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => { setRating(n); onChange(n); }}
                            className="transition-transform hover:scale-110"
                        >
                            <Star
                                className={`w-8 h-8 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                        </button>
                    ))}
                </div>
            );
        case 'sectionHeader':
            return <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{field.label}</h2>;
        case 'paragraph':
            return <p className="text-sm text-gray-500">{field.placeholder || field.label}</p>;
        default:
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
                />
            );
    }
}

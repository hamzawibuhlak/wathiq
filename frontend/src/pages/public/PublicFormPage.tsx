import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Star, Upload, AlertCircle, Loader2, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import { usePublicForm, useSubmitPublicForm, useVerifyPublicOtp } from '@/hooks/useForms';

// Helper: read step out of the validation JSON
const getFieldStep = (f: any): number => {
    const s = f?.validation?.step;
    return typeof s === 'number' && s >= 0 ? s : 0;
};

export default function PublicFormPage() {
    const { slug } = useParams<{ slug: string }>();
    const { data: form, isLoading, error } = usePublicForm(slug || '');
    const submitMutation = useSubmitPublicForm();
    const verifyOtpMutation = useVerifyPublicOtp();

    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitterInfo, setSubmitterInfo] = useState({ submitterName: '', submitterEmail: '', submitterPhone: '' });
    const [submitted, setSubmitted] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [currentStep, setCurrentStep] = useState(0);

    // OTP gate state
    const [otpUnlocked, setOtpUnlocked] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState('');

    // Group fields by step
    const { fieldsByStep, stepCount } = useMemo(() => {
        const map = new Map<number, any[]>();
        for (const f of form?.fields || []) {
            const s = getFieldStep(f);
            if (!map.has(s)) map.set(s, []);
            map.get(s)!.push(f);
        }
        const keys = Array.from(map.keys()).sort((a, b) => a - b);
        const sorted = new Map<number, any[]>();
        keys.forEach((k, idx) => sorted.set(idx, map.get(k) || []));
        return { fieldsByStep: sorted, stepCount: Math.max(1, keys.length) };
    }, [form?.fields]);

    const currentFields = fieldsByStep.get(currentStep) || [];
    const isLastStep = currentStep >= stepCount - 1;

    const updateAnswer = (fieldId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [fieldId]: value }));
        if (errors[fieldId]) setErrors(prev => { const n = { ...prev }; delete n[fieldId]; return n; });
    };

    const validateCurrentStep = (): boolean => {
        const newErrors: Record<string, string> = {};
        for (const field of currentFields) {
            if (field.required) {
                const val = answers[field.id];
                if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
                    newErrors[field.id] = `الحقل "${field.label}" مطلوب`;
                }
            }
        }
        // On first step, also require submitter name
        if (currentStep === 0) {
            if (!submitterInfo.submitterName.trim()) {
                newErrors._name = 'الاسم مطلوب';
            }
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            return false;
        }
        return true;
    };

    const goNext = () => {
        if (!validateCurrentStep()) return;
        setCurrentStep(s => Math.min(stepCount - 1, s + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = () => {
        setCurrentStep(s => Math.max(0, s - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateCurrentStep()) return;

        submitMutation.mutate(
            {
                slug: slug!,
                data: {
                    ...submitterInfo,
                    answers,
                    otpCode: form?.otpEnabled ? otpCode : undefined,
                },
            },
            {
                onSuccess: (res: any) => {
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

    const handleVerifyOtp = () => {
        if (!otpCode.trim() || !slug) {
            setOtpError('يرجى إدخال الرمز');
            return;
        }
        setOtpError('');
        verifyOtpMutation.mutate(
            { slug, code: otpCode.trim() },
            {
                onSuccess: () => setOtpUnlocked(true),
                onError: (err: any) => {
                    setOtpError(err.response?.data?.message || 'رمز غير صحيح');
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

    const accentColor = form.accentColor || '#4f46e5';

    // ─── Success ───
    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center bg-white rounded-2xl shadow-lg p-10 max-w-md mx-auto">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: accentColor + '20' }}
                    >
                        <CheckCircle className="w-8 h-8" style={{ color: accentColor }} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">تم الإرسال بنجاح!</h2>
                    <p className="text-gray-500">{successMessage}</p>
                </div>
            </div>
        );
    }

    // ─── OTP Gate ───
    if (form.otpEnabled && !otpUnlocked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full border-t-4" style={{ borderColor: accentColor }}>
                    {form.tenant?.logo && (
                        <img src={form.tenant.logo} alt={form.tenant.name} className="h-10 mx-auto mb-4" />
                    )}
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: accentColor + '15' }}
                    >
                        <KeyRound className="w-7 h-7" style={{ color: accentColor }} />
                    </div>
                    <h1 className="text-xl font-bold text-center text-gray-900 mb-1">{form.title}</h1>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        هذا النموذج محمي. يُرجى إدخال الرمز الذي تم إرساله إليك.
                    </p>

                    <input
                        value={otpCode}
                        onChange={e => { setOtpCode(e.target.value); setOtpError(''); }}
                        placeholder={'●'.repeat(form.otpLength || 6)}
                        dir="ltr"
                        maxLength={form.otpLength || 6}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] font-mono outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                    />

                    {otpError && (
                        <p className="text-xs text-red-500 text-center mb-2">{otpError}</p>
                    )}

                    <button
                        onClick={handleVerifyOtp}
                        disabled={verifyOtpMutation.isPending || !otpCode.trim()}
                        className="w-full py-3 rounded-xl font-medium text-white disabled:opacity-50 transition-all"
                        style={{ backgroundColor: accentColor }}
                    >
                        {verifyOtpMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                            'التحقق والدخول'
                        )}
                    </button>

                    <p className="text-[11px] text-gray-400 text-center mt-3">
                        لم يصلك الرمز؟ تواصل مع الشخص الذي أرسل إليك الرابط.
                    </p>
                </div>
            </div>
        );
    }

    // ─── Main Form (Wizard) ───
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Tenant Logo */}
                {form.tenant?.logo && (
                    <div className="text-center mb-4">
                        <img src={form.tenant.logo} alt={form.tenant.name} className="h-12 mx-auto" />
                    </div>
                )}

                {/* Form Header + Progress */}
                <div
                    className="bg-white rounded-xl shadow-sm p-6 mb-4 border-t-4"
                    style={{ borderColor: accentColor }}
                >
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{form.title}</h1>
                    {form.description && <p className="text-gray-500 text-sm mb-4">{form.description}</p>}

                    {stepCount > 1 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                <span>الخطوة {currentStep + 1} من {stepCount}</span>
                                <span>{Math.round(((currentStep + 1) / stepCount) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${((currentStep + 1) / stepCount) * 100}%`,
                                        backgroundColor: accentColor,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Error */}
                {errors._form && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {errors._form}
                    </div>
                )}

                {/* Submitter Info (first step only) */}
                {currentStep === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-4 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-700">بياناتك</h3>
                        <div>
                            <input
                                value={submitterInfo.submitterName}
                                onChange={e => { setSubmitterInfo(prev => ({ ...prev, submitterName: e.target.value })); if (errors._name) setErrors(p => { const n = { ...p }; delete n._name; return n; }); }}
                                placeholder="الاسم *"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors._name && <p className="text-xs text-red-500 mt-1">{errors._name}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                value={submitterInfo.submitterEmail}
                                onChange={e => setSubmitterInfo(prev => ({ ...prev, submitterEmail: e.target.value }))}
                                placeholder="البريد الإلكتروني"
                                type="email"
                                dir="ltr"
                                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <input
                                value={submitterInfo.submitterPhone}
                                onChange={e => setSubmitterInfo(prev => ({ ...prev, submitterPhone: e.target.value }))}
                                placeholder="رقم الجوال"
                                type="tel"
                                dir="ltr"
                                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                )}

                {/* Step Fields */}
                <form onSubmit={handleSubmit}>
                    {currentFields.map((field: any) => (
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

                    {currentFields.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-sm text-gray-400 mb-4">
                            لا توجد حقول في هذه الخطوة
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3 mt-6">
                        {currentStep > 0 ? (
                            <button
                                type="button"
                                onClick={goBack}
                                className="flex items-center gap-2 px-5 py-3 border border-gray-300 bg-white text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50"
                            >
                                <ArrowRight className="w-4 h-4" />
                                السابق
                            </button>
                        ) : <div />}

                        {!isLastStep ? (
                            <button
                                type="button"
                                onClick={goNext}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-white shadow-sm hover:shadow-md transition-shadow"
                                style={{ backgroundColor: accentColor }}
                            >
                                التالي
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={submitMutation.isPending}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-white shadow-sm hover:shadow-md transition-shadow disabled:opacity-60"
                                style={{ backgroundColor: accentColor }}
                            >
                                {submitMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'إرسال'
                                )}
                            </button>
                        )}
                    </div>

                    {form.tenant?.name && (
                        <p className="text-center text-xs text-gray-400 mt-6">
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

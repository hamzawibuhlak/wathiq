import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Mail, Lock, Eye, EyeOff, User, Building2, Phone,
    MapPin, FileCheck, ArrowLeft, ArrowRight, Check, Globe,
    Loader2, CheckCircle2, XCircle, Crown, Shield, Rocket,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { useRegister } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import api from '@/api/client';

// ── Step Schemas ────────────────────────────────────
const step1Schema = z.object({
    officeName: z.string().min(3, 'اسم المكتب يجب أن يكون 3 أحرف على الأقل'),
    slug: z
        .string()
        .min(3, 'الرابط يجب أن يكون 3 أحرف على الأقل')
        .max(30, 'الرابط لا يزيد عن 30 حرف')
        .regex(/^[a-z0-9-]+$/, 'أحرف إنجليزية صغيرة وأرقام وشرطة فقط'),
    city: z.string().optional(),
    licenseNumber: z.string().optional(),
});

const step2Schema = z.object({
    name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    phone: z.string().optional(),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
});

const step3Schema = z.object({
    planType: z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'يجب الموافقة على الشروط والخصوصية' }) }),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

// ── Plans ────────────────────────────────────────────
const plans = [
    {
        id: 'BASIC' as const,
        name: 'الأساسية',
        price: 'مجاناً',
        priceSub: '30 يوم تجربة',
        icon: Shield,
        color: 'from-slate-500 to-slate-600',
        borderColor: 'border-slate-300',
        features: ['5 قضايا', '3 مستخدمين', 'تقارير أساسية'],
    },
    {
        id: 'PROFESSIONAL' as const,
        name: 'الاحترافية',
        price: '199 ر.س',
        priceSub: 'شهرياً',
        icon: Crown,
        color: 'from-primary to-primary/80',
        borderColor: 'border-primary',
        features: ['قضايا غير محدودة', '10 مستخدمين', 'تقارير متقدمة', 'تسويق'],
        popular: true,
    },
    {
        id: 'ENTERPRISE' as const,
        name: 'المؤسسات',
        price: '499 ر.س',
        priceSub: 'شهرياً',
        icon: Rocket,
        color: 'from-amber-500 to-amber-600',
        borderColor: 'border-amber-400',
        features: ['كل شيء غير محدود', 'دعم مخصص', 'API متقدم', 'مستشار قانوني AI'],
    },
];

// ── Step Indicators ──────────────────────────────────
const steps = [
    { number: 1, label: 'بيانات المكتب' },
    { number: 2, label: 'بيانات المالك' },
    { number: 3, label: 'اختيار الباقة' },
];

export function RegisterPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [slugMsg, setSlugMsg] = useState('');
    const [checkingSlug, setCheckingSlug] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form data across steps
    const [step1Data, setStep1Data] = useState<Step1 | null>(null);
    const [step2Data, setStep2Data] = useState<Step2 | null>(null);

    const registerMutation = useRegister();

    // ── Step 1 form ──────────────────────────────────
    const form1 = useForm<Step1>({
        resolver: zodResolver(step1Schema),
        defaultValues: step1Data || { officeName: '', slug: '', city: '', licenseNumber: '' },
    });

    // ── Step 2 form ──────────────────────────────────
    const form2 = useForm<Step2>({
        resolver: zodResolver(step2Schema),
        defaultValues: step2Data || { name: '', email: '', phone: '', password: '', confirmPassword: '' },
    });

    // ── Step 3 form ──────────────────────────────────
    const form3 = useForm<Step3>({
        resolver: zodResolver(step3Schema),
        defaultValues: { planType: 'BASIC', acceptTerms: undefined as any },
    });

    // ── Slug availability check ──────────────────────
    const slugValue = form1.watch('slug');

    const checkSlug = useCallback(async (value: string) => {
        if (!value || value.length < 3) {
            setSlugAvailable(null);
            setSlugMsg('');
            return;
        }
        setCheckingSlug(true);
        try {
            const { data } = await api.get(`/auth/check-slug/${value}`);
            setSlugAvailable(data.available);
            setSlugMsg(data.message || (data.available ? 'متاح ✓' : 'غير متاح'));
        } catch {
            setSlugAvailable(null);
            setSlugMsg('خطأ في الفحص');
        } finally {
            setCheckingSlug(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (slugValue && /^[a-z0-9-]+$/.test(slugValue)) {
                checkSlug(slugValue);
            } else {
                setSlugAvailable(null);
                setSlugMsg('');
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [slugValue, checkSlug]);

    // ── Navigation ───────────────────────────────────
    const goToStep2 = (data: Step1) => {
        if (slugAvailable === false) return;
        setStep1Data(data);
        setCurrentStep(2);
    };

    const goToStep3 = (data: Step2) => {
        setStep2Data(data);
        setCurrentStep(3);
    };

    const handleFinalSubmit = (data: Step3) => {
        if (!step1Data || !step2Data) return;
        const { confirmPassword, ...ownerData } = step2Data;
        registerMutation.mutate({
            ...step1Data,
            ...ownerData,
            planType: data.planType,
        });
    };

    // ── Step indicator ───────────────────────────────
    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map((step, idx) => (
                <div key={step.number} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div
                            className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                                currentStep > step.number
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                    : currentStep === step.number
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-4 ring-primary/20'
                                        : 'bg-muted text-muted-foreground'
                            )}
                        >
                            {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                        </div>
                        <span className={cn(
                            'text-[11px] mt-1.5 font-medium',
                            currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                            {step.label}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={cn(
                            'w-16 h-0.5 mx-2 mb-5 rounded-full transition-all duration-300',
                            currentStep > step.number ? 'bg-emerald-500' : 'bg-muted'
                        )} />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div>
            <StepIndicator />

            {/* ═══ Step 1: بيانات المكتب ═══ */}
            {currentStep === 1 && (
                <form onSubmit={form1.handleSubmit(goToStep2)} className="space-y-4">
                    {/* Office Name */}
                    <div className="space-y-2">
                        <Label htmlFor="officeName">اسم المكتب</Label>
                        <div className="relative">
                            <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="officeName"
                                placeholder="مكتب الوثيق للمحاماة"
                                className="pr-10"
                                error={form1.formState.errors.officeName?.message}
                                {...form1.register('officeName')}
                            />
                        </div>
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <Label htmlFor="slug">رابط المكتب</Label>
                        <div className="relative">
                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="slug"
                                dir="ltr"
                                placeholder="watheeq-law"
                                className="pr-10 pl-10 text-left"
                                error={form1.formState.errors.slug?.message}
                                {...form1.register('slug')}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                {checkingSlug && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                {!checkingSlug && slugAvailable === true && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                {!checkingSlug && slugAvailable === false && <XCircle className="h-4 w-4 text-destructive" />}
                            </div>
                        </div>
                        {slugMsg && (
                            <p className={cn(
                                'text-xs',
                                slugAvailable ? 'text-emerald-600' : 'text-destructive'
                            )}>
                                {slugMsg}
                            </p>
                        )}
                        {slugValue && slugAvailable && (
                            <p className="text-xs text-muted-foreground" dir="ltr">
                                watheeq.sa/{slugValue}/dashboard
                            </p>
                        )}
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                        <Label htmlFor="city">المدينة (اختياري)</Label>
                        <div className="relative">
                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="city"
                                placeholder="الرياض"
                                className="pr-10"
                                {...form1.register('city')}
                            />
                        </div>
                    </div>

                    {/* License Number */}
                    <div className="space-y-2">
                        <Label htmlFor="licenseNumber">رقم الترخيص (اختياري)</Label>
                        <div className="relative">
                            <FileCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="licenseNumber"
                                placeholder="1234567890"
                                className="pr-10"
                                {...form1.register('licenseNumber')}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={slugAvailable === false}
                    >
                        <span>التالي</span>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                </form>
            )}

            {/* ═══ Step 2: بيانات المالك ═══ */}
            {currentStep === 2 && (
                <form onSubmit={form2.handleSubmit(goToStep3)} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">الاسم الكامل</Label>
                        <div className="relative">
                            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="name"
                                placeholder="سالم العتيبي"
                                className="pr-10"
                                error={form2.formState.errors.name?.message}
                                {...form2.register('name')}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="salem@example.com"
                                className="pr-10"
                                error={form2.formState.errors.email?.message}
                                {...form2.register('email')}
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">رقم الجوال (اختياري)</Label>
                        <div className="relative">
                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+966 5X XXX XXXX"
                                className="pr-10"
                                {...form2.register('phone')}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pr-10 pl-10"
                                error={form2.formState.errors.password?.message}
                                {...form2.register('password')}
                            />
                            <button
                                type="button"
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pr-10 pl-10"
                                error={form2.formState.errors.confirmPassword?.message}
                                {...form2.register('confirmPassword')}
                            />
                            <button
                                type="button"
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setCurrentStep(1)}
                        >
                            <ArrowRight className="w-4 h-4 ml-2" />
                            <span>السابق</span>
                        </Button>
                        <Button type="submit" className="flex-1">
                            <span>التالي</span>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                        </Button>
                    </div>
                </form>
            )}

            {/* ═══ Step 3: اختيار الباقة ═══ */}
            {currentStep === 3 && (
                <form onSubmit={form3.handleSubmit(handleFinalSubmit)} className="space-y-5">
                    <div className="grid gap-3">
                        {plans.map((plan) => {
                            const selected = form3.watch('planType') === plan.id;
                            const Icon = plan.icon;
                            return (
                                <label
                                    key={plan.id}
                                    className={cn(
                                        'relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200',
                                        'hover:shadow-md',
                                        selected
                                            ? `${plan.borderColor} bg-primary/5 shadow-sm`
                                            : 'border-border hover:border-primary/30'
                                    )}
                                >
                                    <input
                                        type="radio"
                                        value={plan.id}
                                        className="sr-only"
                                        {...form3.register('planType')}
                                    />

                                    {plan.popular && (
                                        <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                                            الأكثر شعبية
                                        </span>
                                    )}

                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                                            plan.color
                                        )}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-bold text-base">{plan.name}</span>
                                                <span className="text-lg font-extrabold text-primary">{plan.price}</span>
                                                <span className="text-xs text-muted-foreground">/{plan.priceSub}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                {plan.features.map((f) => (
                                                    <span
                                                        key={f}
                                                        className="text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground"
                                                    >
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={cn(
                                            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                                            selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                                        )}>
                                            {selected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    {/* Terms Checkbox */}
                    <div className="rounded-xl border border-border p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-1 rounded border-muted-foreground/30 text-primary focus:ring-primary"
                                {...form3.register('acceptTerms')}
                            />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                                أوافق على{' '}
                                <a
                                    href="/privacy?tab=terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary font-medium underline hover:text-primary/80"
                                >
                                    شروط الاستخدام
                                </a>
                                {' '}و{' '}
                                <a
                                    href="/privacy?tab=privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary font-medium underline hover:text-primary/80"
                                >
                                    سياسة الخصوصية
                                </a>
                            </span>
                        </label>
                        {form3.formState.errors.acceptTerms && (
                            <p className="text-xs text-destructive mt-2">
                                {form3.formState.errors.acceptTerms.message}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setCurrentStep(2)}
                        >
                            <ArrowRight className="w-4 h-4 ml-2" />
                            <span>السابق</span>
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            size="lg"
                            isLoading={registerMutation.isPending}
                        >
                            إنشاء الحساب
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default RegisterPage;

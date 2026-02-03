import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, User, Building2, Phone } from 'lucide-react';
import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { useRegister } from '@/hooks/use-auth';

// Validation schema
const registerSchema = z.object({
    name: z
        .string()
        .min(1, 'الاسم مطلوب')
        .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
    officeName: z
        .string()
        .min(1, 'اسم المكتب مطلوب')
        .min(3, 'اسم المكتب يجب أن يكون 3 أحرف على الأقل'),
    email: z
        .string()
        .min(1, 'البريد الإلكتروني مطلوب')
        .email('البريد الإلكتروني غير صالح'),
    phone: z
        .string()
        .optional(),
    password: z
        .string()
        .min(1, 'كلمة المرور مطلوبة')
        .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    confirmPassword: z
        .string()
        .min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const registerMutation = useRegister();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = (data: RegisterFormData) => {
        // Remove confirmPassword before sending
        const { confirmPassword, ...registerData } = data;
        registerMutation.mutate(registerData);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="name"
                        type="text"
                        placeholder="أحمد محمد"
                        className="pr-10"
                        error={errors.name?.message}
                        {...register('name')}
                    />
                </div>
            </div>

            {/* Office Name */}
            <div className="space-y-2">
                <Label htmlFor="officeName">اسم المكتب</Label>
                <div className="relative">
                    <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="officeName"
                        type="text"
                        placeholder="مكتب المحاماة"
                        className="pr-10"
                        error={errors.officeName?.message}
                        {...register('officeName')}
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
                        placeholder="example@watheeq.sa"
                        className="pr-10"
                        error={errors.email?.message}
                        {...register('email')}
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
                        {...register('phone')}
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
                        error={errors.password?.message}
                        {...register('password')}
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
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
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

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" isLoading={registerMutation.isPending}>
                إنشاء الحساب
            </Button>
        </form>
    );
}

export default RegisterPage;

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { useLogin } from '@/hooks/use-auth';

// Validation schema
const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'البريد الإلكتروني مطلوب')
        .email('البريد الإلكتروني غير صالح'),
    password: z
        .string()
        .min(1, 'كلمة المرور مطلوبة')
        .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const loginMutation = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: LoginFormData) => {
        loginMutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" isLoading={loginMutation.isPending}>
                تسجيل الدخول
            </Button>
        </form>
    );
}

export default LoginPage;

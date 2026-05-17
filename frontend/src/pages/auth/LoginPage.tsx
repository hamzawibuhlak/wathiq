import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button, Input, Label } from '@/components/ui';
import { useLogin } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
    email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صالح'),
    password: z.string().min(1, 'كلمة المرور مطلوبة').min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const loginMutation = useLogin();

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: LoginFormData) => { loginMutation.mutate(data); };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/60 text-[13px]">البريد الإلكتروني</Label>
                <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="example@wasmaltheeqa.sa"
                        className="pr-10 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50 focus:bg-white/[0.07]"
                        error={errors.email?.message}
                        {...register('email')}
                    />
                </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-white/60 text-[13px]">كلمة المرور</Label>
                    <Link to="/forgot-password" className="text-[12px] text-primary/70 hover:text-primary transition-colors">
                        نسيت كلمة المرور؟
                    </Link>
                </div>
                <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pr-10 pl-10 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50 focus:bg-white/[0.07]"
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    <button
                        type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Submit */}
            <Button
                type="submit"
                className={cn(
                    'w-full h-11 text-[14px] font-semibold mt-2',
                    'bg-gradient-to-l from-primary/90 to-[hsl(var(--gold))]/80 text-white border-0',
                    'shadow-[0_0_20px_rgba(var(--primary-rgb),0.35)] hover:shadow-[0_0_28px_rgba(var(--primary-rgb),0.5)]',
                    'transition-all duration-200'
                )}
                isLoading={loginMutation.isPending}
            >
                تسجيل الدخول
            </Button>
        </form>
    );
}

export default LoginPage;

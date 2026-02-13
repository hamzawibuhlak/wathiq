import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'البريد الإلكتروني مطلوب')
        .email('البريد الإلكتروني غير صالح'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const mutation = useMutation({
        mutationFn: (data: ForgotPasswordFormData) => authApi.forgotPassword(data.email),
        onSuccess: () => {
            toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل في إرسال البريد الإلكتروني');
        },
    });

    const onSubmit = (data: ForgotPasswordFormData) => {
        mutation.mutate(data);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold">نسيت كلمة المرور؟</h1>
                <p className="text-muted-foreground mt-2">
                    أدخل بريدك الإلكتروني لاستلام رابط إعادة تعيين كلمة المرور
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                <Button type="submit" className="w-full" size="lg" isLoading={mutation.isPending}>
                    إرسال الرابط
                </Button>

                <div className="text-center">
                    <Link to="/login" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
                        <ArrowRight className="h-4 w-4" />
                        العودة لتسجيل الدخول
                    </Link>
                </div>
            </form>
        </div>
    );
}

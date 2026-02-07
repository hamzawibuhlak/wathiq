import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Input, Label, Card, CardContent } from '@/components/ui';
import { useVerifyInvitation, useAcceptInvitation } from '@/hooks/use-settings';

const acceptSchema = z.object({
    name: z.string().min(2, 'الاسم مطلوب'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    confirmPassword: z.string(),
    phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
});

type AcceptFormData = z.infer<typeof acceptSchema>;

const roleLabels: Record<string, string> = {
    OWNER: 'مالك',
    ADMIN: 'مدير',
    LAWYER: 'محامي',
    SECRETARY: 'سكرتير',
};

export function AcceptInvitationPage() {
    const { token } = useParams<{ token: string }>();
    const [isAccepted, setIsAccepted] = useState(false);

    const { data, isLoading, error } = useVerifyInvitation(token || '');
    const acceptMutation = useAcceptInvitation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AcceptFormData>({
        resolver: zodResolver(acceptSchema),
    });

    const invitation = data?.data;

    const onSubmit = (formData: AcceptFormData) => {
        if (!token) return;

        acceptMutation.mutate(
            {
                token,
                name: formData.name,
                password: formData.password,
                phone: formData.phone,
            },
            {
                onSuccess: () => {
                    setIsAccepted(true);
                },
            }
        );
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">جاري التحقق من الدعوة...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    if (error || !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                        <h1 className="text-xl font-bold mb-2">دعوة غير صالحة</h1>
                        <p className="text-muted-foreground mb-6">
                            هذه الدعوة غير موجودة أو منتهية الصلاحية
                        </p>
                        <Link to="/login">
                            <Button variant="outline">
                                العودة لتسجيل الدخول
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Expired or cancelled
    if (invitation.status !== 'PENDING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        {invitation.status === 'ACCEPTED' ? (
                            <>
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h1 className="text-xl font-bold mb-2">تم قبول الدعوة مسبقاً</h1>
                                <p className="text-muted-foreground mb-6">
                                    يمكنك تسجيل الدخول باستخدام بياناتك
                                </p>
                            </>
                        ) : invitation.status === 'EXPIRED' ? (
                            <>
                                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                <h1 className="text-xl font-bold mb-2">انتهت صلاحية الدعوة</h1>
                                <p className="text-muted-foreground mb-6">
                                    يرجى التواصل مع المسؤول لإرسال دعوة جديدة
                                </p>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                                <h1 className="text-xl font-bold mb-2">تم إلغاء الدعوة</h1>
                                <p className="text-muted-foreground mb-6">
                                    هذه الدعوة لم تعد صالحة
                                </p>
                            </>
                        )}
                        <Link to="/login">
                            <Button variant="outline">
                                تسجيل الدخول
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Success state
    if (isAccepted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="py-12 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-xl font-bold mb-2">تم إنشاء حسابك بنجاح!</h1>
                        <p className="text-muted-foreground mb-6">
                            يمكنك الآن تسجيل الدخول للوصول إلى نظام {invitation.tenant.name}
                        </p>
                        <Link to="/login">
                            <Button className="w-full">
                                تسجيل الدخول
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Form state
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardContent className="py-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        {invitation.tenant.logo ? (
                            <img
                                src={invitation.tenant.logo}
                                alt={invitation.tenant.name}
                                className="w-16 h-16 mx-auto mb-4 rounded-lg"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <Building2 className="w-8 h-8 text-primary" />
                            </div>
                        )}
                        <h1 className="text-xl font-bold mb-2">
                            انضم إلى {invitation.tenant.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            تمت دعوتك بواسطة {invitation.inviter.name} كـ{roleLabels[invitation.role]}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label>البريد الإلكتروني</Label>
                            <Input value={invitation.email} disabled className="bg-muted" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">الاسم الكامل *</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder="أدخل اسمك الكامل"
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">رقم الجوال</Label>
                            <Input
                                id="phone"
                                type="tel"
                                dir="ltr"
                                className="text-right"
                                {...register('phone')}
                                placeholder="05XXXXXXXX"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">كلمة المرور *</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register('password')}
                                placeholder="أدخل كلمة المرور"
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...register('confirmPassword')}
                                placeholder="أعد إدخال كلمة المرور"
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={acceptMutation.isPending}
                        >
                            إنشاء الحساب
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        لديك حساب بالفعل؟{' '}
                        <Link to="/login" className="text-primary hover:underline">
                            تسجيل الدخول
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default AcceptInvitationPage;

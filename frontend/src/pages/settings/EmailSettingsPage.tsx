import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smtpApi, type UpdateSmtpSettingsData } from '@/api/settings.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import {
    Mail,
    Server,
    Lock,
    Send,
    CheckCircle2,
    XCircle,
    Loader2,
    Eye,
    EyeOff,
    Info,
} from 'lucide-react';

export default function EmailSettingsPage() {
    const queryClient = useQueryClient();
    const [showPassword, setShowPassword] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [formData, setFormData] = useState<UpdateSmtpSettingsData>({
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        smtpFrom: '',
        smtpFromName: '',
        smtpSecure: false,
        smtpEnabled: false,
    });

    // Fetch SMTP settings
    const { data: settings, isLoading, error } = useQuery({
        queryKey: ['smtp-settings'],
        queryFn: smtpApi.get,
        staleTime: 0,
    });

    // Update form when data is loaded
    useState(() => {
        if (settings?.data) {
            setFormData({
                smtpHost: settings.data.smtpHost || '',
                smtpPort: settings.data.smtpPort || 587,
                smtpUser: settings.data.smtpUser || '',
                smtpPass: '', // Don't show password
                smtpFrom: settings.data.smtpFrom || '',
                smtpFromName: settings.data.smtpFromName || '',
                smtpSecure: settings.data.smtpSecure || false,
                smtpEnabled: settings.data.smtpEnabled || false,
            });
        }
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: smtpApi.update,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['smtp-settings'] });
            toast.success('تم حفظ إعدادات البريد بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'حدث خطأ أثناء الحفظ');
        },
    });

    // Test mutation
    const testMutation = useMutation({
        mutationFn: smtpApi.test,
        onSuccess: (data) => {
            toast.success(data.message || 'تم إرسال رسالة الاختبار بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل الاختبار');
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    const handleTest = () => {
        if (!testEmail) {
            toast.error('يرجى إدخال بريد إلكتروني للاختبار');
            return;
        }
        testMutation.mutate({ testEmail });
    };

    // Update form data when settings are loaded
    if (settings?.data && !formData.smtpHost && settings.data.smtpHost) {
        setFormData({
            smtpHost: settings.data.smtpHost || '',
            smtpPort: settings.data.smtpPort || 587,
            smtpUser: settings.data.smtpUser || '',
            smtpPass: '', // Don't show password
            smtpFrom: settings.data.smtpFrom || '',
            smtpFromName: settings.data.smtpFromName || '',
            smtpSecure: settings.data.smtpSecure || false,
            smtpEnabled: settings.data.smtpEnabled || false,
        });
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>فشل تحميل إعدادات البريد الإلكتروني</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">إعدادات البريد الإلكتروني</h1>
                <p className="text-muted-foreground">
                    قم بتكوين خادم SMTP لإرسال الإشعارات والفواتير وتذكيرات الجلسات
                </p>
            </div>

            {/* Status Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${formData.smtpEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <Mail className={`h-6 w-6 ${formData.smtpEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div>
                                <h3 className="font-semibold">حالة خدمة البريد</h3>
                                <p className="text-sm text-muted-foreground">
                                    {formData.smtpEnabled ? 'الخدمة مفعّلة وجاهزة للإرسال' : 'الخدمة غير مفعّلة'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {formData.smtpEnabled ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-gray-400" />
                            )}
                            <Switch
                                checked={formData.smtpEnabled}
                                onCheckedChange={(checked: boolean) => handleSwitchChange('smtpEnabled', checked)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Settings Form */}
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            إعدادات خادم SMTP
                        </CardTitle>
                        <CardDescription>
                            أدخل بيانات خادم البريد الإلكتروني الخاص بك
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Server Settings */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="smtpHost">خادم SMTP *</Label>
                                <Input
                                    id="smtpHost"
                                    name="smtpHost"
                                    placeholder="smtp.example.com"
                                    value={formData.smtpHost}
                                    onChange={handleInputChange}
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">
                                    مثال: smtp.hostinger.com أو smtp.gmail.com
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtpPort">المنفذ (Port) *</Label>
                                <Input
                                    id="smtpPort"
                                    name="smtpPort"
                                    type="number"
                                    placeholder="587"
                                    value={formData.smtpPort}
                                    onChange={handleInputChange}
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">
                                    587 للـ TLS أو 465 للـ SSL
                                </p>
                            </div>
                        </div>

                        {/* Authentication */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="smtpUser">اسم المستخدم / الإيميل *</Label>
                                <Input
                                    id="smtpUser"
                                    name="smtpUser"
                                    type="email"
                                    placeholder="info@example.com"
                                    value={formData.smtpUser}
                                    onChange={handleInputChange}
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtpPass">كلمة المرور *</Label>
                                <div className="relative">
                                    <Input
                                        id="smtpPass"
                                        name="smtpPass"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={settings?.data?.hasPassword ? '••••••••' : 'أدخل كلمة المرور'}
                                        value={formData.smtpPass}
                                        onChange={handleInputChange}
                                        dir="ltr"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute left-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {settings?.data?.hasPassword && (
                                    <p className="text-xs text-muted-foreground">
                                        اترك الحقل فارغاً للاحتفاظ بكلمة المرور الحالية
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* From Settings */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="smtpFrom">عنوان المرسل</Label>
                                <Input
                                    id="smtpFrom"
                                    name="smtpFrom"
                                    type="email"
                                    placeholder="noreply@example.com"
                                    value={formData.smtpFrom}
                                    onChange={handleInputChange}
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">
                                    إذا تركت فارغاً سيستخدم اسم المستخدم
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="smtpFromName">اسم المرسل</Label>
                                <Input
                                    id="smtpFromName"
                                    name="smtpFromName"
                                    placeholder="مكتب المحاماة"
                                    value={formData.smtpFromName}
                                    onChange={handleInputChange}
                                />
                                <p className="text-xs text-muted-foreground">
                                    الاسم الذي يظهر للمستلم
                                </p>
                            </div>
                        </div>

                        {/* SSL/TLS */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Lock className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <Label htmlFor="smtpSecure" className="cursor-pointer">
                                        استخدام SSL
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        فعّل هذا الخيار إذا كان المنفذ 465
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="smtpSecure"
                                checked={formData.smtpSecure}
                                onCheckedChange={(checked: boolean) => handleSwitchChange('smtpSecure', checked)}
                            />
                        </div>

                        {/* Info Box */}
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <strong>ملاحظة:</strong> إذا كنت تستخدم Gmail، تحتاج إلى إنشاء "App Password" من إعدادات أمان حسابك.
                                <a
                                    href="https://myaccount.google.com/apppasswords"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline mr-1"
                                >
                                    اضغط هنا للمزيد
                                </a>
                            </AlertDescription>
                        </Alert>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? (
                                    <>
                                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    'حفظ الإعدادات'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Test Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        اختبار الإعدادات
                    </CardTitle>
                    <CardDescription>
                        أرسل رسالة اختبار للتأكد من صحة الإعدادات
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            type="email"
                            placeholder="أدخل بريدك الإلكتروني للاختبار"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            dir="ltr"
                            className="max-w-md"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTest}
                            disabled={testMutation.isPending || !formData.smtpEnabled}
                        >
                            {testMutation.isPending ? (
                                <>
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                    جاري الإرسال...
                                </>
                            ) : (
                                <>
                                    <Send className="ml-2 h-4 w-4" />
                                    إرسال اختبار
                                </>
                            )}
                        </Button>
                    </div>
                    {!formData.smtpEnabled && (
                        <p className="text-sm text-amber-600 mt-2">
                            يجب تفعيل خدمة البريد أولاً لإرسال رسالة اختبار
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Common SMTP Providers */}
            <Card>
                <CardHeader>
                    <CardTitle>إعدادات شائعة للمزودين</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Gmail</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>Host: smtp.gmail.com</p>
                                <p>Port: 587 (TLS)</p>
                                <p>يتطلب App Password</p>
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Hostinger</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>Host: smtp.hostinger.com</p>
                                <p>Port: 465 (SSL)</p>
                                <p>أو Port: 587 (TLS)</p>
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Outlook / Office 365</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>Host: smtp.office365.com</p>
                                <p>Port: 587 (TLS)</p>
                                <p>يستخدم بريد المستخدم</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

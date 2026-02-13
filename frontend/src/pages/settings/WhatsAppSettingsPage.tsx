import { useState } from 'react';
import {
    MessageCircle,
    Save,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    ExternalLink,
    Copy,
    Check
} from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi, UpdateWhatsAppSettingsDto } from '@/api/whatsapp.api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import WhatsappConnect from '@/components/whatsapp/WhatsappConnect';

export function WhatsAppSettingsPage() {
    const queryClient = useQueryClient();
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState<UpdateWhatsAppSettingsDto>({});
    const [hasChanges, setHasChanges] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['whatsapp-settings'],
        queryFn: () => whatsappApi.getSettings(),
    });

    const settings = data?.data;

    const updateMutation = useMutation({
        mutationFn: (data: UpdateWhatsAppSettingsDto) => whatsappApi.updateSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-settings'] });
            toast.success('تم حفظ الإعدادات بنجاح');
            setHasChanges(false);
            setFormData({});
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حفظ الإعدادات');
        },
    });

    const testMutation = useMutation({
        mutationFn: () => whatsappApi.testConnection(),
        onSuccess: (result) => {
            if (result.success) {
                toast.success(`${result.message}\nرقم الهاتف: ${result.phoneNumber}`);
            } else {
                toast.error(result.message);
            }
        },
        onError: () => {
            toast.error('فشل اختبار الاتصال');
        },
    });

    const handleChange = (field: keyof UpdateWhatsAppSettingsDto, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    const handleCopyWebhook = () => {
        const webhookUrl = `${window.location.origin}/api/wasmaltheeqa`;
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('تم نسخ رابط الـ Webhook');
    };

    const getValue = (field: keyof UpdateWhatsAppSettingsDto) => {
        if (formData[field] !== undefined) return formData[field];
        if (settings) return (settings as any)[field];
        return '';
    };

    if (isLoading) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-destructive/10 text-destructive rounded-lg p-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <span>حدث خطأ أثناء تحميل الإعدادات</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">إعدادات الواتساب</h2>
                        <p className="text-sm text-muted-foreground">
                            ربط حساب WhatsApp Business API
                        </p>
                    </div>
                </div>
                {settings?.isConfigured && (
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                        settings.whatsappEnabled
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                    )}>
                        {settings.whatsappEnabled ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                متصل ومفعل
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-4 h-4" />
                                متصل لكن غير مفعل
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">كيفية الحصول على بيانات الاتصال</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>اذهب إلى <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">Meta for Developers</a></li>
                    <li>أنشئ تطبيق جديد من نوع "Business"</li>
                    <li>أضف منتج "WhatsApp" للتطبيق</li>
                    <li>من قسم "WhatsApp &gt; API Setup" احصل على:
                        <ul className="list-disc list-inside mr-4 mt-1">
                            <li>Phone Number ID</li>
                            <li>WhatsApp Business Account ID</li>
                            <li>Temporary Access Token (أو أنشئ System User Token دائم)</li>
                        </ul>
                    </li>
                </ol>
                <a
                    href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2 text-sm"
                >
                    <ExternalLink className="w-4 h-4" />
                    دليل البدء السريع
                </a>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Access Token */}
                <div className="space-y-2">
                    <Label htmlFor="token">Access Token *</Label>
                    <div className="relative">
                        <Input
                            id="token"
                            type={showToken ? 'text' : 'password'}
                            value={getValue('whatsappAccessToken') as string}
                            onChange={(e) => handleChange('whatsappAccessToken', e.target.value)}
                            placeholder="أدخل Access Token من Meta"
                            className="pl-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        يمكنك استخدام Temporary Token للاختبار أو System User Token للإنتاج
                    </p>
                </div>

                {/* Phone Number ID */}
                <div className="space-y-2">
                    <Label htmlFor="phoneId">Phone Number ID *</Label>
                    <Input
                        id="phoneId"
                        value={getValue('whatsappPhoneNumberId') as string}
                        onChange={(e) => handleChange('whatsappPhoneNumberId', e.target.value)}
                        placeholder="مثال: 123456789012345"
                    />
                    <p className="text-xs text-muted-foreground">
                        معرف رقم الهاتف من صفحة API Setup
                    </p>
                </div>

                {/* Business Account ID */}
                <div className="space-y-2">
                    <Label htmlFor="businessId">Business Account ID</Label>
                    <Input
                        id="businessId"
                        value={getValue('whatsappBusinessId') as string}
                        onChange={(e) => handleChange('whatsappBusinessId', e.target.value)}
                        placeholder="مثال: 123456789012345"
                    />
                    <p className="text-xs text-muted-foreground">
                        معرف حساب WhatsApp Business (اختياري)
                    </p>
                </div>

                {/* Webhook Token */}
                <div className="space-y-2">
                    <Label htmlFor="webhookToken">Webhook Verify Token</Label>
                    <Input
                        id="webhookToken"
                        value={getValue('whatsappWebhookToken') as string}
                        onChange={(e) => handleChange('whatsappWebhookToken', e.target.value)}
                        placeholder="أي نص تختاره للتحقق"
                    />
                    <p className="text-xs text-muted-foreground">
                        رمز التحقق لاستلام الرسائل الواردة (Webhook)
                    </p>
                </div>

                {/* Webhook URL */}
                <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                        <Input
                            value={`${window.location.origin}/api/wasmaltheeqa`}
                            readOnly
                            className="bg-muted"
                        />
                        <Button type="button" variant="outline" onClick={handleCopyWebhook}>
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        أضف هذا الرابط في إعدادات Webhook على Meta
                    </p>
                </div>

                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                        <h4 className="font-medium">تفعيل الواتساب</h4>
                        <p className="text-sm text-muted-foreground">
                            تفعيل إرسال واستقبال الرسائل عبر الواتساب
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={getValue('whatsappEnabled') as boolean}
                            onChange={(e) => handleChange('whatsappEnabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t">
                    <Button
                        type="submit"
                        disabled={!hasChanges || updateMutation.isPending}
                    >
                        <Save className="w-4 h-4 ml-2" />
                        {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => testMutation.mutate()}
                        disabled={testMutation.isPending || !settings?.isConfigured}
                    >
                        <RefreshCw className={cn("w-4 h-4 ml-2", testMutation.isPending && "animate-spin")} />
                        اختبار الاتصال
                    </Button>
                </div>
            </form>

            {/* Demo Mode Warning */}
            {!settings?.isConfigured && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-yellow-900">وضع العرض التجريبي</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            الواتساب غير مربوط حالياً. الرسائل ستُحفظ في النظام لكن لن تُرسل فعلياً.
                            أدخل بيانات الاتصال لتفعيل الإرسال الحقيقي.
                        </p>
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="border-t pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">ربط واتساب عبر QR Code</h3>
                        <p className="text-sm text-muted-foreground">
                            بديل سريع — امسح الباركود واربط رقم الواتساب مباشرة (بدون API رسمي)
                        </p>
                    </div>
                </div>
                <WhatsappConnect />
            </div>
        </div>
    );
}

export default WhatsAppSettingsPage;

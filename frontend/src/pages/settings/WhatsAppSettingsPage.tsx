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
    Check,
    Shield,
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
    const [showSecret, setShowSecret] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copiedVerify, setCopiedVerify] = useState(false);
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

    const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
    const verifyToken = settings?.whatsappWebhookToken || getValue('whatsappWebhookToken') as string;

    function handleCopyWebhook() {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('تم نسخ رابط الـ Webhook');
    }

    function handleCopyVerifyToken() {
        if (!verifyToken) return;
        navigator.clipboard.writeText(verifyToken as string);
        setCopiedVerify(true);
        setTimeout(() => setCopiedVerify(false), 2000);
        toast.success('تم نسخ Verify Token');
    }

    function getValue(field: keyof UpdateWhatsAppSettingsDto) {
        if (formData[field] !== undefined) return formData[field];
        if (settings) return (settings as any)[field];
        return '';
    }

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
                        <h2 className="text-xl font-bold">إعدادات واتساب Business API</h2>
                        <p className="text-sm text-muted-foreground">
                            ربط حساب WhatsApp Cloud API (Meta Business)
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

            {/* Steps Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-blue-900">خطوات الربط مع Meta</h3>
                <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                    <li>
                        اذهب إلى{' '}
                        <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                            business.facebook.com
                        </a>{' '}
                        وأنشئ تطبيقاً جديداً من نوع <strong>Business</strong>
                    </li>
                    <li>في التطبيق: أضف منتج <strong>WhatsApp</strong></li>
                    <li>
                        من قسم <strong>WhatsApp → API Setup</strong> احصل على:
                        <ul className="list-disc list-inside mr-4 mt-1 space-y-0.5">
                            <li><code className="bg-blue-100 px-1 rounded text-xs">Access Token</code> — مؤقت (60 يوم) أو دائم عبر System User</li>
                            <li><code className="bg-blue-100 px-1 rounded text-xs">Phone Number ID</code> — معرّف رقم الهاتف</li>
                            <li><code className="bg-blue-100 px-1 rounded text-xs">Business Account ID</code> — معرّف الحساب التجاري</li>
                        </ul>
                    </li>
                    <li>
                        من <strong>App Settings → Basic</strong>:{' '}
                        <code className="bg-blue-100 px-1 rounded text-xs">App Secret</code> — مطلوب للتحقق من توقيع الـ Webhook
                    </li>
                    <li>
                        في <strong>WhatsApp → Configuration</strong>: أضف Webhook URL وVerify Token أدناه ثم فعّل حقول <code className="bg-blue-100 px-1 rounded text-xs">messages</code> و<code className="bg-blue-100 px-1 rounded text-xs">message_status</code>
                    </li>
                </ol>
                <a
                    href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                    <ExternalLink className="w-4 h-4" />
                    دليل البدء السريع (Meta)
                </a>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Access Token */}
                <div className="space-y-2">
                    <Label htmlFor="token">
                        Access Token <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id="token"
                            type={showToken ? 'text' : 'password'}
                            value={getValue('whatsappAccessToken') as string}
                            onChange={(e) => handleChange('whatsappAccessToken', e.target.value)}
                            placeholder="EAAxxxxxxxxxxx"
                            className="pl-10"
                            dir="ltr"
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
                        Temporary Token للاختبار أو System User Token للإنتاج (صلاحية دائمة)
                    </p>
                </div>

                {/* Phone Number ID */}
                <div className="space-y-2">
                    <Label htmlFor="phoneId">
                        Phone Number ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="phoneId"
                        value={getValue('whatsappPhoneNumberId') as string}
                        onChange={(e) => handleChange('whatsappPhoneNumberId', e.target.value)}
                        placeholder="123456789012345"
                        dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                        معرّف رقم الهاتف من صفحة API Setup
                    </p>
                </div>

                {/* Business Account ID */}
                <div className="space-y-2">
                    <Label htmlFor="businessId">Business Account ID</Label>
                    <Input
                        id="businessId"
                        value={getValue('whatsappBusinessId') as string}
                        onChange={(e) => handleChange('whatsappBusinessId', e.target.value)}
                        placeholder="987654321098765"
                        dir="ltr"
                    />
                    <p className="text-xs text-muted-foreground">
                        معرّف حساب WhatsApp Business (اختياري للاستعلام)
                    </p>
                </div>

                {/* App Secret */}
                <div className="space-y-2">
                    <Label htmlFor="appSecret" className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-amber-600" />
                        App Secret
                    </Label>
                    <div className="relative">
                        <Input
                            id="appSecret"
                            type={showSecret ? 'text' : 'password'}
                            value={getValue('whatsappAppSecret') as string}
                            onChange={(e) => handleChange('whatsappAppSecret', e.target.value)}
                            placeholder="abc123secret456"
                            className="pl-10"
                            dir="ltr"
                        />
                        <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        من صفحة <strong>App Settings → Basic</strong> — يُستخدم للتحقق من صحة توقيع الـ Webhook (HMAC-SHA256)
                    </p>
                </div>

                {/* Divider */}
                <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                        إعداد الـ Webhook
                    </h4>
                </div>

                {/* Webhook Verify Token */}
                <div className="space-y-2">
                    <Label htmlFor="webhookToken">Webhook Verify Token</Label>
                    <div className="flex gap-2">
                        <Input
                            id="webhookToken"
                            value={getValue('whatsappWebhookToken') as string}
                            onChange={(e) => handleChange('whatsappWebhookToken', e.target.value)}
                            placeholder="أي نص تختاره أنت (مثال: wasm-secret-2026)"
                            dir="ltr"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleCopyVerifyToken}
                            disabled={!verifyToken}
                            title="نسخ"
                        >
                            {copiedVerify ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        أدخله في خانة <strong>Verify Token</strong> عند ضبط Webhook في Meta
                    </p>
                </div>

                {/* Webhook URL */}
                <div className="space-y-2">
                    <Label>Webhook Callback URL</Label>
                    <div className="flex gap-2">
                        <Input
                            value={webhookUrl}
                            readOnly
                            className="bg-muted font-mono text-sm"
                            dir="ltr"
                        />
                        <Button type="button" variant="outline" size="icon" onClick={handleCopyWebhook} title="نسخ">
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        أضف هذا الرابط في <strong>WhatsApp → Configuration → Webhook</strong> على Meta
                    </p>
                </div>

                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                        <h4 className="font-medium">تفعيل إرسال الرسائل</h4>
                        <p className="text-sm text-muted-foreground">
                            تفعيل الإرسال الفعلي عبر WhatsApp Cloud API
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
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-medium text-yellow-900">وضع العرض التجريبي</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            واتساب Cloud API غير مربوط حالياً. الرسائل ستُحفظ في النظام لكن لن تُرسل فعلياً.
                            أدخل Access Token و Phone Number ID لتفعيل الإرسال الحقيقي.
                        </p>
                    </div>
                </div>
            )}

            {/* Architecture Note */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 space-y-1">
                <p className="font-semibold text-slate-800">ملاحظات مهمة</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>نافذة الرد الحرة: <strong>24 ساعة</strong> من آخر رسالة من العميل — بعدها لا تقدر ترسل إلا Template</li>
                    <li>للأرقام الجديدة: سقف <strong>1000 رسالة/يوم</strong> يتوسّع تلقائياً مع الجودة</li>
                    <li>الـ Webhook يجب أن يكون <strong>HTTPS</strong> — استخدم ngrok للتطوير المحلي</li>
                </ul>
            </div>

            {/* Divider — QR Section */}
            <div className="border-t pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">ربط واتساب عبر QR Code</h3>
                        <p className="text-sm text-muted-foreground">
                            بديل سريع — امسح الباركود مباشرة (بدون API رسمي من Meta)
                        </p>
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2 text-sm text-amber-800">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>هذا الخيار يستخدم مكتبة غير رسمية وقد يؤدي إلى حظر الرقم. يُنصح باستخدام Cloud API أعلاه للبيئات الإنتاجية.</span>
                </div>
                <WhatsappConnect />
            </div>
        </div>
    );
}

export default WhatsAppSettingsPage;

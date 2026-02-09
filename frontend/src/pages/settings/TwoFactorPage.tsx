import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Smartphone, Copy, Check, Loader2, AlertTriangle, QrCode } from 'lucide-react';
import api from '@/api/client';
import { toast } from 'react-hot-toast';

export function TwoFactorPage() {
    const queryClient = useQueryClient();
    const [token, setToken] = useState('');
    const [showBackupCodes, setShowBackupCodes] = useState<string[] | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Check 2FA status
    const { data: statusData, isLoading: statusLoading } = useQuery({
        queryKey: ['2fa', 'status'],
        queryFn: () => api.get('/auth/2fa/status').then(res => res.data),
    });

    const is2FAEnabled = statusData?.enabled;

    // Generate 2FA secret
    const generateMutation = useMutation({
        mutationFn: () => api.post('/auth/2fa/generate').then(res => res.data),
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'فشل في إنشاء السر');
        },
    });

    // Enable 2FA
    const enableMutation = useMutation({
        mutationFn: (token: string) => api.post('/auth/2fa/enable', { token }).then(res => res.data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['2fa', 'status'] });
            setShowBackupCodes(data.backupCodes);
            setToken('');
            toast.success('تم تفعيل المصادقة الثنائية بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'رمز غير صحيح');
        },
    });

    // Disable 2FA
    const disableMutation = useMutation({
        mutationFn: (token: string) => api.post('/auth/2fa/disable', { token }).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['2fa', 'status'] });
            generateMutation.reset();
            setToken('');
            toast.success('تم إلغاء المصادقة الثنائية');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'رمز غير صحيح');
        },
    });

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const copyAllCodes = () => {
        if (showBackupCodes) {
            navigator.clipboard.writeText(showBackupCodes.join('\n'));
            toast.success('تم نسخ جميع الرموز');
        }
    };

    if (statusLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">المصادقة الثنائية (2FA)</h1>
                    <p className="text-muted-foreground">أضف طبقة أمان إضافية لحسابك</p>
                </div>
            </div>

            {/* Status Card */}
            <div className={`p-6 rounded-2xl border ${is2FAEnabled ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30' : 'bg-card'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Smartphone className={`w-5 h-5 ${is2FAEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
                        <div>
                            <p className="font-medium">حالة المصادقة الثنائية</p>
                            <p className={`text-sm ${is2FAEnabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {is2FAEnabled ? 'مفعّلة ✓' : 'غير مفعّلة'}
                            </p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${is2FAEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-muted text-muted-foreground'}`}>
                        {is2FAEnabled ? 'آمن' : 'غير آمن'}
                    </div>
                </div>
            </div>

            {/* Backup Codes Display */}
            {showBackupCodes && (
                <div className="p-6 rounded-2xl border bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30">
                    <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">احفظ رموز النسخ الاحتياطي</p>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                استخدم هذه الرموز إذا فقدت الوصول إلى تطبيق المصادقة. كل رمز يستخدم مرة واحدة فقط.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {showBackupCodes.map((code, index) => (
                            <button
                                key={index}
                                onClick={() => copyToClipboard(code)}
                                className="flex items-center justify-between p-2 bg-white dark:bg-black/20 rounded-lg border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                            >
                                <code className="font-mono text-sm">{code}</code>
                                {copiedCode === code ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={copyAllCodes}
                        className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                    >
                        نسخ جميع الرموز
                    </button>
                </div>
            )}

            {/* Setup Section */}
            {!is2FAEnabled && (
                <div className="p-6 rounded-2xl border bg-card space-y-6">
                    <h2 className="font-semibold flex items-center gap-2">
                        <QrCode className="w-5 h-5" />
                        إعداد المصادقة الثنائية
                    </h2>

                    {!generateMutation.data ? (
                        <div className="text-center space-y-4">
                            <p className="text-muted-foreground">
                                استخدم تطبيق مثل Google Authenticator أو Authy لمسح رمز QR
                            </p>
                            <button
                                onClick={() => generateMutation.mutate()}
                                disabled={generateMutation.isPending}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                            >
                                {generateMutation.isPending ? (
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                ) : (
                                    'بدء الإعداد'
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* QR Code */}
                            <div className="flex justify-center">
                                <img
                                    src={generateMutation.data.qrCode}
                                    alt="QR Code"
                                    className="w-48 h-48 rounded-lg border"
                                />
                            </div>

                            {/* Manual Entry */}
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">أو أدخل الرمز يدوياً:</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 p-2 bg-background rounded border font-mono text-sm break-all">
                                        {generateMutation.data.manualEntry}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(generateMutation.data.manualEntry)}
                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                    >
                                        {copiedCode === generateMutation.data.manualEntry ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Verify Token */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium">
                                    أدخل الرمز من التطبيق للتأكيد:
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="flex-1 px-4 py-3 border rounded-xl text-center font-mono text-lg tracking-widest bg-background"
                                        maxLength={6}
                                    />
                                    <button
                                        onClick={() => enableMutation.mutate(token)}
                                        disabled={token.length !== 6 || enableMutation.isPending}
                                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                                    >
                                        {enableMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'تفعيل'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Disable Section */}
            {is2FAEnabled && (
                <div className="p-6 rounded-2xl border border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/30 space-y-4">
                    <h2 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        إلغاء المصادقة الثنائية
                    </h2>
                    <p className="text-sm text-red-600 dark:text-red-400">
                        إلغاء المصادقة الثنائية سيجعل حسابك أقل أماناً. أدخل الرمز من التطبيق للتأكيد.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="flex-1 px-4 py-3 border rounded-xl text-center font-mono text-lg tracking-widest bg-background"
                            maxLength={6}
                        />
                        <button
                            onClick={() => disableMutation.mutate(token)}
                            disabled={token.length !== 6 || disableMutation.isPending}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                        >
                            {disableMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'إلغاء 2FA'
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TwoFactorPage;

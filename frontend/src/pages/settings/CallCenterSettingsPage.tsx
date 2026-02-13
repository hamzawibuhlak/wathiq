import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { callCenterApi, type CallCenterSettingsData } from '@/api/callCenter';

/* ═══════════════════════════════════════════════════════════
   CallCenterSettingsPage — صفحة إعدادات السنترال
   ═══════════════════════════════════════════════════════════ */

function CallCenterSettingsPage() {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<CallCenterSettingsData>>({});

    // ── Data ─────────────────────────────────────
    const { data: settingsRes, isLoading } = useQuery({
        queryKey: ['call-center-settings'],
        queryFn: callCenterApi.getSettings,
    });
    const settings = settingsRes?.data;

    useEffect(() => {
        if (settings && !isEditing) {
            setFormData(settings);
        }
    }, [settings, isEditing]);

    // ── Mutations ────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: (data: Partial<CallCenterSettingsData>) =>
            callCenterApi.updateSettings(data),
        onSuccess: () => {
            toast.success('تم حفظ الإعدادات بنجاح');
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['call-center-settings'] });
        },
        onError: () => toast.error('فشل حفظ الإعدادات'),
    });

    const testMutation = useMutation({
        mutationFn: () => callCenterApi.testConnection(),
        onSuccess: (result) => {
            const res = result?.data;
            if (res?.success) {
                toast.success('✅ ' + res.message);
            } else {
                toast.error('❌ ' + (res?.message || 'فشل الاتصال'));
            }
            queryClient.invalidateQueries({ queryKey: ['call-center-settings'] });
        },
        onError: () => toast.error('فشل اختبار الاتصال'),
    });

    const syncMutation = useMutation({
        mutationFn: () => callCenterApi.syncCallLogs(),
        onSuccess: (result) => {
            const res = result?.data;
            if (res?.success) {
                toast.success(`تم مزامنة ${res.syncedCount || 0} مكالمة`);
            } else {
                toast.error('فشل المزامنة');
            }
        },
        onError: () => toast.error('فشل المزامنة'),
    });

    // ── Helpers ───────────────────────────────────
    const handleSave = () => updateMutation.mutate(formData);

    const startEditing = () => {
        setFormData(settings || {});
        setIsEditing(true);
    };

    const updateField = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const inputClass = (disabled: boolean) =>
        `w-full px-4 py-2.5 border rounded-lg text-sm transition-colors ${disabled
            ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'
            : 'bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
        }`;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-gray-500 text-sm">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* ═══ Header ═══ */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">إعدادات السنترال</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        ربط UCM6301 عبر GDMS Cloud للتحكم الكامل في الاتصالات
                    </p>
                </div>

                {/* Status Badge */}
                {settings?.isConnected ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-emerald-700 text-sm font-medium">متصل</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                        <span className="text-red-700 text-sm font-medium">غير متصل</span>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {/* ═══════════════════════ UCM Connection ═══════════════════════ */}
                <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">اتصال UCM</h3>
                            <p className="text-gray-500 text-xs">معلومات الاتصال بجهاز السنترال</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">UCM Host / Cloud Domain</label>
                            <input
                                type="text"
                                value={formData.ucmHost ?? ''}
                                onChange={(e) => updateField('ucmHost', e.target.value)}
                                disabled={!isEditing}
                                placeholder="ec74d74943f0.b.gdms.cloud"
                                className={inputClass(!isEditing)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">WebSocket Port</label>
                            <input
                                type="number"
                                value={formData.ucmPort ?? 8089}
                                onChange={(e) => updateField('ucmPort', parseInt(e.target.value))}
                                disabled={!isEditing}
                                placeholder="8089"
                                className={inputClass(!isEditing)}
                            />
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════ GDMS API ═══════════════════════ */}
                <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">GDMS Cloud API</h3>
                            <p className="text-gray-500 text-xs">بيانات تسجيل الدخول ومفاتيح API (من لوحة GDMS → API Developer)</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* GDMS Login Credentials */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم (GDMS Username)</label>
                                <input
                                    type="text"
                                    value={formData.gdmsUsername ?? ''}
                                    onChange={(e) => updateField('gdmsUsername', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="البريد الإلكتروني لحساب GDMS"
                                    className={inputClass(!isEditing)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور (GDMS Password)</label>
                                <input
                                    type="password"
                                    value={formData.gdmsPassword ?? ''}
                                    onChange={(e) => updateField('gdmsPassword', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="••••••••••••••••"
                                    className={inputClass(!isEditing)}
                                />
                            </div>
                        </div>

                        {/* API Client Credentials */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Client ID (API Key)</label>
                                <input
                                    type="password"
                                    value={formData.gdmsApiKey ?? ''}
                                    onChange={(e) => updateField('gdmsApiKey', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="••••••••••••••••"
                                    className={inputClass(!isEditing)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Secret Key</label>
                                <input
                                    type="password"
                                    value={formData.gdmsApiSecret ?? ''}
                                    onChange={(e) => updateField('gdmsApiSecret', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="••••••••••••••••"
                                    className={inputClass(!isEditing)}
                                />
                            </div>
                        </div>

                        {/* Device ID & Account ID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">GDMS Device ID</label>
                                <input
                                    type="text"
                                    value={formData.gdmsDeviceId ?? ''}
                                    onChange={(e) => updateField('gdmsDeviceId', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="ec74d74943f0"
                                    className={inputClass(!isEditing)}
                                />
                                <p className="text-xs text-gray-400 mt-1">MAC Address بدون نقطتين بأحرف صغيرة</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">GDMS Account ID</label>
                                <input
                                    type="text"
                                    value={formData.gdmsAccountId ?? ''}
                                    onChange={(e) => updateField('gdmsAccountId', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="اختياري"
                                    className={inputClass(!isEditing)}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════ Extension Settings ═══════════════════════ */}
                <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">إعدادات Extensions</h3>
                            <p className="text-gray-500 text-xs">نطاق أرقام الداخليات وكلمة المرور</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Extension Prefix</label>
                            <input
                                type="text"
                                value={formData.extensionPrefix ?? '1000'}
                                onChange={(e) => updateField('extensionPrefix', e.target.value)}
                                disabled={!isEditing}
                                className={inputClass(!isEditing)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">من (Start)</label>
                            <input
                                type="number"
                                value={formData.extensionStart ?? 1001}
                                onChange={(e) => updateField('extensionStart', parseInt(e.target.value))}
                                disabled={!isEditing}
                                className={inputClass(!isEditing)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">إلى (End)</label>
                            <input
                                type="number"
                                value={formData.extensionEnd ?? 1099}
                                onChange={(e) => updateField('extensionEnd', parseInt(e.target.value))}
                                disabled={!isEditing}
                                className={inputClass(!isEditing)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
                            <input
                                type="password"
                                value={formData.defaultPassword ?? ''}
                                onChange={(e) => updateField('defaultPassword', e.target.value)}
                                disabled={!isEditing}
                                className={inputClass(!isEditing)}
                            />
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════ Recording Settings ═══════════════════════ */}
                <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">إعدادات التسجيل</h3>
                            <p className="text-gray-500 text-xs">تسجيل المكالمات والاحتفاظ بها</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formData.enableRecording ?? true}
                                onChange={(e) => updateField('enableRecording', e.target.checked)}
                                disabled={!isEditing}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">تفعيل تسجيل المكالمات</span>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">صيغة التسجيل</label>
                                <select
                                    value={formData.recordingFormat ?? 'wav'}
                                    onChange={(e) => updateField('recordingFormat', e.target.value)}
                                    disabled={!isEditing}
                                    className={inputClass(!isEditing)}
                                >
                                    <option value="wav">WAV</option>
                                    <option value="mp3">MP3</option>
                                    <option value="gsm">GSM</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">حذف التسجيلات بعد (يوم)</label>
                                <input
                                    type="number"
                                    value={formData.autoDeleteDays ?? 90}
                                    onChange={(e) => updateField('autoDeleteDays', parseInt(e.target.value) || null)}
                                    disabled={!isEditing}
                                    placeholder="90"
                                    className={inputClass(!isEditing)}
                                />
                                <p className="text-xs text-gray-400 mt-1">اتركه فارغاً للاحتفاظ بالتسجيلات للأبد</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════ Advanced Settings ═══════════════════════ */}
                <details className="bg-white border border-gray-200 rounded-xl shadow-sm group">
                    <summary className="p-6 cursor-pointer select-none flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">إعدادات متقدمة</h3>
                            <p className="text-gray-500 text-xs">STUN, NAT, RTP</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">STUN Server</label>
                                <input
                                    type="text"
                                    value={formData.stunServer ?? 'stun.l.google.com:19302'}
                                    onChange={(e) => updateField('stunServer', e.target.value)}
                                    disabled={!isEditing}
                                    className={inputClass(!isEditing)}
                                />
                            </div>
                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={formData.enableNat ?? true}
                                        onChange={(e) => updateField('enableNat', e.target.checked)}
                                        disabled={!isEditing}
                                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">تفعيل NAT</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">RTP Port Start</label>
                                <input
                                    type="number"
                                    value={formData.rtpPortStart ?? 10000}
                                    onChange={(e) => updateField('rtpPortStart', parseInt(e.target.value))}
                                    disabled={!isEditing}
                                    className={inputClass(!isEditing)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">RTP Port End</label>
                                <input
                                    type="number"
                                    value={formData.rtpPortEnd ?? 20000}
                                    onChange={(e) => updateField('rtpPortEnd', parseInt(e.target.value))}
                                    disabled={!isEditing}
                                    className={inputClass(!isEditing)}
                                />
                            </div>
                        </div>
                    </div>
                </details>

                {/* ═══════════════════════ Action Buttons ═══════════════════════ */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                            >
                                {updateMutation.isPending ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                حفظ الإعدادات
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                            >
                                إلغاء
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={startEditing}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                تعديل الإعدادات
                            </button>
                            <button
                                onClick={() => testMutation.mutate()}
                                disabled={testMutation.isPending}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                            >
                                {testMutation.isPending ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                )}
                                اختبار الاتصال
                            </button>
                            <button
                                onClick={() => syncMutation.mutate()}
                                disabled={syncMutation.isPending}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                            >
                                {syncMutation.isPending ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )}
                                مزامنة المكالمات
                            </button>
                        </>
                    )}
                </div>

                {/* ═══ Last Sync / Error ═══ */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                    {settings?.lastSync && (
                        <span>
                            آخر مزامنة:{' '}
                            {new Date(settings.lastSync).toLocaleString('ar-SA')}
                        </span>
                    )}
                    {settings?.lastError && (
                        <span className="text-red-400">
                            آخر خطأ: {settings.lastError}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CallCenterSettingsPage;

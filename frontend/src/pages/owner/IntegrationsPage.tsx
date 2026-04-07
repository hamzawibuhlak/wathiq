/**
 * صفحة الربط والتكاملات
 * 7 تكاملات: SMTP، واتساب، مركز الاتصال، نفاذ، زاتكا، أبشر، جوجل كالندر
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import {
    Link2, CheckCircle, XCircle, Play, Power, Settings,
    ExternalLink, Zap, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Config
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const INTEGRATION_META: Record<string, {
    gradient: string;
    bgLight: string;
    settingsPath?: string;
    featurePath?: string;
    description: string;
    category: 'communication' | 'government' | 'productivity';
}> = {
    EMAIL_SMTP: {
        gradient: 'from-blue-500 to-blue-600',
        bgLight: 'bg-blue-50 border-blue-100 text-blue-700',
        settingsPath: 'settings/email',
        description: 'إرسال واستقبال رسائل البريد الإلكتروني عبر خادم SMTP',
        category: 'communication',
    },
    WHATSAPP: {
        gradient: 'from-green-500 to-green-600',
        bgLight: 'bg-green-50 border-green-100 text-green-700',
        settingsPath: 'settings/whatsapp',
        featurePath: 'whatsapp',
        description: 'التواصل مع العملاء عبر واتساب بزنس API',
        category: 'communication',
    },
    CALL_CENTER: {
        gradient: 'from-violet-500 to-violet-600',
        bgLight: 'bg-violet-50 border-violet-100 text-violet-700',
        settingsPath: 'settings/call-center',
        featurePath: 'calls',
        description: 'إدارة المكالمات الهاتفية وتسجيلها وتتبعها',
        category: 'communication',
    },
    NAFATH: {
        gradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        description: 'التحقق من هوية العملاء عبر منصة نفاذ الوطنية',
        category: 'government',
    },
    ZATCA: {
        gradient: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50 border-amber-100 text-amber-700',
        description: 'الربط مع هيئة الزكاة والضريبة والجمارك للفوترة الإلكترونية',
        category: 'government',
    },
    ABSHER: {
        gradient: 'from-cyan-500 to-cyan-600',
        bgLight: 'bg-cyan-50 border-cyan-100 text-cyan-700',
        description: 'الاستعلام عن بيانات الأفراد عبر منصة أبشر الحكومية',
        category: 'government',
    },
    GOOGLE_CALENDAR: {
        gradient: 'from-red-500 to-rose-600',
        bgLight: 'bg-red-50 border-red-100 text-red-700',
        description: 'مزامنة المواعيد والأحداث مع تقويم جوجل',
        category: 'productivity',
    },
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
    communication: { label: 'التواصل والاتصالات', icon: '📡' },
    government: { label: 'الخدمات الحكومية', icon: '🏛️' },
    productivity: { label: 'الإنتاجية', icon: '⚡' },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function IntegrationsPage() {
    const queryClient = useQueryClient();
    const { slug } = useParams<{ slug: string }>();

    const { data: integrations = [], isLoading } = useQuery({
        queryKey: ['owner-integrations'],
        queryFn: ownerApi.getIntegrations,
    });

    const testMutation = useMutation({
        mutationFn: (type: string) => ownerApi.testIntegration(type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-integrations'] });
            toast.success('تم اختبار التكامل بنجاح ✅');
        },
        onError: () => toast.error('فشل اختبار التكامل'),
    });

    const toggleMutation = useMutation({
        mutationFn: (type: string) => ownerApi.toggleIntegration(type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-integrations'] });
            toast.success('تم تحديث حالة التكامل');
        },
    });

    // Group by category
    const grouped = integrations.reduce((acc: Record<string, any[]>, int: any) => {
        const meta = INTEGRATION_META[int.type];
        const cat = meta?.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(int);
        return acc;
    }, {});

    const categoryOrder = ['communication', 'government', 'productivity'];

    // Stats
    const configured = integrations.filter((i: any) => i.isConfigured).length;
    const active = integrations.filter((i: any) => i.isActive).length;

    return (
        <div className="p-8 max-w-[1400px] mx-auto" dir="rtl">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
                        <Link2 className="w-5 h-5 text-white" />
                    </div>
                    الربط والتكاملات
                </h1>
                <p className="text-sm text-gray-500 mt-2 mr-[52px]">
                    ربط النظام بالخدمات الخارجية والحكومية
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
                            <p className="text-xs text-gray-500">تكامل متاح</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Settings className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{configured}</p>
                            <p className="text-xs text-gray-500">تم إعداده</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{active}</p>
                            <p className="text-xs text-gray-500">مفعّل الآن</p>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                        <div key={i} className="h-52 bg-gray-50 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="space-y-8">
                    {categoryOrder.map(cat => {
                        const items = grouped[cat];
                        if (!items || items.length === 0) return null;
                        const catInfo = CATEGORY_LABELS[cat];

                        return (
                            <div key={cat}>
                                {/* Category Header */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-lg">{catInfo.icon}</span>
                                    <h2 className="font-bold text-gray-800">{catInfo.label}</h2>
                                    <div className="flex-1 h-px bg-gray-100 mr-3" />
                                </div>

                                {/* Integration Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {items.map((int: any) => {
                                        const meta = INTEGRATION_META[int.type];
                                        if (!meta) return null;

                                        return (
                                            <div
                                                key={int.type}
                                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                                            >
                                                {/* Gradient Top Bar */}
                                                <div className={`h-1.5 bg-gradient-to-l ${meta.gradient}`} />

                                                <div className="p-5">
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-2xl shadow-sm`}>
                                                                {int.icon}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900 text-sm">{int.name}</h3>
                                                                <span className="text-[10px] text-gray-400 font-mono">{int.type}</span>
                                                            </div>
                                                        </div>
                                                        {int.isConfigured && (
                                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border flex items-center gap-1 ${
                                                                int.isActive
                                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                                    : 'bg-gray-50 text-gray-500 border-gray-200'
                                                            }`}>
                                                                {int.isActive ? (
                                                                    <><CheckCircle className="w-3 h-3" /> مفعّل</>
                                                                ) : (
                                                                    <><XCircle className="w-3 h-3" /> معطّل</>
                                                                )}
                                                            </span>
                                                        )}
                                                        {!int.isConfigured && meta.settingsPath && (
                                                            <span className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3" /> متاح
                                                            </span>
                                                        )}
                                                        {!int.isConfigured && !meta.settingsPath && (
                                                            <span className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-gray-50 text-gray-400 border border-gray-100">
                                                                قريباً
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Description */}
                                                    <p className="text-xs text-gray-500 leading-relaxed mb-4">{meta.description}</p>

                                                    {/* Last Test */}
                                                    {int.lastTestedAt && (
                                                        <div className="flex items-center gap-2 mb-3 text-[10px] text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                                                            آخر اختبار: {new Date(int.lastTestedAt).toLocaleDateString('ar-SA')}
                                                            {int.lastTestOk ? (
                                                                <span className="text-green-600">✅ ناجح</span>
                                                            ) : (
                                                                <span className="text-red-600">❌ فاشل</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        {int.isConfigured ? (
                                                            <>
                                                                <button
                                                                    onClick={() => testMutation.mutate(int.type)}
                                                                    disabled={testMutation.isPending}
                                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
                                                                >
                                                                    <Play className="w-3.5 h-3.5" />
                                                                    اختبار
                                                                </button>
                                                                <button
                                                                    onClick={() => toggleMutation.mutate(int.type)}
                                                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl transition-colors ${
                                                                        int.isActive
                                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                                                                            : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100'
                                                                    }`}
                                                                >
                                                                    <Power className="w-3.5 h-3.5" />
                                                                    {int.isActive ? 'تعطيل' : 'تفعيل'}
                                                                </button>
                                                                {meta.settingsPath && (
                                                                    <Link
                                                                        to={`/${slug}/${meta.settingsPath}`}
                                                                        className="flex items-center justify-center p-2.5 text-gray-400 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-600 transition-colors"
                                                                    >
                                                                        <Settings className="w-4 h-4" />
                                                                    </Link>
                                                                )}
                                                            </>
                                                        ) : meta.settingsPath ? (
                                                            <Link
                                                                to={`/${slug}/${meta.settingsPath}`}
                                                                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium rounded-xl text-white bg-gradient-to-l ${meta.gradient} hover:opacity-90 transition-opacity shadow-sm`}
                                                            >
                                                                <Settings className="w-3.5 h-3.5" />
                                                                إعداد وتفعيل
                                                                <ArrowUpRight className="w-3 h-3" />
                                                            </Link>
                                                        ) : (
                                                            <div className="w-full px-3 py-2.5 text-xs text-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                                                                🔜 قريباً — سيتم دعم هذا التكامل
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Feature page link */}
                                                    {int.isConfigured && int.isActive && meta.featurePath && (
                                                        <Link
                                                            to={`/${slug}/${meta.featurePath}`}
                                                            className="mt-3 flex items-center justify-center gap-2 px-3 py-2 text-xs text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors font-medium"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            فتح الصفحة
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

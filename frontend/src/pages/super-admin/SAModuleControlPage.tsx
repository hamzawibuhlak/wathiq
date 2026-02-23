import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { superAdminApi } from '@/api/superAdmin';
import { MODULES, CATEGORY_LABELS } from '@/constants/modules.constants';
import toast from 'react-hot-toast';
import {
    ArrowRight,
    Shield,
    Sparkles,
    Clock,
    ToggleLeft,
    ToggleRight,
    Zap,
    Search,
    Loader2,
    AlertTriangle,
    History,
    Crown,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    XCircle,
    Lock,
} from 'lucide-react';

interface ChangeLogEntry {
    id: string;
    moduleKey: string;
    action: string;
    previousValue: boolean;
    newValue: boolean;
    reason?: string;
    createdAt: string;
    changer: { name: string; email: string };
}

export default function SAModuleControlPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [modules, setModules] = useState<Record<string, { enabled: boolean; features?: Record<string, boolean> }>>({});
    const [changelog, setChangelog] = useState<ChangeLogEntry[]>([]);
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [updatingFeature, setUpdatingFeature] = useState<string | null>(null);
    const [applyingPlan, setApplyingPlan] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showChangelog, setShowChangelog] = useState(false);
    const [reason, setReason] = useState('');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    const toggleExpand = (key: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // Fetch data
    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                setLoading(true);
                const [mods, tenantData, logs] = await Promise.all([
                    superAdminApi.getTenantModules(id),
                    superAdminApi.getTenantDetails(id),
                    superAdminApi.getTenantModuleChangelog(id),
                ]);
                setModules(mods);
                setTenant(tenantData);
                setChangelog(logs);
            } catch (err: any) {
                toast.error('فشل تحميل البيانات');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Toggle a single module
    const handleToggle = async (moduleKey: string, currentEnabled: boolean) => {
        const def = MODULES[moduleKey];
        if (def?.isCore) {
            toast.error('لا يمكن تعطيل الأقسام الأساسية');
            return;
        }

        setUpdating(moduleKey);
        try {
            await superAdminApi.updateTenantModule(id!, moduleKey, !currentEnabled, reason || undefined);
            // Re-fetch to get the cascaded features
            const updated = await superAdminApi.getTenantModules(id!);
            setModules(updated);
            toast.success(!currentEnabled ? `تم تفعيل ${def?.nameAr || moduleKey}` : `تم تعطيل ${def?.nameAr || moduleKey}`);
            setReason('');
            const logs = await superAdminApi.getTenantModuleChangelog(id!);
            setChangelog(logs);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'فشل التحديث');
        } finally {
            setUpdating(null);
        }
    };

    // Toggle a single feature
    const handleFeatureToggle = async (moduleKey: string, featureKey: string, currentEnabled: boolean) => {
        const def = MODULES[moduleKey];
        const featureDef = def?.features.find(f => f.key === featureKey);
        if (featureDef?.isCore) {
            toast.error('لا يمكن تعطيل المميزات الأساسية');
            return;
        }

        const featureId = `${moduleKey}.${featureKey}`;
        setUpdatingFeature(featureId);
        try {
            await superAdminApi.updateTenantFeature(id!, moduleKey, featureKey, !currentEnabled, reason || undefined);
            setModules(prev => ({
                ...prev,
                [moduleKey]: {
                    ...prev[moduleKey],
                    features: {
                        ...(prev[moduleKey]?.features || {}),
                        [featureKey]: !currentEnabled,
                    },
                },
            }));
            toast.success(!currentEnabled
                ? `تم تفعيل: ${featureDef?.labelAr || featureKey}`
                : `تم تعطيل: ${featureDef?.labelAr || featureKey}`);
            setReason('');
            const logs = await superAdminApi.getTenantModuleChangelog(id!);
            setChangelog(logs);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'فشل تحديث الميزة');
        } finally {
            setUpdatingFeature(null);
        }
    };

    // Apply plan defaults
    const handleApplyPlan = async (plan: string) => {
        setApplyingPlan(plan);
        try {
            const result = await superAdminApi.applyPlanModules(id!, plan);
            setModules(result.modules);
            toast.success(`تم تطبيق إعدادات باقة ${plan === 'BASIC' ? 'أساسية' : plan === 'PROFESSIONAL' ? 'احترافية' : 'متقدمة'}`);
            const logs = await superAdminApi.getTenantModuleChangelog(id!);
            setChangelog(logs);
        } catch {
            toast.error('فشل تطبيق الباقة');
        } finally {
            setApplyingPlan(null);
        }
    };

    // Filter modules by search (include description and features)
    const filteredModules = Object.values(MODULES).filter(m => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            m.nameAr.includes(searchQuery) ||
            m.nameEn.toLowerCase().includes(q) ||
            m.key.includes(searchQuery) ||
            m.descriptionAr?.includes(searchQuery) ||
            m.features?.some(f => f.labelAr.includes(searchQuery))
        );
    });

    // Group by category
    const groupedModules = filteredModules.reduce((acc, mod) => {
        const cat = mod.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(mod);
        return acc;
    }, {} as Record<string, typeof filteredModules>);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const planLabel = (plan: string) =>
        plan === 'BASIC' ? 'أساسية' :
            plan === 'PROFESSIONAL' ? 'احترافية' : 'متقدمة';

    return (
        <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`/super-admin/tenants/${id}`)}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-indigo-500" />
                                    إدارة الأقسام والمميزات
                                </h1>
                                {tenant && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {tenant.name} — باقة {planLabel(tenant.planType)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowChangelog(!showChangelog)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm"
                            >
                                <History className="w-4 h-4" />
                                سجل التغييرات
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* Plan Quick-Apply */}
                <div className="bg-gradient-to-l from-indigo-50 to-white dark:from-indigo-950/30 dark:to-slate-800 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <Crown className="w-6 h-6 text-amber-500" />
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">تطبيق إعدادات الباقة</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    تفعيل/تعطيل الأقسام والمميزات تلقائياً حسب مستوى الباقة
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {['BASIC', 'PROFESSIONAL', 'ENTERPRISE'].map(plan => (
                                <button
                                    key={plan}
                                    onClick={() => handleApplyPlan(plan)}
                                    disabled={!!applyingPlan}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${tenant?.planType === plan
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md'
                                        } ${applyingPlan === plan ? 'opacity-50' : ''}`}
                                >
                                    {applyingPlan === plan ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-4" />
                                    ) : (
                                        planLabel(plan)
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Search + Reason */}
                <div className="flex gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="ابحث عن قسم أو ميزة..."
                            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                    </div>
                    <input
                        type="text"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="سبب التغيير (اختياري)..."
                        className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                </div>

                {/* Modules Grid by Category */}
                {Object.entries(groupedModules).map(([category, items]) => (
                    <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {CATEGORY_LABELS[category]?.ar || category}
                            </h2>
                            <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {items.length} أقسام
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.map(mod => {
                                const isEnabled = modules[mod.key]?.enabled !== false;
                                const isUpdating = updating === mod.key;
                                const isExpanded = expandedModules.has(mod.key);
                                const moduleFeatures = modules[mod.key]?.features || {};
                                const enabledFeaturesCount = mod.features.filter(f => moduleFeatures[f.key] !== false).length;

                                return (
                                    <div
                                        key={mod.key}
                                        className={`rounded-2xl border transition-all duration-300 ${isEnabled
                                            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800 opacity-70'
                                            } ${mod.isCore ? 'ring-1 ring-indigo-200 dark:ring-indigo-800' : ''}`}
                                    >
                                        {/* Card Header */}
                                        <div className="p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isEnabled
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                        }`}>
                                                        {mod.isPremium ? (
                                                            <Sparkles className="w-5 h-5" />
                                                        ) : mod.isCore ? (
                                                            <Shield className="w-5 h-5" />
                                                        ) : (
                                                            <Zap className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`font-semibold text-sm ${isEnabled ? 'text-slate-900 dark:text-white' : 'text-slate-500'
                                                            }`}>
                                                            {mod.nameAr}
                                                        </h3>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                                            {mod.nameEn}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleToggle(mod.key, isEnabled)}
                                                    disabled={mod.isCore || isUpdating}
                                                    className={`transition-all duration-200 flex-shrink-0 ${mod.isCore ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
                                                        }`}
                                                    title={mod.isCore ? 'قسم أساسي — لا يمكن تعطيله' : isEnabled ? 'تعطيل' : 'تفعيل'}
                                                >
                                                    {isUpdating ? (
                                                        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                                                    ) : isEnabled ? (
                                                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                                                    ) : (
                                                        <ToggleLeft className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Description */}
                                            {mod.descriptionAr && (
                                                <p className={`mt-2 text-xs leading-relaxed ${isEnabled ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {mod.descriptionAr}
                                                </p>
                                            )}

                                            {/* Badges + Expand */}
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {mod.isCore && (
                                                        <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                            <Shield className="w-3 h-3" /> أساسي
                                                        </span>
                                                    )}
                                                    {mod.isPremium && (
                                                        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                                            <Sparkles className="w-3 h-3" /> متقدم
                                                        </span>
                                                    )}
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isEnabled
                                                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                                        : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {isEnabled ? 'مفعّل' : 'معطّل'}
                                                    </span>
                                                    {mod.features.length > 0 && (
                                                        <span className="text-xs text-slate-400 dark:text-slate-500">
                                                            {enabledFeaturesCount}/{mod.features.length} مميزات مفعّلة
                                                        </span>
                                                    )}
                                                </div>

                                                {mod.features.length > 0 && (
                                                    <button
                                                        onClick={() => toggleExpand(mod.key)}
                                                        className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                                                    >
                                                        {isExpanded ? (
                                                            <>إخفاء <ChevronUp className="w-3.5 h-3.5" /></>
                                                        ) : (
                                                            <>المميزات <ChevronDown className="w-3.5 h-3.5" /></>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expandable Features List — Toggleable */}
                                        {isExpanded && mod.features.length > 0 && (
                                            <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-2xl">
                                                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/30">
                                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                        المميزات — {enabledFeaturesCount} من {mod.features.length} مفعّلة
                                                    </p>
                                                </div>
                                                <ul className="divide-y divide-slate-100 dark:divide-slate-700/30">
                                                    {mod.features.map(feature => {
                                                        const featureEnabled = isEnabled && moduleFeatures[feature.key] !== false;
                                                        const isFeatureUpdating = updatingFeature === `${mod.key}.${feature.key}`;
                                                        const isCoreFeature = feature.isCore;
                                                        const moduleDisabled = !isEnabled;

                                                        return (
                                                            <li
                                                                key={feature.key}
                                                                className={`flex items-center justify-between px-5 py-2.5 transition ${moduleDisabled ? 'opacity-40' : ''
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    {featureEnabled ? (
                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                                    ) : (
                                                                        <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                                                    )}
                                                                    <span className={`text-xs ${featureEnabled ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                                                                        {feature.labelAr}
                                                                    </span>
                                                                    {isCoreFeature && (
                                                                        <Lock className="w-3 h-3 text-indigo-400" />
                                                                    )}
                                                                </div>

                                                                <button
                                                                    onClick={() => handleFeatureToggle(mod.key, feature.key, featureEnabled)}
                                                                    disabled={moduleDisabled || isCoreFeature || isFeatureUpdating}
                                                                    className={`transition-all duration-200 ${moduleDisabled || isCoreFeature
                                                                        ? 'cursor-not-allowed opacity-40'
                                                                        : 'cursor-pointer hover:scale-110'
                                                                        }`}
                                                                    title={
                                                                        moduleDisabled
                                                                            ? 'فعّل القسم أولاً'
                                                                            : isCoreFeature
                                                                                ? 'ميزة أساسية — لا يمكن تعطيلها'
                                                                                : featureEnabled
                                                                                    ? 'تعطيل'
                                                                                    : 'تفعيل'
                                                                    }
                                                                >
                                                                    {isFeatureUpdating ? (
                                                                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                                                    ) : featureEnabled ? (
                                                                        <ToggleRight className="w-6 h-6 text-emerald-500" />
                                                                    ) : (
                                                                        <ToggleLeft className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                                                    )}
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Changelog Panel */}
                {showChangelog && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-500" />
                                سجل التغييرات
                            </h3>
                            <button
                                onClick={() => setShowChangelog(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                            >
                                ✕
                            </button>
                        </div>
                        {changelog.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                لا توجد تغييرات بعد
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-96 overflow-y-auto">
                                {changelog.map(log => {
                                    const logParts = log.moduleKey.split('.');
                                    const modKey = logParts[0];
                                    const featureKey = logParts[1];
                                    const mod = MODULES[modKey];
                                    const feature = featureKey ? mod?.features.find(f => f.key === featureKey) : null;

                                    return (
                                        <div key={log.id} className="px-6 py-3 flex items-center gap-4 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.action.includes('ENABLE') || log.action.includes('APPLY')
                                                ? 'bg-emerald-500'
                                                : 'bg-red-500'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-slate-900 dark:text-white">
                                                    <span className="font-medium">{log.changer?.name}</span>
                                                    {' '}
                                                    {log.action.startsWith('APPLY_PLAN')
                                                        ? `طبّق باقة ${log.action.replace('APPLY_PLAN_', '')}`
                                                        : log.action === 'ENABLE'
                                                            ? `فعّل ${mod?.nameAr || log.moduleKey}`
                                                            : log.action === 'DISABLE'
                                                                ? `عطّل ${mod?.nameAr || log.moduleKey}`
                                                                : log.action === 'ENABLE_FEATURE'
                                                                    ? `فعّل ميزة "${feature?.labelAr || featureKey}" في ${mod?.nameAr || modKey}`
                                                                    : log.action === 'DISABLE_FEATURE'
                                                                        ? `عطّل ميزة "${feature?.labelAr || featureKey}" في ${mod?.nameAr || modKey}`
                                                                        : log.action
                                                    }
                                                </p>
                                                {log.reason && (
                                                    <p className="text-xs text-slate-400 truncate">{log.reason}</p>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleDateString('ar-SA', {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

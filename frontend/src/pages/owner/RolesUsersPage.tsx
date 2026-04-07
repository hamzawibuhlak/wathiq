/**
 * صفحة الأدوار والمستخدمين - 3 تبويبات:
 * 1. الأدوار (مدير، محامي، مستشار، محاسب، مسوق + إضافة/تعديل/حذف)
 * 2. الصلاحيات (إدارة صلاحيات الوصول لكل دور)
 * 3. المستخدمين (إضافة مستخدم مع اختيار الدور)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { tenantRolesApi, type TenantRole } from '@/api/tenantRoles';
import {
    Users, Shield, Plus, X, Pencil, Trash2,
    Power, Search, Copy, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type TabType = 'roles' | 'permissions' | 'users';

const ICON_MAP: Record<string, string> = {
    scale: '⚖️', 'book-open': '📖', clipboard: '📋', calculator: '🧮',
    'graduation-cap': '🎓', shield: '🛡️', star: '⭐', user: '👤',
};

interface Role {
    id: string;
    name: string;
    nameEn?: string;
    isActive: boolean;
    createdAt: string;
}

// الألوان لكل دور
const ROLE_COLORS: Record<string, string> = {
    'المالك': 'from-amber-500 to-amber-600',
    'مدير': 'from-blue-500 to-blue-600',
    'محامي': 'from-emerald-500 to-emerald-600',
    'مستشار': 'from-violet-500 to-violet-600',
    'محاسب': 'from-orange-500 to-orange-600',
    'مسوق': 'from-pink-500 to-pink-600',
};

const ROLE_BG: Record<string, string> = {
    'المالك': 'bg-amber-50 text-amber-700 border-amber-200',
    'مدير': 'bg-blue-50 text-blue-700 border-blue-200',
    'محامي': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'مستشار': 'bg-violet-50 text-violet-700 border-violet-200',
    'محاسب': 'bg-orange-50 text-orange-700 border-orange-200',
    'مسوق': 'bg-pink-50 text-pink-700 border-pink-200',
};

const ROLE_ICONS: Record<string, string> = {
    'المالك': '👑',
    'مدير': '👔',
    'محامي': '⚖️',
    'مستشار': '📋',
    'محاسب': '🧮',
    'مسوق': '📢',
};

// الأدوار الافتراضية
const DEFAULT_ROLES = [
    { name: 'مدير', nameEn: 'Manager' },
    { name: 'محامي', nameEn: 'Lawyer' },
    { name: 'مستشار', nameEn: 'Consultant' },
    { name: 'محاسب', nameEn: 'Accountant' },
    { name: 'مسوق', nameEn: 'Marketer' },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function RolesUsersPage() {
    const [activeTab, setActiveTab] = useState<TabType>('roles');

    const tabs: { key: TabType; label: string; icon: any }[] = [
        { key: 'roles', label: 'الأدوار', icon: Shield },
        { key: 'permissions', label: 'الصلاحيات', icon: Lock },
        { key: 'users', label: 'المستخدمين', icon: Users },
    ];

    return (
        <div className="p-8 max-w-[1400px] mx-auto" dir="rtl">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    الأدوار والمستخدمين
                </h1>
                <p className="text-sm text-gray-500 mt-2 mr-[52px]">
                    إدارة أدوار الموظفين والصلاحيات وحساباتهم
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-gray-100/80 p-1.5 rounded-2xl w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? 'bg-white text-gray-900 shadow-sm shadow-gray-200/60 ring-1 ring-gray-200/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500' : ''}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-200">
                {activeTab === 'roles' && <RolesTab />}
                {activeTab === 'permissions' && <PermissionsTab />}
                {activeTab === 'users' && <UsersTab />}
            </div>
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tab 1: الأدوار
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function RolesTab() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Role | null>(null);
    const [form, setForm] = useState({ name: '', nameEn: '' });
    const [search, setSearch] = useState('');
    const [seeding, setSeeding] = useState(false);

    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['owner-job-titles'],
        queryFn: ownerApi.getJobTitles,
    });

    const createMutation = useMutation({
        mutationFn: (data: { name: string; nameEn?: string }) => ownerApi.createJobTitle(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-job-titles'] });
            toast.success('تم إضافة الدور');
            closeForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; nameEn?: string } }) =>
            ownerApi.updateJobTitle(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-job-titles'] });
            toast.success('تم تحديث الدور');
            closeForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => ownerApi.deleteJobTitle(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-job-titles'] });
            toast.success('تم حذف الدور');
        },
    });

    // إنشاء الأدوار الافتراضية
    const seedDefaultRoles = async () => {
        setSeeding(true);
        try {
            for (const role of DEFAULT_ROLES) {
                const exists = roles.find((r: Role) => r.name === role.name);
                if (!exists) {
                    await ownerApi.createJobTitle(role);
                }
            }
            queryClient.invalidateQueries({ queryKey: ['owner-job-titles'] });
            toast.success('تم إنشاء الأدوار الافتراضية');
        } catch {
            // handled by interceptor
        } finally {
            setSeeding(false);
        }
    };

    const openForm = (item?: Role) => {
        if (item) {
            setEditingItem(item);
            setForm({ name: item.name, nameEn: item.nameEn || '' });
        } else {
            setEditingItem(null);
            setForm({ name: '', nameEn: '' });
        }
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingItem(null);
        setForm({ name: '', nameEn: '' });
    };

    const handleSubmit = () => {
        if (!form.name.trim()) return;
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const handleDelete = (item: Role) => {
        if (window.confirm(`هل أنت متأكد من حذف دور "${item.name}"؟`)) {
            deleteMutation.mutate(item.id);
        }
    };

    const filtered = roles.filter(
        (r: Role) =>
            r.name.includes(search) ||
            (r.nameEn && r.nameEn.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-500" />
                            الأدوار
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            أضف وعدّل أدوار الموظفين في مكتبك
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {roles.length === 0 && !isLoading && (
                            <button
                                onClick={seedDefaultRoles}
                                disabled={seeding}
                                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                {seeding ? '⏳ جاري الإنشاء...' : '🌱 أدوار افتراضية'}
                            </button>
                        )}
                        <button
                            onClick={() => openForm()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-l from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm shadow-indigo-200 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            إضافة دور
                        </button>
                    </div>
                </div>

                {/* Search */}
                {roles.length > 0 && (
                    <div className="px-6 py-4 border-b border-gray-50">
                        <div className="relative max-w-sm">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="بحث..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* Roles Grid */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-28 bg-gray-50 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">لا توجد أدوار بعد</p>
                            <p className="text-sm text-gray-400 mt-1">أضف الأدوار الافتراضية أو أنشئ دوراً جديداً</p>
                            <button
                                onClick={seedDefaultRoles}
                                disabled={seeding}
                                className="mt-4 px-5 py-2.5 bg-gradient-to-l from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 text-sm font-medium shadow-sm"
                            >
                                🌱 إنشاء الأدوار الافتراضية
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((item: Role) => {
                                const gradient = ROLE_COLORS[item.name] || 'from-gray-500 to-gray-600';
                                const icon = ROLE_ICONS[item.name] || '👤';
                                return (
                                    <div
                                        key={item.id}
                                        className="relative bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all group overflow-hidden"
                                    >
                                        {/* Gradient top bar */}
                                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-l ${gradient}`} />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl shadow-sm`}>
                                                    {icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                                                    {item.nameEn && (
                                                        <span className="text-xs text-gray-400">{item.nameEn}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openForm(item)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" dir="rtl">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-indigo-50 to-white">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-500" />
                                {editingItem ? 'تعديل الدور' : 'إضافة دور جديد'}
                            </h2>
                            <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الدور بالعربي *</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                                    placeholder="مثال: محامي، مستشار، مساعد إداري"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الدور بالإنجليزي (اختياري)</label>
                                <input
                                    value={form.nameEn}
                                    onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                                    placeholder="e.g. Lawyer, Consultant"
                                    dir="ltr"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 py-2.5 bg-gradient-to-l from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-sm font-medium transition-all shadow-sm"
                                >
                                    {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة'}
                                </button>
                                <button
                                    onClick={closeForm}
                                    className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tab 2: الصلاحيات
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function PermissionsTab() {
    const navigate = useNavigate();
    const [roles, setRoles] = useState<TenantRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const data = await tenantRolesApi.getRoles();
            setRoles(data);
        } catch {
            // handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    const handleSeedRoles = async () => {
        try {
            setSeeding(true);
            await tenantRolesApi.seedRoles();
            toast.success('تم إنشاء الصلاحيات الافتراضية بنجاح');
            await loadRoles();
        } catch {
            // handled by interceptor
        } finally {
            setSeeding(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
        try {
            await tenantRolesApi.deleteRole(id);
            toast.success('تم حذف مجموعة الصلاحيات');
            setRoles((prev) => prev.filter((r) => r.id !== id));
        } catch {
            // handled by interceptor
        }
    };

    const handleClone = async (id: string, name: string) => {
        const newName = prompt('أدخل اسم المجموعة الجديدة:', `${name} (نسخة)`);
        if (!newName) return;
        try {
            await tenantRolesApi.cloneRole(id, newName);
            toast.success(`تم نسخ الصلاحيات كـ "${newName}"`);
            await loadRoles();
        } catch {
            // handled by interceptor
        }
    };

    const getPermissionProgress = (enabled: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((enabled / total) * 100);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-500" />
                        الصلاحيات
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">تحكم في صلاحيات الوصول لكل دور داخل مكتبك</p>
                </div>
                <div className="flex gap-2">
                    {roles.length === 0 && !loading && (
                        <button
                            onClick={handleSeedRoles}
                            disabled={seeding}
                            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            {seeding ? '⏳ جاري الإنشاء...' : '🌱 صلاحيات افتراضية'}
                        </button>
                    )}
                    <button
                        onClick={() => navigate('new')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-l from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm shadow-indigo-200 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        إنشاء مجموعة صلاحيات
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-gray-50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : roles.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">لا توجد مجموعات صلاحيات بعد</p>
                        <p className="text-sm text-gray-400 mt-1">ابدأ بإنشاء الصلاحيات الافتراضية أو أنشئ مجموعة جديدة</p>
                        <button
                            onClick={handleSeedRoles}
                            disabled={seeding}
                            className="mt-4 px-5 py-2.5 bg-gradient-to-l from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 text-sm font-medium shadow-sm"
                        >
                            🌱 إنشاء الصلاحيات الافتراضية
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roles.map((role) => {
                            const progress = getPermissionProgress(role.enabledPermissions, role.totalPermissions);
                            return (
                                <div
                                    key={role.id}
                                    className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                                    style={{ borderTop: `3px solid ${role.color}` }}
                                >
                                    {/* Role Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-xl">
                                            {ICON_MAP[role.icon] || '🛡️'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-sm truncate">{role.name}</h3>
                                            {role.nameEn && (
                                                <span className="text-xs text-gray-400">{role.nameEn}</span>
                                            )}
                                        </div>
                                        {role.isSystem && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">
                                                نظام
                                            </span>
                                        )}
                                    </div>

                                    {role.description && (
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{role.description}</p>
                                    )}

                                    {/* Stats */}
                                    <div className="flex gap-4 mb-3">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900">{role.usersCount}</p>
                                            <p className="text-[10px] text-gray-400">مستخدم</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900">{role.enabledPermissions}</p>
                                            <p className="text-[10px] text-gray-400">صلاحية</p>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-[10px] text-gray-400">الصلاحيات</span>
                                            <span className="text-[10px] font-semibold text-gray-600">{progress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%`, backgroundColor: role.color }}
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-1.5 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => navigate(`${role.id}`)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                            title="تعديل"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            تعديل
                                        </button>
                                        <button
                                            onClick={() => handleClone(role.id, role.name)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            title="نسخ"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            نسخ
                                        </button>
                                        {!role.isSystem && (
                                            <button
                                                onClick={() => handleDelete(role.id, role.name)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                حذف
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tab 3: المستخدمين
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function UsersTab() {
    const queryClient = useQueryClient();
    const [showInvite, setShowInvite] = useState(false);
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', phone: '', role: 'LAWYER', title: '', tenantRoleId: '' });
    const [roles, setRoles] = useState<Role[]>([]);
    const [tenantRoles, setTenantRoles] = useState<TenantRole[]>([]);
    const [editUser, setEditUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'LAWYER', title: '', tenantRoleId: '' });
    const [createdUser, setCreatedUser] = useState<{ email: string; tempPassword: string } | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        ownerApi.getJobTitles().then(setRoles).catch(() => {});
        tenantRolesApi.getRoles().then(setTenantRoles).catch(() => {});
    }, []);

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['owner-users'],
        queryFn: ownerApi.getUsers,
    });

    const inviteMutation = useMutation({
        mutationFn: (data: typeof inviteForm) => ownerApi.inviteUser(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['owner-users'] });
            setCreatedUser({ email: result.email, tempPassword: result.tempPassword });
            setShowInvite(false);
            setInviteForm({ name: '', email: '', phone: '', role: 'LAWYER', title: '', tenantRoleId: '' });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل إنشاء الحساب'),
    });

    const toggleMutation = useMutation({
        mutationFn: (userId: string) => ownerApi.toggleUserStatus(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-users'] });
            toast.success('تم تحديث حالة المستخدم');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => ownerApi.deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-users'] });
            toast.success('تم حذف المستخدم');
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل حذف المستخدم'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: any }) => ownerApi.updateUser(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-users'] });
            toast.success('تم تحديث بيانات المستخدم');
            setEditUser(null);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل تحديث البيانات'),
    });

    const getTenantRoleName = (tenantRoleId: string | null | undefined) => {
        if (!tenantRoleId) return null;
        const role = tenantRoles.find(r => r.id === tenantRoleId);
        return role ? role.name : null;
    };

    const openEditModal = (user: any) => {
        setEditUser(user);
        setEditForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || 'LAWYER',
            title: user.title || '',
            tenantRoleId: user.tenantRoleId || '',
        });
    };

    const filteredUsers = users.filter((u: any) =>
        u.name?.includes(search) ||
        u.email?.includes(search) ||
        u.phone?.includes(search) ||
        u.title?.includes(search)
    );

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" />
                            المستخدمين
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">إدارة حسابات الموظفين وأدوارهم</p>
                    </div>
                    <button
                        onClick={() => setShowInvite(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-l from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm shadow-indigo-200 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة مستخدم
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-gray-50">
                    <div className="relative max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو البريد أو الدور..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الاسم</th>
                                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الدور</th>
                                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الصلاحيات</th>
                                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">البريد</th>
                                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الجوال</th>
                                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الحالة</th>
                                <th className="text-center text-xs font-medium text-gray-500 px-6 py-3">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                                        جاري التحميل...
                                    </div>
                                </td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-gray-400">لا يوجد مستخدمون</td></tr>
                            ) : filteredUsers.map((user: any) => {
                                const displayRole = user.role === 'OWNER' ? 'المالك' : (user.title || '');
                                const roleBg = ROLE_BG[displayRole] || 'bg-gray-50 text-gray-700 border-gray-200';
                                const roleIcon = ROLE_ICONS[displayRole] || '👤';
                                const gradient = ROLE_COLORS[displayRole] || 'from-gray-400 to-gray-500';
                                return (
                                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br ${gradient}`}>
                                                    {user.name?.charAt(0)}
                                                </div>
                                                <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {displayRole ? (
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex items-center gap-1 w-fit ${roleBg}`}>
                                                    <span>{roleIcon}</span>
                                                    {displayRole}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const trName = getTenantRoleName(user.tenantRoleId);
                                                return trName ? (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 flex items-center gap-1 w-fit border border-indigo-100">
                                                        <Lock className="w-3 h-3" />
                                                        {trName}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600" dir="ltr">{user.phone || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${user.isActive
                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                                {user.isActive ? 'نشط' : 'معطل'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.role !== 'OWNER' && (
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="تعديل"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleMutation.mutate(user.id)}
                                                        className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                        title={user.isActive ? 'تعطيل' : 'تفعيل'}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`هل أنت متأكد من حذف ${user.name}؟`)) {
                                                                deleteMutation.mutate(user.id);
                                                            }
                                                        }}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" dir="rtl">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-indigo-50 to-white">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-500" />
                                إضافة مستخدم جديد
                            </h2>
                            <button onClick={() => setShowInvite(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم *</label>
                                <input
                                    value={inviteForm.name}
                                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                    placeholder="اسم المستخدم"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني *</label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                    placeholder="user@example.com"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الجوال</label>
                                <input
                                    type="tel"
                                    value={inviteForm.phone}
                                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                    placeholder="+966 5XX XXX XXXX"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">الدور *</label>
                                <select
                                    value={inviteForm.title}
                                    onChange={(e) => setInviteForm({ ...inviteForm, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white"
                                >
                                    <option value="">— اختر الدور —</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.name}>{ROLE_ICONS[r.name] || '👤'} {r.name}{r.nameEn ? ` (${r.nameEn})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">الصلاحيات</label>
                                <select
                                    value={inviteForm.tenantRoleId}
                                    onChange={(e) => setInviteForm({ ...inviteForm, tenantRoleId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white"
                                >
                                    <option value="">بدون صلاحيات مخصصة</option>
                                    {tenantRoles.map((tr) => (
                                        <option key={tr.id} value={tr.id}>{tr.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => inviteMutation.mutate(inviteForm)}
                                disabled={inviteMutation.isPending || !inviteForm.name || !inviteForm.email || !inviteForm.title}
                                className="w-full py-2.5 bg-gradient-to-l from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-sm font-medium transition-all shadow-sm"
                            >
                                {inviteMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" dir="rtl">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-blue-50 to-white">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-blue-500" />
                                تعديل بيانات المستخدم
                            </h2>
                            <button onClick={() => setEditUser(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Avatar */}
                            <div className="flex justify-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br ${ROLE_COLORS[editForm.title] || 'from-gray-400 to-gray-500'}`}>
                                    {editForm.name?.charAt(0) || '?'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم</label>
                                <input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الجوال</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">الدور</label>
                                <select
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                                >
                                    <option value="">— اختر الدور —</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.name}>{ROLE_ICONS[r.name] || '👤'} {r.name}{r.nameEn ? ` (${r.nameEn})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">الصلاحيات</label>
                                <select
                                    value={editForm.tenantRoleId}
                                    onChange={(e) => setEditForm({ ...editForm, tenantRoleId: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                                >
                                    <option value="">بدون صلاحيات مخصصة</option>
                                    {tenantRoles.map((tr) => (
                                        <option key={tr.id} value={tr.id}>{tr.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => {
                                    updateMutation.mutate({
                                        userId: editUser.id,
                                        data: {
                                            name: editForm.name,
                                            email: editForm.email,
                                            title: editForm.title || null,
                                            tenantRoleId: editForm.tenantRoleId || null,
                                        },
                                    });
                                }}
                                disabled={updateMutation.isPending || !editForm.name || !editForm.email}
                                className="w-full py-2.5 bg-gradient-to-l from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-sm font-medium transition-all shadow-sm"
                            >
                                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Account Created Dialog */}
            {createdUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 overflow-hidden" dir="rtl">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">تم إنشاء الحساب بنجاح</h3>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                            <p className="text-sm text-blue-800">
                                📧 تم إرسال بيانات تسجيل الدخول وكلمة المرور المؤقتة إلى
                            </p>
                            <p className="text-sm font-bold text-blue-900 mt-1">{createdUser.email}</p>
                        </div>
                        <div className="mt-5">
                            <button
                                onClick={() => setCreatedUser(null)}
                                className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 text-sm font-medium transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

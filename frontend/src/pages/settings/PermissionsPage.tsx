import { Fragment, useMemo, useState } from 'react';
import {
    Shield,
    Lock,
    AlertCircle,
    Search,
    Plus,
    Trash2,
    RotateCcw,
    Eraser,
    Check,
    MoreVertical,
    Sparkles,
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuthStore } from '@/stores/auth.store';
import {
    useAllPermissions,
    useRolePermissions,
    useAssignPermission,
    useRevokePermission,
    useBulkAssign,
    useBulkRevoke,
    useResetRole,
    useClearRole,
    useCreatePermission,
    useDeletePermission,
} from '@/hooks/use-permissions-admin';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Permission } from '@/api/permissions.api';
import toast from 'react-hot-toast';

const ROLES = [
    { key: 'OWNER',      label: 'مالك',     color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { key: 'ADMIN',      label: 'مدير',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { key: 'LAWYER',     label: 'محامي',    color: 'bg-green-100 text-green-700 border-green-200' },
    { key: 'SECRETARY',  label: 'سكرتير',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { key: 'ACCOUNTANT', label: 'محاسب',   color: 'bg-orange-100 text-orange-700 border-orange-200' },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
    work:      { label: 'إدارة العمل',     icon: '💼' },
    finance:   { label: 'المالية',         icon: '💰' },
    hr:        { label: 'الموارد البشرية', icon: '👥' },
    comms:     { label: 'التواصل',         icon: '💬' },
    marketing: { label: 'التسويق',         icon: '📣' },
    analytics: { label: 'التحليلات',       icon: '📊' },
    settings:  { label: 'الإعدادات',       icon: '⚙️' },
    core:      { label: 'أساسي',           icon: '⭐' },
    custom:    { label: 'صلاحيات مخصصة',  icon: '✨' },
};

const ACTION_COLORS: Record<string, string> = {
    create:    'text-emerald-600 bg-emerald-50',
    read:      'text-blue-600 bg-blue-50',
    update:    'text-amber-600 bg-amber-50',
    delete:    'text-rose-600 bg-rose-50',
    export:    'text-violet-600 bg-violet-50',
    import:    'text-indigo-600 bg-indigo-50',
    approve:   'text-teal-600 bg-teal-50',
    assign:    'text-cyan-600 bg-cyan-50',
    send:      'text-pink-600 bg-pink-50',
    configure: 'text-slate-600 bg-slate-100',
    manage:    'text-red-600 bg-red-50',
};

// ── Permission cell — toggle a single role/permission ──
function PermissionCell({
    role,
    permissionName,
    isOwner,
    canEdit,
    rolePermissions,
}: {
    role: string;
    permissionName: string;
    isOwner: boolean;
    canEdit: boolean;
    rolePermissions: Permission[];
}) {
    const assignMutation = useAssignPermission();
    const revokeMutation = useRevokePermission();

    const checked = isOwner || rolePermissions.some((p) => p.name === permissionName);
    const isPending = assignMutation.isPending || revokeMutation.isPending;

    const handleToggle = () => {
        if (isOwner || !canEdit) return;
        if (checked) {
            revokeMutation.mutate({ role, permission: permissionName });
        } else {
            assignMutation.mutate({ role, permission: permissionName });
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isOwner || !canEdit || isPending}
            className={cn(
                'w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all mx-auto',
                checked
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                    : 'bg-white border-border hover:border-primary/40',
                (isOwner || !canEdit) && 'cursor-not-allowed opacity-60',
                isPending && 'animate-pulse',
            )}
            title={isOwner ? 'المالك له جميع الصلاحيات' : checked ? 'إلغاء' : 'منح'}
        >
            {checked && <Check className="w-4 h-4" strokeWidth={3} />}
        </button>
    );
}

// ── Bulk grant/revoke helper ───────────────────────────
function RoleBulkActions({
    role,
    visibleNames,
    rolePermissions,
    canEdit,
}: {
    role: string;
    visibleNames: string[];
    rolePermissions: Permission[];
    canEdit: boolean;
}) {
    const bulkAssign = useBulkAssign();
    const bulkRevoke = useBulkRevoke();
    const resetRole = useResetRole();
    const clearRole = useClearRole();

    if (role === 'OWNER' || !canEdit) return null;

    const rolePermNames = new Set(rolePermissions.map((p) => p.name));
    const allGranted = visibleNames.every((n) => rolePermNames.has(n));

    const grantAll = () => bulkAssign.mutate({ role, permissions: visibleNames });
    const revokeAll = () => bulkRevoke.mutate({ role, permissions: visibleNames });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="w-6 h-6 rounded hover:bg-muted/60 flex items-center justify-center" title="إجراءات">
                    <MoreVertical className="w-3 h-3" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={grantAll} disabled={allGranted}>
                    <Check className="w-4 h-4 ml-2" />
                    منح كل الصلاحيات الظاهرة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={revokeAll}>
                    <Eraser className="w-4 h-4 ml-2" />
                    إلغاء كل الصلاحيات الظاهرة
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => resetRole.mutate(role)}>
                    <RotateCcw className="w-4 h-4 ml-2" />
                    استعادة الافتراضي
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => {
                        if (confirm(`مسح جميع صلاحيات "${role}"؟`)) {
                            clearRole.mutate(role);
                        }
                    }}
                    className="text-destructive"
                >
                    <Trash2 className="w-4 h-4 ml-2" />
                    مسح الكل
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ── Add custom permission dialog ───────────────────────
function AddPermissionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const createMut = useCreatePermission();
    const [form, setForm] = useState({
        module: '',
        action: '',
        labelAr: '',
        description: '',
        category: 'custom',
    });

    const reset = () => setForm({ module: '', action: '', labelAr: '', description: '', category: 'custom' });

    const submit = () => {
        if (!form.module.trim() || !form.action.trim()) {
            toast.error('الـ module والـ action مطلوبان');
            return;
        }
        createMut.mutate(form, {
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        إضافة صلاحية مخصصة
                    </DialogTitle>
                    <DialogDescription>
                        أنشئ صلاحية بمسمى جديد ثم امنحها للأدوار من الجدول
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="module">القسم (Module) *</Label>
                            <Input
                                id="module"
                                placeholder="مثال: contracts"
                                value={form.module}
                                onChange={(e) => setForm({ ...form, module: e.target.value })}
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="action">الإجراء (Action) *</Label>
                            <Input
                                id="action"
                                placeholder="مثال: sign"
                                value={form.action}
                                onChange={(e) => setForm({ ...form, action: e.target.value })}
                                dir="ltr"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-2">
                        أحرف لاتينية صغيرة، أرقام، وشرطة (-) فقط. الاسم النهائي:{' '}
                        <code className="text-primary font-mono">{form.module || 'module'}.{form.action || 'action'}</code>
                    </p>

                    <div className="space-y-1.5">
                        <Label htmlFor="labelAr">الاسم بالعربي</Label>
                        <Input
                            id="labelAr"
                            placeholder="مثال: توقيع العقود"
                            value={form.labelAr}
                            onChange={(e) => setForm({ ...form, labelAr: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description">الوصف</Label>
                        <Input
                            id="description"
                            placeholder="شرح موجز لما تتيحه هذه الصلاحية"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="category">التصنيف</Label>
                        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                            <SelectTrigger id="category">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
                                    <SelectItem key={key} value={key}>
                                        {icon} {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        إلغاء
                    </Button>
                    <Button onClick={submit} disabled={createMut.isPending}>
                        {createMut.isPending ? 'جاري الإضافة...' : 'إضافة'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Main page ──────────────────────────────────────────
export function PermissionsPage() {
    const { user } = useAuthStore();
    const { data: permissionsData, isLoading } = useAllPermissions();
    const allPermissions = permissionsData?.data || [];

    const isOwner = user?.role === 'OWNER';

    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [addOpen, setAddOpen] = useState(false);

    const deletePerm = useDeletePermission();

    // One hook call per role (Rules of Hooks: fixed list, fixed order)
    const adminPerms = useRolePermissions('ADMIN');
    const lawyerPerms = useRolePermissions('LAWYER');
    const secretaryPerms = useRolePermissions('SECRETARY');
    const accountantPerms = useRolePermissions('ACCOUNTANT');
    const rolePermsMap: Record<string, Permission[]> = {
        OWNER: [],
        ADMIN: adminPerms.data?.data || [],
        LAWYER: lawyerPerms.data?.data || [],
        SECRETARY: secretaryPerms.data?.data || [],
        ACCOUNTANT: accountantPerms.data?.data || [],
    };

    // ── Filter & group ─────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allPermissions.filter((p) => {
            if (activeCategory !== 'all' && p.category !== activeCategory) return false;
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                p.module.toLowerCase().includes(q) ||
                p.action.toLowerCase().includes(q) ||
                (p.labelAr || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            );
        });
    }, [allPermissions, search, activeCategory]);

    const groupedByModule = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        filtered.forEach((p) => {
            if (!groups[p.module]) groups[p.module] = [];
            groups[p.module].push(p);
        });
        return groups;
    }, [filtered]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allPermissions.forEach((p) => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });
        return counts;
    }, [allPermissions]);

    const visibleNames = filtered.map((p) => p.name);

    if (isLoading) return <LoadingState size="lg" />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-7 h-7 text-primary" />
                        صلاحيات الأدوار
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        تحكّم تفصيلي بكل صلاحيات النظام ({allPermissions.length} صلاحية موزّعة على {Object.keys(categoryCounts).length} تصنيفات)
                    </p>
                </div>
                {isOwner && (
                    <Button onClick={() => setAddOpen(true)}>
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة صلاحية مخصصة
                    </Button>
                )}
            </div>

            {!isOwner && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-900">عرض فقط</p>
                        <p className="text-xs text-amber-700 mt-1">
                            فقط مالك المكتب (OWNER) يستطيع تعديل الصلاحيات. أنت تعرض الصفحة في وضع القراءة فقط.
                        </p>
                    </div>
                </div>
            )}

            {/* Search + category filter */}
            <div className="bg-card rounded-xl border p-4 space-y-3">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="ابحث عن صلاحية بالاسم أو الوصف..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-10"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-sm border transition',
                            activeCategory === 'all'
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-card hover:bg-muted border-border',
                        )}
                    >
                        الكل <span className="opacity-70 text-xs mr-1">({allPermissions.length})</span>
                    </button>
                    {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => {
                        const count = categoryCounts[key] || 0;
                        if (count === 0) return null;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveCategory(key)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm border transition flex items-center gap-1.5',
                                    activeCategory === key
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-card hover:bg-muted border-border',
                                )}
                            >
                                <span>{icon}</span>
                                {label}
                                <span className="opacity-70 text-xs">({count})</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Matrix */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b sticky top-0 z-10">
                            <tr>
                                <th className="text-right py-3 px-4 font-semibold min-w-[260px]">الصلاحية</th>
                                {ROLES.map((role) => {
                                    const rolePerms = rolePermsMap[role.key];
                                    return (
                                        <th key={role.key} className="text-center py-3 px-2 font-semibold min-w-[110px]">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1">
                                                    <span className={cn('text-xs px-2 py-0.5 rounded-full border', role.color)}>
                                                        {role.label}
                                                    </span>
                                                    {role.key === 'OWNER' && (
                                                        <Lock className="w-3 h-3 text-muted-foreground" />
                                                    )}
                                                    {isOwner && role.key !== 'OWNER' && (
                                                        <RoleBulkActions
                                                            role={role.key}
                                                            visibleNames={visibleNames}
                                                            rolePermissions={rolePerms}
                                                            canEdit={isOwner}
                                                        />
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {role.key === 'OWNER' ? '∞' : `${rolePerms.length} صلاحية`}
                                                </span>
                                            </div>
                                        </th>
                                    );
                                })}
                                <th className="w-8" />
                            </tr>
                        </thead>

                        <tbody>
                            {Object.entries(groupedByModule).map(([module, perms]) => {
                                const moduleLabel = perms[0]?.labelAr?.split(' ').slice(-1)[0] || module;
                                return (
                                    <Fragment key={`group-${module}`}>
                                        <tr key={`mod-${module}`} className="bg-primary/5 border-b">
                                            <td colSpan={ROLES.length + 2} className="py-2.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-primary text-[13px]">
                                                        {moduleLabel}
                                                    </span>
                                                    <code className="text-[10px] text-muted-foreground font-mono">
                                                        {module}
                                                    </code>
                                                </div>
                                            </td>
                                        </tr>

                                        {perms.map((p) => {
                                            const actionColor = ACTION_COLORS[p.action] || 'text-foreground bg-muted';
                                            return (
                                                <tr key={p.id} className="border-b hover:bg-muted/30 transition">
                                                    <td className="py-2 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded', actionColor)}>
                                                                {p.action}
                                                            </span>
                                                            <span className="text-foreground">
                                                                {p.labelAr || p.name}
                                                            </span>
                                                            {!p.isSystem && (
                                                                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                                                    مخصص
                                                                </span>
                                                            )}
                                                        </div>
                                                        {p.description && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 mr-1">
                                                                {p.description}
                                                            </p>
                                                        )}
                                                    </td>
                                                    {ROLES.map((role) => (
                                                        <td key={role.key} className="py-1.5 px-2 text-center">
                                                            <PermissionCell
                                                                role={role.key}
                                                                permissionName={p.name}
                                                                isOwner={role.key === 'OWNER'}
                                                                canEdit={isOwner}
                                                                rolePermissions={rolePermsMap[role.key]}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="text-center">
                                                        {isOwner && !p.isSystem && (
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm(`حذف الصلاحية "${p.name}"؟`)) {
                                                                        deletePerm.mutate(p.id);
                                                                    }
                                                                }}
                                                                className="text-muted-foreground hover:text-destructive p-1 rounded"
                                                                title="حذف"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="p-12 text-center">
                        <Shield className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">لا توجد نتائج</h3>
                        <p className="text-muted-foreground text-sm">
                            جرّب تغيير كلمة البحث أو إلغاء فلتر التصنيف
                        </p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="bg-muted/30 rounded-xl p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">ملاحظات:</p>
                <ul className="space-y-1 list-disc list-inside">
                    <li>المالك (OWNER) له جميع الصلاحيات تلقائياً ولا يمكن تعديلها</li>
                    <li>قائمة (⋮) بجانب اسم الدور تتيح المنح/الإلغاء الجماعي للصلاحيات الظاهرة، أو استعادة الافتراضي</li>
                    <li>الصلاحيات المخصصة (شارة بنفسجية) يمكن حذفها — صلاحيات النظام محمية</li>
                    <li>إضافة صلاحية جديدة تنشئها فوراً وتظهر في الجدول لتمنحها للأدوار</li>
                </ul>
            </div>

            <AddPermissionDialog open={addOpen} onOpenChange={setAddOpen} />
        </div>
    );
}

export default PermissionsPage;

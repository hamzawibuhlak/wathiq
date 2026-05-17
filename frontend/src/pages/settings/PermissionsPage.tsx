import { useMemo } from 'react';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuthStore } from '@/stores/auth.store';
import {
    useAllPermissions,
    useRolePermissions,
    useAssignPermission,
    useRevokePermission,
} from '@/hooks/use-permissions-admin';
import { cn } from '@/lib/utils';

const ROLES = [
    { key: 'OWNER', label: 'مالك', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { key: 'ADMIN', label: 'مدير', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { key: 'LAWYER', label: 'محامي', color: 'bg-green-100 text-green-700 border-green-200' },
    { key: 'SECRETARY', label: 'سكرتير', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
];

const MODULE_LABELS: Record<string, string> = {
    cases: 'القضايا',
    hearings: 'الجلسات',
    clients: 'العملاء',
    documents: 'المستندات',
    invoices: 'الفواتير',
    users: 'المستخدمون',
    reports: 'التقارير',
    settings: 'الإعدادات',
    accounting: 'المحاسبة',
    tasks: 'المهام',
    messages: 'الرسائل',
    notifications: 'الإشعارات',
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    create: { label: 'إنشاء', color: 'text-emerald-600' },
    read:   { label: 'عرض',   color: 'text-blue-600' },
    update: { label: 'تعديل', color: 'text-amber-600' },
    delete: { label: 'حذف',   color: 'text-rose-600' },
};

function RolePermissionsCell({
    role,
    permissionName,
    isOwner,
}: {
    role: string;
    permissionName: string;
    isOwner: boolean;
}) {
    const { user: currentUser } = useAuthStore();
    const { data: rolePerms } = useRolePermissions(role);
    const assignMutation = useAssignPermission();
    const revokeMutation = useRevokePermission();

    const isOwnerOnly = currentUser?.role === 'OWNER';
    const checked = isOwner || (rolePerms?.data?.includes(permissionName) ?? false);
    const isPending = assignMutation.isPending || revokeMutation.isPending;

    const handleToggle = () => {
        if (isOwner || !isOwnerOnly) return; // OWNER role is read-only, and only OWNER user can toggle
        if (checked) {
            revokeMutation.mutate({ role, permission: permissionName });
        } else {
            assignMutation.mutate({ role, permission: permissionName });
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isOwner || !isOwnerOnly || isPending}
            className={cn(
                'w-9 h-9 rounded-md border-2 flex items-center justify-center transition-all',
                checked
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                    : 'bg-white border-border hover:border-primary/40',
                (isOwner || !isOwnerOnly) && 'cursor-not-allowed opacity-60',
                isPending && 'animate-pulse'
            )}
            title={isOwner ? 'المالك له جميع الصلاحيات' : !isOwnerOnly ? 'يجب أن تكون مالكاً لتعديل الصلاحيات' : checked ? 'إلغاء' : 'منح'}
        >
            {checked && (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </button>
    );
}

export function PermissionsPage() {
    const { user } = useAuthStore();
    const { data: permissionsData, isLoading } = useAllPermissions();
    const allPermissions = permissionsData?.data || [];

    const isOwner = user?.role === 'OWNER';

    // Group permissions by module
    const groupedByModule = useMemo(() => {
        const groups: Record<string, typeof allPermissions> = {};
        allPermissions.forEach(p => {
            if (!groups[p.module]) groups[p.module] = [];
            groups[p.module].push(p);
        });
        return groups;
    }, [allPermissions]);

    if (isLoading) return <LoadingState size="lg" />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-7 h-7 text-primary" />
                    صلاحيات الأدوار
                </h1>
                <p className="text-muted-foreground mt-1">
                    تحكّم في صلاحيات كل دور وظيفي في النظام
                </p>
            </div>

            {/* Owner-only notice */}
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

            {/* Permissions Matrix */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        {/* Header */}
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-right py-3 px-4 font-semibold sticky right-0 bg-muted/50 z-10 min-w-[180px]">
                                    الصلاحية
                                </th>
                                {ROLES.map(role => (
                                    <th key={role.key} className="text-center py-3 px-4 font-semibold min-w-[100px]">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={cn('text-xs px-2 py-0.5 rounded-full border', role.color)}>
                                                {role.label}
                                            </span>
                                            {role.key === 'OWNER' && (
                                                <Lock className="w-3 h-3 text-muted-foreground" aria-label="ثابت" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Body grouped by module */}
                        <tbody>
                            {Object.entries(groupedByModule).map(([module, perms]) => (
                                <>
                                    {/* Module header row */}
                                    <tr key={`mod-${module}`} className="bg-primary/5 border-b">
                                        <td colSpan={ROLES.length + 1} className="py-2.5 px-4 font-bold text-primary text-[13px]">
                                            {MODULE_LABELS[module] || module}
                                        </td>
                                    </tr>

                                    {/* Permission rows */}
                                    {perms.map(p => {
                                        const action = ACTION_LABELS[p.action] || { label: p.action, color: 'text-foreground' };
                                        return (
                                            <tr key={p.id} className="border-b hover:bg-muted/30 transition">
                                                <td className="py-2.5 px-4 sticky right-0 bg-card">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn('text-xs font-mono w-12', action.color)}>
                                                            {action.label}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs">
                                                            {p.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                {ROLES.map(role => (
                                                    <td key={role.key} className="py-2 px-4 text-center">
                                                        <div className="flex justify-center">
                                                            <RolePermissionsCell
                                                                role={role.key}
                                                                permissionName={p.name}
                                                                isOwner={role.key === 'OWNER'}
                                                            />
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>

                {allPermissions.length === 0 && (
                    <div className="p-12 text-center">
                        <Shield className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">لا توجد صلاحيات</h3>
                        <p className="text-muted-foreground">
                            سيتم إنشاء الصلاحيات الافتراضية تلقائياً عند تشغيل الباكند.
                        </p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="bg-muted/30 rounded-xl p-4 text-xs text-muted-foreground">
                <p className="font-semibold mb-2 text-foreground">ملاحظات:</p>
                <ul className="space-y-1 list-disc list-inside">
                    <li>المالك (OWNER) له جميع الصلاحيات تلقائياً ولا يمكن تعديلها</li>
                    <li>التعديل يطبّق على جميع المستخدمين بنفس الدور</li>
                    <li>الصلاحيات تشمل: إنشاء، عرض، تعديل، حذف لكل قسم</li>
                </ul>
            </div>
        </div>
    );
}

export default PermissionsPage;

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { permissionsApi, CreatePermissionInput, Permission } from '@/api/permissions.api';

export const permissionKeys = {
    all: ['permissions'] as const,
    list: () => [...permissionKeys.all, 'all'] as const,
    categories: () => [...permissionKeys.all, 'categories'] as const,
    role: (role: string) => [...permissionKeys.all, 'role', role] as const,
};

// ── Reads ─────────────────────────────────────────
export function useAllPermissions() {
    return useQuery({
        queryKey: permissionKeys.list(),
        queryFn: () => permissionsApi.getAllPermissions(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useCategories() {
    return useQuery({
        queryKey: permissionKeys.categories(),
        queryFn: () => permissionsApi.getCategories(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useRolePermissions(role: string) {
    return useQuery({
        queryKey: permissionKeys.role(role),
        queryFn: () => permissionsApi.getRolePermissions(role),
        enabled: !!role,
    });
}

// ── Single assign/revoke ──────────────────────────
export function useAssignPermission() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ role, permission }: { role: string; permission: string }) =>
            permissionsApi.assignPermission(role, permission),
        onSuccess: (_, { role }) => {
            toast.success('تم منح الصلاحية');
            qc.invalidateQueries({ queryKey: permissionKeys.role(role) });
        },
        onError: () => toast.error('فشل في منح الصلاحية'),
    });
}

export function useRevokePermission() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ role, permission }: { role: string; permission: string }) =>
            permissionsApi.revokePermission(role, permission),
        onSuccess: (_, { role }) => {
            toast.success('تم إلغاء الصلاحية');
            qc.invalidateQueries({ queryKey: permissionKeys.role(role) });
        },
        onError: () => toast.error('فشل في إلغاء الصلاحية'),
    });
}

// ── Bulk operations ───────────────────────────────
export function useBulkAssign() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) =>
            permissionsApi.bulkAssign(role, permissions),
        onSuccess: (res, { role }) => {
            toast.success(res.message);
            qc.invalidateQueries({ queryKey: permissionKeys.role(role) });
        },
        onError: () => toast.error('فشل في منح الصلاحيات'),
    });
}

export function useBulkRevoke() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) =>
            permissionsApi.bulkRevoke(role, permissions),
        onSuccess: (res, { role }) => {
            toast.success(res.message);
            qc.invalidateQueries({ queryKey: permissionKeys.role(role) });
        },
        onError: () => toast.error('فشل في إلغاء الصلاحيات'),
    });
}

export function useResetRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (role: string) => permissionsApi.resetRole(role),
        onSuccess: (_, role) => {
            toast.success('تم إعادة الضبط للوضع الافتراضي');
            qc.invalidateQueries({ queryKey: permissionKeys.role(role) });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل إعادة الضبط'),
    });
}

export function useClearRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (role: string) => permissionsApi.clearRole(role),
        onSuccess: (res, role) => {
            toast.success(res.message);
            qc.invalidateQueries({ queryKey: permissionKeys.role(role) });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل المسح'),
    });
}

// ── Custom permission CRUD ────────────────────────
export function useCreatePermission() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreatePermissionInput) => permissionsApi.createPermission(input),
        onSuccess: (res) => {
            toast.success(res.message || 'تمت إضافة الصلاحية');
            qc.invalidateQueries({ queryKey: permissionKeys.all });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل إضافة الصلاحية'),
    });
}

export function useUpdatePermission() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<Pick<Permission, 'labelAr' | 'description' | 'category'>> }) =>
            permissionsApi.updatePermission(id, input),
        onSuccess: () => {
            toast.success('تم التحديث');
            qc.invalidateQueries({ queryKey: permissionKeys.all });
        },
        onError: () => toast.error('فشل التحديث'),
    });
}

export function useDeletePermission() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => permissionsApi.deletePermission(id),
        onSuccess: () => {
            toast.success('تم الحذف');
            qc.invalidateQueries({ queryKey: permissionKeys.all });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل الحذف'),
    });
}

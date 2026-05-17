import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { permissionsApi } from '@/api/permissions.api';

export const permissionKeys = {
    all: ['permissions'] as const,
    list: () => [...permissionKeys.all, 'all'] as const,
    role: (role: string) => [...permissionKeys.all, 'role', role] as const,
};

export function useAllPermissions() {
    return useQuery({
        queryKey: permissionKeys.list(),
        queryFn: () => permissionsApi.getAllPermissions(),
        staleTime: 10 * 60 * 1000, // 10 min — permissions list rarely changes
    });
}

export function useRolePermissions(role: string) {
    return useQuery({
        queryKey: permissionKeys.role(role),
        queryFn: () => permissionsApi.getRolePermissions(role),
        enabled: !!role,
    });
}

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

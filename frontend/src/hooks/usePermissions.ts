/**
 * Phase 35: usePermissions Hook
 * Fetches and caches user permissions for frontend gating.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { tenantRolesApi, type MyPermissions } from '@/api/tenantRoles';
import { useAuthStore } from '@/stores/auth.store';

interface UsePermissionsReturn {
    /** Check if user can perform an action */
    can: (resource: string, action: string, level?: 'VIEW' | 'EDIT' | 'FULL') => boolean;
    /** Whether user is the owner (bypasses all checks) */
    isOwner: boolean;
    /** User's tenant role name */
    roleName: string | null;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: string | null;
    /** Refresh permissions */
    refresh: () => Promise<void>;
}

const LEVEL_HIERARCHY: Record<string, number> = {
    NONE: 0,
    VIEW: 1,
    EDIT: 2,
    FULL: 3,
};

export function usePermissions(): UsePermissionsReturn {
    const [permissions, setPermissions] = useState<MyPermissions | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fetchedRef = useRef(false);
    const user = useAuthStore((s) => s.user);

    const fetchPermissions = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await tenantRolesApi.getMyPermissions();
            setPermissions(data);
        } catch (err: any) {
            setError(err?.message || 'Failed to load permissions');
            // If API fails, default to owner behavior on OWNER role
            if (user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN') {
                setPermissions({
                    role: user.role,
                    tenantRole: null,
                    isOwner: true,
                    permissions: {},
                });
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!fetchedRef.current) {
            fetchedRef.current = true;
            fetchPermissions();
        }
    }, [fetchPermissions]);

    const can = useCallback(
        (resource: string, action: string, level: 'VIEW' | 'EDIT' | 'FULL' = 'VIEW'): boolean => {
            // While loading or no permissions, be permissive for UX
            if (!permissions) return true;

            // Owner bypasses everything
            if (permissions.isOwner) return true;

            // Check specific permission
            const key = `${resource}.${action}`;
            const perm = permissions.permissions[key];

            if (!perm || perm.accessLevel === 'NONE') return false;

            return (LEVEL_HIERARCHY[perm.accessLevel] || 0) >= (LEVEL_HIERARCHY[level] || 0);
        },
        [permissions],
    );

    return {
        can,
        isOwner: permissions?.isOwner ?? false,
        roleName: permissions?.tenantRole?.name ?? null,
        loading,
        error,
        refresh: fetchPermissions,
    };
}

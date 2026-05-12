import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/api';

interface UsePermissionsReturn {
    can: (resource: string, action: string) => boolean;
    isOwner: boolean;
    roleName: string | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
    const [permissions, setPermissions] = useState<string[]>([]);
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
            const { data } = await api.get<string[]>('/permissions/my-permissions');
            setPermissions(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err?.message || 'Failed to load permissions');
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
        (resource: string, action: string): boolean => {
            if (user?.role === 'OWNER') return true;
            return permissions.includes(`${resource}.${action}`);
        },
        [permissions, user],
    );

    return {
        can,
        isOwner: user?.role === 'OWNER',
        roleName: user?.role ?? null,
        loading,
        error,
        refresh: fetchPermissions,
    };
}

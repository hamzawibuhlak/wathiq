import { create } from 'zustand';

interface SuperAdminState {
    token: string | null;
    admin: { id: string; name: string; email: string; role: string; customRoleId?: string } | null;
    permissions: Record<string, Record<string, string>>;
    isAuthenticated: boolean;
    login: (token: string, admin: any) => void;
    logout: () => void;
    loadFromStorage: () => void;
    setPermissions: (perms: Record<string, Record<string, string>>) => void;
    hasPermission: (resource: string, action: string, level?: string) => boolean;
}

const LEVEL_ORDER = ['NONE', 'VIEW', 'EDIT', 'FULL'];

export const useSuperAdminStore = create<SuperAdminState>((set, get) => ({
    token: null,
    admin: null,
    permissions: {},
    isAuthenticated: false,

    login: (token, admin) => {
        localStorage.setItem('sa_token', token);
        localStorage.setItem('sa_admin', JSON.stringify(admin));
        set({ token, admin, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('sa_token');
        localStorage.removeItem('sa_admin');
        localStorage.removeItem('sa_permissions');
        set({ token: null, admin: null, permissions: {}, isAuthenticated: false });
    },

    loadFromStorage: () => {
        const token = localStorage.getItem('sa_token');
        const adminStr = localStorage.getItem('sa_admin');
        const permsStr = localStorage.getItem('sa_permissions');
        if (token && adminStr) {
            try {
                const admin = JSON.parse(adminStr);
                const permissions = permsStr ? JSON.parse(permsStr) : {};
                set({ token, admin, permissions, isAuthenticated: true });
            } catch {
                localStorage.removeItem('sa_token');
                localStorage.removeItem('sa_admin');
                localStorage.removeItem('sa_permissions');
            }
        }
    },

    setPermissions: (perms) => {
        localStorage.setItem('sa_permissions', JSON.stringify(perms));
        set({ permissions: perms });
    },

    hasPermission: (resource, action, level = 'VIEW') => {
        const state = get();
        // OWNER role always passes
        if (state.admin?.role === 'OWNER') return true;
        // No permissions loaded yet — deny
        if (!state.permissions || Object.keys(state.permissions).length === 0) return false;

        const userLevel = state.permissions[resource]?.[action];
        if (!userLevel) return false;

        const userIndex = LEVEL_ORDER.indexOf(userLevel);
        const requiredIndex = LEVEL_ORDER.indexOf(level);
        return userIndex >= requiredIndex;
    },
}));

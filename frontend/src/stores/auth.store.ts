import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User type
interface User {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'LAWYER' | 'SECRETARY' | 'ACCOUNTANT';
    avatar: string | null;
    isActive: boolean;
    tenantId: string;
    tenant?: {
        id: string;
        name: string;
        isActive: boolean;
    };
}

// Permission types
export type Resource = 'users' | 'cases' | 'clients' | 'hearings' | 'documents' | 'invoices' | 'settings';
export type Action = 'view' | 'create' | 'update' | 'delete' | 'manage';

// Auth state interface
interface AuthState {
    // State
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setUser: (user: User) => void;
    setToken: (token: string) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;

    // Role helpers
    isOwner: () => boolean;
    isAdmin: () => boolean;
    isLawyer: () => boolean;
    isSecretary: () => boolean;
    isAdminOrOwner: () => boolean;

    // Permission helpers
    can: (action: Action, resource: Resource) => boolean;
    canManageUsers: () => boolean;
    canManageInvoices: () => boolean;
    canManageCases: () => boolean;
    canManageHearings: () => boolean;
    canUploadDocuments: () => boolean;
    canDeleteDocuments: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            // Actions
            setUser: (user) => set({ user, isAuthenticated: true }),

            setToken: (token) => set({ token }),

            login: (user, token) =>
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                }),

            logout: () =>
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                }),

            setLoading: (isLoading) => set({ isLoading }),

            // Role helpers
            isOwner: () => get().user?.role === 'OWNER',
            isAdmin: () => get().user?.role === 'ADMIN',
            isLawyer: () => get().user?.role === 'LAWYER',
            isSecretary: () => get().user?.role === 'SECRETARY',
            isAdminOrOwner: () => {
                const role = get().user?.role;
                return role === 'OWNER' || role === 'ADMIN';
            },

            // Permission helpers
            canManageUsers: () => {
                const role = get().user?.role;
                return role === 'OWNER' || role === 'ADMIN';
            },
            canManageInvoices: () => {
                const role = get().user?.role;
                return role === 'OWNER' || role === 'ADMIN';
            },
            canManageCases: () => {
                const role = get().user?.role;
                return role === 'OWNER' || role === 'ADMIN' || role === 'LAWYER';
            },
            canManageHearings: () => {
                const role = get().user?.role;
                return role === 'OWNER' || role === 'ADMIN' || role === 'SECRETARY';
            },
            canUploadDocuments: () => {
                const role = get().user?.role;
                return role === 'OWNER' || role === 'ADMIN' || role === 'LAWYER';
            },
            canDeleteDocuments: () => {
                const role = get().user?.role;
                return role === 'OWNER' || role === 'ADMIN';
            },

            // Generic permission checker
            can: (action: Action, resource: Resource) => {
                const role = get().user?.role;
                if (!role) return false;

                // OWNER can do everything
                if (role === 'OWNER') return true;

                // Permission matrix
                const permissions: Record<string, Record<Action, boolean>> = {
                    ADMIN: {
                        view: true,
                        create: resource !== 'users',
                        update: resource !== 'users' || action === 'update',
                        delete: resource !== 'users',
                        manage: resource !== 'users',
                    },
                    LAWYER: {
                        view: resource !== 'invoices' || action === 'view',
                        create: ['cases', 'documents'].includes(resource),
                        update: resource === 'cases',
                        delete: false,
                        manage: false,
                    },
                    SECRETARY: {
                        view: true,
                        create: resource === 'hearings',
                        update: resource === 'hearings',
                        delete: false,
                        manage: false,
                    },
                };

                return permissions[role]?.[action] ?? false;
            },
        }),
        {
            name: 'watheeq-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

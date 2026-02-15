import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/models.types';
import apiService from '../services/api.service';

// ═══════════════════════════════════════════════════════════
// Auth Store — Zustand
// ═══════════════════════════════════════════════════════════

interface AuthState {
    user: User | null;
    token: string | null;
    tenantSlug: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    login: (tenantSlug: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loadFromStorage: () => Promise<void>;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    tenantSlug: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,

    login: async (tenantSlug: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
            const response = await apiService.login(tenantSlug, email, password);
            const { accessToken, user } = response;

            // Persist
            await AsyncStorage.multiSet([
                ['auth_token', accessToken],
                ['auth_user', JSON.stringify(user)],
                ['tenant_slug', tenantSlug],
            ]);

            // Configure API
            apiService.setTenantSlug(tenantSlug);

            set({
                user,
                token: accessToken,
                tenantSlug,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        await AsyncStorage.multiRemove(['auth_token', 'auth_user', 'tenant_slug']);
        set({
            user: null,
            token: null,
            tenantSlug: null,
            isAuthenticated: false,
        });
    },

    loadFromStorage: async () => {
        try {
            const [[, token], [, userStr], [, slug]] = await AsyncStorage.multiGet([
                'auth_token',
                'auth_user',
                'tenant_slug',
            ]);

            if (token && userStr && slug) {
                const user = JSON.parse(userStr);
                apiService.setTenantSlug(slug);
                set({
                    user,
                    token,
                    tenantSlug: slug,
                    isAuthenticated: true,
                    isInitialized: true,
                });
            } else {
                set({ isInitialized: true });
            }
        } catch {
            set({ isInitialized: true });
        }
    },

    updateUser: (updates: Partial<User>) => {
        const current = get().user;
        if (current) {
            const updatedUser = { ...current, ...updates };
            set({ user: updatedUser });
            AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
        }
    },
}));

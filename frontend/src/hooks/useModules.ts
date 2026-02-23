// ═══════════════════════════════════════════════════════════
// Phase 42: useModules hook — fetches & caches tenant modules
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import api from '@/api/client';

interface ModuleState {
    modules: Record<string, { enabled: boolean; features?: Record<string, boolean> }>;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    fetchModules: () => Promise<void>;
    isModuleEnabled: (key: string) => boolean;
    isFeatureEnabled: (moduleKey: string, featureKey: string) => boolean;
    reset: () => void;
}

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const useModuleStore = create<ModuleState>((set, get) => ({
    modules: {},
    loading: false,
    error: null,
    lastFetched: null,

    fetchModules: async () => {
        const state = get();

        // Skip if recently fetched
        if (state.lastFetched && Date.now() - state.lastFetched < STALE_TIME) {
            return;
        }

        set({ loading: true, error: null });

        try {
            const data = await api.get('/users/my-modules').then(r => r.data);
            set({
                modules: data,
                loading: false,
                lastFetched: Date.now(),
            });
        } catch (err: any) {
            console.error('Failed to fetch modules:', err);
            set({ loading: false, error: err.message });
        }
    },

    isModuleEnabled: (key: string) => {
        const { modules } = get();
        // If no modules fetched yet, allow all (graceful fallback)
        if (Object.keys(modules).length === 0) return true;
        return modules[key]?.enabled !== false;
    },

    isFeatureEnabled: (moduleKey: string, featureKey: string) => {
        const { modules } = get();
        // If no modules fetched yet, allow all (graceful fallback)
        if (Object.keys(modules).length === 0) return true;
        // Module must be enabled
        if (modules[moduleKey]?.enabled === false) return false;
        // Check feature — default to true if not explicitly set
        const features = modules[moduleKey]?.features;
        if (!features) return true;
        return features[featureKey] !== false;
    },

    reset: () => set({ modules: {}, loading: false, error: null, lastFetched: null }),
}));

// Convenience hook
export function useModules() {
    const store = useModuleStore();
    return {
        modules: store.modules,
        loading: store.loading,
        isModuleEnabled: store.isModuleEnabled,
        isFeatureEnabled: store.isFeatureEnabled,
        fetchModules: store.fetchModules,
        reset: store.reset,
    };
}

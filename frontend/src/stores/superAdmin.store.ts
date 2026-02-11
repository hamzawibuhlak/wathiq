import { create } from 'zustand';

interface SuperAdminState {
    token: string | null;
    admin: { id: string; name: string; email: string; role: string } | null;
    isAuthenticated: boolean;
    login: (token: string, admin: any) => void;
    logout: () => void;
    loadFromStorage: () => void;
}

export const useSuperAdminStore = create<SuperAdminState>((set) => ({
    token: null,
    admin: null,
    isAuthenticated: false,

    login: (token, admin) => {
        localStorage.setItem('sa_token', token);
        localStorage.setItem('sa_admin', JSON.stringify(admin));
        set({ token, admin, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('sa_token');
        localStorage.removeItem('sa_admin');
        set({ token: null, admin: null, isAuthenticated: false });
    },

    loadFromStorage: () => {
        const token = localStorage.getItem('sa_token');
        const adminStr = localStorage.getItem('sa_admin');
        if (token && adminStr) {
            try {
                const admin = JSON.parse(adminStr);
                set({ token, admin, isAuthenticated: true });
            } catch {
                localStorage.removeItem('sa_token');
                localStorage.removeItem('sa_admin');
            }
        }
    },
}));

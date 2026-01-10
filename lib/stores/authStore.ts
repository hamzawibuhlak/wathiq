import { create } from 'zustand';

interface AuthState {
  user: any | null;
  setUser: (user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    document.cookie =
      'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    set({ user: null });
  },
}));

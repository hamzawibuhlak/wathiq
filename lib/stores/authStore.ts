import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),
  logout: () => {
    set({ user: null, isAuthenticated: false });
    // Only clear user data, token is in HttpOnly cookie
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  },
}));

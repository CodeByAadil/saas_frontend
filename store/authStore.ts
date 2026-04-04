/**
 * store/authStore.ts
 */
import { create } from 'zustand';

interface User {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    setToken: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,

    setAuth: (user, token) => {
        set({ user, token });
    },

    setToken: (token) => set({ token }),

    logout: () => set({ user: null, token: null }),
}));

// Expose to window for the axios interceptor (avoids circular import)
if (typeof window !== 'undefined') {
    (window as any).__authStore = useAuthStore;
}
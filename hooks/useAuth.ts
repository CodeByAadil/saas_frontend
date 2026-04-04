/**
 * hooks/useAuth.ts
 *
 * Thin wrapper around the auth store that adds:
 *   - Boot-time session hydration (calls /auth/me on first load)
 *   - login() / register() / logout() action helpers with loading state
 *   - Computed `isAuthenticated` flag
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface LoginParams { email: string; password: string }
interface RegisterParams { name: string; email: string; password: string }

export function useAuth() {
    const router = useRouter();
    const { user, token, setAuth, setToken, logout: storeLogout } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [hydrating, setHydrating] = useState(!user);  // true on first render if no user

    // ── Boot hydration ─────────────────────────────────────────────────────────
    // On first app load the Zustand store is empty (no persistence).
    // If there's a cookie, /auth/me will succeed and restore the session.
    useEffect(() => {
        if (user) { setHydrating(false); return; }

        api.get('/auth/me')
            .then(({ data }) => setAuth(data.user, token ?? ''))
            .catch(() => {/* No session — user needs to log in */ })
            .finally(() => setHydrating(false));
    }, []);

    // ── Actions ────────────────────────────────────────────────────────────────

    const login = useCallback(async ({ email, password }: LoginParams) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setAuth(data.user, data.accessToken);
            router.push('/workspaces');
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async ({ name, email, password }: RegisterParams) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            setAuth(data.user, data.accessToken);
            router.push('/workspaces');
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        try {
            await api.post('/auth/logout');
        } catch {
            // Best-effort — clear client state regardless
        } finally {
            storeLogout();
            setLoading(false);
            router.push('/login');
        }
    }, []);

    const refreshToken = useCallback(async () => {
        try {
            const { data } = await api.post('/auth/refresh');
            setToken(data.accessToken);
            return data.accessToken as string;
        } catch {
            storeLogout();
            router.push('/login');
            return null;
        }
    }, []);

    return {
        user,
        token,
        isAuthenticated: !!user,
        hydrating,
        loading,
        login,
        register,
        logout,
        refreshToken,
    };
}
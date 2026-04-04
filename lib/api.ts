/**
 * lib/api.ts — Axios instance with automatic token refresh
 *
 * On 401 responses the interceptor:
 *   1. Calls /auth/refresh to get a new access token
 *   2. Retries the original request with the new token
 *   3. On refresh failure, redirects to /login
 */

import axios, { type AxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const api = axios.create({
  baseURL:         API_BASE,
  withCredentials: true,   // send httpOnly cookies automatically
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token from memory ────────────────────
// The access token is kept in Zustand (not localStorage) for XSS safety.
// On first load it may be undefined; the refresh interceptor handles that.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Dynamically read from the auth store to avoid circular imports
    const { token } = (window as any).__authStore?.getState?.() ?? {};
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle 401 with token refresh ─────────────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Skip refresh for the auth endpoints themselves
    if (original.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry  = true;
    isRefreshing     = true;

    try {
      const { data } = await axios.post(
        `${API_BASE}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken = data.accessToken;

      // Push new token into the store
      if (typeof window !== 'undefined') {
        (window as any).__authStore?.getState?.().setToken(newToken);
      }

      processQueue(null, newToken);
      original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Redirect to login on refresh failure
      if (typeof window !== 'undefined') {
        (window as any).__authStore?.getState?.().logout();
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
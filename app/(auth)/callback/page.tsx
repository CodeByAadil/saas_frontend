'use client';

/**
 * app/auth/callback/page.tsx
 *
 * Landing page after Google OAuth completes.
 * The backend redirects here with ?token=<accessToken>.
 * We store it in the Zustand auth store, then fetch the user profile,
 * and finally push to /workspaces.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function OAuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setAuth } = useAuthStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const err = searchParams.get('error');

        if (err || !token) {
            setError('OAuth sign-in failed. Please try again.');
            setTimeout(() => router.push('/login'), 3000);
            return;
        }

        // Temporarily set the token so the /me request is authenticated
        useAuthStore.getState().setToken(token);

        api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(({ data }) => {
                setAuth(data.user, token);
                router.push('/workspaces');
            })
            .catch(() => {
                setError('Failed to load user profile. Please try again.');
                setTimeout(() => router.push('/login'), 3000);
            });
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-1)',
            gap: '20px',
        }}>
            {error ? (
                <>
                    <p style={{ color: 'var(--danger)', fontSize: '0.95rem' }}>{error}</p>
                    <p style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>Redirecting to login…</p>
                </>
            ) : (
                <>
                    {/* Animated logo */}
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.5rem',
                        letterSpacing: '-0.02em',
                        color: 'var(--ink)',
                    }}>
                        Project<span style={{ color: 'var(--accent)' }}>AI</span>
                    </span>

                    {/* Pulse dots */}
                    <div style={{ display: 'flex', gap: '7px' }}>
                        {[0, 1, 2].map((i) => (
                            <div key={i} style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                animation: 'pulseDot 1.5s ease-in-out infinite',
                                animationDelay: `${i * 0.2}s`,
                            }} />
                        ))}
                    </div>

                    <p style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>
                        Signing you in…
                    </p>
                </>
            )}
        </div>
    );
}
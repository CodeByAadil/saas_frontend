'use client';

/**
 * app/(auth)/login/page.tsx
 * Refined editorial aesthetic — warm off-white, Fraunces serif display,
 * DM Sans body. Minimal form, full-page split layout.
 */

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setAuth(data.user, data.accessToken);
            router.push('/dashboard/workspaces');
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Login failed');
        } finally {
            setLoading(false);
        }
    }

    function handleGoogleLogin() {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--surface-1)',
        }}>
            {/* Left — brand panel */}
            <div style={{
                background: 'var(--ink)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '48px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative grain overlay */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.04,
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                    backgroundSize: '128px',
                }} />

                <div style={{ position: 'relative' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                        ProjectAI
                    </span>
                </div>

                <div style={{ position: 'relative' }}>
                    <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2.8rem',
                        color: '#f0ede8',
                        lineHeight: 1.15,
                        letterSpacing: '-0.03em',
                        marginBottom: '24px',
                        fontWeight: 300,
                    }}>
                        Intelligent project<br />management for<br />
                        <em style={{ color: 'var(--accent)' }}>modern teams.</em>
                    </p>
                    <p style={{ color: '#6b6760', fontSize: '0.9rem', lineHeight: 1.7 }}>
                        AI-generated tasks, real-time collaboration,<br />
                        and deep workspace analytics — all in one place.
                    </p>
                </div>
            </div>

            {/* Right — form panel */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
            }}>
                <div style={{ width: '100%', maxWidth: '380px' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2rem',
                        fontWeight: 400,
                        letterSpacing: '-0.03em',
                        marginBottom: '8px',
                    }}>Welcome back</h1>
                    <p style={{ color: 'var(--ink-2)', fontSize: '0.9rem', marginBottom: '36px' }}>
                        Don&apos;t have an account?{' '}
                        <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                            Sign up free
                        </Link>
                    </p>

                    {/* Google OAuth */}
                    <button onClick={handleGoogleLogin} className="btn btn-secondary" style={{ width: '100%', marginBottom: '20px', padding: '11px' }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>or</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Email</label>
                            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                        </div>
                        <div style={{ marginBottom: '28px' }}>
                            <label className="label">Password</label>
                            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '11px' }} disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
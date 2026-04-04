'use client';

/**
 * app/invite/accept/page.tsx
 *
 * Called when a user clicks the email invite link.
 * URL: /invite/accept?token=<signedJWT>
 *
 * Flow:
 *  1. User must be authenticated (middleware redirects to login with ?next= if not)
 *  2. POST /members/accept with the token
 *  3. Redirect to the workspace board
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/store/workspaceStore';

type Stage = 'loading' | 'confirming' | 'joining' | 'error';

export default function InviteAcceptPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const { setWorkspaces, setActive } = useWorkspaceStore();
    const [stage, setStage] = useState<Stage>('loading');
    const [message, setMessage] = useState('');
    const [wsId, setWsId] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setStage('error');
            setMessage('Invalid invite link — no token found.');
            return;
        }

        // Decode the JWT payload (without verification — backend will verify)
        try {
            const payloadB64 = token.split('.')[1];
            const payload = JSON.parse(atob(payloadB64));
            setWsId(payload.workspaceId);
            setStage('confirming');
        } catch {
            setStage('error');
            setMessage('Malformed invite link.');
        }
    }, [token]);

    async function handleAccept() {
        setStage('joining');
        try {
            const { data } = await api.post(`/workspaces/${wsId}/members/accept`, { token });

            // Refresh workspace list so the new workspace appears in the sidebar
            const { data: wsData } = await api.get('/workspaces');
            setWorkspaces(wsData.workspaces);
            const joined = wsData.workspaces.find((w: any) => w._id === data.workspaceId);
            if (joined) setActive(joined);

            toast.success('Welcome to the workspace!');
            router.push(`/workspace/${data.workspaceId}/tasks`);
        } catch (err: any) {
            setStage('error');
            setMessage(err.response?.data?.error ?? 'Failed to accept invite.');
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-1)',
            padding: '24px',
        }}>
            <div className="card" style={{ padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>

                {/* Logo */}
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '-0.02em', display: 'block', marginBottom: '28px' }}>
                    Project<span style={{ color: 'var(--accent)' }}>AI</span>
                </span>

                {stage === 'loading' && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '7px', padding: '20px 0' }}>
                        {[0, 1, 2].map((i) => (
                            <div key={i} style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: 'var(--accent)',
                                animation: 'pulseDot 1.5s ease-in-out infinite',
                                animationDelay: `${i * 0.2}s`,
                            }} />
                        ))}
                    </div>
                )}

                {stage === 'confirming' && (
                    <>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            background: 'var(--accent-subtle)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px', fontSize: '1.5rem', color: 'var(--accent)',
                        }}>
                            ◎
                        </div>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
                            You&apos;ve been invited
                        </h1>
                        <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 28px' }}>
                            You have been invited to join a workspace on ProjectAI. Click below to accept and get started.
                        </p>
                        <button onClick={handleAccept} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
                            Accept invitation
                        </button>
                    </>
                )}

                {stage === 'joining' && (
                    <div style={{ padding: '20px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '7px', marginBottom: '16px' }}>
                            {[0, 1, 2].map((i) => (
                                <div key={i} style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: 'var(--accent)',
                                    animation: 'pulseDot 1.5s ease-in-out infinite',
                                    animationDelay: `${i * 0.2}s`,
                                }} />
                            ))}
                        </div>
                        <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem' }}>Joining workspace…</p>
                    </div>
                )}

                {stage === 'error' && (
                    <>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px', fontSize: '1.5rem', color: 'var(--danger)',
                        }}>
                            ✕
                        </div>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, margin: '0 0 10px' }}>
                            Invite error
                        </h1>
                        <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem', margin: '0 0 24px', lineHeight: 1.6 }}>
                            {message || 'This invite link is invalid or has expired.'}
                        </p>
                        <button onClick={() => router.push('/workspaces')} className="btn btn-secondary" style={{ width: '100%' }}>
                            Go to workspaces
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
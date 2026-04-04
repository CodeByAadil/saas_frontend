'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { api } from '@/lib/api';
import clsx from 'clsx';

const NAV = [
    { label: 'Board', href: 'tasks', icon: '⊞' },
    { label: 'Members', href: 'members', icon: '◎' },
    { label: 'Billing', href: 'billing', icon: '◈' },
    { label: 'Settings', href: 'settings', icon: '◉' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const { workspaces, activeWorkspace, setWorkspaces, setActive } = useWorkspaceStore();

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        api.get('/workspaces').then(({ data }) => {
            setWorkspaces(data.workspaces);
            if (!activeWorkspace && data.workspaces.length > 0) {
                setActive(data.workspaces[0]);
            }
        }).catch(() => router.push('/login'));
    }, [user]);

    if (!user) return null;

    const wsId = activeWorkspace?._id;

    function handleLogout() {
        api.post('/auth/logout').finally(() => {
            logout();
            router.push('/login');
        });
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>

            {/* ── Sidebar ─────────────────────────────────────────────────────── */}
            <aside style={{
                width: 'var(--sidebar-w)',
                flexShrink: 0,
                background: 'var(--surface-0)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0, left: 0, bottom: 0,
                zIndex: 40,
            }}>
                {/* Logo */}
                <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.15rem',
                        letterSpacing: '-0.02em',
                        color: 'var(--ink)',
                    }}>
                        Project<span style={{ color: 'var(--accent)' }}>AI</span>
                    </span>
                </div>

                {/* Workspace switcher */}
                <div style={{ padding: '12px 10px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: '6px' }}>Workspace</p>
                    {workspaces.map((ws) => (
                        <button
                            key={ws._id}
                            onClick={() => setActive(ws)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                width: '100%', padding: '7px 8px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none', cursor: 'pointer',
                                background: ws._id === activeWorkspace?._id ? 'var(--accent-subtle)' : 'transparent',
                                color: ws._id === activeWorkspace?._id ? 'var(--accent)' : 'var(--ink-2)',
                                fontSize: '0.875rem', fontWeight: 500, textAlign: 'left',
                            }}
                        >
                            <span style={{
                                width: '22px', height: '22px', borderRadius: '6px',
                                background: ws._id === activeWorkspace?._id ? 'var(--accent)' : 'var(--surface-2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', color: ws._id === activeWorkspace?._id ? '#fff' : 'var(--ink-2)',
                                fontWeight: 700, flexShrink: 0,
                            }}>
                                {ws.name.charAt(0).toUpperCase()}
                            </span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</span>
                            {ws.plan !== 'free' && (
                                <span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: '#fff', padding: '1px 6px', borderRadius: '99px' }}>
                                    {ws.plan}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 10px' }}>
                    {wsId && NAV.map((item) => {
                        const href = `/workspace/${wsId}/${item.href}`;
                        const active = pathname.includes(`/${item.href}`);
                        return (
                            <Link key={item.href} href={href} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                                color: active ? 'var(--ink)' : 'var(--ink-2)',
                                background: active ? 'var(--surface-2)' : 'transparent',
                                textDecoration: 'none', fontSize: '0.875rem',
                                fontWeight: active ? 500 : 400,
                                marginBottom: '2px',
                                transition: 'all 0.1s',
                            }}>
                                <span style={{ fontSize: '1rem', opacity: 0.7 }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User */}
                <div style={{
                    padding: '12px 10px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: 'var(--accent)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#fff', fontSize: '0.8rem',
                        fontWeight: 600, flexShrink: 0,
                    }}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--ink-3)', fontSize: '1rem', padding: '4px',
                        borderRadius: '4px',
                    }} title="Sign out">→</button>
                </div>
            </aside>

            {/* ── Main content area ────────────────────────────────────────────── */}
            <main style={{ flex: 1, marginLeft: 'var(--sidebar-w)', minHeight: '100vh' }}>
                {children}
            </main>
        </div>
    );
}
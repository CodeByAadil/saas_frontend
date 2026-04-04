'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function WorkspacesPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { workspaces, setWorkspaces, setActive } = useWorkspaceStore();

    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { router.push('/login'); return; }
        api.get('/workspaces')
            .then(({ data }) => {
                setWorkspaces(data.workspaces);
                if (data.workspaces.length === 0) setShowCreate(true);
            })
            .catch(() => toast.error('Failed to load workspaces'))
            .finally(() => setLoading(false));
    }, [user]);

    async function handleCreate() {
        if (!name.trim()) return;
        setCreating(true);
        try {
            const { data } = await api.post('/workspaces', { name: name.trim() });
            setWorkspaces([...workspaces, { ...data.workspace, role: 'owner' }]);
            setActive({ ...data.workspace, role: 'owner' });
            router.push(`/workspace/${data.workspace._id}/tasks`);
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Failed to create workspace');
        } finally {
            setCreating(false);
        }
    }

    function handleSelect(ws: any) {
        setActive(ws);
        router.push(`/workspace/${ws._id}/tasks`);
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '40px 20px', background: 'var(--surface-1)',
        }}>
            <div style={{ width: '100%', maxWidth: '560px' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                        Project<span style={{ color: 'var(--accent)' }}>AI</span>
                    </span>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, letterSpacing: '-0.04em', margin: '16px 0 8px' }}>
                        Your workspaces
                    </h1>
                    <p style={{ color: 'var(--ink-2)', fontSize: '0.9rem' }}>
                        Select a workspace to continue or create a new one.
                    </p>
                </div>

                {/* Workspace list */}
                {!loading && workspaces.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                        {workspaces.map((ws) => (
                            <button
                                key={ws._id}
                                onClick={() => handleSelect(ws)}
                                className="card"
                                style={{
                                    padding: '18px 20px', display: 'flex', alignItems: 'center',
                                    gap: '14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                                    transition: 'box-shadow 0.15s, border-color 0.15s',
                                    width: '100%',
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                            >
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: 'var(--accent)', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.1rem', fontWeight: 700, flexShrink: 0,
                                }}>
                                    {ws.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 3px', color: 'var(--ink)' }}>{ws.name}</p>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', margin: 0 }}>
                                        {ws.memberCount} member{ws.memberCount !== 1 ? 's' : ''} · {ws.plan} plan
                                    </p>
                                </div>
                                <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>{ws.role}</span>
                                <span style={{ color: 'var(--ink-3)' }}>→</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Create workspace */}
                {showCreate ? (
                    <div className="card" style={{ padding: '24px' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
                            {workspaces.length === 0 ? 'Create your first workspace' : 'New workspace'}
                        </h2>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="label">Workspace name</label>
                            <input
                                className="input" autoFocus
                                value={name} onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                placeholder="e.g. Acme Engineering, Product Team…"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleCreate} className="btn btn-primary" style={{ flex: 1 }} disabled={creating || !name.trim()}>
                                {creating ? 'Creating…' : 'Create workspace'}
                            </button>
                            {workspaces.length > 0 && (
                                <button onClick={() => setShowCreate(false)} className="btn btn-ghost">Cancel</button>
                            )}
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowCreate(true)} className="btn btn-secondary" style={{ width: '100%' }}>
                        + Create new workspace
                    </button>
                )}
            </div>
        </div>
    );
}
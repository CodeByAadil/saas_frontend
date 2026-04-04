'use client';

/**
 * components/workspace/WorkspaceSwitcher.tsx
 *
 * Dropdown to switch between workspaces and create new ones.
 * Pops open when clicking the workspace name in the sidebar.
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useWorkspaceStore, type Workspace } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';

export default function WorkspaceSwitcher() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { workspaces, activeWorkspace, setWorkspaces, setActive } = useWorkspaceStore();

    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);

    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    async function handleCreate() {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const { data } = await api.post('/workspaces', { name: newName.trim() });
            const ws = { ...data.workspace, role: 'owner' as const };
            setWorkspaces([...workspaces, ws]);
            setActive(ws);
            router.push(`/workspace/${ws._id}/tasks`);
            setCreating(false);
            setNewName('');
            setOpen(false);
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Failed to create workspace');
        } finally {
            setSaving(false);
        }
    }

    function handleSwitch(ws: Workspace) {
        setActive(ws);
        router.push(`/workspace/${ws._id}/tasks`);
        setOpen(false);
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    background: open ? 'var(--surface-2)' : 'transparent',
                    color: 'var(--ink)',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                }}
            >
                {/* Workspace avatar */}
                <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>
                    {activeWorkspace?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>

                <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeWorkspace?.name ?? 'Select workspace'}
                </span>

                <span style={{ color: 'var(--ink-3)', fontSize: '0.7rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    ▾
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'var(--surface-0)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    zIndex: 100,
                    overflow: 'hidden',
                    animation: 'slideIn 0.15s ease-out',
                }}>
                    {/* Workspace list */}
                    <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {workspaces.map((ws) => (
                            <button
                                key={ws._id}
                                onClick={() => handleSwitch(ws)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: ws._id === activeWorkspace?._id ? 'var(--accent-subtle)' : 'transparent',
                                    color: ws._id === activeWorkspace?._id ? 'var(--accent)' : 'var(--ink)',
                                    textAlign: 'left',
                                    fontSize: '0.85rem',
                                    transition: 'background 0.1s',
                                }}
                            >
                                <div style={{
                                    width: '22px', height: '22px', borderRadius: '5px',
                                    background: ws._id === activeWorkspace?._id ? 'var(--accent)' : 'var(--surface-3)',
                                    color: ws._id === activeWorkspace?._id ? '#fff' : 'var(--ink-2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                                }}>
                                    {ws.name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: ws._id === activeWorkspace?._id ? 500 : 400 }}>
                                    {ws.name}
                                </span>
                                {ws._id === activeWorkspace?._id && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'var(--border)' }} />

                    {/* Create new */}
                    {creating ? (
                        <div style={{ padding: '10px 12px', display: 'flex', gap: '8px' }}>
                            <input
                                className="input"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                placeholder="Workspace name"
                                autoFocus
                                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                            />
                            <button onClick={handleCreate} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px', flexShrink: 0 }} disabled={saving}>
                                {saving ? '…' : 'Create'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setCreating(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '10px 12px',
                                border: 'none',
                                cursor: 'pointer',
                                background: 'transparent',
                                color: 'var(--ink-2)',
                                fontSize: '0.82rem',
                            }}
                        >
                            <span style={{ fontSize: '1rem', color: 'var(--accent)' }}>+</span>
                            New workspace
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
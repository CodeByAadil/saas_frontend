'use client';

import { useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';

export default function SettingsPage() {
    const params = useParams();
    const router = useRouter();
    const workspaceId = params.workspaceId as string;

    const { activeWorkspace, updateWorkspace } = useWorkspaceStore();
    const { logout } = useAuthStore();

    const [name, setName] = useState(activeWorkspace?.name ?? '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmName, setConfirmName] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isOwner = activeWorkspace?.role === 'owner';
    const isAdmin = activeWorkspace?.role === 'admin' || isOwner;

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
            const { data } = await api.patch(`/workspaces/${workspaceId}`, { name: name.trim() });
            updateWorkspace(data.workspace);
            toast.success('Workspace updated');
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Update failed');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (confirmName !== activeWorkspace?.name) {
            toast.error('Workspace name does not match');
            return;
        }
        setDeleting(true);
        try {
            await api.delete(`/workspaces/${workspaceId}`);
            toast.success('Workspace deleted');
            logout();
            router.push('/workspaces');
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Delete failed');
            setDeleting(false);
        }
    }

    return (
        <div style={{ padding: '32px 40px', maxWidth: '640px' }}>
            <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 400,
                letterSpacing: '-0.03em',
                margin: '0 0 8px',
            }}>
                Settings
            </h1>
            <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem', margin: '0 0 40px' }}>
                Manage your workspace configuration.
            </p>

            {/* General settings */}
            <section style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
                    General
                </h2>
                <div className="card" style={{ padding: '24px' }}>
                    <form onSubmit={handleSave}>
                        <div style={{ marginBottom: '20px' }}>
                            <label className="label">Workspace name</label>
                            <input
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={!isAdmin}
                                style={{ opacity: isAdmin ? 1 : 0.6 }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label className="label">Workspace ID</label>
                            <input
                                className="input"
                                value={workspaceId}
                                readOnly
                                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.7 }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label className="label">Plan</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '99px',
                                    background: activeWorkspace?.plan !== 'free' ? '#fdf3e7' : 'var(--surface-2)',
                                    color: activeWorkspace?.plan !== 'free' ? 'var(--accent)' : 'var(--ink-2)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                }}>
                                    {activeWorkspace?.plan ?? 'free'}
                                </span>
                                <a
                                    href={`/workspace/${workspaceId}/billing`}
                                    style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}
                                >
                                    Manage →
                                </a>
                            </div>
                        </div>

                        {isAdmin && (
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving || name === activeWorkspace?.name}
                            >
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        )}
                    </form>
                </div>
            </section>

            {/* Danger zone */}
            {isOwner && (
                <section>
                    <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
                        Danger zone
                    </h2>
                    <div className="card" style={{ padding: '24px', borderColor: '#fecaca' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
                            <div>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: '0 0 4px' }}>
                                    Delete this workspace
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
                                    Permanently deletes all tasks, members, and data. This cannot be undone.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn btn-danger"
                                style={{ flexShrink: 0 }}
                            >
                                Delete workspace
                            </button>
                        </div>

                        {showDeleteConfirm && (
                            <div style={{
                                marginTop: '20px',
                                paddingTop: '20px',
                                borderTop: '1px solid #fecaca',
                            }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--ink-2)', margin: '0 0 12px' }}>
                                    Type <strong>{activeWorkspace?.name}</strong> to confirm deletion:
                                </p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className="input"
                                        value={confirmName}
                                        onChange={(e) => setConfirmName(e.target.value)}
                                        placeholder={activeWorkspace?.name}
                                        style={{ borderColor: '#fecaca' }}
                                    />
                                    <button
                                        onClick={handleDelete}
                                        className="btn btn-danger"
                                        disabled={deleting || confirmName !== activeWorkspace?.name}
                                        style={{ flexShrink: 0 }}
                                    >
                                        {deleting ? 'Deleting…' : 'Confirm delete'}
                                    </button>
                                    <button
                                        onClick={() => { setShowDeleteConfirm(false); setConfirmName(''); }}
                                        className="btn btn-ghost"
                                        style={{ flexShrink: 0 }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
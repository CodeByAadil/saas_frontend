'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';

interface Member {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
}

export default function MembersPage() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const { activeWorkspace } = useWorkspaceStore();
    const { user } = useAuthStore();

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInvEmail] = useState('');
    const [inviteRole, setInvRole] = useState<'admin' | 'member'>('member');
    const [inviting, setInviting] = useState(false);
    const [showInvite, setShowInvite] = useState(false);

    const myRole = activeWorkspace?.role;
    const canInvite = myRole === 'owner' || myRole === 'admin';
    const isOwner = myRole === 'owner';

    useEffect(() => {
        api.get(`/workspaces/${workspaceId}/members`)
            .then(({ data }) => setMembers(data.members))
            .catch(() => toast.error('Failed to load members'))
            .finally(() => setLoading(false));
    }, [workspaceId]);

    async function handleInvite() {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        try {
            await api.post(`/workspaces/${workspaceId}/members/invite`, {
                email: inviteEmail.trim(), role: inviteRole,
            });
            toast.success(`Invite sent to ${inviteEmail}`);
            setInvEmail(''); setShowInvite(false);
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Invite failed');
        } finally {
            setInviting(false);
        }
    }

    async function handleRoleChange(memberId: string, newRole: 'admin' | 'member') {
        try {
            await api.patch(`/workspaces/${workspaceId}/members/${memberId}/role`, { role: newRole });
            setMembers((prev) => prev.map((m) => m._id === memberId ? { ...m, role: newRole } : m));
            toast.success('Role updated');
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Failed to update role');
        }
    }

    async function handleRemove(memberId: string, name: string) {
        if (!confirm(`Remove ${name} from this workspace?`)) return;
        try {
            await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
            setMembers((prev) => prev.filter((m) => m._id !== memberId));
            toast.success(`${name} removed`);
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Failed to remove member');
        }
    }

    const roleColor: Record<string, string> = { owner: '#c8813a', admin: '#8b5cf6', member: '#64748b' };

    return (
        <div style={{ padding: '32px 40px', maxWidth: '760px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
                        Team members
                    </h1>
                    <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem', margin: 0 }}>
                        {members.length} member{members.length !== 1 ? 's' : ''} in this workspace
                    </p>
                </div>
                {canInvite && (
                    <button onClick={() => setShowInvite(true)} className="btn btn-primary">
                        + Invite member
                    </button>
                )}
            </div>

            {/* Invite panel */}
            {showInvite && (
                <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400, margin: '0 0 16px' }}>
                        Send an invitation
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label className="label">Email address</label>
                            <input className="input" type="email" value={inviteEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="colleague@company.com" />
                        </div>
                        <div style={{ width: '140px' }}>
                            <label className="label">Role</label>
                            <select className="input" value={inviteRole} onChange={(e) => setInvRole(e.target.value as any)}>
                                <option value="member">Member</option>
                                {isOwner && <option value="admin">Admin</option>}
                            </select>
                        </div>
                        <button onClick={handleInvite} className="btn btn-primary" disabled={inviting} style={{ flexShrink: 0 }}>
                            {inviting ? 'Sending…' : 'Send invite'}
                        </button>
                        <button onClick={() => setShowInvite(false)} className="btn btn-ghost" style={{ flexShrink: 0 }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Member list */}
            <div className="card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '20px' }}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '8px', borderRadius: 'var(--radius-sm)' }} />
                        ))}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['Member', 'Role', 'Joined', 'Actions'].map((h) => (
                                    <th key={h} style={{
                                        padding: '12px 20px', textAlign: 'left',
                                        fontSize: '0.75rem', fontWeight: 600,
                                        color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((m) => (
                                <tr key={m._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '14px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: 'var(--accent)', color: '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                                            }}>{m.name.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: '0 0 1px', color: 'var(--ink)' }}>
                                                    {m.name} {m._id === user?._id && <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>(you)</span>}
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--ink-3)', margin: 0 }}>{m.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        {isOwner && m.role !== 'owner' ? (
                                            <select
                                                value={m.role}
                                                onChange={(e) => handleRoleChange(m._id, e.target.value as any)}
                                                style={{
                                                    border: 'none', background: 'transparent',
                                                    color: roleColor[m.role], fontWeight: 500,
                                                    fontSize: '0.8rem', cursor: 'pointer',
                                                }}
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: roleColor[m.role] }}>
                                                {m.role}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--ink-3)' }}>
                                        {new Date(m.joinedAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        {m.role !== 'owner' && m._id !== user?._id && canInvite && (
                                            <button
                                                onClick={() => handleRemove(m._id, m.name)}
                                                className="btn btn-ghost"
                                                style={{ fontSize: '0.8rem', padding: '4px 10px', color: 'var(--danger)' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
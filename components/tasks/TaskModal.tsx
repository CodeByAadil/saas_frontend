'use client';

import { useState, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useTaskStore, type Task } from '@/store/workspaceStore';

interface Props {
    task: Task | null;  // null = create mode
    workspaceId: string;
    onClose: () => void;
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'in_review', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

export default function TaskModal({ task, workspaceId, onClose }: Props) {
    const { addTask, updateTask } = useTaskStore();
    const isEdit = !!task;

    const [title, setTitle] = useState(task?.title ?? '');
    const [desc, setDesc] = useState(task?.description ?? '');
    const [status, setStatus] = useState(task?.status ?? 'todo');
    const [priority, setPriority] = useState(task?.priority ?? 'medium');
    const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? '');
    const [tags, setTags] = useState(task?.tags?.join(', ') ?? '');
    const [loading, setLoading] = useState(false);

    // Trap focus, ESC to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!title.trim()) { toast.error('Title is required'); return; }
        setLoading(true);

        const payload = {
            title: title.trim(), description: desc, status, priority,
            dueDate: dueDate || null,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        };

        try {
            if (isEdit) {
                const { data } = await api.put(`/workspaces/${workspaceId}/tasks/${task._id}`, payload);
                updateTask(data.task);
                toast.success('Task updated');
            } else {
                const { data } = await api.post(`/workspaces/${workspaceId}/tasks`, payload);
                addTask(data.task);
                toast.success('Task created');
            }
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Failed to save task');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!task) return;
        if (!confirm('Delete this task? This cannot be undone.')) return;
        try {
            await api.delete(`/workspaces/${workspaceId}/tasks/${task._id}`);
            useTaskStore.getState().removeTask(task._id);
            toast.success('Task deleted');
            onClose();
        } catch {
            toast.error('Failed to delete task');
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    zIndex: 50, animation: 'fadeIn 0.15s ease-out',
                }}
            />

            {/* Panel */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '480px', maxWidth: '100vw',
                background: 'var(--surface-0)',
                borderLeft: '1px solid var(--border)',
                zIndex: 51, display: 'flex', flexDirection: 'column',
                animation: 'slideIn 0.2s ease-out',
                overflowY: 'auto',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'sticky', top: 0, background: 'var(--surface-0)', zIndex: 1,
                }}>
                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontSize: '1.2rem',
                        fontWeight: 400, letterSpacing: '-0.02em', margin: 0,
                    }}>
                        {isEdit ? 'Edit task' : 'New task'}
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: '1.1rem' }}>×</button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label className="label">Title</label>
                        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
                    </div>

                    <div>
                        <label className="label">Description</label>
                        <textarea
                            className="input"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="Add context, acceptance criteria, links…"
                            rows={4}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Status</label>
                            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Priority</label>
                            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">Due date</label>
                        <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>

                    <div>
                        <label className="label">Tags (comma-separated)</label>
                        <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="backend, auth, api" />
                    </div>

                    {/* AI summary display (read-only if present) */}
                    {task?.aiSummary && (
                        <div style={{
                            background: 'var(--accent-subtle)',
                            border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                            borderRadius: 'var(--radius-md)',
                            padding: '14px',
                        }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                ✦ AI Summary
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                                {task.aiSummary}
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
                        </button>
                        {isEdit && (
                            <button type="button" onClick={handleDelete} className="btn btn-danger">
                                Delete
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
}
'use client';

/**
 * AISummaryPanel — Slides in from right, triggers AI summarization
 * and shows the result streamed via Socket.io
 */

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useTaskStore, type Task } from '@/store/workspaceStore';

interface SummaryPanelProps {
    task: Task;
    workspaceId: string;
    onClose: () => void;
}

export default function AISummaryPanel({ task, workspaceId, onClose }: SummaryPanelProps) {
    const updateTask = useTaskStore((s) => s.updateTask);
    const liveTask = useTaskStore((s) => s.tasks.find((t) => t._id === task._id)) ?? task;
    const [loading, setLoading] = useState(false);

    async function triggerSummary() {
        setLoading(true);
        try {
            await api.post(`/workspaces/${workspaceId}/ai/summarize/${task._id}`);
            // Result arrives via Socket.io `ai:summary:ready` event (handled in useSocket)
            toast('Generating summary…', { icon: '✦', duration: 3000 });
        } catch {
            toast.error('Failed to start summarization');
        } finally {
            setLoading(false);
        }
    }

    // Auto-trigger if no summary exists
    useEffect(() => {
        if (!liveTask.aiSummary) triggerSummary();
    }, []);

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.3)' }} />
            <div style={{
                position: 'fixed', top: '80px', right: '24px', bottom: '24px',
                width: '360px', background: 'var(--surface-0)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
                zIndex: 51, display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                animation: 'slideIn 0.2s ease-out',
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>✦</span>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
                        AI Summary
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '4px 8px' }}>×</button>
                </div>

                <div style={{ padding: '20px', flex: 1 }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-2)', marginBottom: '16px', fontWeight: 500 }}>
                        {task.title}
                    </p>

                    {liveTask.aiSummary ? (
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>
                                {liveTask.aiSummary}
                            </p>
                            <button
                                onClick={triggerSummary}
                                className="btn btn-secondary"
                                style={{ marginTop: '20px', width: '100%', fontSize: '0.8rem' }}
                                disabled={loading}
                            >
                                ↻ Regenerate
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="animate-pulse-dot" style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: 'var(--accent)',
                                        animationDelay: `${i * 0.2}s`,
                                        animation: 'pulseDot 1.5s ease-in-out infinite',
                                    }} />
                                ))}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>Generating summary…</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}


/**
 * AIGenerateModal — Prompt input to bulk-generate tasks via AI
 */
interface GenerateModalProps {
    workspaceId: string;
    onClose: () => void;
}

export function AIGenerateModal({ workspaceId, onClose }: GenerateModalProps) {
    const [prompt, setPrompt] = useState('');
    const [count, setCount] = useState(5);
    const [loading, setLoading] = useState(false);

    async function handleGenerate() {
        if (!prompt.trim()) { toast.error('Enter a prompt first'); return; }
        setLoading(true);
        try {
            await api.post(`/workspaces/${workspaceId}/ai/generate-tasks`, {
                prompt: prompt.trim(), count,
            });
            toast('Generating tasks…', { icon: '✦', duration: 3000 });
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Generation failed');
        } finally {
            setLoading(false);
        }
    }

    const examples = [
        'Build a user authentication system with email and Google OAuth',
        'Create a payment flow with Stripe integration and webhooks',
        'Set up CI/CD pipeline with GitHub Actions and deployment to AWS',
    ];

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: '540px', maxWidth: '95vw',
                background: 'var(--surface-0)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                zIndex: 61, padding: '32px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
                animation: 'slideIn 0.2s ease-out',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>✦</span>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, letterSpacing: '-0.02em', margin: 0 }}>
                        AI Task Generator
                    </h2>
                    <button onClick={onClose} className="btn btn-ghost" style={{ marginLeft: 'auto' }}>×</button>
                </div>

                <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem', marginBottom: '20px', lineHeight: 1.6 }}>
                    Describe a feature or goal and the AI will break it into actionable development tasks.
                </p>

                <div style={{ marginBottom: '16px' }}>
                    <label className="label">Describe your goal</label>
                    <textarea
                        className="input"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Build a real-time notification system with WebSockets…"
                        rows={3}
                        autoFocus
                        style={{ resize: 'none' }}
                    />
                </div>

                {/* Examples */}
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginBottom: '8px' }}>Examples:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {examples.map((ex) => (
                            <button
                                key={ex}
                                onClick={() => setPrompt(ex)}
                                style={{
                                    textAlign: 'left', background: 'var(--surface-1)',
                                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                                    padding: '8px 12px', fontSize: '0.8rem', color: 'var(--ink-2)',
                                    cursor: 'pointer', transition: 'all 0.1s',
                                }}
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <label className="label" style={{ margin: 0 }}>Number of tasks</label>
                    <input
                        type="range" min={1} max={15} value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <span style={{
                        minWidth: '32px', textAlign: 'center',
                        background: 'var(--accent)', color: '#fff',
                        borderRadius: 'var(--radius-sm)', padding: '2px 8px',
                        fontSize: '0.85rem', fontWeight: 600,
                    }}>{count}</span>
                </div>

                <button
                    onClick={handleGenerate}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? 'Submitting…' : `✦ Generate ${count} tasks`}
                </button>
            </div>
        </>
    );
}
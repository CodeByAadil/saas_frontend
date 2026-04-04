'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import type { Task } from '@/store/workspaceStore';
import clsx from 'clsx';

const PRIORITY_COLORS: Record<string, string> = {
    low: '#64748b',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444',
};

const PRIORITY_BG: Record<string, string> = {
    low: '#f1f5f9',
    medium: '#eff6ff',
    high: '#fffbeb',
    urgent: '#fef2f2',
};

interface Props {
    task: Task;
    isDragging?: boolean;
    onClick?: () => void;
    onAIClick?: () => void;
}

export default function TaskCard({ task, isDragging, onClick, onAIClick }: Props) {
    const {
        attributes, listeners, setNodeRef,
        transform, transition, isDragging: isSortDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortDragging ? 0.35 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <div
                onClick={onClick}
                style={{
                    background: 'var(--surface-0)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                    userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                }}
            >
                {/* Priority badge + AI indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{
                        fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px',
                        borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: PRIORITY_BG[task.priority],
                        color: PRIORITY_COLORS[task.priority],
                    }}>
                        {task.priority}
                    </span>
                    {task.aiSummary && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent)', marginLeft: 'auto' }} title="AI summary available">✦</span>
                    )}
                </div>

                {/* Title */}
                <p style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--ink)',
                    margin: '0 0 10px',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {task.title}
                </p>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Assignee avatar */}
                    {task.assigneeId && (
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: 'var(--accent)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
                        }} title={task.assigneeId.name}>
                            {task.assigneeId.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {/* Due date */}
                    {task.dueDate && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--ink-3)', marginLeft: 'auto' }}>
                            {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                    )}

                    {/* Attachments count */}
                    {task.attachments.length > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>
                            ◫ {task.attachments.length}
                        </span>
                    )}

                    {/* AI summary trigger */}
                    {!task.aiSummary && onAIClick && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAIClick(); }}
                            style={{
                                marginLeft: 'auto', background: 'none', border: 'none',
                                cursor: 'pointer', color: 'var(--ink-3)', fontSize: '0.75rem',
                                padding: '2px 4px', borderRadius: '4px',
                            }}
                            title="Generate AI summary"
                        >
                            ✦
                        </button>
                    )}
                </div>

                {/* Tags */}
                {task.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {task.tags.slice(0, 3).map((tag) => (
                            <span key={tag} style={{
                                fontSize: '0.68rem', padding: '1px 6px',
                                background: 'var(--surface-2)', color: 'var(--ink-2)',
                                borderRadius: '4px',
                            }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/store/workspaceStore';
import TaskCard from './TaskCard';

interface Props {
    column: { id: TaskStatus; label: string; color: string };
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onAIClick: (task: Task) => void;
}

export default function TaskColumn({ column, tasks, onTaskClick, onAIClick }: Props) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface-0)',
            border: `1px solid ${isOver ? column.color : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            transition: 'border-color 0.15s',
            overflow: 'hidden',
        }}>
            {/* Column header */}
            <div style={{
                padding: '14px 16px 12px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
            }}>
                <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: column.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    {column.label}
                </span>
                <span style={{
                    marginLeft: 'auto',
                    background: 'var(--surface-2)',
                    color: 'var(--ink-2)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    padding: '1px 7px',
                    borderRadius: '99px',
                }}>
                    {tasks.length}
                </span>
            </div>

            {/* Droppable task list */}
            <div
                ref={setNodeRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '10px',
                    background: isOver ? `color-mix(in srgb, ${column.color} 5%, var(--surface-1))` : 'transparent',
                    transition: 'background 0.15s',
                    minHeight: '80px',
                }}
            >
                <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onClick={() => onTaskClick(task)}
                            onAIClick={() => onAIClick(task)}
                        />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '32px 16px',
                        color: 'var(--ink-3)',
                        fontSize: '0.8rem',
                    }}>
                        Drop tasks here
                    </div>
                )}
            </div>
        </div>
    );
}
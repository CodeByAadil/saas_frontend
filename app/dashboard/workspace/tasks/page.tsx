'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
    type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useTaskStore, type Task, type TaskStatus } from '@/store/workspaceStore';
import { useSocket } from '@/hooks/useSocket';
import TaskColumn from '@/components/tasks/TaskColumn';
import TaskCard from '@/components/tasks/TaskCard';
import TaskModal from '@/components/tasks/TaskModal';
import AISummaryPanel from '@/components/tasks/AISummaryPanel';
import AIGenerateModal from '@/components/tasks/AIGenerateModal';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: '#64748b' },
    { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
    { id: 'in_review', label: 'In Review', color: '#8b5cf6' },
    { id: 'done', label: 'Done', color: '#10b981' },
];

export default function TaskBoardPage() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const { tasks, setTasks, moveTask, setLoading, loading } = useTaskStore();

    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showGenerate, setShowGenerate] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [aiPanelTask, setAIPanelTask] = useState<Task | null>(null);

    // Connect Socket.io for real-time updates
    useSocket(workspaceId);

    // Load tasks on mount
    useEffect(() => {
        setLoading(true);
        api.get(`/workspaces/${workspaceId}/tasks?limit=100`)
            .then(({ data }) => setTasks(data.tasks))
            .catch(() => toast.error('Failed to load tasks'))
            .finally(() => setLoading(false));
    }, [workspaceId]);

    // dnd-kit sensors — delay to prevent accidental drags on click
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    function handleDragStart({ active }: DragStartEvent) {
        setActiveTask(tasks.find((t) => t._id === active.id) ?? null);
    }

    async function handleDragEnd({ active, over }: DragEndEvent) {
        setActiveTask(null);
        if (!over || active.id === over.id) return;

        const newStatus = over.id as TaskStatus;
        const task = tasks.find((t) => t._id === active.id);
        if (!task || task.status === newStatus) return;

        // Optimistic update
        moveTask(task._id, newStatus);

        try {
            await api.patch(`/workspaces/${workspaceId}/tasks/${task._id}/status`, { status: newStatus });
        } catch {
            // Revert on failure
            moveTask(task._id, task.status);
            toast.error('Failed to update task status');
        }
    }

    const tasksByStatus = useCallback(
        (status: TaskStatus) => tasks.filter((t) => t.status === status),
        [tasks]
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

            {/* ── Header ───────────────────────────────────────────────────────── */}
            <div style={{
                padding: '20px 28px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-0)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)', fontSize: '1.6rem',
                        fontWeight: 400, letterSpacing: '-0.03em', margin: 0,
                    }}>Task Board</h1>
                    <p style={{ color: 'var(--ink-2)', fontSize: '0.85rem', margin: '2px 0 0' }}>
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''} across {COLUMNS.length} columns
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowGenerate(true)}
                        className="btn btn-secondary"
                        style={{ gap: '6px' }}
                    >
                        <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>✦</span>
                        AI Generate
                    </button>
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                        + New Task
                    </button>
                </div>
            </div>

            {/* ── Kanban board ─────────────────────────────────────────────────── */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '24px 28px' }}>
                {loading ? (
                    <BoardSkeleton />
                ) : (
                    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '16px',
                            height: '100%',
                        }}>
                            {COLUMNS.map((col) => (
                                <TaskColumn
                                    key={col.id}
                                    column={col}
                                    tasks={tasksByStatus(col.id)}
                                    onTaskClick={(task) => setSelectedTask(task)}
                                    onAIClick={(task) => setAIPanelTask(task)}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeTask && (
                                <div className="drag-overlay">
                                    <TaskCard task={activeTask} isDragging />
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>

            {/* ── Panels & Modals ───────────────────────────────────────────────── */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    workspaceId={workspaceId}
                    onClose={() => setSelectedTask(null)}
                />
            )}

            {showCreate && (
                <TaskModal
                    task={null}
                    workspaceId={workspaceId}
                    onClose={() => setShowCreate(false)}
                />
            )}

            {showGenerate && (
                <AIGenerateModal
                    workspaceId={workspaceId}
                    onClose={() => setShowGenerate(false)}
                />
            )}

            {aiPanelTask && (
                <AISummaryPanel
                    task={aiPanelTask}
                    workspaceId={workspaceId}
                    onClose={() => setAIPanelTask(null)}
                />
            )}
        </div>
    );
}

function BoardSkeleton() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', height: '100%' }}>
            {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border)' }}>
                    <div className="skeleton" style={{ height: '20px', width: '80px', marginBottom: '16px' }} />
                    {[...Array(3)].map((_, j) => (
                        <div key={j} className="skeleton" style={{ height: '88px', marginBottom: '10px', borderRadius: 'var(--radius-md)' }} />
                    ))}
                </div>
            ))}
        </div>
    );
}
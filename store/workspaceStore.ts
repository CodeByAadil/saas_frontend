/**
 * store/workspaceStore.ts
 */
import { create } from 'zustand';

export interface Workspace {
    _id: string;
    name: string;
    slug: string;
    plan: 'free' | 'pro' | 'enterprise';
    memberCount: number;
    role: 'owner' | 'admin' | 'member';
}

interface WorkspaceState {
    workspaces: Workspace[];
    activeWorkspace: Workspace | null;
    setWorkspaces: (ws: Workspace[]) => void;
    setActive: (ws: Workspace) => void;
    updateWorkspace: (patch: Partial<Workspace> & { _id: string }) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    workspaces: [],
    activeWorkspace: null,

    setWorkspaces: (workspaces) => set({ workspaces }),

    setActive: (ws) => set({ activeWorkspace: ws }),

    updateWorkspace: (patch) =>
        set((state) => ({
            workspaces: state.workspaces.map((w) =>
                w._id === patch._id ? { ...w, ...patch } : w
            ),
            activeWorkspace:
                state.activeWorkspace?._id === patch._id
                    ? { ...state.activeWorkspace, ...patch }
                    : state.activeWorkspace,
        })),
}));


/**
 * store/taskStore.ts
 */
import { create as createTask } from 'zustand';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    _id: string;
    workspaceId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId: { _id: string; name: string; avatarUrl?: string } | null;
    createdBy: { _id: string; name: string; avatarUrl?: string };
    aiSummary: string | null;
    attachments: string[];
    dueDate: string | null;
    tags: string[];
    createdAt: string;
}

interface TaskState {
    tasks: Task[];
    loading: boolean;
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    updateTask: (task: Partial<Task> & { _id: string }) => void;
    removeTask: (id: string) => void;
    setLoading: (v: boolean) => void;
    moveTask: (id: string, status: TaskStatus) => void;
}

export const useTaskStore = createTask<TaskState>((set) => ({
    tasks: [],
    loading: false,

    setTasks: (tasks) => set({ tasks }),
    addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
    removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) })),
    setLoading: (loading) => set({ loading }),

    updateTask: (patch) =>
        set((s) => ({
            tasks: s.tasks.map((t) => (t._id === patch._id ? { ...t, ...patch } : t)),
        })),

    moveTask: (id, status) =>
        set((s) => ({
            tasks: s.tasks.map((t) => (t._id === id ? { ...t, status } : t)),
        })),
}));
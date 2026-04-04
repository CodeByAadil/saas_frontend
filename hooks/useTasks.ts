/**
 * hooks/useTasks.ts
 *
 * Wraps task API calls with optimistic updates, error rollback,
 * and loading states. Components import this hook instead of
 * calling the API directly, keeping pages thin.
 */

'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useTaskStore, type Task, type TaskStatus } from '@/store/workspaceStore';

export function useTasks(workspaceId: string) {
    const { tasks, addTask, updateTask, removeTask, moveTask, setTasks, setLoading } = useTaskStore();

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchTasks = useCallback(async (params?: Record<string, string>) => {
        setLoading(true);
        try {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            const { data } = await api.get(`/workspaces/${workspaceId}/tasks${qs}`);
            setTasks(data.tasks);
            return data.tasks as Task[];
        } catch {
            toast.error('Failed to load tasks');
            return [];
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    // ── Create ─────────────────────────────────────────────────────────────────
    const createTask = useCallback(async (payload: Partial<Task>) => {
        try {
            const { data } = await api.post(`/workspaces/${workspaceId}/tasks`, payload);
            addTask(data.task);
            toast.success('Task created');
            return data.task as Task;
        } catch (err: any) {
            toast.error(err.response?.data?.error ?? 'Failed to create task');
            throw err;
        }
    }, [workspaceId]);

    // ── Update ─────────────────────────────────────────────────────────────────
    const updateTaskById = useCallback(async (taskId: string, payload: Partial<Task>) => {
        // Optimistic update
        updateTask({ _id: taskId, ...payload });
        try {
            const { data } = await api.put(`/workspaces/${workspaceId}/tasks/${taskId}`, payload);
            updateTask(data.task);
            return data.task as Task;
        } catch (err: any) {
            // Rollback: re-fetch the real state
            toast.error(err.response?.data?.error ?? 'Failed to update task');
            api.get(`/workspaces/${workspaceId}/tasks/${taskId}`)
                .then(({ data }) => updateTask(data.task))
                .catch(() => { });
            throw err;
        }
    }, [workspaceId]);

    // ── Move (status change) ───────────────────────────────────────────────────
    const moveTaskTo = useCallback(async (taskId: string, status: TaskStatus) => {
        const previous = tasks.find((t) => t._id === taskId)?.status;
        moveTask(taskId, status);  // optimistic
        try {
            await api.patch(`/workspaces/${workspaceId}/tasks/${taskId}/status`, { status });
        } catch (err: any) {
            if (previous) moveTask(taskId, previous);  // rollback
            toast.error('Failed to update task status');
        }
    }, [workspaceId, tasks]);

    // ── Delete ─────────────────────────────────────────────────────────────────
    const deleteTask = useCallback(async (taskId: string) => {
        const previous = tasks.find((t) => t._id === taskId);
        removeTask(taskId);  // optimistic
        try {
            await api.delete(`/workspaces/${workspaceId}/tasks/${taskId}`);
            toast.success('Task deleted');
        } catch (err: any) {
            if (previous) addTask(previous);  // rollback
            toast.error('Failed to delete task');
        }
    }, [workspaceId, tasks]);

    // ── AI summarize ───────────────────────────────────────────────────────────
    const requestSummary = useCallback(async (taskId: string) => {
        try {
            await api.post(`/workspaces/${workspaceId}/ai/summarize/${taskId}`);
            // Result will arrive via Socket.io `ai:summary:ready`
        } catch {
            toast.error('Failed to request AI summary');
        }
    }, [workspaceId]);

    // ── File attachment ────────────────────────────────────────────────────────
    const uploadAttachment = useCallback(async (taskId: string, file: File) => {
        // 1. Get presigned URL
        const { data: urlData } = await api.get('/files/presigned-url', {
            params: {
                filename: file.name,
                contentType: file.type,
                workspaceId,
            },
        });

        // 2. PUT file directly to S3 (bypasses our server)
        await fetch(urlData.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
        });

        // 3. Register the S3 key on the task
        const { data } = await api.post(
            `/workspaces/${workspaceId}/tasks/${taskId}/attachments`,
            { s3Key: urlData.s3Key }
        );
        updateTask(data.task);
        toast.success('File attached');
        return urlData.s3Key as string;
    }, [workspaceId]);

    return {
        tasks,
        fetchTasks,
        createTask,
        updateTask: updateTaskById,
        moveTask: moveTaskTo,
        deleteTask,
        requestSummary,
        uploadAttachment,
    };
}
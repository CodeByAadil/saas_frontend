/**
 * hooks/useSocket.ts
 *
 * Connects to Socket.io, joins the workspace room, and
 * wires server-pushed events into the Zustand task store.
 * Automatically disconnects on unmount / workspace change.
 */

'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/workspaceStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:4000';

export function useSocket(workspaceId: string | null) {
    const socketRef = useRef<Socket | null>(null);
    const token = useAuthStore((s) => s.token);
    const { addTask, updateTask, removeTask } = useTaskStore();

    useEffect(() => {
        if (!workspaceId || !token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[socket] Connected:', socket.id);
            socket.emit('join:workspace', workspaceId);
        });

        socket.on('connect_error', (err) => {
            console.error('[socket] Connection error:', err.message);
        });

        // ── Task events ──────────────────────────────────────────────────────────
        socket.on('task:created', (task) => {
            addTask(task);
            toast.success(`New task: ${task.title}`, { duration: 2500 });
        });

        socket.on('task:updated', (patch) => {
            updateTask(patch);
        });

        socket.on('task:deleted', ({ taskId }: { taskId: string }) => {
            removeTask(taskId);
        });

        // ── AI events ────────────────────────────────────────────────────────────
        socket.on('ai:summary:ready', ({ taskId, summary }: { taskId: string; summary: string }) => {
            updateTask({ _id: taskId, aiSummary: summary });
            toast.success('AI summary ready', { icon: '✦' });
        });

        socket.on('ai:tasks:generated', ({ tasks, prompt }: { tasks: any[]; prompt: string }) => {
            tasks.forEach((t) => addTask(t));
            toast.success(`${tasks.length} tasks generated from AI`, { icon: '✦', duration: 4000 });
        });

        socket.on('ai:error', ({ message }: { message: string }) => {
            toast.error(`AI error: ${message}`);
        });

        // ── Subscription events ──────────────────────────────────────────────────
        socket.on('subscription:updated', ({ plan }: { plan: string }) => {
            toast.success(`Plan updated to ${plan}`, { icon: '⭐' });
        });

        // ── Member events ────────────────────────────────────────────────────────
        socket.on('member:joined', ({ email }: { email: string }) => {
            toast(`${email} joined the workspace`, { icon: '👋' });
        });

        return () => {
            socket.emit('leave:workspace', workspaceId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [workspaceId, token]);

    return socketRef;
}
/**
 * hooks/useWorkspace.ts
 *
 * Provides the active workspace with its subscription data,
 * and exposes helpers for switching workspace context.
 *
 * Keeps the JWT token in sync — when the user switches workspace
 * we call /auth/refresh with the new workspaceId to get a fresh
 * token scoped to the correct workspace.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore, type Workspace } from '@/store/workspaceStore';

interface UseWorkspaceReturn {
    workspace: Workspace | null;
    subscription: SubscriptionData | null;
    loading: boolean;
    switchTo: (ws: Workspace) => Promise<void>;
    refresh: () => Promise<void>;
}

interface SubscriptionData {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
}

export function useWorkspace(workspaceId?: string): UseWorkspaceReturn {
    const router = useRouter();
    const { setToken } = useAuthStore();
    const { activeWorkspace, workspaces, setWorkspaces, setActive, updateWorkspace } = useWorkspaceStore();

    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(false);

    // Load subscription data when workspace is set
    useEffect(() => {
        const id = workspaceId ?? activeWorkspace?._id;
        if (!id) return;

        api.get(`/billing/subscription/${id}`)
            .then(({ data }) => setSubscription(data.subscription))
            .catch(() => {/* non-fatal — subscription may not exist on new workspace */ });
    }, [workspaceId ?? activeWorkspace?._id]);

    // Load all workspaces if not yet loaded
    useEffect(() => {
        if (workspaces.length > 0) return;
        setLoading(true);
        api.get('/workspaces')
            .then(({ data }) => {
                setWorkspaces(data.workspaces);
                if (!activeWorkspace && data.workspaces.length > 0) {
                    setActive(data.workspaces[0]);
                }
            })
            .catch(() => toast.error('Failed to load workspaces'))
            .finally(() => setLoading(false));
    }, []);

    /**
     * Switches the active workspace and refreshes the JWT so
     * the new workspaceId is embedded in the access token.
     */
    const switchTo = useCallback(async (ws: Workspace) => {
        setActive(ws);
        try {
            const { data } = await api.post('/auth/refresh');
            setToken(data.accessToken);
            router.push(`/workspace/${ws._id}/tasks`);
        } catch {
            // Non-fatal — old token still works until it expires
        }
    }, []);

    /**
     * Re-fetches the active workspace's data from the server.
     * Useful after a settings update.
     */
    const refresh = useCallback(async () => {
        const id = workspaceId ?? activeWorkspace?._id;
        if (!id) return;
        try {
            const { data } = await api.get(`/workspaces/${id}`);
            updateWorkspace(data.workspace);
        } catch {
            toast.error('Failed to refresh workspace');
        }
    }, [workspaceId ?? activeWorkspace?._id]);

    return {
        workspace: workspaceId
            ? (workspaces.find((w) => w._id === workspaceId) ?? activeWorkspace)
            : activeWorkspace,
        subscription,
        loading,
        switchTo,
        refresh,
    };
}
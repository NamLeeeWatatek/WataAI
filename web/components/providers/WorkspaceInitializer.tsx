'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useWorkspaceStore } from '@/lib/store/zustand/workspace-store';
import { setActiveWorkspaceId, getActiveWorkspaceId } from '@/lib/axios-client';
import axiosClient from '@/lib/axios-client';
import { AxiosError } from 'axios';
import { WorkspaceEntity } from '@/types/next-auth';

/**
 * Syncs session and workspace data between NextAuth and Zustand/Axios
 */
export function WorkspaceInitializer() {
    const { data: session, status } = useSession();
    const {
        currentWorkspace,
        workspaces,
        isLoading: isWorkspaceLoading,
        error: workspaceError,
        setWorkspaces,
        setCurrentWorkspace,
        setLoading,
        setError
    } = useWorkspaceStore();

    // 1. Initialize Workspaces in Zustand Store
    useEffect(() => {
        // Prevent fetching if already loading, already has error, or not authenticated
        if (status !== 'authenticated' || !session?.user || !session?.accessToken) return;

        // Initial hydration of axios workspace ID from session if locally empty.
        if (session.workspace?.id && !getActiveWorkspaceId()) {
            setActiveWorkspaceId(session.workspace.id);
        }

        if (isWorkspaceLoading || workspaceError || workspaces.length > 0) return;

        const fetchWorkspaces = async () => {
            setLoading(true);
            try {
                const response = await axiosClient.get<WorkspaceEntity[]>('/workspaces');
                const workspacesData = Array.isArray(response) ? response : [];

                if (workspacesData.length > 0) {
                    setWorkspaces(workspacesData as any);

                    let targetWorkspace = workspacesData[0];
                    if (session.workspace?.id) {
                        const defaultWs = workspacesData.find((w: WorkspaceEntity) => w.id === session.workspace?.id);
                        if (defaultWs) targetWorkspace = defaultWs;
                    }

                    setCurrentWorkspace(targetWorkspace as any);

                    // Only update axios ID if it wasn't already set to something else
                    if (!getActiveWorkspaceId()) {
                        setActiveWorkspaceId(targetWorkspace.id);
                    }
                }
            } catch (err: unknown) {
                const error = err as AxiosError<{ message?: string }>;
                console.error('Failed to fetch workspaces:', error.response?.data?.message || error.message);
                setError('Failed to load workspaces');
            } finally {
                setLoading(false);
            }
        };

        fetchWorkspaces();
    }, [status, session, workspaces.length, isWorkspaceLoading, workspaceError, currentWorkspace, setWorkspaces, setCurrentWorkspace, setLoading, setError]);

    // 2. Keep axios workspace ID in sync with Zustand
    useEffect(() => {
        if (currentWorkspace?.id) {
            setActiveWorkspaceId(currentWorkspace.id);
        }
    }, [currentWorkspace]);

    return null;
}

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useWorkspaceStore } from '@/lib/store/zustand/workspace-store';
import { setActiveWorkspaceId, getActiveWorkspaceId } from '@/lib/axios-client';

import { useWorkspaces } from '@/lib/hooks/features/useWorkspaces';

/**
 * Syncs session and workspace data between NextAuth and Zustand/Axios
 */
export function WorkspaceInitializer() {
    const { data: session, status } = useSession();
    const {
        currentWorkspace,
        setWorkspaces,
        setCurrentWorkspace,
        setLoading,
        setError,
        workspaces: existingWorkspaces
    } = useWorkspaceStore();

    const {
        workspaces: fetchedWorkspaces,
        isLoading,
        error
    } = useWorkspaces();

    // 1. Sync fetched workspaces to Zustand
    useEffect(() => {
        if (status !== 'authenticated' || !session?.user || !session?.accessToken) return;

        if (isLoading) {
            setLoading(true);
            return;
        }
        setLoading(false);

        if (error) {
            setError('Failed to load workspaces');
            return;
        }

        if (fetchedWorkspaces.length > 0 && existingWorkspaces.length === 0) {
            setWorkspaces(fetchedWorkspaces as any);

            let targetWorkspace = fetchedWorkspaces[0];
            if (session.workspace?.id) {
                const defaultWs = fetchedWorkspaces.find((w) => w.id === session.workspace?.id);
                if (defaultWs) targetWorkspace = defaultWs;
            }

            setCurrentWorkspace(targetWorkspace as any);

            // Initial hydration of axios workspace ID from session if locally empty.
            if (!getActiveWorkspaceId()) {
                setActiveWorkspaceId(targetWorkspace.id);
            }
        }
    }, [status, session, fetchedWorkspaces, isLoading, error, existingWorkspaces.length, setWorkspaces, setCurrentWorkspace, setLoading, setError]);

    // 2. Keep axios workspace ID in sync with Zustand
    useEffect(() => {
        if (currentWorkspace?.id) {
            setActiveWorkspaceId(currentWorkspace.id);
        }
    }, [currentWorkspace]);

    return null;
}

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
    setWorkspaces,
    setCurrentWorkspace,
    setLoading,
    setError,
} from '@/lib/store/slices/workspaceSlice';
import { setActiveWorkspaceId, setAxiosToken } from '@/lib/axios-client';
import axiosClient from '@/lib/axios-client';
import { AxiosError } from 'axios';
import { WorkspaceEntity } from '@/types/next-auth';

/**
 * Syncs session and workspace data between NextAuth and Redux/Axios
 */
export function WorkspaceInitializer() {
    const { data: session, status } = useSession();
    const dispatch = useAppDispatch();
    const { currentWorkspace, workspaces, isLoading: isWorkspaceLoading, error: workspaceError } = useAppSelector(state => state.workspace);

    // 1. Initialize Workspaces in Redux Store
    useEffect(() => {
        // Prevent fetching if already loading, already has error, or not authenticated
        if (status !== 'authenticated' || !session?.user || !session?.accessToken) return;
        if (isWorkspaceLoading || workspaceError || workspaces.length > 0) return;

        const fetchWorkspaces = async () => {
            dispatch(setLoading(true));
            try {
                // response is typed as WorkspaceEntity[] because of axiosClient interceptor returning data
                const response = await axiosClient.get<WorkspaceEntity[]>('/workspaces');
                const workspacesData = Array.isArray(response) ? response : [];

                if (workspacesData.length > 0) {
                    dispatch(setWorkspaces(workspacesData as any)); // cast to generic Workspace if internal types differ slightly

                    let targetWorkspace = workspacesData[0];
                    if (session.workspace?.id) {
                        const defaultWs = workspacesData.find((w: WorkspaceEntity) => w.id === session.workspace?.id);
                        if (defaultWs) targetWorkspace = defaultWs;
                    }

                    dispatch(setCurrentWorkspace(targetWorkspace as any));
                    setActiveWorkspaceId(targetWorkspace.id);
                }
            } catch (err: unknown) {
                const error = err as AxiosError<{ message?: string }>;
                console.error('Failed to fetch workspaces:', error.response?.data?.message || error.message);

                // If it's a 401, axiosClient will handle the sign out.
                // We set the error to prevent WorkspaceInitializer from looping immediately.
                dispatch(setError('Failed to load workspaces'));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchWorkspaces();
    }, [status, session, dispatch, workspaces.length, isWorkspaceLoading, workspaceError, currentWorkspace]);

    // 3. Keep axios workspace ID in sync with Redux
    useEffect(() => {
        if (currentWorkspace?.id) {
            setActiveWorkspaceId(currentWorkspace.id);
        }
    }, [currentWorkspace]);

    return null;
}

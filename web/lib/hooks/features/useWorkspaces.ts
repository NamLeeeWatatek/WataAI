import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi, Workspace } from '@/lib/api/workspaces';

export const workspaceKeys = {
    all: ['workspaces'] as const,
    list: () => [...workspaceKeys.all, 'list'] as const,
    detail: (id: string) => [...workspaceKeys.all, 'detail', id] as const,
};

export function useWorkspaces() {
    const query = useQuery({
        queryKey: workspaceKeys.list(),
        queryFn: () => workspacesApi.getAll(),
    });

    return {
        ...query,
        workspaces: query.data || [],
    };
}

import { useWorkspaceStore } from '@/lib/store/zustand/workspace-store'

export function useWorkspace() {
  const { currentWorkspace, workspaces } = useWorkspaceStore()

  return {
    workspace: currentWorkspace,
    workspaces: workspaces,
    currentWorkspace: currentWorkspace,
    workspaceId: currentWorkspace?.id || null,
    isLoading: false, // Loading is handled by TanStack Query or Initialization
    hasWorkspace: !!currentWorkspace?.id,
  }
}

export type UseWorkspaceReturn = ReturnType<typeof useWorkspace>

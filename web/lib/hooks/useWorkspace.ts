
import { useAppSelector } from '@/lib/store/hooks'

export function useWorkspace() {
  const { currentWorkspace, workspaces, isLoading } = useAppSelector(state => state.workspace)

  return {
    workspace: currentWorkspace,
    workspaces: workspaces,
    currentWorkspace: currentWorkspace,
    workspaceId: currentWorkspace?.id || null,
    isLoading: isLoading,
    hasWorkspace: !!currentWorkspace?.id,
  }
}

export type UseWorkspaceReturn = ReturnType<typeof useWorkspace>

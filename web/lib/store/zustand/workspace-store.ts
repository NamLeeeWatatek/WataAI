import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Workspace } from '@/lib/types/workspace'
import { setActiveWorkspaceId } from '@/lib/axios-client'

interface WorkspaceState {
    currentWorkspace: Workspace | null
    workspaces: Workspace[]
    isLoading: boolean
    error: string | null

    // Actions
    setCurrentWorkspace: (workspace: Workspace | null) => void
    setWorkspaces: (workspaces: Workspace[]) => void
    addWorkspace: (workspace: Workspace) => void
    updateWorkspace: (workspace: Workspace) => void
    removeWorkspace: (id: string) => void
    switchWorkspace: (id: string) => void
    setLoading: (isLoading: boolean) => void
    setError: (error: string | null) => void
    clearWorkspaces: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            currentWorkspace: null,
            workspaces: [],
            isLoading: false,
            error: null,

            setCurrentWorkspace: (workspace) => {
                set({ currentWorkspace: workspace })
                setActiveWorkspaceId(workspace?.id || null)
            },

            setWorkspaces: (workspaces) => {
                const { currentWorkspace } = get()
                set({ workspaces })

                // If no current workspace but we have workspaces, select the first one
                if (!currentWorkspace && workspaces.length > 0) {
                    const firstWorkspace = workspaces[0]
                    set({ currentWorkspace: firstWorkspace })
                    setActiveWorkspaceId(firstWorkspace.id)
                }
            },

            addWorkspace: (workspace) =>
                set((state) => ({
                    workspaces: [...state.workspaces, workspace],
                })),

            updateWorkspace: (payload) =>
                set((state) => {
                    const newWorkspaces = state.workspaces.map((w) =>
                        w.id === payload.id ? payload : w
                    )
                    const isCurrent = state.currentWorkspace?.id === payload.id

                    if (isCurrent) {
                        setActiveWorkspaceId(payload.id)
                    }

                    return {
                        workspaces: newWorkspaces,
                        currentWorkspace: isCurrent ? payload : state.currentWorkspace,
                    }
                }),

            removeWorkspace: (id) =>
                set((state) => {
                    const newWorkspaces = state.workspaces.filter((w) => w.id !== id)
                    const isCurrent = state.currentWorkspace?.id === id
                    const nextWorkspace = isCurrent ? (newWorkspaces[0] || null) : state.currentWorkspace

                    if (isCurrent) {
                        setActiveWorkspaceId(nextWorkspace?.id || null)
                    }

                    return {
                        workspaces: newWorkspaces,
                        currentWorkspace: nextWorkspace,
                    }
                }),

            switchWorkspace: (id) => {
                const { workspaces } = get()
                const workspace = workspaces.find((w) => w.id === id)
                if (workspace) {
                    set({ currentWorkspace: workspace })
                    setActiveWorkspaceId(workspace.id)
                }
            },

            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),
            clearWorkspaces: () => {
                set({ currentWorkspace: null, workspaces: [], error: null })
                setActiveWorkspaceId(null)
            },
        }),
        {
            name: 'workspace-storage',
            partialize: (state) => ({ currentWorkspace: state.currentWorkspace }), // Only persist current workspace
        }
    )
)

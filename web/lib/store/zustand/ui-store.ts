import { create } from 'zustand'

interface UiState {
    /** Global loading state - shows overlay most of the screen */
    isGlobalLoading: boolean
    /** Current loading message */
    loadingMessage: string | null
    /** Stack of active loading actions (allows multiple concurrent loadings) */
    loadingActions: string[]
    /** Dynamic breadcrumb names mapped by ID */
    breadcrumbNames: Record<string, string>

    // Actions
    setBreadcrumbName: (id: string, name: string) => void
    removeBreadcrumbName: (id: string) => void
    setGlobalLoading: (actionId: string, isLoading: boolean, message?: string) => void
    clearGlobalLoading: () => void
}

export const useUiStore = create<UiState>((set) => ({
    isGlobalLoading: false,
    loadingMessage: null,
    loadingActions: [],
    breadcrumbNames: {},

    setBreadcrumbName: (id, name) =>
        set((state) => ({
            breadcrumbNames: { ...state.breadcrumbNames, [id]: name },
        })),

    removeBreadcrumbName: (id) =>
        set((state) => {
            const newNames = { ...state.breadcrumbNames }
            delete newNames[id]
            return { breadcrumbNames: newNames }
        }),

    setGlobalLoading: (actionId, isLoading, message) =>
        set((state) => {
            if (isLoading) {
                // Start loading
                const newActions = state.loadingActions.includes(actionId)
                    ? state.loadingActions
                    : [...state.loadingActions, actionId]

                return {
                    isGlobalLoading: true,
                    loadingMessage: message || state.loadingMessage,
                    loadingActions: newActions,
                }
            } else {
                // End loading
                const newActions = state.loadingActions.filter((id) => id !== actionId)
                const isStillLoading = newActions.length > 0

                return {
                    loadingActions: newActions,
                    isGlobalLoading: isStillLoading,
                    loadingMessage: isStillLoading ? state.loadingMessage : null,
                }
            }
        }),

    clearGlobalLoading: () =>
        set({
            isGlobalLoading: false,
            loadingMessage: null,
            loadingActions: [],
        }),
}))

import { create } from 'zustand'

interface KBState {
    currentFolderId: string | null
    breadcrumbs: Array<{ id: string | null; name: string }>
    viewMode: 'grid' | 'table'
    searchQuery: string
    selectedIds: string[]
    autoRefreshing: boolean
    currentPage: number
    pageSize: number
    draggedItem: { type: 'folder' | 'document'; id: string } | null
    dragOverFolder: string | null

    // Actions
    setCurrentFolderId: (id: string | null) => void
    navigateToFolder: (id: string | null, name: string) => void
    navigateToBreadcrumb: (index: number) => void
    setViewMode: (mode: 'grid' | 'table') => void
    setSearchQuery: (query: string) => void
    toggleSelection: (id: string) => void
    setSelectedIds: (ids: string[]) => void
    clearSelection: () => void
    setAutoRefreshing: (refreshing: boolean) => void
    setPagination: (page: number, pageSize: number) => void
    setCurrentPage: (page: number) => void
    setDraggedItem: (item: { type: 'folder' | 'document'; id: string } | null) => void
    setDragOverFolder: (id: string | null) => void
    resetState: () => void
}

const initialState = {
    currentFolderId: null,
    breadcrumbs: [],
    viewMode: 'table' as const,
    searchQuery: '',
    selectedIds: [],
    autoRefreshing: false,
    currentPage: 1,
    pageSize: 10,
    draggedItem: null,
    dragOverFolder: null,
}

export const useKbStore = create<KBState>((set) => ({
    ...initialState,

    setCurrentFolderId: (id) => set({ currentFolderId: id }),

    navigateToFolder: (id, name) =>
        set((state) => ({
            breadcrumbs: [...state.breadcrumbs, { id, name }],
            currentFolderId: id,
        })),

    navigateToBreadcrumb: (index) =>
        set((state) => {
            if (index === -1) {
                return { breadcrumbs: [], currentFolderId: null }
            }
            const newBreadcrumbs = state.breadcrumbs.slice(0, index + 1)
            return {
                breadcrumbs: newBreadcrumbs,
                currentFolderId: newBreadcrumbs[index].id,
            }
        }),

    setViewMode: (viewMode) => set({ viewMode }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    toggleSelection: (id) =>
        set((state) => {
            const index = state.selectedIds.indexOf(id)
            if (index > -1) {
                return { selectedIds: state.selectedIds.filter((i) => i !== id) }
            }
            return { selectedIds: [...state.selectedIds, id] }
        }),

    setSelectedIds: (selectedIds) => set({ selectedIds }),
    clearSelection: () => set({ selectedIds: [] }),
    setAutoRefreshing: (autoRefreshing) => set({ autoRefreshing }),

    setPagination: (currentPage, pageSize) => set({ currentPage, pageSize }),
    setCurrentPage: (currentPage) => set({ currentPage }),

    setDraggedItem: (draggedItem) => set({ draggedItem }),
    setDragOverFolder: (dragOverFolder) => set({ dragOverFolder }),

    resetState: () => set(initialState),
}))

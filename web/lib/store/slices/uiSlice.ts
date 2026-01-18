import { createSlice } from '@reduxjs/toolkit'

interface UiState {
    /** Global loading state - shows overlay most of the screen */
    isGlobalLoading: boolean
    /** Current loading message */
    loadingMessage: string | null
    /** Stack of active loading actions (allows multiple concurrent loadings) */
    loadingActions: string[]
    /** Dynamic breadcrumb names mapped by ID */
    breadcrumbNames: Record<string, string>
}

const initialState: UiState = {
    isGlobalLoading: false,
    loadingMessage: null,
    loadingActions: [],
    breadcrumbNames: {}
}

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        /**
         * Set a dynamic breadcrumb name for an ID
         * @param id - The ID to map
         * @param name - The display name
         */
        setBreadcrumbName(state, action: { payload: { id: string; name: string } }) {
            const { id, name } = action.payload
            state.breadcrumbNames[id] = name
        },

        /**
         * Remove a breadcrumb name mapping
         * @param id - The ID to remove
         */
        removeBreadcrumbName(state, action: { payload: string }) {
            delete state.breadcrumbNames[action.payload]
        },

        /**
         * Set global loading state
         * @param actionId - Unique identifier for the loading action
         * @param isLoading - True to start loading, false to end
         * @param message - Optional loading message
         */
        setGlobalLoading(state, action) {
            const { actionId, isLoading, message } = action.payload

            if (isLoading) {
                // Start loading
                state.isGlobalLoading = true
                state.loadingMessage = message || state.loadingMessage
                if (!state.loadingActions.includes(actionId)) {
                    state.loadingActions.push(actionId)
                }
            } else {
                // End loading
                state.loadingActions = state.loadingActions.filter(id => id !== actionId)
                state.isGlobalLoading = state.loadingActions.length > 0
                // Clear message if no more actions
                if (!state.isGlobalLoading) {
                    state.loadingMessage = null
                }
            }
        },

        /**
         * Clear all loading states (emergency reset)
         */
        clearGlobalLoading(state) {
            state.isGlobalLoading = false
            state.loadingMessage = null
            state.loadingActions = []
        }
    },
})

export const { setGlobalLoading, clearGlobalLoading, setBreadcrumbName, removeBreadcrumbName } = uiSlice.actions
export default uiSlice.reducer

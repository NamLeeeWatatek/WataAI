import { create } from 'zustand'

interface ProgressOverlayState {
    open: boolean
    title: string
    description: string
    steps: string[]
    currentStep: number
    progress?: number
    callbacks: {
        onComplete?: (result: any) => void
        onError?: (error: any) => void
        onCancel?: () => void
    } | null
}

interface ProgressOverlayActions {
    showProgress: (config: {
        title: string
        description: string
        steps: string[]
        onComplete?: (result: any) => void
        onError?: (error: any) => void
        onCancel?: () => void
    }) => void
    hideProgress: (result?: any, error?: any) => void
    updateProgress: (updates: Partial<Omit<ProgressOverlayState, 'callbacks' | 'open'>>) => void
    completeProgress: (result: any) => void
    failProgress: (error: any) => void
    cancelProgress: () => void
}

const useProgressStore = create<ProgressOverlayState & ProgressOverlayActions>((set, get) => ({
    open: false,
    title: '',
    description: '',
    steps: [],
    currentStep: 0,
    progress: undefined,
    callbacks: null,

    showProgress: (config) => {
        set({
            open: true,
            title: config.title,
            description: config.description,
            steps: config.steps,
            currentStep: 0,
            progress: undefined,
            callbacks: {
                onComplete: config.onComplete,
                onError: config.onError,
                onCancel: config.onCancel
            }
        })
    },

    hideProgress: (result, error) => {
        const { callbacks } = get()
        if (error && callbacks?.onError) {
            callbacks.onError(error)
        } else if (result && callbacks?.onComplete) {
            callbacks.onComplete(result)
        }
        set({ open: false, callbacks: null })
    },

    updateProgress: (updates) => set((state) => ({ ...state, ...updates })),

    completeProgress: (result) => {
        get().hideProgress(result)
    },

    failProgress: (error) => {
        get().hideProgress(undefined, error)
    },

    cancelProgress: () => {
        const { callbacks } = get()
        if (callbacks?.onCancel) callbacks.onCancel()
        set({ open: false, callbacks: null })
    }
}))

// Export hook for component usage
export const useProgressOverlay = () => useProgressStore()

// Export standalone functions for non-component usage (migrating existing calls)
export const showProgressOverlay = (config: Parameters<ProgressOverlayActions['showProgress']>[0]) =>
    useProgressStore.getState().showProgress(config)

export const hideProgressOverlay = (result?: any, error?: any) =>
    useProgressStore.getState().hideProgress(result, error)

export const updateProgressOverlay = (updates: Partial<Omit<ProgressOverlayState, 'callbacks' | 'open'>>) =>
    useProgressStore.getState().updateProgress(updates)

export const completeProgressOverlay = (result: any) =>
    useProgressStore.getState().completeProgress(result)

export const failProgressOverlay = (error: any) =>
    useProgressStore.getState().failProgress(error)

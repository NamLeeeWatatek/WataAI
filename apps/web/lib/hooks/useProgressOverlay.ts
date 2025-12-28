import { useState, useEffect } from 'react'

interface ProgressOverlayState {
    open: boolean
    title: string
    description: string
    steps: string[]
    currentStep: number
    progress?: number
}

let progressOverlayCallbacks: {
    onComplete?: (result: any) => void
    onError?: (error: any) => void
    onCancel?: () => void
} | null = null

let progressOverlayState: ProgressOverlayState = {
    open: false,
    title: '',
    description: '',
    steps: [],
    currentStep: 0,
}

let stateListeners: ((state: ProgressOverlayState) => void)[] = []

const notifyListeners = () => {
    stateListeners.forEach(listener => listener(progressOverlayState))
}

export const useProgressOverlay = () => {
    const [state, setState] = useState<ProgressOverlayState>(progressOverlayState)

    useEffect(() => {
        const listener = (newState: ProgressOverlayState) => {
            setState(newState)
        }

        stateListeners.push(listener)

        return () => {
            stateListeners = stateListeners.filter(l => l !== listener)
        }
    }, [])

    const showProgress = (config: {
        title: string
        description: string
        steps: string[]
        onComplete?: (result: any) => void
        onError?: (error: any) => void
        onCancel?: () => void
    }) => {
        progressOverlayCallbacks = {
            onComplete: config.onComplete,
            onError: config.onError,
            onCancel: config.onCancel,
        }

        progressOverlayState = {
            open: true,
            title: config.title,
            description: config.description,
            steps: config.steps,
            currentStep: 0,
            progress: undefined,
        }

        notifyListeners()

        // Auto-progress simulation
        if (config.steps.length > 0) {
            let step = 0
            const interval = setInterval(() => {
                step++
                if (step >= config.steps.length) {
                    clearInterval(interval)
                } else {
                    progressOverlayState.currentStep = step
                    notifyListeners()
                }
            }, 2000)
        }
    }

    const hideProgress = () => {
        progressOverlayState.open = false
        notifyListeners()
        progressOverlayCallbacks = null
    }

    const updateProgress = (updates: Partial<{
        currentStep: number
        progress: number
        title: string
        description: string
    }>) => {
        progressOverlayState = { ...progressOverlayState, ...updates }
        notifyListeners()
    }

    const completeProgress = (result: any) => {
        hideProgress()
        progressOverlayCallbacks?.onComplete?.(result)
    }

    const failProgress = (error: any) => {
        hideProgress()
        progressOverlayCallbacks?.onError?.(error)
    }

    const cancelProgress = () => {
        hideProgress()
        progressOverlayCallbacks?.onCancel?.()
    }

    return {
        ...state,
        showProgress,
        hideProgress,
        updateProgress,
        completeProgress,
        failProgress,
        cancelProgress,
    }
}

export const showProgressOverlay = (config: {
    title: string
    description: string
    steps: string[]
    onComplete?: (result: any) => void
    onError?: (error: any) => void
    onCancel?: () => void
}) => {
    progressOverlayCallbacks = {
        onComplete: config.onComplete,
        onError: config.onError,
        onCancel: config.onCancel,
    }

    progressOverlayState = {
        open: true,
        title: config.title,
        description: config.description,
        steps: config.steps,
        currentStep: 0,
        progress: undefined,
    }

    notifyListeners()

    // Auto-progress simulation
    if (config.steps.length > 0) {
        let step = 0
        const interval = setInterval(() => {
            step++
            if (step >= config.steps.length) {
                clearInterval(interval)
            } else {
                progressOverlayState.currentStep = step
                notifyListeners()
            }
        }, 2000)
    }
}

export const hideProgressOverlay = (result?: any, error?: any) => {
    if (error) {
        progressOverlayCallbacks?.onError?.(error)
    } else if (result) {
        progressOverlayCallbacks?.onComplete?.(result)
    }

    progressOverlayState.open = false
    notifyListeners()
    progressOverlayCallbacks = null
}

export const updateProgressOverlay = (updates: Partial<{
    currentStep: number
    progress: number
    title: string
    description: string
}>) => {
    progressOverlayState = { ...progressOverlayState, ...updates }
    notifyListeners()
}

export const completeProgressOverlay = (result: any) => {
    hideProgressOverlay()
    progressOverlayCallbacks?.onComplete?.(result)
}

export const failProgressOverlay = (error: any) => {
    hideProgressOverlay()
    progressOverlayCallbacks?.onError?.(error)
}

/**
 * Redux Typed Hooks
 * Use these instead of plain `useDispatch` and `useSelector`
 */
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './index'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// UI Loading hooks
export const useGlobalLoading = () => {
    return useAppSelector(state => ({
        isLoading: state.ui.isGlobalLoading,
        message: state.ui.loadingMessage,
    }))
}

export const useLoadingAction = () => {
    const dispatch = useAppDispatch()

    return {
        startLoading: (actionId: string, message?: string) => {
            dispatch({ type: 'ui/setGlobalLoading', payload: { actionId, isLoading: true, message } })
        },
        stopLoading: (actionId: string) => {
            dispatch({ type: 'ui/setGlobalLoading', payload: { actionId, isLoading: false } })
        },
        withLoading: async <T>(
            actionId: string,
            asyncFn: () => Promise<T>,
            message?: string
        ): Promise<T> => {
            dispatch({ type: 'ui/setGlobalLoading', payload: { actionId, isLoading: true, message } })
            try {
                const result = await asyncFn()
                return result
            } finally {
                dispatch({ type: 'ui/setGlobalLoading', payload: { actionId, isLoading: false } })
            }
        }
    }
}

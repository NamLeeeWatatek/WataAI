'use client'

import { useAppSelector } from '@/lib/store/hooks'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'

export function GlobalLoadingOverlay() {
    const { isGlobalLoading, loadingMessage } = useAppSelector(state => state.ui)

    if (!isGlobalLoading) {
        return null
    }

    return <LoadingOverlay message={loadingMessage} />
}

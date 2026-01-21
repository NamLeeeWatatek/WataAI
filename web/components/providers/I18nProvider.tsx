'use client'

import { ReactNode, useEffect, useState } from 'react'
import i18n from '../../lib/i18n/i18n'
import { LoadingLogo } from '../shared/LoadingLogo'

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const handleInitialized = () => {
      setIsReady(true)
    }

    if (i18n.isInitialized) {
      handleInitialized()
    } else {
      i18n.on('initialized', handleInitialized)
    }

    return () => {
      i18n.off('initialized', handleInitialized)
    }
  }, [])

  return <>{children}</>
}

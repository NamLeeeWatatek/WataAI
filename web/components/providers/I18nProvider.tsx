'use client'

import { ReactNode, useEffect, useState } from 'react'
import '../../lib/i18n/i18n'
import { LoadingLogo } from '../shared/LoadingLogo'

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingLogo size="lg" />
      </div>
    )
  }

  return <>{children}</>
}

import React, { Suspense } from 'react'
import { CardSkeleton } from './Skeleton'

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function LazyWrapper({
  children,
  fallback,
  className = ''
}: LazyWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className={className}>
          {fallback || <CardSkeleton />}
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

// Simple lazy loading utility
export function lazyLoad(importFunc: () => Promise<any>, fallback?: React.ReactNode) {
  const Component = React.lazy(importFunc)

  return function LazyComponent(props: any) {
    return (
      <LazyWrapper fallback={fallback}>
        <Component {...props} />
      </LazyWrapper>
    )
  }
}

// Pre-configured lazy components for heavy features

export const LazyChatInterface = lazyLoad(
  () => import('@/components/features/chat/ChatInterface')
)

export const LazyTableSkeleton = lazyLoad(
  () => Promise.resolve({ default: CardSkeleton }),
  <CardSkeleton />
)

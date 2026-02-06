'use client'

import React from 'react'
import { LoadingLogo } from './LoadingLogo'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface PageLoadingProps {
    message?: string
    fullScreen?: boolean
    className?: string
    minHeight?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Standardized Page Loading component
 * Use this for initial page data fetching states.
 * Features premium design with smooth animations and glassmorphism
 */
export function PageLoading({
    message = 'Loading',
    fullScreen = false,
    className,
    minHeight = 'min-h-[400px]',
    size = 'lg',
}: PageLoadingProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center w-full",
            minHeight,
            fullScreen && "fixed inset-0 z-50 bg-background/80 backdrop-blur-md",
            className
        )}>
            <LoadingLogo size={size} text={message} />
        </div>
    )
}


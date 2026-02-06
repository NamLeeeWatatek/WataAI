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
    useLogo = fullScreen // Default to logo only for fullscreen/global loading
}: PageLoadingProps & { useLogo?: boolean }) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center w-full",
            minHeight,
            fullScreen && "fixed inset-0 z-50 bg-background/80 backdrop-blur-md",
            className
        )}>
            <div className="flex flex-col items-center gap-4">
                {useLogo ? (
                    <LoadingLogo size={size} text={message} />
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className={cn("text-primary animate-spin", size === 'lg' ? 'w-10 h-10' : 'w-6 h-6')} />
                        {message && (
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                {message}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}


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
    showGlow?: boolean
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
    showGlow = true,
    useLogo = fullScreen // Default to logo only for fullscreen/global loading
}: PageLoadingProps & { useLogo?: boolean }) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center w-full",
            "animate-in fade-in slide-in-from-bottom-4 duration-700",
            minHeight,
            fullScreen && "fixed inset-0 z-50 bg-gradient-to-br from-background/98 via-background/95 to-background/98 backdrop-blur-md",
            className
        )}>
            <div className="relative">
                {/* Content container */}
                <div className="relative group flex flex-col items-center gap-4">
                    {useLogo ? (
                        <>
                            {/* Enhanced glow background effect only for logo */}
                            {showGlow && (
                                <div className={cn(
                                    "absolute -inset-8 rounded-full blur-3xl opacity-0 transition-opacity duration-700",
                                    "bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20",
                                    "group-hover:opacity-100 animate-pulse"
                                )} />
                            )}
                            <LoadingLogo size={size} text={message} showGlow={showGlow} />
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className={cn("text-primary animate-spin", size === 'lg' ? 'w-10 h-10' : 'w-6 h-6')} />
                            {message && <p className="text-muted-foreground text-sm font-medium animate-pulse">{message}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


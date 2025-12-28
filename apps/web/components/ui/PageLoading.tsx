'use client'

import React from 'react'
import { LoadingLogo } from './LoadingLogo'
import { cn } from '@/lib/utils'

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
    showGlow = true
}: PageLoadingProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center w-full",
            "animate-in fade-in slide-in-from-bottom-4 duration-700",
            minHeight,
            fullScreen && "fixed inset-0 z-50 bg-gradient-to-br from-background/98 via-background/95 to-background/98 backdrop-blur-md",
            className
        )}>
            <div className="relative">
                {/* Enhanced glow background effect */}
                {showGlow && (
                    <div className={cn(
                        "absolute -inset-8 rounded-full blur-3xl opacity-0 transition-opacity duration-700",
                        "bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20",
                        "group-hover:opacity-100 animate-pulse"
                    )} />
                )}

                {/* Content container */}
                <div className="relative group">
                    <LoadingLogo size={size} text={message} showGlow={showGlow} />
                </div>
            </div>
        </div>
    )
}


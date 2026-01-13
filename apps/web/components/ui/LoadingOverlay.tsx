'use client'

import React from 'react'
import { LoadingLogo } from './LoadingLogo'
import { cn } from '@/lib/utils'

interface LoadingOverlayProps {
    /** Loading message to display */
    message?: string | null
    /** Allow click through overlay */
    allowInteraction?: boolean
    /** Custom className for the container */
    className?: string
}

/**
 * Global loading overlay that covers entire screen
 * Used for system-wide loading states like uploading, saving, etc.
 * Features glassmorphism design and smooth animations
 */
export function LoadingOverlay({
    message,
    allowInteraction = false,
    className
}: LoadingOverlayProps) {
    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center',
                'bg-gradient-to-br from-background/95 via-background/90 to-background/95',
                'backdrop-blur-md',
                'backdrop-blur-md',
                allowInteraction ? 'pointer-events-none' : 'pointer-events-auto',
                className
            )}
            role="status"
            aria-live="polite"
            aria-label={message || 'Loading'}
        >
            {/* Content Card with glassmorphism */}
            <div className={cn(
                'relative flex flex-col items-center gap-6 p-8',
                'bg-card/50 backdrop-blur-xl',
                'border border-border/50 rounded-2xl shadow-2xl',
                'border border-border/50 rounded-2xl shadow-2xl',
            )}>
                {/* Gradient glow background */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl opacity-50" />

                {/* Content */}
                <div className="relative z-10">
                    <LoadingLogo size="lg" showGlow />
                </div>

                {message && (
                    <p className="relative z-10 text-sm text-foreground/80 font-medium text-center max-w-xs">
                        {message}
                    </p>
                )}
            </div>
        </div>
    )
}



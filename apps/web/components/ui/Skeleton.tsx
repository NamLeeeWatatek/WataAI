'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

/**
 * Base Skeleton component for loading states
 * Used to create skeleton screens for better perceived performance
 */
function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-lg bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 bg-[length:200%_100%]',
                'animate-shimmer',
                className
            )}
            {...props}
        />
    )
}

// Specialized skeleton components for common use cases

/**
 * Table skeleton with header and rows
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="space-y-3">
            {/* Table Header */}
            <div className="flex gap-4 pb-2 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-6 flex-1" />
                ))}
            </div>

            {/* Table Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={`row-${rowIndex}`} className="flex gap-4 items-center">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-10 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    )
}

/**
 * Card skeleton for content cards
 */
export function CardSkeleton() {
    return (
        <div className="p-6 border rounded-xl bg-card shadow-sm">
            <div className="space-y-4">
                {/* Title */}
                <Skeleton className="h-7 w-2/5" />

                {/* Description lines */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                </div>
            </div>
        </div>
    )
}

/**
 * List item skeleton with avatar and text
 */
export function ListSkeleton({ items = 3 }: { items?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: items }).map((_, i) => (
                <div key={`list-${i}`} className="flex items-center gap-4">
                    {/* Avatar */}
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>

                    {/* Badge/Status */}
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            ))}
        </div>
    )
}

/**
 * Form skeleton with labels and inputs
 */
export function FormSkeleton() {
    return (
        <div className="space-y-6">
            {[1, 2, 3].map((i) => (
                <div key={`field-${i}`} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className={cn(
                        "w-full",
                        i === 3 ? "h-28" : "h-10"
                    )} />
                </div>
            ))}

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
                <Skeleton className="h-10 w-28 rounded-md" />
                <Skeleton className="h-10 w-20 rounded-md" />
            </div>
        </div>
    )
}

/**
 * Stats/Dashboard cards skeleton
 */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={`stat-${i}`} className="p-6 border rounded-xl bg-card shadow-sm">
                    <div className="space-y-3">
                        {/* Icon + Label */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-md" />
                            <Skeleton className="h-4 w-24" />
                        </div>

                        {/* Value */}
                        <Skeleton className="h-8 w-20" />

                        {/* Change indicator */}
                        <Skeleton className="h-3 w-28" />
                    </div>
                </div>
            ))}
        </div>
    )
}

/**
 * Chat message skeleton
 */
export function ChatSkeleton({ messages = 3 }: { messages?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: messages }).map((_, i) => {
                const isUser = i % 2 === 0
                return (
                    <div
                        key={`message-${i}`}
                        className={cn(
                            'flex gap-3',
                            isUser ? 'justify-end' : 'justify-start'
                        )}
                    >
                        {!isUser && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
                        <div className={cn('space-y-2 max-w-[70%]', isUser && 'items-end')}>
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className={cn('h-16 rounded-2xl', isUser ? 'w-48' : 'w-64')} />
                        </div>
                        {isUser && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
                    </div>
                )
            })}
        </div>
    )
}

export { Skeleton }

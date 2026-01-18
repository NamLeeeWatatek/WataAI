'use client';

import { cn } from '@/lib/utils';

interface MessageSkeletonProps {
    isAgent: boolean;
}

// ✅ Skeleton loading component
export function MessageSkeleton({ isAgent }: MessageSkeletonProps) {
    return (
        <div className={cn('flex gap-3 animate-pulse', isAgent && 'flex-row-reverse')}>
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className={cn('flex flex-col gap-1.5 max-w-[70%]', isAgent && 'items-end')}>
                <div className="h-4 w-24 bg-muted rounded" />
                <div className={cn(
                    'rounded-2xl px-4 py-2.5 space-y-2',
                    isAgent ? 'rounded-tr-sm' : 'rounded-tl-sm'
                )}>
                    <div className="h-3 w-48 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted rounded" />
                </div>
            </div>
        </div>
    );
}


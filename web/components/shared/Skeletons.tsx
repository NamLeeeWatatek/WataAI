import { Card } from "@/components/ui/Card"
import { Skeleton } from "@/components/ui/Skeleton"

export function CardGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 rounded-2xl border border-border/50 bg-card/40 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
                        <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
                        <div className="h-4 w-2/3 bg-muted/50 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function TableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <div className="p-4 border-b border-border/50 bg-muted/10 flex gap-4">
                    <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                    <div className="ml-auto flex gap-2">
                        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <div className="divide-y divide-border/50">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 flex items-center gap-4">
                            <div className="w-8 h-8 rounded bg-muted animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                                <div className="h-3 w-32 bg-muted/50 rounded animate-pulse" />
                            </div>
                            <div className="w-24 h-4 bg-muted rounded animate-pulse" />
                            <div className="w-8 h-8 rounded bg-muted animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export function FormSkeleton() {
    return (
        <div className="w-full max-w-7xl mx-auto py-2 lg:py-4 flex flex-col h-full animate-in fade-in duration-500">
            <div className="bg-card border border-border/60 rounded-[32px] shadow-2xl shadow-black/5 overflow-hidden flex flex-col h-auto w-full">
                {/* Header / Steps Skeleton */}
                <div className="px-8 lg:px-12 py-5 bg-secondary/5 border-b border-border/40 flex justify-between items-center h-20">
                    <div className="flex gap-4 w-full max-w-xl mx-auto justify-between">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-3 items-center opacity-50">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <Skeleton className="h-3 w-16 hidden md:block" />
                                {i < 3 && <div className="h-[2px] w-12 bg-border/40 hidden md:block" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="p-8 lg:p-12 space-y-8">
                    {/* Description */}
                    <div className="flex justify-center mb-8">
                        <Skeleton className="h-4 w-1/2 rounded-full" />
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-3 w-24 rounded-full" />
                                <Skeleton className="h-14 w-full rounded-2xl" />
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 mt-12 pt-4 border-t border-border/20">
                        <Skeleton className="h-14 w-32 rounded-2xl" />
                        <Skeleton className="h-14 flex-1 rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ChatListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-0 divide-y divide-border/50">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="p-4 flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-12 bg-muted/50 rounded animate-pulse" />
                        </div>
                        <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function ToolCardSkeleton() {
    return (
        <Card className="flex flex-col h-full bg-card border border-border/40 rounded-[32px] overflow-hidden">
            <div className="relative aspect-[16/10] w-full bg-muted animate-pulse" />
            <div className="flex flex-col flex-1 p-6 pt-7 space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>
                <div className="flex gap-3 mt-4">
                    <Skeleton className="h-8 flex-1 rounded-xl" />
                    <Skeleton className="h-8 flex-1 rounded-xl" />
                </div>
                <Skeleton className="h-11 w-full rounded-2xl mt-4" />
            </div>
        </Card>
    );
}

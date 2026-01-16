export default function AdminLoading() {
    return (
        <div className="h-full w-full p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 rounded-lg border border-border bg-card p-4">
                        <div className="h-4 w-20 bg-muted rounded mb-3 animate-pulse" />
                        <div className="h-8 w-12 bg-muted/50 rounded animate-pulse" />
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-border bg-card">
                <div className="p-4 border-b border-border flex items-center gap-4">
                    <div className="h-9 w-64 bg-muted rounded animate-pulse" />
                    <div className="ml-auto h-9 w-24 bg-muted rounded animate-pulse" />
                </div>
                <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                                <div className="h-3 w-32 bg-muted/50 rounded animate-pulse" />
                            </div>
                            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

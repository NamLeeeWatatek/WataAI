export default function DashboardLoading() {
    return (
        <div className="h-full w-full p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div className="h-8 w-48 bg-muted rounded" />
                <div className="h-9 w-32 bg-muted rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex flex-col gap-3">
                            <div className="h-5 w-8 bg-muted rounded" />
                            <div className="h-4 w-24 bg-muted/50 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 h-[400px]">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-10 w-10 bg-muted rounded" />
                    <div className="space-y-2">
                        <div className="h-5 w-40 bg-muted rounded" />
                        <div className="h-4 w-60 bg-muted/50 rounded" />
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 w-full bg-muted/20 rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    )
}

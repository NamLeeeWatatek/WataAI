export default function MarketingLoading() {
    return (
        <div className="dark min-h-screen flex flex-col bg-slate-950 text-white">
            <header className="h-16 md:h-20 border-b border-white/10 container mx-auto flex items-center justify-between px-4">
                <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
                <div className="flex gap-4">
                    <div className="h-9 w-20 bg-white/10 rounded-full animate-pulse" />
                    <div className="h-9 w-24 bg-white/10 rounded-full animate-pulse" />
                </div>
            </header>
            <main className="flex-1 container mx-auto px-4 py-12 md:py-20 flex flex-col items-center gap-8">
                <div className="h-12 w-3/4 max-w-2xl bg-white/10 rounded-lg animate-pulse" />
                <div className="h-6 w-1/2 max-w-xl bg-white/5 rounded-lg animate-pulse" />
                <div className="flex gap-4 mt-8">
                    <div className="h-12 w-40 bg-white/10 rounded-full animate-pulse" />
                    <div className="h-12 w-40 bg-white/5 rounded-full animate-pulse" />
                </div>
            </main>
        </div>
    )
}

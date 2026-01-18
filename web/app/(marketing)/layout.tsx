
import { MarketingHeader, MarketingFooter } from '@/components/marketing';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="dark min-h-screen flex flex-col bg-slate-950 text-white" style={{ colorScheme: 'dark' }}>
            <MarketingHeader />
            <main className="flex-1 pt-16 md:pt-20">
                {children}
            </main>
            <MarketingFooter />
        </div>
    );
}

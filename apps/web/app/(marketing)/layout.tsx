import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { MarketingHeader, MarketingFooter } from '@/components/marketing';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <div className="min-h-screen flex flex-col bg-background">
                <MarketingHeader />
                <main className="flex-1 pt-16 md:pt-20">
                    {children}
                </main>
                <MarketingFooter />
            </div>
        </ThemeProvider>
    );
}

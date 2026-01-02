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
            forcedTheme="dark"
            disableTransitionOnChange
        >
            <div className="dark min-h-screen flex flex-col bg-background text-foreground" style={{ colorScheme: 'dark' }}>
                <MarketingHeader />
                <main className="flex-1 pt-16 md:pt-20">
                    {children}
                </main>
                <MarketingFooter />
            </div>
        </ThemeProvider>
    );
}

import {
    MarketingHeader,
    MarketingFooter,
    HeroSection,
    FeatureBentoGrid,
    SocialProof,
    ConnectorsSection
} from '@/components/marketing';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface PublicBotLandingProps {
    bot: any;
    onStartChat: () => void;
}

export function PublicBotLanding({ bot, onStartChat }: PublicBotLandingProps) {
    const { t } = useTranslation();

    // We are simply rendering the Marketing Page as the visual background for the bot.
    // The "Start Chatting" functionality is provided by the floating button in the parent component.

    return (
        <div className="dark min-h-screen flex flex-col bg-slate-950 text-white selection:bg-primary/30 font-sans" style={{ colorScheme: 'dark' }}>
            <MarketingHeader />

            <main className="flex-1 pt-16 md:pt-20">
                <HeroSection />
                <SocialProof />
                <FeatureBentoGrid />
                <ConnectorsSection />

                {/* Standard Marketing CTA Section (Cloned from (marketing)/page.tsx) */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent pointer-events-none" />
                    <div className="container px-4 mx-auto relative z-10 text-center">
                        <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tighter">
                            Ready to transform your business?
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
                            Join thousands of companies using WataAI to automate 10M+ conversations monthly.
                        </p>
                        <Link href={"/register" as any} className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-primary rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:scale-105">
                            Start Verification Free
                        </Link>
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
}

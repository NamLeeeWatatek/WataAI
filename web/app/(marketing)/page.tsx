import Link from 'next/link';
import {
    HeroSection,
    FeatureBentoGrid,
    SocialProof,
    ConnectorsSection
} from '@/components/marketing';

export default function MarketingPage() {
    return (
        <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Main Content */}
            <main>
                <HeroSection />
                <SocialProof />
                <FeatureBentoGrid />
                <ConnectorsSection />

                {/* CTA Placeholder - will be improved later or part of Connector section */}
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
        </div>
    );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Sparkles, Zap, Shield, PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HeroSection() {
    const { t } = useTranslation();

    const heroFeatures = [
        {
            icon: Zap,
            title: t('marketing.heroFeatures.instant.title'),
            desc: t('marketing.heroFeatures.instant.desc')
        },
        {
            icon: Shield,
            title: t('marketing.heroFeatures.secure.title'),
            desc: t('marketing.heroFeatures.secure.desc')
        },
        {
            icon: PlayCircle,
            title: t('marketing.heroFeatures.fast.title'),
            desc: t('marketing.heroFeatures.fast.desc')
        }
    ];

    return (
        <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-primary/10 rounded-[100%] blur-[120px] pointer-events-none" />

            <div className="container relative z-10 px-4 mx-auto">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('marketing.hero.badge')}</span>
                    </div>

                    {/* Headline */}
                    <h1 className="display-heading-1 mb-8">
                        {t('marketing.hero.titlePart1')} <br />
                        <span className="text-gradient">{t('marketing.hero.titlePart2')}</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
                        {t('marketing.hero.description')}
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-24">
                        <Button
                            size="lg"
                            className="h-14 px-10 text-lg shadow-2xl shadow-primary/20 hover:scale-105 transition-all duration-300 rounded-2xl font-black uppercase tracking-widest"
                            asChild
                        >
                            <Link href={"/register" as any}>
                                {t('marketing.hero.ctaStart')}
                                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="ghost"
                            className="h-14 px-8 text-lg font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
                            asChild
                        >
                            <Link href="https://watatek.com/contact" target="_blank" rel="noopener noreferrer">
                                {t('hero.contactSales')}
                                <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </Button>
                    </div>

                    {/* Feature Spotlight Cards (replacing complex mockup) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
                        {heroFeatures.map((item, i) => (
                            <div key={i} className="glass-card p-6 text-left hover:border-primary/50 transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <item.icon className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

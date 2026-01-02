'use client';

import { motion } from 'framer-motion';

const brands = [
    { name: 'TechCorp', opacity: 0.7 },
    { name: 'InnovateLabs', opacity: 0.6 },
    { name: 'FutureSoft', opacity: 0.8 },
    { name: 'GlobalSystems', opacity: 0.5 },
    { name: 'NextGen', opacity: 0.7 },
    { name: 'SmartSolutions', opacity: 0.6 },
];

export function SocialProof() {
    return (
        <section className="py-12 border-y border-border/30 bg-muted/20">
            <div className="container mx-auto px-4">
                <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-widest">
                    Trusted by forward-thinking teams
                </p>

                <div className="relative flex overflow-hidden mask-gradient-x">
                    <div className="flex gap-16 items-center animate-scroll whitespace-nowrap">
                        {[...brands, ...brands, ...brands].map((brand, idx) => (
                            <div
                                key={idx}
                                className="text-xl md:text-2xl font-bold text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-default"
                            >
                                {brand.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

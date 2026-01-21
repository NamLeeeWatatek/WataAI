'use client';

import {
    Globe,
    Zap,
    Cpu,
    Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FacebookIcon, ZaloIcon, WhatsAppIcon } from '@/components/shared/icons/Logos';

const integrations = [
    { name: 'Zalo', icon: ZaloIcon, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { name: 'Facebook', icon: FacebookIcon, color: 'text-blue-600', bgColor: 'bg-blue-600/10' },
    { name: 'Website', icon: Globe, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { name: 'WhatsApp', icon: WhatsAppIcon, color: 'text-green-500', bgColor: 'bg-green-500/10' },
];

export function ConnectorsSection() {
    return (
        <section className="py-24 relative overflow-hidden bg-background">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container px-4 mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    <div className="flex-1 space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                            <LinkIcon className="w-3 h-3" />
                            <span>Integrations</span>
                        </div>
                        <h2 className="display-heading-2">
                            Connect <span className="text-gradient">Anywhere.</span>
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                            WataAI acts as the central brain for your business. Connect your existing channels in seconds and let our AI handle the traffic.
                            Whether it's social media, your website, or mobile app, we've got you covered.
                        </p>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                            {integrations.map((item) => (
                                <div key={item.name} className="flex items-center gap-3 px-4 py-2 rounded-xl glass border-white/5">
                                    <div className={cn("p-1.5 rounded-lg", item.bgColor)}>
                                        <item.icon className={cn("w-4 h-4", item.color)} />
                                    </div>
                                    <span className="text-sm font-medium">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 relative w-full flex items-center justify-center">
                        <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
                            {/* Central Brain Card */}
                            <div className="w-32 h-32 md:w-40 md:h-40 glass-card flex items-center justify-center z-10 relative shadow-2xl shadow-primary/20 border-primary/30">
                                <Cpu className="w-12 h-12 md:w-16 md:h-16 text-primary animate-pulse" />
                            </div>

                            {/* Orbits / Connection Circles */}
                            <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_20s_linear_infinite]" />
                            <div className="absolute inset-16 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                            <div className="absolute inset-32 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />

                            {/* Outer Integration Bubbles */}
                            {integrations.map((item, i) => {
                                const angle = (i * 90) * (Math.PI / 180);
                                const x = Math.cos(angle) * 45;
                                const y = Math.sin(angle) * 45;
                                return (
                                    <div
                                        key={i}
                                        className="absolute w-16 h-16 md:w-20 md:h-20 glass-card flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-500"
                                        style={{
                                            left: `${50 + x}%`,
                                            top: `${50 + y}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        <item.icon className={cn("w-6 h-6 md:w-8 md:h-8", item.color)} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


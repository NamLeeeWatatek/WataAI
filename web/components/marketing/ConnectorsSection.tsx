'use client';

import {
    Cpu,
    Link as LinkIcon
} from 'lucide-react';
import { FacebookIcon, WhatsAppIcon, InstagramIcon, TikTokIcon, WebsiteIcon } from '@/components/shared/icons/Logos';

const integrations = [
    { name: 'Facebook', icon: FacebookIcon, color: 'text-[#1877F2]' },
    { name: 'Instagram', icon: InstagramIcon, color: 'text-[#E4405F]' },
    { name: 'TikTok', icon: TikTokIcon, color: 'text-foreground' },
    { name: 'Website', icon: WebsiteIcon, color: 'text-[#0EA5E9]' },
    { name: 'WhatsApp', icon: WhatsAppIcon, color: 'text-[#25D366]' },
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
                        <h2 className="display-heading-2 tracking-tighter">
                            Connect <span className="text-gradient">Anywhere.</span>
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                            WataAI acts as the central brain for your business. Connect your existing channels in seconds and let our AI handle the traffic.
                            Whether it's social media, your website, or mobile app, we've got you covered.
                        </p>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                            {integrations.map((item) => (
                                <div key={item.name} className="flex items-center gap-3 px-5 py-2.5 rounded-2xl glass border-white/5 hover:border-primary/20 hover:bg-white/5 transition-all duration-300 group">
                                    <div className="transition-transform group-hover:scale-110">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-bold tracking-tight">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 relative w-full flex items-center justify-center">
                        <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
                            {/* Central Brain Card */}
                            <div className="w-32 h-32 md:w-40 md:h-40 glass shadow-2xl shadow-primary/20 rounded-[40px] border border-primary/30 flex items-center justify-center z-10 relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                                <Cpu className="w-12 h-12 md:w-16 md:h-16 text-primary z-10" />
                            </div>

                            {/* Orbits / Connection Circles */}
                            <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_30s_linear_infinite]" />
                            <div className="absolute inset-16 border border-white/5 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
                            <div className="absolute inset-32 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />

                            {/* Outer Integration Bubbles */}
                            {integrations.map((item, i) => {
                                const angle = (i * (360 / integrations.length) - 90) * (Math.PI / 180);
                                const radius = 40; // Percentage
                                const x = Math.cos(angle) * radius;
                                const y = Math.sin(angle) * radius;
                                return (
                                    <div
                                        key={i}
                                        className="absolute w-16 h-16 md:w-20 md:h-20 glass flex items-center justify-center rounded-3xl shadow-xl hover:scale-110 hover:shadow-primary/10 transition-all duration-500 border-white/5 hover:border-primary/30 group"
                                        style={{
                                            left: `${50 + x}%`,
                                            top: `${50 + y}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        <item.icon className="w-7 h-7 md:w-10 md:h-10 transition-transform group-hover:scale-110" />
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

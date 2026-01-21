'use client';

import { Bot, MessageSquare, Zap, BarChart3, Lock, Cpu, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
    {
        title: 'Omnichannel Chatbots',
        description: 'Build once, deploy everywhere. Support for Facebook, Zalo, and Web Widget out of the box.',
        icon: Bot,
        className: 'md:col-span-2 md:row-span-2',
        gradient: 'from-blue-600/10 to-transparent',
    },
    {
        title: 'Unified Inbox',
        description: 'Manage all your customer conversations in one centralized dashboard.',
        icon: MessageSquare,
        className: 'md:col-span-1 md:row-span-1',
        gradient: 'from-purple-600/10 to-transparent',
    },
    {
        title: 'Smart Analytics',
        description: 'Deep insights into bot performance and user engagement.',
        icon: BarChart3,
        className: 'md:col-span-1 md:row-span-1',
        gradient: 'from-amber-600/10 to-transparent',
    },
    {
        title: 'Zero Code Builder',
        description: 'Drag-and-drop visual flow builder. If you can draw it, you can build it.',
        icon: Zap,
        className: 'md:col-span-1 md:row-span-1',
        gradient: 'from-emerald-600/10 to-transparent',
    },
    {
        title: 'Enterprise Security',
        description: 'Bank-grade encryption and role-based access control.',
        icon: Lock,
        className: 'md:col-span-2 md:row-span-1',
        gradient: 'from-red-600/10 to-transparent',
    }
];

export function FeatureBentoGrid() {
    return (
        <section className="py-24 relative overflow-hidden bg-background">
            <div className="container px-4 mx-auto relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="display-heading-2 mb-6">
                        Everything you need to <span className="text-gradient">automate & scale.</span>
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        A complete toolkit for modern businesses to automate customer engagement without writing a single line of code.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-6 auto-rows-[minmax(200px,auto)]">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "glass-card p-10 group overflow-hidden relative",
                                feature.className
                            )}
                        >
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                                feature.gradient
                            )} />

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="p-3.5 w-fit rounded-2xl bg-primary/10 mb-8 border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                    <feature.icon className="w-8 h-h-8 text-primary" />
                                </div>

                                <h3 className="text-2xl font-bold mb-4 tracking-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Decorative Icon Fallback (Removed complex SVG/3D) */}
                            <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none">
                                <feature.icon size={180} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


'use client';

import { motion } from 'framer-motion';
import { Bot, MessageSquare, Share2, Zap, BarChart3, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

const features = [
    {
        title: 'Omnichannel Chatbots',
        description: 'Build once, deploy everywhere. Support for Facebook, Zalo, and Web Widget out of the box.',
        icon: Bot,
        className: 'md:col-span-2 md:row-span-2',
        gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
        title: 'Unified Inbox',
        description: 'Manage all your customer conversations in one centralized dashboard.',
        icon: MessageSquare,
        className: 'md:col-span-1 md:row-span-1',
        gradient: 'from-purple-500/20 to-pink-500/20',
    },
    {
        title: 'Smart Analytics',
        description: 'Deep insights into bot performance and user engagement.',
        icon: BarChart3,
        className: 'md:col-span-1 md:row-span-1',
        gradient: 'from-amber-500/20 to-orange-500/20',
    },
    {
        title: 'Zero Code Builder',
        description: 'Drag-and-drop visual flow builder. If you can draw it, you can build it.',
        icon: Zap,
        className: 'md:col-span-1 md:row-span-1',
        gradient: 'from-green-500/20 to-emerald-500/20',
    },
    {
        title: 'Enterprise Security',
        description: 'Bank-grade encryption and role-based access control.',
        icon: Lock,
        className: 'md:col-span-2 md:row-span-1',
        gradient: 'from-red-500/20 to-rose-500/20',
    }
];

export function FeatureBentoGrid() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container px-4 mx-auto relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                        Everything needed to scale.
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        A complete toolkit for automating customer engagement without writing a single line of code.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-6 auto-rows-[minmax(180px,auto)]">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "group relative overflow-hidden rounded-3xl border border-border/40 bg-card/30 backdrop-blur-sm p-8 hover:bg-card/50 transition-colors",
                                feature.className
                            )}
                        >
                            {/* Gradient Glow */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br",
                                feature.gradient
                            )} />

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="p-3 w-fit rounded-xl bg-primary/10 mb-6">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>

                                <h3 className="text-xl font-bold mb-3 text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Decorative Elements */}
                                {feature.title === 'Omnichannel Chatbots' && (
                                    <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Bot className="w-full h-full" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Sparkles, Zap, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="container relative z-10 px-4 mx-auto">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-8"
                    >
                        <span className="block text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground/90 to-foreground/50 pb-2">
                            One AI Brain.
                        </span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-400 pb-4">
                            Every Channel.
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
                    >
                        Build, deploy, and manage intelligent chatbots that live across Facebook, Zalo, and your Website.
                        <span className="text-foreground font-medium"> Zero code required.</span>
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                    >
                        <Button
                            size="lg"
                            className="h-12 px-8 text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
                            asChild
                        >
                            <Link href="/register">
                                <Zap className="w-4 h-4 mr-2" />
                                Start Building Free
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 px-8 text-base backdrop-blur-sm bg-background/5 border-border/50 hover:bg-background/10"
                        >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            View Demo
                        </Button>
                    </motion.div>

                    {/* Visual Mockup Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="mt-20 relative w-full aspect-[16/9] max-w-5xl rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-purple-500/5 to-transparent" />

                        {/* Mock UI Elements - Refactored to use tokens */}
                        <div className="absolute top-4 left-4 right-4 h-12 rounded-lg bg-background/40 border border-border/50 flex items-center px-4 gap-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            </div>
                            <div className="flex-1 h-6 rounded-md bg-background/40 max-w-sm mx-auto text-[10px] flex items-center justify-center text-muted-foreground font-mono border border-border/30">
                                app.wata.ai/dashboard
                            </div>
                        </div>

                        <div className="absolute top-20 left-4 w-64 bottom-4 rounded-lg bg-background/40 border border-border/50 p-4 space-y-3">
                            <div className="h-8 w-full bg-muted/50 rounded" />
                            <div className="h-4 w-3/4 bg-muted/30 rounded" />
                            <div className="h-4 w-1/2 bg-muted/30 rounded" />
                        </div>

                        <div className="absolute top-20 left-72 right-4 bottom-4 rounded-lg bg-background/40 border border-border/50 flex items-center justify-center">
                            <p className="text-muted-foreground text-sm font-medium">Interactive Graph Visualization Node</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

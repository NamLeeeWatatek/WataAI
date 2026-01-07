'use client';

import { useState } from 'react';
import Spline from '@splinetool/react-spline';

import { ArrowRightLeft } from 'lucide-react';

const SPLINE_SCENE_URL = "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"; // Replace with your own "Connect" 3D scene

export function ConnectorsSection() {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/0 to-background pointer-events-none" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none opacity-50" />

            <div className="container px-4 mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    <div className="flex-1 space-y-8 text-center lg:text-left">
                        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                            Connect Anywhere.
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            WataAI acts as the central brain for your business. Connect your existing channels in seconds and let our AI handle the traffic.
                            Whether it's social media, your website, or mobile app, we've got you covered.
                        </p>
                    </div>

                    <div className="flex-1 relative w-full h-[500px] flex items-center justify-center">
                        {/* Spline 3D Scene */}
                        <div className="w-full h-full relative z-20">
                            <Spline
                                scene={SPLINE_SCENE_URL}
                                onLoad={() => setIsLoading(false)}
                                className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}
                            />
                        </div>

                        {/* Loading / Fallback State (Premium Glass Card) */}
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center">
                                <div
                                    className="relative w-64 h-64 rounded-full bg-primary/5 border border-primary/20 backdrop-blur-3xl flex items-center justify-center"
                                >
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-transparent blur-xl" />
                                    <div className="w-20 h-20 rounded-2xl bg-card border border-border/50 flex items-center justify-center shadow-2xl relative z-20">
                                        <ArrowRightLeft className="w-8 h-8 text-primary animate-pulse" />
                                    </div>
                                    <p className="absolute -bottom-12 text-sm font-medium text-muted-foreground animate-pulse">
                                        Loading 3D Experience...
                                    </p>
                                </div>
                            </div>
                        )}


                        {/* Decorative 'Grid' Floor (Static fallback visual layer) */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140%] h-[50%] bg-primary/5 blur-[80px] -z-10 rounded-[100%]" />
                    </div>
                </div>
            </div>
        </section>
    );
}

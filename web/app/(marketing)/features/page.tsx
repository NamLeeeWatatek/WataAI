import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Bot, MessageSquare, Zap, BarChart3, Lock, Shield, Globe, Cpu } from 'lucide-react';

const coreFeatures = [
    {
        title: 'Omnichannel Chatbots',
        description: 'Build once, deploy everywhere. Support for Facebook, Zalo, and Web Widget out of the box.',
        icon: Bot,
        gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
        title: 'Unified Inbox',
        description: 'Manage all your customer conversations in one centralized dashboard.',
        icon: MessageSquare,
        gradient: 'from-purple-500/20 to-pink-500/20',
    },
    {
        title: 'AI Logic Engine',
        description: 'Advanced reasoning and decision making powered by multi-model orchestration.',
        icon: Cpu,
        gradient: 'from-indigo-500/20 to-purple-500/20',
    },
    {
        title: 'Visual Flow Builder',
        description: 'Drag-and-drop workspace to design complex interaction flows without code.',
        icon: Zap,
        gradient: 'from-amber-500/20 to-orange-500/20',
    },
    {
        title: 'Enterprise Analytics',
        description: 'Deep insights into bot performance, user sentiment, and ROI tracking.',
        icon: BarChart3,
        gradient: 'from-emerald-500/20 to-teal-500/20',
    },
    {
        title: 'Global Scale',
        description: 'Infrastructure designed for millions of messages with 99.9% uptime.',
        icon: Globe,
        gradient: 'from-sky-500/20 to-blue-500/20',
    }
];

export default function FeaturesPage() {
    return (
        <div className="container mx-auto px-4 py-24">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h1 className="display-heading-1 mb-6">Powering the next generation of <span className="text-gradient">Conversational AI</span></h1>
                <p className="text-xl text-muted-foreground">Everything you need to build, deploy, and scale intelligent agents across your entire business ecosystem.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {coreFeatures.map((feature, idx) => (
                    <div key={idx} className="glass-card p-8 group hover:border-primary/30 transition-all duration-500">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <feature.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                ))}
            </div>

            <div className="mt-32 glass-card p-12 text-center overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none" />
                <h2 className="display-heading-2 mb-8">Ready to see these features in action?</h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="h-12 px-8" asChild>
                        <Link href={"/register" as any}>Start for Free</Link>
                    </Button>
                    <Button size="lg" variant="outline" className="h-12 px-8 glass" asChild>
                        <Link href={"/login" as any}>Book a Demo</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

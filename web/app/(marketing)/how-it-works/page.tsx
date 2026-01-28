import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Lightbulb, Workflow, Rocket, Headphones, ArrowRight } from 'lucide-react';

const steps = [
    {
        title: 'Define your Objectives',
        description: 'Tell WataAI what you want to achieve. Whether it is lead generation, customer support, or automated bookings.',
        icon: Lightbulb,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        borderColor: 'border-yellow-400/20'
    },
    {
        title: 'Build with the Flow Editor',
        description: 'Use our powerful visual editor to map out conversation paths. Connect to your database, external APIs, or AI knowledge bases.',
        icon: Workflow,
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        borderColor: 'border-blue-400/20'
    },
    {
        title: 'Train on your Data',
        description: 'Upload documents, link your website, or sync with your knowledge base. Your bot learns your brand voice instantly.',
        icon: Headphones,
        color: 'text-teal-400',
        bgColor: 'bg-teal-400/10',
        borderColor: 'border-teal-400/20'
    },
    {
        title: 'Deploy to any Channel',
        description: 'One-click deployment to Facebook, Zalo, or your website. Your intelligent agent is ready to engage 24/7.',
        icon: Rocket,
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        borderColor: 'border-green-400/20'
    }
];

export default function HowItWorks() {
    return (
        <div className="container mx-auto px-4 py-24">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">The Process</span>
                <h1 className="display-heading-1 mb-6">How WataAI <span className="text-gradient">Works</span></h1>
                <p className="text-xl text-muted-foreground">From idea to live automation in minutes. Our platform handles the complexity so you can focus on your business.</p>
            </div>

            <div className="relative pt-12">
                {/* Connector Line */}
                <div className="hidden lg:block absolute top-[148px] left-[150px] right-[150px] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {steps.map((step, idx) => (
                        <div key={idx} className="relative flex flex-col items-center text-center">
                            <div className={`w-28 h-28 rounded-[2rem] border-2 ${step.borderColor} ${step.bgColor} flex items-center justify-center mb-8 relative z-10 glass-heavy hover:scale-110 transition-transform duration-500`}>
                                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center font-bold text-lg shadow-xl">
                                    {idx + 1}
                                </div>
                                <step.icon className={`w-12 h-12 ${step.color}`} />
                            </div>
                            <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-32 p-1 bg-gradient-to-r from-primary/30 via-teal-500/30 to-cyan-500/30 rounded-[2.5rem]">
                <div className="bg-background/95 backdrop-blur-sm rounded-[2.4rem] p-12 lg:p-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                    <div className="flex-1">
                        <h2 className="display-heading-2 mb-6 text-foreground">Automation for everyone, no coding required.</h2>
                        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                            We have abstracted the complexities of LLMs, vector databases, and multi-channel integration into a simple, visual interface.
                            Building an AI agent with WataAI is as natural as sketching a flowchart.
                        </p>
                        <Button size="lg" className="h-14 px-10 text-lg rounded-2xl group shadow-2xl shadow-primary/20" asChild>
                            <Link href={"/register" as any}>
                                Start Building Now
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>
                    <div className="flex-1 relative">
                        <div className="aspect-square w-full max-w-[400px] mx-auto glass-card border-primary/20 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                            <Workflow className="w-32 h-32 text-primary opacity-20 absolute" />
                            <Rocket className="w-16 h-16 text-primary absolute animate-bounce" style={{ animationDuration: '3s' }} />
                            <div className="flex flex-col gap-4 relative z-10 w-full px-8">
                                <div className="h-4 w-3/4 bg-primary/20 rounded-full" />
                                <div className="h-4 w-1/2 bg-primary/20 rounded-full" />
                                <div className="h-12 w-full glass rounded-xl border-primary/30" />
                                <div className="h-4 w-2/3 bg-primary/20 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

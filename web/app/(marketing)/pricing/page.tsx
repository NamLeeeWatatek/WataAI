import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Check, Zap, Shield, Star, Crown } from 'lucide-react';

const plans = [
    {
        name: 'Starter',
        price: '0',
        description: 'Perfect for exploring and small personal projects.',
        features: [
            'Up to 1,000 messages/mo',
            '1 Active Chatbot',
            'Web Widget Integration',
            'Basic Analytics',
            'Community Support'
        ],
        cta: 'Get Started',
        variant: 'glass'
    },
    {
        name: 'Pro',
        price: '49',
        description: 'For growing businesses needing scale and automation.',
        features: [
            'Up to 50,000 messages/mo',
            '5 Active Chatbots',
            'Omnichannel (FB, Zalo, Web)',
            'Advanced Analytics',
            'Priority Support',
            'Custom AI Logic'
        ],
        cta: 'Start Free Trial',
        variant: 'primary',
        popular: true
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        description: 'Advanced features for large scale organizations.',
        features: [
            'Unlimited messages',
            'Unlimited Chatbots',
            'SLA Guarantee',
            'Dedicated Account Manager',
            'On-premise Deployment Options',
            'Custom Integrations'
        ],
        cta: 'Contact Sales',
        variant: 'glass'
    }
];

export default function PricingPage() {
    return (
        <div className="container mx-auto px-4 py-24">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Pricing Plans</span>
                <h1 className="display-heading-1 mb-6">Simple, Transparent <span className="text-gradient">Pricing</span></h1>
                <p className="text-xl text-muted-foreground">Choose the plan that fits your business needs. Scale as you grow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-8">
                {plans.map((plan, idx) => (
                    <div key={idx} className={`relative flex flex-col p-8 rounded-3xl transition-all duration-500 border ${plan.popular ? 'border-primary bg-primary/5 scale-105 z-10' : 'border-white/10 glass-card bg-white/5 hover:border-white/20'}`}>
                        {plan.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Most Popular
                            </div>
                        )}
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <p className="text-muted-foreground text-sm">{plan.description}</p>
                        </div>
                        <div className="mb-8 flex items-baseline gap-1">
                            {plan.price !== 'Custom' && <span className="text-4xl font-bold text-foreground font-display">$</span>}
                            <span className="text-6xl font-black font-display text-foreground">{plan.price}</span>
                            {plan.price !== 'Custom' && <span className="text-muted-foreground">/mo</span>}
                        </div>
                        <ul className="space-y-4 mb-12 flex-1">
                            {plan.features.map((feature, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-3 text-sm">
                                    <div className="mt-0.5 p-0.5 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Button
                            variant={plan.variant === 'primary' ? 'default' : 'outline'}
                            className={`w-full h-12 rounded-xl font-bold transition-all duration-300 ${plan.variant === 'primary' ? 'shadow-xl shadow-primary/30 hover:scale-[1.02]' : 'glass hover:bg-white/10'}`}
                            asChild
                        >
                            <Link href={"/register" as any}>{plan.cta}</Link>
                        </Button>
                    </div>
                ))}
            </div>

            <div className="mt-32 text-center p-12 glass-card border-dashed">
                <h3 className="text-2xl font-bold mb-4">Need a custom plan?</h3>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">We offer customized solutions for non-profits, educational institutions, and high-volume enterprises. Get in touch with our team for a tailored quote.</p>
                <Button variant="link" className="text-primary font-bold text-lg" asChild>
                    <Link href={"mailto:sales@wata.ai" as any}>Contact our sales team &rarr;</Link>
                </Button>
            </div>
        </div>
    );
}

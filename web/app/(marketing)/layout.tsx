import { MarketingHeader, MarketingFooter } from '@/components/marketing';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'WataAI - Smart Multi-Channel AI Chatbot Platform',
    description: 'Connect WhatsApp, Facebook, Instagram, and Telegram in one single platform. Automate customer care with AI and increase sales revenue with WataAI.',
    keywords: ['AI Chatbot', 'Multi-channel', 'Omnichannel', 'Automation', 'Customer Care', 'WataAI', 'Watatek'],
    alternates: {
        canonical: 'https://ai.watatek.com',
    },
    openGraph: {
        title: 'WataAI - Smart Multi-Channel AI Chatbot Platform',
        description: 'The AI-Powered Brain for Every Customer Channel.',
        url: 'https://ai.watatek.com',
        siteName: 'WataAI',
        images: [
            {
                url: '/images/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'WataAI Platform',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'WataAI - Smart Multi-Channel AI Chatbot Platform',
        description: 'The AI-Powered Brain for Every Customer Channel.',
        images: ['/images/og-image.jpg'],
    },
};

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': 'https://watatek.com/#organization',
                'name': 'Watatek',
                'url': 'https://watatek.com',
                'logo': 'https://ai.watatek.com/images/logo.svg',
            },
            {
                '@type': 'WebSite',
                '@id': 'https://ai.watatek.com/#website',
                'url': 'https://ai.watatek.com',
                'name': 'WataAI',
                'publisher': { '@id': 'https://watatek.com/#organization' },
            },
            {
                '@type': 'SoftwareApplication',
                'name': 'WataAI',
                'applicationCategory': 'BusinessApplication',
                'operatingSystem': 'Web',
                'offers': {
                    '@type': 'Offer',
                    'price': '0',
                    'priceCurrency': 'USD',
                },
                'description': 'Smart Multi-Channel AI Chatbot Platform',
            }
        ]
    };

    return (
        <div className="dark min-h-screen flex flex-col bg-slate-950 text-white" style={{ colorScheme: 'dark' }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <MarketingHeader />
            <main className="flex-1 pt-16 md:pt-20">
                {children}
            </main>
            <MarketingFooter />
        </div>
    );
}

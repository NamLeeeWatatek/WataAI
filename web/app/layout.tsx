import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { Toaster } from '@/components/ui/Sonner'

import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { SessionProvider } from 'next-auth/react'

import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { SessionWatcher } from '@/components/providers/SessionWatcher'
import { LazyMotion, domMax } from 'framer-motion'

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    display: 'swap',
    variable: '--font-inter',
})

const outfit = Outfit({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800', '900'],
    display: 'swap',
    variable: '--font-outfit',
})

import { SkipToMainContent } from '@/components/shared/SkipToMainContent';

export const metadata: Metadata = {
    title: 'Wata AI - One AI. Every Channel. Zero Code.',
    description: 'AI-powered omnichannel customer engagement platform with zero-code flow builder and unified inbox.',
    keywords: ['AI', 'chatbot', 'omnichannel', 'customer engagement', 'automation', 'n8n'],
    metadataBase: new URL('https://wata.ai'),
    openGraph: {
        title: 'Wata AI - One AI. Every Channel. Zero Code.',
        description: 'AI-powered omnichannel customer engagement platform with zero-code flow builder and unified inbox.',
        url: 'https://wata.ai',
        siteName: 'Wata AI',
        images: [
            {
                url: '/images/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Wata AI Platform Preview',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Wata AI - One AI. Every Channel. Zero Code.',
        description: 'AI-powered omnichannel customer engagement platform with zero-code flow builder and unified inbox.',
        images: ['/images/og-image.png'],
    },
    icons: {
        icon: '/images/logo.svg',
    },
}

import { ThemeProviderWrapper } from '@/components/providers/ThemeProviderWrapper';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
            <body className="font-sans antialiased" suppressHydrationWarning>
                <SkipToMainContent />
                <QueryProvider>
                    <I18nProvider>
                        <SessionProvider>
                            <ThemeProviderWrapper>
                                <ErrorBoundary>
                                    <SessionWatcher />
                                    <LazyMotion features={domMax}>
                                        {children}
                                    </LazyMotion>
                                </ErrorBoundary>
                                <Toaster />
                            </ThemeProviderWrapper>
                        </SessionProvider>
                    </I18nProvider>
                </QueryProvider>
            </body>
        </html>
    )
}

import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { Toaster } from '@/components/ui/Sonner'

import { ReduxProvider } from '@/lib/store/Provider'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { SessionProvider } from 'next-auth/react'
import { ThemeProviderWrapper } from '@/components/providers/ThemeProviderWrapper'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { SessionWatcher } from '@/components/providers/SessionWatcher'

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

export const metadata: Metadata = {
    title: 'Wata AI - One AI. Every Channel. Zero Code.',
    description: 'AI-powered omnichannel customer engagement platform with zero-code flow builder and unified inbox.',
    keywords: ['AI', 'chatbot', 'omnichannel', 'customer engagement', 'automation', 'n8n'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
            <body className="font-sans antialiased">
                <QueryProvider>
                    <I18nProvider>
                        <SessionProvider>
                            <ThemeProviderWrapper>
                                <ReduxProvider>
                                    <ErrorBoundary>
                                        <SessionWatcher />
                                        {children}
                                    </ErrorBoundary>
                                    <Toaster />
                                </ReduxProvider>
                            </ThemeProviderWrapper>
                        </SessionProvider>
                    </I18nProvider>
                </QueryProvider>
            </body>
        </html>
    )
}

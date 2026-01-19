'use client'

import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'

interface ThemeProviderWrapperProps {
    children: ReactNode
}

export function ThemeProviderWrapper({ children }: ThemeProviderWrapperProps) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    )
}

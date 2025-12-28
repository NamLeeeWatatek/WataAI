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
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    )
}

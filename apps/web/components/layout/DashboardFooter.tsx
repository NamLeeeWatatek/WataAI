'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface DashboardFooterProps {
    className?: string
}

export function DashboardFooter({ className }: DashboardFooterProps) {
    const { t } = useTranslation()

    return (
        <footer className={cn(
            "mt-auto border-t border-border/10 py-6 px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground",
            className
        )}>
            <div>
                © {new Date().getFullYear()} WataAI. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs">
                    <a href="#">Documentation</a>
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs">
                    <a href="#">Support</a>
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs">
                    <a href="#">Privacy Policy</a>
                </Button>
            </div>
        </footer>
    )
}
